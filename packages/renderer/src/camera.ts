interface Position {
  readonly x: number;
  readonly y: number;
}

const VISIBLE_WORLD_WIDTH = 100;

/** Reserved extension point. No supported settings yet. */
export type CameraConfig = Readonly<Record<string, never>>;

/** Fixed visible World Width of 100; top-left origin; Screen Coordinates are CSS pixels. */
export function createCamera(_config: CameraConfig = {}) {
  let scale = 1;
  return {
    resize(width: number, height: number) {
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new RangeError('Viewport dimensions must be finite and positive');
      }
      scale = width / VISIBLE_WORLD_WIDTH;
    },
    worldToScreen({ x, y }: Position): Position {
      return { x: x * scale, y: y * scale };
    },
    screenToWorld({ x, y }: Position): Position {
      return { x: x / scale, y: y / scale };
    },
  };
}

export type Camera = ReturnType<typeof createCamera>;
