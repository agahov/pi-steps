# Bootstrap plan

Implemented. The move-object demo, initial Camera policy, and empty Camera configuration extension point are agreed. UI button/click input and synchronous delivery are bootstrap implementation defaults; see [architecture](../../doc/architecture/overview.md).

- [x] Agree on demo action, rendering policy, coordinate units, and configuration scope.
- [x] Select build/test tooling and establish workspace/module scaffolding. See [setup](../../README.md).
- [x] Establish module boundaries. Verify CASE-01.
- [x] Implement UI and Pixi input adapters and Event Bus. Verify CASE-02–04.
- [x] Implement Game Logic and UI event mapping. Verify CASE-05–06.
- [x] Implement rendering and Camera mapping. Verify CASE-07–08.
- [x] Connect real modules in the browser. Verify CASE-09.
- [x] Review changes and record results against [cases](cases.md).

## Verification

- `npm run check`: passed type checking, import boundaries, 46 unit/contract tests, and package/application builds.
- `npm run test -w @pi-steps/acceptance`: passed 4 Chromium browser tests, including the unchanged Match-3 scaffold.
- CASE-01: dependency-cruiser; CASE-02–08: colocated package tests; CASE-09: connected contract tests and real browser input/rendering tests.
- Browser tests inspect actual scene pixels before/after moves and across landscape/portrait resizing at device pixel ratio 2. Pointer assertions allow subpixel quantization; direct contract assertions remain exact.
- Lifecycle tests cover disposal, initialization/setup failure, and late resize callbacks after disposal.

Mermaid source reviewed; no Mermaid renderer validation was run.
