# Pi Steps

2D web games, starting with Match-3. [Project context](CONTEXT.md).

## Workspace layout

```text
packages/
  core/          Shared contracts; no presentation dependencies
  logger/        Structured, domain-scoped logging
  game-logic/    BitECS world creation; no Vue or Pixi dependencies
  renderer/      Camera mapping, state-driven Pixi scene, and input
  ui/            Vue presentation components
prototypes/
  bootstrap/     Connected move-object demo
games/
  match3/        Independent game entry point; no gameplay yet
tests/
  acceptance/    Playwright tests against production builds
```

Unit tests live beside source as `*.test.ts`. Existing `tests/subagent.test.mjs` belongs to the development extension, not the game test suite.

Packages are private, source-first workspaces: Vite consumes their TypeScript exports. `build:packages` also emits JavaScript and declarations to `dist/packages`; these are not published packages. Application bundles go to each application's `dist/`.

## Run and verify

Requires Node 22.12+ and npm. Commit `package-lock.json`; use `npm ci` for reproducible installs. Use npm 11 when updating dependencies (npm 10 can fail while resolving Vitest's optional peers).

```sh
npm ci
npm run dev                    # Bootstrap: http://127.0.0.1:5173
npm run dev:match3              # Match-3: http://127.0.0.1:5174
npm run check                  # Types, dependency boundaries, units, builds
npx playwright install chromium # Once per machine; --with-deps on Linux CI
npm run test:acceptance         # Build both apps, then browser tests
```

`npm test` runs units; `npm run test:unit:watch` watches them. Acceptance tests start and stop their own preview servers on ports 4173/4174. CI runs the same checks and retains failure traces.

## Logging

```ts
import { createConsoleSink, createLogger } from '@pi-steps/logger';

const logger = createLogger({
  sink: createConsoleSink(),
  level: 'info',
  domainLevels: { game: 'debug', render: 'warn', ui: 'silent' },
});
logger.forDomain('game').debug('World created', { gameId: 'match3' });
```

Levels: `trace`, `debug`, `info`, `warn`, `error`; `silent` disables output. Domain overrides match exact names; other domains inherit the default. Suggested domains: `app`, `game`, `render`, `ui`, `input`. Pass a custom `sink` and `clock` for tests or alternate destinations. No global logger or console patching. Sinks are synchronous; thrown sink errors propagate. Avoid sensitive data in log metadata.

## Adding a game or prototype

Create a workspace under `games/<name>` or `prototypes/<name>` with its own entry point, dependencies, and Vite scripts. Use `@pi-steps/*` packages instead of importing another application's internals. Add its build to the root build command and a Playwright project/server when it needs acceptance coverage.

Bootstrap demonstrates Commands, committed Events, UI projection, and Camera-driven rendering. Use the move button or click the scene; resizing changes the Camera view without changing World Coordinates. Camera configuration is currently an optional empty object. See the [bootstrap feature](features/feature-bootstrap/spec.md). Match-3 still verifies scaffolding only.
