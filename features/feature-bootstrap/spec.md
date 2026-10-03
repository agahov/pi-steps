# Bootstrap

Status: implemented.

## Outcome

Establish project structure and demonstrate communication between separate UI and Game Logic modules, with a minimal rendered scene. No Match-3 rules yet.

Follow the [architecture](../../doc/architecture/overview.md), [stack](../../doc/tech/stack.md), and [shared terms](../../doc/UBIQUITOUS_LANGUAGE.md).

## Scope

- UI and Pixi input each send a Command through the Event Bus.
- Game Logic changes owned state and emits an Event after committing.
- UI maps that Event to UI State held in `shallowRef`.
- The Render System displays one object from game state.
- A Camera maps the independent World to the browser viewport and provides inverse mapping for input. Initial display and resizing preserve object proportions and World Coordinates.
- Camera accepts optional empty configuration as an extension point; no configurable settings yet.

Object A starts at World Coordinates `(10, 20)`. A UI button requests `(30, 40)`; clicking the Pixi scene requests the corresponding World Coordinates. Both paths update the scene and UI State. The [initial Camera policy](../../doc/architecture/overview.md#camera) applies.

## Excluded

Match-3 gameplay, asset pipelines, persistence, configurable World Width, panning/zoom, and extracting a reusable game framework.
