import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const object = {
    rect: vi.fn().mockReturnThis(), fill: vi.fn().mockReturnThis(),
    position: { set: vi.fn() }, scale: { set: vi.fn() },
  };
  const application = {
    init: vi.fn(async () => undefined),
    destroy: vi.fn(),
    renderer: { resize: vi.fn() },
    ticker: { add: vi.fn() },
    stage: { addChild: vi.fn(), on: vi.fn(), eventMode: '', hitArea: undefined },
    canvas: { setAttribute: vi.fn() },
  };
  return { object, application, observe: vi.fn(), disconnect: vi.fn() };
});
vi.mock('pixi.js', () => ({
  Application: vi.fn(function () { return mocks.application; }),
  Graphics: vi.fn(function () { return mocks.object; }),
  Rectangle: vi.fn(function (x, y, width, height) { return { x, y, width, height }; }),
}));

import { mountMoveScene } from './move-scene';

let resize: () => void;
beforeEach(() => {
  vi.stubGlobal('window', { devicePixelRatio: 2 });
  vi.stubGlobal('ResizeObserver', vi.fn(function (callback: () => void) {
    resize = callback;
    return { observe: mocks.observe, disconnect: mocks.disconnect };
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('Pixi scene lifecycle', () => {
  it('initializes, maps input and resize, and disposes exactly once', async () => {
    const host = { clientWidth: 800, clientHeight: 600, appendChild: vi.fn() };
    const send = vi.fn();
    const dispose = await mountMoveScene(host as unknown as HTMLElement, {
      readObject: () => ({ id: 'A', x: 30, y: 40 }), send, camera: {},
    });
    expect(mocks.application.init).toHaveBeenCalledWith(expect.objectContaining({ resolution: 2, autoDensity: true }));
    expect(host.appendChild).toHaveBeenCalledExactlyOnceWith(mocks.application.canvas);
    expect(mocks.object.position.set).toHaveBeenCalledWith(240, 320);
    expect(mocks.object.scale.set).toHaveBeenCalledWith(8, 8);
    expect(mocks.observe).toHaveBeenCalledExactlyOnceWith(host);
    const input = mocks.application.stage.on.mock.calls[0]![1] as (event: { global: { x: number; y: number } }) => void;
    input({ global: { x: 240, y: 320 } });
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'MoveObject', id: 'A', x: 30, y: 40 });
    host.clientWidth = 1200;
    resize();
    expect(mocks.application.renderer.resize).toHaveBeenLastCalledWith(1200, 600);
    expect(mocks.object.position.set).toHaveBeenLastCalledWith(360, 480);
    expect(mocks.object.scale.set).toHaveBeenLastCalledWith(12, 12);
    dispose();
    dispose();
    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.application.destroy).toHaveBeenCalledExactlyOnceWith(true, { children: true });
    resize();
    expect(mocks.application.renderer.resize).toHaveBeenCalledTimes(2);
  });

  it('cleans up if scene setup fails after initialization', async () => {
    const host = {
      clientWidth: 800, clientHeight: 600,
      appendChild() { throw new Error('Detached host'); },
    };
    await expect(mountMoveScene(host as unknown as HTMLElement, {
      readObject: () => ({ id: 'A', x: 10, y: 20 }), send() {},
    })).rejects.toThrow('Detached host');
    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.application.destroy).toHaveBeenCalledTimes(1);
  });

  it('cleans up after initialization failure without attaching or observing', async () => {
    mocks.application.init.mockRejectedValueOnce(new Error('No renderer'));
    const host = { clientWidth: 800, clientHeight: 600, appendChild: vi.fn() };
    await expect(mountMoveScene(host as unknown as HTMLElement, {
      readObject: () => ({ id: 'A', x: 10, y: 20 }), send() {},
    })).rejects.toThrow('No renderer');
    expect(host.appendChild).not.toHaveBeenCalled();
    expect(mocks.observe).not.toHaveBeenCalled();
    expect(mocks.application.destroy).toHaveBeenCalledTimes(1);
  });
});
