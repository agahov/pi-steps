import type { GameWorld } from './create-world';

export type System = (world: GameWorld, deltaSeconds: number) => void;

/** Run one update in caller-defined order. Scheduling belongs to the application. */
export function runSystems(world: GameWorld, systems: readonly System[], deltaSeconds: number): void {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new RangeError('Elapsed seconds must be finite and non-negative');
  }
  for (const system of systems) system(world, deltaSeconds);
}
