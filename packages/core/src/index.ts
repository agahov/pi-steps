/** Shared application identity, not gameplay configuration or agent instructions. */
export interface GameDefinition {
  readonly id: string;
  readonly title: string;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface GameObject extends Point {
  readonly id: string;
}

export interface MoveObject extends GameObject {
  readonly type: 'MoveObject';
}

export interface ObjectMoved extends GameObject {
  readonly type: 'ObjectMoved';
}

/** Synchronous delivery. Consumers commit state before publishing Events. */
export function createEventBus<T>() {
  const consumers = new Set<(message: T) => void>();
  return {
    send(message: T) {
      for (const consumer of [...consumers]) consumer(message);
    },
    subscribe(consumer: (message: T) => void) {
      consumers.add(consumer);
      return () => { consumers.delete(consumer); };
    },
  };
}
