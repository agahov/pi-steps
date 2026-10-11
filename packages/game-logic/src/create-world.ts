import { createWorld } from 'bitecs';

/** Create isolated ECS storage. No entities or systems are initialized. */
export function createGameWorld() {
  return createWorld();
}

export type GameWorld = ReturnType<typeof createGameWorld>;
