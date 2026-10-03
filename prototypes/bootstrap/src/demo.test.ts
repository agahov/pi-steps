import { createEventBus } from '@pi-steps/core';
import type { MoveObject, ObjectMoved } from '@pi-steps/core';
import { createMoveGame } from '@pi-steps/game-logic';
import { createCamera, createPixiMoveInput, createRenderSystem } from '@pi-steps/renderer';
import { createMoveProjection, createUiMoveAction } from '@pi-steps/ui';
import { describe, expect, it } from 'vitest';

describe('connected bootstrap contracts', () => {
  it.each(['UI', 'Pixi'])('moves committed state, UI State, and display through %s input', source => {
    const commands = createEventBus<MoveObject>();
    const events = createEventBus<ObjectMoved>();
    const game = createMoveGame({ initialObject: { id: 'A', x: 10, y: 20 }, emit: events.send });
    const projection = createMoveProjection(game.readObject('A'));
    commands.subscribe(game.handle);
    events.subscribe(projection.apply);
    const camera = createCamera({});
    camera.resize(800, 600);
    let displayed = { x: 0, y: 0 };
    const renderer = createRenderSystem({
      readObject: () => game.readObject('A'), camera,
      display: position => { displayed = position; },
    });
    if (source === 'UI') createUiMoveAction(commands.send)({ id: 'A', x: 30, y: 40 });
    else createPixiMoveInput({ objectId: 'A', screenToWorld: camera.screenToWorld, send: commands.send })({ x: 240, y: 320 });
    renderer.renderFrame();
    expect(game.readObject('A')).toEqual({ id: 'A', x: 30, y: 40 });
    expect(projection.state.value).toEqual(game.readObject('A'));
    expect(displayed).toEqual({ x: 240, y: 320 });
  });
});
