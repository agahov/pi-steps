import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './index';

describe('Event Bus', () => {
  it('delivers synchronously once and supports unsubscribe', () => {
    const bus = createEventBus<{ type: string }>();
    const consumer = vi.fn();
    const unsubscribe = bus.subscribe(consumer);
    const command = { type: 'MoveObject' };
    bus.send(command);
    expect(consumer).toHaveBeenCalledExactlyOnceWith(command);
    unsubscribe();
    unsubscribe();
    bus.send(command);
    expect(consumer).toHaveBeenCalledTimes(1);
  });

  it('isolates buses and preserves subscription order', () => {
    const bus = createEventBus<number>();
    const other = createEventBus<number>();
    const calls: number[] = [];
    bus.subscribe(value => calls.push(value));
    bus.subscribe(value => calls.push(value + 1));
    other.send(100);
    bus.send(1);
    expect(calls).toEqual([1, 2]);
  });
});
