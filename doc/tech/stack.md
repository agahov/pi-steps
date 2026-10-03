# Technical direction

- Vue: UI; event-derived UI State held in `shallowRef`.
- BitECS: Game Logic.
- Pixi.js: rendering through the Render System.

Scaffold tooling: TypeScript, npm workspaces, Vite, Vitest (colocated unit tests), Playwright (browser acceptance tests), and dependency-cruiser (import boundaries). GitHub Actions runs validation and browser tests.

Workspace dependencies and resolved versions live in `package.json` files and the root `package-lock.json`. See [setup and commands](../../README.md).
