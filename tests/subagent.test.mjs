import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArgs, runChild } from "../.pi/extensions/run-subagent/runner.mjs";

/**
 * Fake "pi" child processes. We spawn the current Node binary directly
 * (command = process.execPath, prefixArgs = ["-e", script], args = []) and
 * hand it a small script that speaks the JSON-line protocol runChild
 * consumes. No real pi binary, no model, no external deps.
 */

// Build a script that emits protocol lines and then exits cleanly on its own.
// `emit(obj)` prints one newline-delimited JSON event to stdout.
function fakeScript(body) {
  return [
    'const emit = (o) => process.stdout.write(JSON.stringify(o) + "\\n");',
    body ?? "",
    'process.once("exit", () => {});',
    'process.on("SIGTERM", () => process.exit(0));',
  ].join("\n");
}

// A long-lived fake that survives until killed (for timeout/abort tests).
function keepAliveScript() {
  return [
    'process.once("exit", () => {});',
    'const t = setTimeout(() => {}, 600_000);',
    'process.on("SIGTERM", () => { clearTimeout(t); process.exit(0); });',
  ].join("\n");
}

// Run runChild against a fake node child with sensible defaults.
function fakeRun({ script, prompt = "the prompt text", signal, timeoutMs = 15_000, onProgress } = {}) {
  return runChild({
    command: process.execPath,
    prefixArgs: ["-e", script],
    args: [],
    cwd: process.cwd(),
    prompt,
    signal,
    timeoutMs,
    onProgress,
  });
}

const assistant = (content, extra = {}) => ({
  role: "assistant",
  content: content.map((text) => ({ type: "text", text })),
  stopReason: "stop",
  model: "test-model",
  provider: "test-provider",
  ...extra,
});

// ---------------------------------------------------------------------------
// buildArgs (pure)
// ---------------------------------------------------------------------------

test("buildArgs keeps isolation flags and rejects inherited sessions/extensions/skills", () => {
  const args = buildArgs({ model: "anthropic/claude-x", effort: "high" });
  assert.equal(args.slice(0, 8), ["--mode", "json", "--print", "--no-session", "--no-extensions", "--no-skills", "--no-prompt-templates", "--no-themes"]);
});

test("buildArgs applies model and effort", () => {
  const args = buildArgs({ model: "openai/gpt-y", effort: "low" });
  assert.deepEqual(args.filter(Boolean).indexOf("--model") > -1, true);
  // --model and --thinking carry their values
  assert.equal(args[args.indexOf("--model") + 1], "openai/gpt-y");
  assert.equal(args[args.indexOf("--thinking") + 1], "low");
});

test("buildArgs toggles approval on trust", () => {
  assert.ok(buildArgs({ model: "m", effort: "off", trusted: false }).includes("--no-approve"));
  assert.ok(buildArgs({ model: "m", effort: "off", trusted: true }).includes("--approve"));
  // exactly one of the two
  const un = buildArgs({ model: "m", effort: "off", trusted: false });
  assert.equal(un.filter((a) => a === "--approve" || a === "--no-approve").length, 1);
  const tr = buildArgs({ model: "m", effort: "off", trusted: true });
  assert.equal(tr.filter((a) => a === "--approve" || a === "--no-approve").length, 1);
});

test("buildArgs flattens each skill into its own --skill flag", () => {
  const args = buildArgs({ model: "m", effort: "off", skills: ["/a/SKILL.md", "/b/dir/SKILL.md"] });
  const got = [];
  for (let i = 0; i < args.length; i++) if (args[i] === "--skill") got.push(args[++i]);
  assert.deepEqual(got, ["/a/SKILL.md", "/b/dir/SKILL.md"]);
});

test("buildArgs omits --skill flags when no skills are requested", () => {
  assert.ok(!buildArgs({ model: "m", effort: "off" }).includes("--skill"));
});

// ---------------------------------------------------------------------------
// runChild: success path
// ---------------------------------------------------------------------------

test("runChild resolves with the last assistant final text and its model/provider", async () => {
  const result = await fakeRun({
    script: fakeScript(`emit({ type: "message_end", message: ${JSON.stringify(assistant(["the answer"], { model: "final-model", provider: "final-provider" }))} });`),
  });
  assert.equal(result.text, "the answer");
  assert.equal(result.model, "final-model");
  assert.equal(result.provider, "final-provider");
});

