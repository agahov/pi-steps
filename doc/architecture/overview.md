# World lifecycle

## Create World

A **World** is isolated BitECS storage. Creation does not spawn entities, initialize presentation, or start an update loop.

## Initialize Archetypes

An **Archetype** is an entity-template function, not an ECS storage archetype. It receives a World, creates one entity with its components and initial values, and returns the entity ID.

`initializeArchetypes` calls the supplied templates in order. Repeating a template creates another entity. Calling initialization again creates more entities; it is not a reset.

Games own their templates and component storage. Mutable component storage must be created per game instance, not shared globally between Worlds. No concrete game templates are supplied yet.

## Run Systems

A **System** is a function that receives a World and elapsed seconds, then performs one unit of behavior. Systems access entities through their components.

`runSystems` executes the supplied functions synchronously in declared order. The application owns scheduling and supplies elapsed time. There is no implicit loop, registry, or scheduler. Errors stop the current pass and propagate; prior changes are not rolled back.

Games own their Systems. No Match-3 Systems are implemented yet.

## Presentation boundary

Game Logic does not import UI or rendering. Applications compose these independent modules and inject dependencies at their boundaries. World state remains authoritative; presentation must not become a second gameplay store.

**World Coordinates** belong to game space. **Screen Coordinates** are canvas-local CSS pixels. A **Camera** maps between them without changing World state.

The retained Camera fixes visible World Width at 100 units, adapts visible height to the viewport, and uses uniform scale. Its origin is top-left, with x increasing rightward and y downward. Call `resize` with viewport dimensions before using it. Its optional empty `CameraConfig` is reserved for future settings.

Camera mapping and a Vue application shell remain. Pixi scenes, input adapters, messaging, and the move demo have been removed. Vue and BitECS are active dependencies; Pixi remains the intended rendering technology, not an initialized subsystem.
