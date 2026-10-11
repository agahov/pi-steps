import type { GameWorld } from './create-world';

/** An entity template: create one entity with its components and initial values. */
export type Archetype = (world: GameWorld) => number;

/** Spawn one entity per supplied template, in order. Templates may be repeated. */
export function initializeArchetypes(world: GameWorld, archetypes: readonly Archetype[]): number[] {
  return archetypes.map(createEntity => createEntity(world));
}
