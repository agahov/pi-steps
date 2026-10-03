import { describe, expect, it, vi } from 'vitest';
import { createMoveProjection, createUiMoveAction } from './move-demo';

describe('UI move action', () => {
  it('requests a move exactly once without updating UI State', () => {
    const projection = createMoveProjection({ id: 'A', x: 10, y: 20 });
    const send = vi.fn();
    const move = createUiMoveAction(send);
    move({ id: 'A', x: 30, y: 40 });
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'MoveObject', id: 'A', x: 30, y: 40 });
    expect(projection.state.value).toEqual({ id: 'A', x: 10, y: 20 });
  });
});

describe('UI projection', () => {
  it('replaces the shallowRef snapshot only after an Event', () => {
    const initial = { id: 'A', x: 10, y: 20 };
    const projection = createMoveProjection(initial);
    const previous = projection.state.value;
    projection.apply({ type: 'ObjectMoved', id: 'A', x: 30, y: 40 });
    expect(projection.state.value).toEqual({ id: 'A', x: 30, y: 40 });
    expect(projection.state.value).not.toBe(previous);
    expect(previous).toEqual(initial);
  });

  it('ignores Events for other objects', () => {
    const projection = createMoveProjection({ id: 'A', x: 10, y: 20 });
    const previous = projection.state.value;
    projection.apply({ type: 'ObjectMoved', id: 'B', x: 30, y: 40 });
    expect(projection.state.value).toBe(previous);
  });
});
