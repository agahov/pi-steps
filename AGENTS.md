# Agent entry point

Read [CONTEXT.md](CONTEXT.md) before planning or changing the project. Follow its references as needed.

## Code rules

- Prefer closures over classes.
- Inject runtime dependencies across module boundaries; import types and library primitives normally.
- Prefer deep modules with compact public APIs.
- Keep World creation, Archetype initialization, and System execution separate.
