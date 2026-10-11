import { addComponent, addEntity, getAllEntities, hasComponent, query } from 'bitecs';
import { describe, expect, it } from 'vitest';
import { createGameWorld, initializeArchetypes, runSystems } from './index';
import type { Archetype, System } from './index';

describe('Create World', () => {
  it('creates empty, isolated storage', () => {
    const first = createGameWorld();
    const second = createGameWorld();
    expect(getAllEntities(first)).toEqual([]);
    expect(getAllEntities(second)).toEqual([]);
    addEntity(first);
    expect(getAllEntities(first)).toHaveLength(1);
    expect(getAllEntities(second)).toHaveLength(0);
  });
});

describe('Initialize Archetypes', () => {
  it('spawns entities from templates with components and initial values', () => {
    const world = createGameWorld();
    const position = { x: [] as number[] };
    const createObject: Archetype = world => {
      const entity = addEntity(world);
      addComponent(world, entity, position);
      position.x[entity] = 10;
      return entity;
    };
    const entities = initializeArchetypes(world, [createObject, createObject]);
    expect(new Set(entities).size).toBe(2);
    expect(getAllEntities(world)).toEqual(entities);
    for (const entity of entities) {
      expect(hasComponent(world, entity, position)).toBe(true);
      expect(position.x[entity]).toBe(10);
    }
  });

  it('runs templates in declared order and supports an empty initial world', () => {
    const world = createGameWorld();
    const order: string[] = [];
    expect(initializeArchetypes(world, [])).toEqual([]);
    initializeArchetypes(world, [
      world => { order.push('first'); return addEntity(world); },
      world => { order.push('second'); return addEntity(world); },
    ]);
    expect(order).toEqual(['first', 'second']);
  });
});

describe('Run Systems', () => {
  it('updates initialized entities in explicit order using elapsed seconds', () => {
    const world = createGameWorld();
    const position = { x: [] as number[] };
    const [entity] = initializeArchetypes(world, [world => {
      const entity = addEntity(world);
      addComponent(world, entity, position);
      position.x[entity] = 10;
      return entity;
    }]);
    const observed: number[] = [];
    const move: System = (world, deltaSeconds) => {
      for (const entity of query(world, [position])) position.x[entity]! += 4 * deltaSeconds;
    };
    const observe: System = world => {
      for (const entity of query(world, [position])) observed.push(position.x[entity]!);
    };
    runSystems(world, [move, observe], 0.5);
    expect(position.x[entity!]).toBe(12);
    expect(observed).toEqual([12]);
    runSystems(world, [move, observe], 0.5);
    expect(observed).toEqual([12, 14]);
  });

  it('accepts no systems and rejects invalid elapsed time before running any', () => {
    const world = createGameWorld();
    runSystems(world, [], 0);
    let calls = 0;
    for (const delta of [-1, NaN, Infinity]) {
      expect(() => runSystems(world, [() => { calls++; }], delta)).toThrow('Elapsed seconds');
    }
    expect(calls).toBe(0);
  });
});
