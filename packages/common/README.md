# Logging

Import from `@pi-steps/common/logger`. Create a logger in the application and inject contextual handles into modules. No global logger or console patching.

## Labels

- `module`: where a record originated, such as `game-logic` or `renderer`.
- `feature`: the behavior being followed across modules, such as `resolve-move`.
- `traceId`: one operation, such as `move-42`. Create it at the operation boundary and pass it through; the logger does not generate or propagate it automatically.

Keep module and feature names stable. Put object IDs, positions, and other changing values in metadata, not in label names. A trace ID correlates log records; it is not a tracing span or a profiler.

## Configure what you see

```ts
import { createConsoleSink, createLogger } from '@pi-steps/common/logger';

const logger = createLogger({
  sink: createConsoleSink(),
  level: 'warn',
  rules: [
    { feature: 'resolve-move', level: 'trace' },
    { module: 'renderer', level: 'debug' },
  ],
});
```

This traces `resolve-move` in every module, enables debug output for other renderer work, and retains warnings/errors everywhere else.

Rules are checked in order; **the first match wins**. Labels within one rule are AND conditions and match exact strings, not prefixes or wildcards. With no matching rule, the default level applies (`info` if omitted).

Levels include everything at or above their threshold:

`trace → debug → info → warn → error`; `silent` emits nothing.

Alternative configurations:

```ts
// Only one feature. Warning: unrelated warnings/errors are also hidden.
{ level: 'silent', rules: [{ feature: 'resolve-move', level: 'trace' }] }

// One module across every feature, plus warnings elsewhere.
{ level: 'warn', rules: [{ module: 'renderer', level: 'debug' }] }

// Only the intersection of module and feature gets verbose output.
{ level: 'warn', rules: [{ module: 'renderer', feature: 'resolve-move', level: 'trace' }] }

// Follow one operation across all modules.
{ level: 'warn', rules: [{ traceId: 'move-42', level: 'trace' }] }
```

Put a specific exception before a broader rule. A matching `silent` rule suppresses even errors. Configuration is copied at creation; changing the supplied object later has no effect. Create and inject a new logger to change filters.

## Follow a feature across modules

```ts
const input = logger.forContext({
  module: 'input', feature: 'resolve-move', traceId: 'move-42',
});
input.trace('Move requested', { objectId: 'A' });

const game = input.withContext({ module: 'game-logic' });
game.debug('World updated', { objectId: 'A', x: 30, y: 40 });

const render = game.withContext({ module: 'renderer' });
render.trace('Frame drawn');
```

Child handles inherit unchanged labels and re-evaluate filters without mutating the parent. For unrelated work, create a fresh handle with `forContext` so an old feature or trace ID is not accidentally retained. For queued/asynchronous work, carry the operation context explicitly; do not store a “current feature” globally.

The logger filters before creating a record or calling the clock/sink. Accepted records contain timestamp (epoch milliseconds), level, context labels, message, and optional data. Metadata is not cloned; prefer small snapshots over mutable World objects. Arguments are still evaluated by JavaScript before filtering, so avoid expensive computations in log calls.

## Output and example

Run `npm run example:logging`. The [example](src/logger/example.ts) uses injected handles across illustrative input, gameplay, and rendering functions. It emits seven JSON records; two extra calls are filtered out. It does not add gameplay to the application.

`createConsoleSink` sends trace/debug to `console.debug` and other levels to their corresponding console methods. Enable Verbose/Debug in browser DevTools to see them. Trace is verbosity, not `console.trace` stack output. A custom sink can write JSON lines or capture records in tests. Sinks are synchronous and errors propagate; remote buffering/retries belong in a sink adapter.

Prefer warnings as the baseline while investigating a feature. Avoid frame-by-frame logging by default, secrets in metadata, and duplicate error logs at every layer. For production telemetry, use a maintained transport/tracing integration rather than expanding this helper into a logging framework.
