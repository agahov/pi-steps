import { describe, expect, it } from 'vitest';
import { createCamera } from './camera';

describe('Camera', () => {
  it('accepts an empty optional configuration', () => {
    expect(createCamera({}).worldToScreen({ x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
  });

  it('initializes and resizes with fixed World Width and uniform scale', () => {
    const camera = createCamera();
    const world = { x: 30, y: 40 };
    for (const [width, height, x, y] of [
      [800, 600, 240, 320],
      [1200, 600, 360, 480],
      [600, 1200, 180, 240],
    ] as const) {
      camera.resize(width, height);
      expect(camera.worldToScreen(world)).toEqual({ x, y });
      expect(camera.worldToScreen({ x: 100, y: 0 })).toEqual({ x: width, y: 0 });
      expect(camera.worldToScreen({ x: 1, y: 1 })).toEqual({ x: width / 100, y: width / 100 });
      const roundTrip = camera.screenToWorld(camera.worldToScreen(world));
      expect(roundTrip.x).toBeCloseTo(world.x, 6);
      expect(roundTrip.y).toBeCloseTo(world.y, 6);
      expect(world).toEqual({ x: 30, y: 40 });
    }
  });

  it('maps the top-left origin and negative positions without clamping', () => {
    const camera = createCamera();
    camera.resize(800, 600);
    expect(camera.worldToScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(camera.screenToWorld({ x: -80, y: 160 })).toEqual({ x: -10, y: 20 });
  });

  it('rejects invalid viewports without changing the last mapping', () => {
    const camera = createCamera();
    camera.resize(800, 600);
    for (const [width, height] of [[0, 600], [800, -1], [Infinity, 600], [800, NaN]]) {
      expect(() => camera.resize(width!, height!)).toThrow('positive');
    }
    expect(camera.worldToScreen({ x: 1, y: 1 })).toEqual({ x: 8, y: 8 });
  });
});