test("runChild returns only the final assistant message, ignoring intermediate + tool events", async () => {
  const progress = [];
  const result = await fakeRun({
    onProgress: (t) => progress.push(t),
    script: fakeScript([
      `emit({ type: "message_end", message: ${JSON.stringify(assistant(["intermediate draft"]))} });`,
      `emit({ type: "tool_execution_start", toolName: "bash" });`,
      `emit({ type: "tool_execution_start", toolName: "read" });`,
      `emit({ type: "message_end", message: ${JSON.stringify(assistant(["final result"]))} });`,
    ].join("\n")),
  });
  // last message wins; the intermediate text never leaks into the answer
  assert.equal(result.text, "final result");
  // tool events surface as progress, one per event
  assert.deepEqual(progress, ["Subagent running bash", "Subagent running read"]);
});

test("runChild joins only text content parts of the final message", async () => {
  // The final message mixes a text part, an unrelated part, and another text part.
  const finalContent = [
    { type: "text", text: "line one" },
    { type: "image", data: "ignore-me" },
    { type: "text", text: "line two" },
  ];
  const result = await fakeRun({
    script: fakeScript(`emit({ type: "message_end", message: ${JSON.stringify({ role: "assistant", content: finalContent, stopReason: "stop", model: "m", provider: "p" })} });`),
  });
  assert.equal(result.text, "line one\nline two");
  assert.ok(!result.text.includes("ignore-me"));
});

test("runChild passes the prompt to the child over stdin", async () => {
  // The fake echoes everything it received on stdin back in its final answer.
  const script = [
    'let buf = "";',
    'process.stdin.setEncoding("utf8");',
    'process.stdin.on("data", (c) => { buf += c; });',
    'process.stdin.on("end", () => {',
    '  process.stdout.write(JSON.stringify({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "echo:" + buf }], stopReason: "stop", model: "m", provider: "p" } }) + "\\n");',
    '});',
    'process.on("SIGTERM", () => process.exit(0));',
  ].join("\n");
  const result = await fakeRun({ script, prompt: "do a thing exactly as written" });
  assert.equal(result.text, "echo:do a thing exactly as written");
});

test("runChild reconstructs a JSON record whose bytes split a multibyte char across chunks", async () => {
  // Write the record one byte at a time so Korean/emoji sequences span data events.
  const script = [
    `const rec = JSON.stringify({ type: "message_end", message: ${JSON.stringify(assistant(["한국어 🎉 😀 done"], { model: "m", provider: "p" }))} });`,
    'const buf = Buffer.from(rec + "\\n", "utf8");',
    'for (let i = 0; i < buf.length; i++) process.stdout.write(buf.subarray(i, i + 1));',
    'process.on("SIGTERM", () => process.exit(0));',
  ].join("\n");
  const result = await fakeRun({ script });
  assert.equal(result.text, "한국어 🎉 😀 done");
});

// ---------------------------------------------------------------------------
// runChild: usage aggregation
// ---------------------------------------------------------------------------

test("runChild aggregates usage across every assistant message_end", async () => {
  const script = fakeScript([
    `emit({ type: "message_end", message: ${JSON.stringify({ role: "assistant", content: [{ type: "text", text: "a" }], stopReason: "stop", usage: { input: 10, output: 1, cacheRead: 2, cacheWrite: 3, totalTokens: 16, cost: { input: 11, output: 1.1, cacheRead: 2.2, cacheWrite: 3.3, total: 17.6 } } })} });`,
    `emit({ type: "message_end", message: ${JSON.stringify({ role: "assistant", content: [{ type: "text", text: "b" }], stopReason: "stop", usage: { input: 20, output: 4, cacheRead: 5, cacheWrite: 6, totalTokens: 35, cost: { input: 22, output: 4.4, cacheRead: 5.5, cacheWrite: 6.6, total: 38.5 } } })} });`,
    `emit({ type: "message_end", message: ${JSON.stringify({ role: "assistant", content: [{ type: "text", text: "final" }], stopReason: "stop", usage: { input: 30, output: 7, cacheRead: 8, cacheWrite: 9, totalTokens: 54, cost: { input: 33, output: 7.7, cacheRead: 8.8, cacheWrite: 9.9, total: 59.4 } } })} });`,
  ].join("\n"));
  const { usage } = await fakeRun({ script });
  assert.deepEqual(
    { input: usage.input, output: usage.output, cacheRead: usage.cacheRead, cacheWrite: usage.cacheWrite, totalTokens: usage.totalTokens },
    { input: 60, output: 12, cacheRead: 15, cacheWrite: 18, totalTokens: 105 },
  );
  assert.deepEqual(
    usage.cost,
    { input: 66, output: 13.2, cacheRead: 16.5, cacheWrite: 19.8, total: 115.5 },
  );
});

