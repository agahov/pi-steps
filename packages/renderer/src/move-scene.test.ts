import { describe, expect, it, vi } from 'vitest';
import { createPixiMoveInput, createRenderSystem } from './move-scene';

describe('Pixi input', () => {
  it('maps Screen Coordinates before sending exactly one Command', () => {
    const screenToWorld = vi.fn(() => ({ x: 30, y: 40 }));
    const send = vi.fn();
    const input = createPixiMoveInput({ objectId: 'A', screenToWorld, send });
    input({ x: 300, y: 400 });
    expect(screenToWorld).toHaveBeenCalledExactlyOnceWith({ x: 300, y: 400 });
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'MoveObject', id: 'A', x: 30, y: 40 });
  });
});

describe('Render System', () => {
  it('renders committed gameplay through the Camera without mutating it', () => {
    const state = Object.freeze({ id: 'A', x: 30, y: 40 });
    const readObject = vi.fn(() => state);
    const display = vi.fn();
    const worldToScreen = vi.fn(({ x, y }) => ({ x: x * 10, y: y * 10 }));
    const renderer = createRenderSystem({ readObject, camera: { worldToScreen }, display });
    renderer.renderFrame();
    expect(display).toHaveBeenCalledExactlyOnceWith({ x: 300, y: 400 }, { x: 40, y: 40 });
    expect(readObject).toHaveBeenCalledTimes(1);
    expect(state).toEqual({ id: 'A', x: 30, y: 40 });
  });
});
