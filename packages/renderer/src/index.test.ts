import { describe, expect, it, vi } from 'vitest';

const { init, destroy, canvas } = vi.hoisted(() => ({
  init: vi.fn(async () => undefined),
  destroy: vi.fn(),
  canvas: { tagName: 'CANVAS' },
}));
vi.mock('pixi.js', () => ({
  Application: class {
    init = init;
    destroy = destroy;
    canvas = canvas;
  },
}));

import { mountRenderer } from './index';

describe('mountRenderer', () => {
  it('initializes before attaching the canvas and disposes once', async () => {
    const appendChild = vi.fn(() => {
      expect(init).toHaveBeenCalledExactlyOnceWith({ resizeTo: host, backgroundAlpha: 0 });
    });
    const host = { appendChild } as unknown as HTMLElement;
    const dispose = await mountRenderer(host);
    expect(appendChild).toHaveBeenCalledExactlyOnceWith(canvas);
    dispose();
    dispose();
    expect(destroy).toHaveBeenCalledExactlyOnceWith(true, { children: true });
  });

  it('propagates initialization errors without attaching a canvas', async () => {
    init.mockRejectedValueOnce(new Error('WebGL unavailable'));
    const appendChild = vi.fn();
    await expect(mountRenderer({ appendChild } as unknown as HTMLElement)).rejects.toThrow('WebGL unavailable');
    expect(appendChild).not.toHaveBeenCalled();
  });
});
