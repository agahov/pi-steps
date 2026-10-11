# Project concept

Build 2D web games, starting with Match-3, while improving an agent-assisted development workflow. The agent develops the game; it is not part of gameplay.

Keep a small foundation: create an independent World, initialize entities from Archetype templates, then run Systems in explicit order. Camera and UI stay outside gameplay state.

No gameplay is implemented. The previous move-object demo has been removed.

- [Architecture and shared terms](doc/architecture/overview.md)
- [Structure and development commands](README.md)
