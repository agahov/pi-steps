# Ubiquitous Language

Use these terms across documents, feature cases, and code; code casing may differ.

## Game space

| Term | Meaning | Avoid |
| --- | --- | --- |
| World Coordinates | Positions in game space, independent of the browser and Camera. | Unqualified “coordinates” |
| Screen Coordinates | Positions in the displayed game area, measured in canvas-local CSS pixels. | Unqualified “pixels” |
| World Width | A horizontal extent measured in World Coordinates; visible World Width describes the Camera's view, not a gameplay boundary. | “Resolution” for world size |
| Camera | Maps World Coordinates to Screen Coordinates and provides the inverse mapping for input. | Treating browser dimensions as World state |

## Relationships

The **Camera** maps **World Coordinates** to **Screen Coordinates** without distorting proportions. Resizing changes the view, not the World. See [Camera policy](architecture/overview.md#camera).

Technical vocabulary: Commands request changes from Game Logic; Events report committed changes; UI State is a presentation projection. UI and Pixi input are Command sources.
