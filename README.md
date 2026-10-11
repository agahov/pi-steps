# Pi Steps

A minimal foundation for 2D web games. [Project concept](CONTEXT.md) · [World lifecycle](doc/architecture/overview.md).

## Structure

```text
packages/
  game-logic/src/
    create-world.ts           Isolated ECS storage
    initialize-archetypes.ts  Spawn entities from templates
    run-systems.ts            Execute an ordered update
  renderer/src/camera.ts      World-to-Screen mapping and its inverse
  ui/src/application-shell.ts
  common/src/logger/          Structured logging with feature/module filters
games/
  match3/                     Empty application; owns future templates and Systems
tests/
  acceptance/                 Browser startup check
```

Packages are private, source-first npm workspaces. Unit tests live beside source. `tests/subagent.test.mjs` is separate development-tooling coverage, not part of the game suite.

[Logging configuration and examples](packages/common/README.md). Run `npm run example:logging` for a cross-module feature trace.

## Development

Requires Node 22.12+ and npm. Commit the lockfile; use npm 11 when updating dependencies.

```sh
npm ci
npm run dev                     # Match-3: http://127.0.0.1:5174
npm run check                   # Types, import boundaries, units, builds
npx playwright install chromium # Once per machine
npm run test:acceptance          # Build and browser test
```

Tooling: TypeScript, npm workspaces, Vite, Vitest, Playwright, dependency-cruiser, and GitHub Actions. `npm test` runs unit tests. CI runs the checks and browser test.

`build:packages` emits JavaScript and declarations into `dist/packages`; the application bundle goes into `games/match3/dist`.
