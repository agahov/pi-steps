import type { GameObject, MoveObject, ObjectMoved } from '@pi-steps/core';
import { addComponent, addEntity, createWorld } from 'bitecs';

/** A new, independent ECS world. Games supply their own components and systems. */
export function createGameWorld() {
  return createWorld();
}

/** Bootstrap gameplay authority. Mutable ECS storage never crosses the API. */
export function createMoveGame(options: {
  initialObject: GameObject;
  emit: (event: ObjectMoved) => void;
}) {
  const { initialObject, emit } = options;
  if (!Number.isFinite(initialObject.x) || !Number.isFinite(initialObject.y)) {
    throw new RangeError('World Coordinates must be finite');
  }
  const world = createGameWorld();
  const position = { x: [] as number[], y: [] as number[] };
  const entity = addEntity(world);
  addComponent(world, entity, position);
  position.x[entity] = initialObject.x;
  position.y[entity] = initialObject.y;
  const id = initialObject.id;

  function readObject(objectId: string): GameObject {
    if (objectId !== id) throw new Error(`Unknown object: ${objectId}`);
    return { id, x: position.x[entity]!, y: position.y[entity]! };
  }

  return {
    readObject,
    handle(command: MoveObject) {
      if (command.id !== id) throw new Error(`Unknown object: ${command.id}`);
      if (!Number.isFinite(command.x) || !Number.isFinite(command.y)) {
        throw new RangeError('World Coordinates must be finite');
      }
      position.x[entity] = command.x;
      position.y[entity] = command.y;
      emit({ type: 'ObjectMoved', ...readObject(id) });
    },
  };
}
