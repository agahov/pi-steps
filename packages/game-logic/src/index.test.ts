import { addEntity, getAllEntities } from 'bitecs';
import { describe, expect, it } from 'vitest';
import { createGameWorld, createMoveGame } from './index';

describe('createGameWorld', () => {
  it('isolates each game instance', () => {
    const first = createGameWorld();
    const second = createGameWorld();
    addEntity(first);
    expect(getAllEntities(first)).toHaveLength(1);
    expect(getAllEntities(second)).toHaveLength(0);
  });
});

describe('move gameplay', () => {
  it('commits before emitting exactly one Event', () => {
    const events: unknown[] = [];
    const game = createMoveGame({
      initialObject: { id: 'A', x: 10, y: 20 },
      emit(event) {
        expect(game.readObject('A')).toEqual({ id: 'A', x: 30, y: 40 });
        events.push(event);
      },
    });
    const previous = game.readObject('A');
    game.handle({ type: 'MoveObject', id: 'A', x: 30, y: 40 });
    expect(events).toEqual([{ type: 'ObjectMoved', id: 'A', x: 30, y: 40 }]);
    expect(previous).toEqual({ id: 'A', x: 10, y: 20 });
  });

  it('isolates state and returns detached snapshots', () => {
    const first = createMoveGame({ initialObject: { id: 'A', x: 10, y: 20 }, emit() {} });
    const second = createMoveGame({ initialObject: { id: 'A', x: 10, y: 20 }, emit() {} });
    const snapshot = first.readObject('A');
    Object.assign(snapshot, { x: 100 });
    first.handle({ type: 'MoveObject', id: 'A', x: 30, y: 40 });
    expect(second.readObject('A')).toEqual({ id: 'A', x: 10, y: 20 });
    expect(first.readObject('A')).toEqual({ id: 'A', x: 30, y: 40 });
  });

  it('rejects unknown objects and invalid positions without publishing or mutating', () => {
    const events: unknown[] = [];
    const game = createMoveGame({ initialObject: { id: 'A', x: 10, y: 20 }, emit: event => events.push(event) });
    expect(() => game.readObject('B')).toThrow('Unknown object');
    expect(() => game.handle({ type: 'MoveObject', id: 'B', x: 30, y: 40 })).toThrow('Unknown object');
    expect(() => game.handle({ type: 'MoveObject', id: 'A', x: NaN, y: 40 })).toThrow('finite');
    expect(() => game.handle({ type: 'MoveObject', id: 'A', x: 30, y: Infinity })).toThrow('finite');
    expect(events).toEqual([]);
    expect(game.readObject('A')).toEqual({ id: 'A', x: 10, y: 20 });
    expect(() => createMoveGame({ initialObject: { id: 'A', x: NaN, y: 20 }, emit() {} })).toThrow('finite');
  });
});
