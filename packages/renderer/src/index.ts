import { Application } from 'pixi.js';

export { createCamera } from './camera';
export type { Camera, CameraConfig } from './camera';
export { createPixiMoveInput, createRenderSystem, mountMoveScene } from './move-scene';

/** Lifecycle-only entry point; use mountMoveScene for the bootstrap demo. */
export async function mountRenderer(host: HTMLElement): Promise<() => void> {
  const application = new Application();
  await application.init({ resizeTo: host, backgroundAlpha: 0 });
  host.appendChild(application.canvas);
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    application.destroy(true, { children: true });
  };
}
