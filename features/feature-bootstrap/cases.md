# Bootstrap cases

Scope: module contracts and end-to-end moves through both input sources. See verification results in the [plan](plan.md#verification).

## Test API

Fixture vocabulary maps to the implemented contracts:

- `MoveObject(id, x, y)`: Command with target World Coordinates.
- `ObjectMoved(id, x, y)`: Event with committed World Coordinates.
- Command and Event delivery is synchronous; no pending-work hook is needed.
- `renderFrame()`: renders committed state; Pixi calls it on each frame.
- `readObject(id)`: reads a detached gameplay snapshot without exposing mutable storage.

Use object `A` at `(10, 20)` and target `(30, 40)`. Create a fresh fixture per scenario. Await observable updates; do not use timed sleeps. Spies record payloads and call counts.

## CASE-01 — Module boundaries

Verification: dependency-cruiser checks the workspace import graph and rejects presentation imports from Game Logic.

```gherkin
Feature: Independent Game Logic
  Scenario: Game Logic has no presentation dependencies
    Given the Game Logic module
    When its imports are checked
    Then it does not depend on Vue, Pixi.js, or the UI module
```

## CASE-02 — UI command adapter

Real UI adapter; mock Event Bus. No Game Logic instance.

```gherkin
Feature: UI Commands
  Scenario: Request a move
    Given UI State shows object A at (10, 20)
    When the UI move action requests A at (30, 40)
    Then the Event Bus receives exactly one MoveObject(A, 30, 40)
    And UI State still shows A at (10, 20)
```

## CASE-03 — Pixi input adapter

Real input adapter; fake Pixi input source; mock coordinate mapper and Event Bus.

```gherkin
Feature: Pixi Commands
  Scenario: Map input to World Coordinates
    Given the coordinate mapper maps screen (300, 400) to world (30, 40)
    When a move input for A occurs at screen (300, 400)
    Then the mapper receives screen (300, 400)
    And the Event Bus receives exactly one MoveObject(A, 30, 40)
```

The real adapter uses a Pixi `pointertap` and the Camera's inverse mapping. This isolated case checks forwarding only.

## CASE-04 — Event Bus

Real Event Bus; spy Command consumer.

```gherkin
Feature: Command delivery
  Scenario: Deliver a Command once
    Given one Game Logic consumer is subscribed
    When MoveObject(A, 30, 40) is sent
    Then the consumer receives exactly one MoveObject(A, 30, 40)
```

## CASE-05 — Game Logic

Real BitECS state and Command handler; spy Event sink. No Vue or Pixi.js.

```gherkin
Feature: Gameplay authority
  Scenario: Commit a requested move
    Given object A is at (10, 20)
    When Game Logic receives MoveObject(A, 30, 40)
    Then readObject(A) returns position (30, 40)
    And exactly one ObjectMoved(A, 30, 40) is emitted
    And reading A during Event delivery returns position (30, 40)
```

## CASE-06 — UI event mapping

Real mapper and Vue shallowRef; fake Event source.

```gherkin
Feature: UI projection
  Scenario: Replace UI State after a move
    Given UI State shows A at (10, 20)
    And its current value is saved as the previous snapshot
    When ObjectMoved(A, 30, 40) is delivered
    Then UI State shows A at (30, 40)
    And its value is not the previous snapshot
    And the previous snapshot still shows A at (10, 20)
```

## CASE-07 — Render System

Real Render System; fake state reader; mock coordinate mapper and Pixi display adapter.

```gherkin
Feature: State-driven rendering
  Scenario: Render committed position
    Given readObject(A) returns position (30, 40)
    And the mapper maps world (30, 40) to screen (300, 400)
    When renderFrame completes
    Then A's display position is (300, 400)
    And readObject(A) still returns position (30, 40)
```

## CASE-08 — Viewport transform

Real Camera; no Vue, BitECS, or Pixi.js. Uses the [Camera policy](../../doc/architecture/overview.md#camera).

```gherkin
Feature: Undistorted viewport mapping
  Scenario Outline: Initialize and resize
    Given A has World Coordinates (30, 40)
    When the viewport is initialized at 800 by 600
    And resized to <width> by <height>
    Then the horizontal and vertical scale factors are equal
    And A's World Coordinates are unchanged
    And its initial Screen Coordinates were (240, 320)
    And its resized Screen Coordinates are (<x>, <y>)
    And mapping A to screen and back recovers its World Coordinates within 0.000001

    Examples:
      | width | height | x   | y   |
      | 1200  | 600    | 360 | 480 |
      | 600   | 1200   | 180 | 240 |
```

Numeric assertions prove the sizing policy independently of round-trip checks. Browser resize checks also sample both object axes to verify proportions.

## CASE-09 — Main success path

Browser test with real Vue, Event Bus, BitECS, event mapping, Render System, and Pixi.js. No mocked module boundaries. Use a fixed viewport and deterministic initial state.

```gherkin
Feature: Connected bootstrap
  Scenario Outline: Move an object through the application
    Given the application shows A at world (10, 20)
    When the user requests A at world (30, 40) through <source>
    And the next state update and rendered frame complete
    Then Game Logic stores A at world (30, 40)
    And the visible UI shows A at world (30, 40)
    And the Pixi scene displays A at the expected Screen Coordinates
    And no uncaught application errors occur

    Examples:
      | source     |
      | UI action  |
      | Pixi input |
```

At an 800 CSS-pixel-wide scene, the UI move button or a click at screen `(240, 320)` requests world `(30, 40)`. Browser pointer assertions allow 0.01 World units for subpixel input quantization. Browser tests sample rendered canvas pixels at the new and old positions; connected module tests directly check committed Game Logic state. No production inspection hook is exposed.