// ---------------------------------------------------------------------------
// runChild: failure paths
// ---------------------------------------------------------------------------

test("runChild rejects on a non-zero exit with stderr diagnostics", async () => {
  const script = [
    'process.stderr.write("build exploded on line 42");',
    'process.exit(3);',
  ].join("\n");
  await assert.rejects(fakeRun({ script }), /Subagent exited 3: build exploded on line 42/);
});

test("runChild rejects on a non-zero exit with no diagnostics", async () => {
  const script = "process.exit(2);";
  await assert.rejects(fakeRun({ script }), /Subagent exited 2: no diagnostics/);
});

test("runChild rejects when the final message errors even on a zero exit", async () => {
  const script = fakeScript(
    `emit({ type: "message_end", message: ${JSON.stringify(assistant(["partial"], { stopReason: "error", errorMessage: "context exploded" }))} });`,
  );
  await assert.rejects(fakeRun({ script }), /Subagent error: context exploded/);
});

test("runChild treats aborted/length/toolUse stopReasons as errors with a default message", async () => {
  for (const stopReason of ["aborted", "length", "toolUse"]) {
    const script = fakeScript(
      `emit({ type: "message_end", message: ${JSON.stringify(assistant(["partial"], { stopReason }))} });`,
    );
    await assert.rejects(fakeRun({ script }), new RegExp(`Subagent ${stopReason}: did not finish the task`));
  }
});

test("runChild rejects when the child produces no assistant message", async () => {
  // Emits only a non-protocol line and a non-assistant message_end, then exits 0.
  const script = fakeScript([
    'process.stdout.write("startup notice, not json\\n");',
    `emit({ type: "message_end", message: { role: "user", content: [] } });`,
  ].join("\n"));
  await assert.rejects(fakeRun({ script }), /Subagent returned no assistant message/);
});

test("runChild rejects when the child has no output at all", async () => {
  const script = 'process.exit(0);';
  await assert.rejects(fakeRun({ script }), /Subagent returned no assistant message/);
});

test("runChild rejects when the final answer has no text content", async () => {
  const script = fakeScript(
    `emit({ type: "message_end", message: ${JSON.stringify({ role: "assistant", content: [{ type: "image", data: "x" }], stopReason: "stop", model: "m", provider: "p" })} });`,
  );
  await assert.rejects(fakeRun({ script }), /Subagent returned no final text/);
});

test("runChild rejects on a spawn failure (missing executable)", async () => {
  await assert.rejects(
    runChild({
      command: "no-such-binary-xyz-123",
      prefixArgs: [],
      args: [],
      cwd: process.cwd(),
      prompt: "x",
      timeoutMs: 15_000,
    }),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(/ENOENT|spawn/i.test(err.code ? err.code : err.message));
      return true;
    },
  );
});

test("runChild propagates a pre-aborted signal synchronously", () => {
  const controller = new AbortController();
  controller.abort();
  assert.throws(
    () => runChild({ command: process.execPath, prefixArgs: ["-e", "1"], args: [], prompt: "x", signal: controller.signal }),
    /aborted/i,
  );
});

test("runChild rejects with a cancellation error when the signal aborts mid-flight", async () => {
  const controller = new AbortController();
  const pending = fakeRun({ script: keepAliveScript(), signal: controller.signal });
  // Let the child come up, then cancel it.
  await new Promise((r) => setTimeout(r, 100));
  controller.abort();
  await assert.rejects(pending, /Subagent cancelled/);
});

test("runChild rejects with a timeout error when the child never exits", async () => {
  await assert.rejects(fakeRun({ script: keepAliveScript(), timeoutMs: 40 }), /Subagent timed out/);
});
