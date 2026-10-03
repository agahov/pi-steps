import type { GameObject, MoveObject, Point } from '@pi-steps/core';
import { Application, Graphics, Rectangle } from 'pixi.js';
import type { Camera, CameraConfig } from './camera';
import { createCamera } from './camera';

/** Input requests a move; it never writes gameplay or presentation state. */
export function createPixiMoveInput(options: {
  objectId: string;
  screenToWorld: (point: Point) => Point;
  send: (command: MoveObject) => void;
}) {
  return (screen: Point) => {
    const world = options.screenToWorld(screen);
    options.send({ type: 'MoveObject', id: options.objectId, ...world });
  };
}

/** Reads committed state and projects it through the injected Camera. */
export function createRenderSystem(options: {
  readObject: () => GameObject;
  camera: Pick<Camera, 'worldToScreen'>;
  display: (position: Point, size: Point) => void;
}) {
  return {
    renderFrame() {
      const position = options.camera.worldToScreen(options.readObject());
      const origin = options.camera.worldToScreen({ x: 0, y: 0 });
      const corner = options.camera.worldToScreen({ x: 4, y: 4 });
      options.display(position, { x: corner.x - origin.x, y: corner.y - origin.y });
    },
  };
}

/** Owns the Pixi scene, viewport observation, input, and their cleanup. */
export async function mountMoveScene(host: HTMLElement, options: {
  readObject: () => GameObject;
  send: (command: MoveObject) => void;
  camera?: CameraConfig;
}) {
  const camera = createCamera(options.camera);
  const application = new Application();
  try {
    await application.init({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight),
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      background: 0x18212f,
      preference: 'webgl',
    });
  } catch (error) {
    // Pixi may not have a renderer yet after a failed initialization.
    if (application.renderer) application.destroy(true, { children: true });
    throw error;
  }
  let observer: ResizeObserver | undefined;
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    application.destroy(true, { children: true });
  }
  try {
    const object = new Graphics().rect(-2, -2, 4, 4).fill(0x38bdf8);
    application.stage.addChild(object);
    application.stage.eventMode = 'static';
    const render = createRenderSystem({
      readObject: options.readObject,
      camera,
      display(position, size) {
        object.position.set(position.x, position.y);
        object.scale.set(size.x / 4, size.y / 4);
      },
    });
    const input = createPixiMoveInput({
      objectId: options.readObject().id,
      screenToWorld: camera.screenToWorld,
      send: options.send,
    });
    application.stage.on('pointertap', event => input(event.global));
    function resize() {
      if (disposed) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.resize(width, height);
      application.renderer.resize(width, height);
      application.stage.hitArea = new Rectangle(0, 0, width, height);
      render.renderFrame();
    }
    resize();
    application.ticker.add(render.renderFrame);
    observer = new ResizeObserver(resize);
    observer.observe(host);
    application.canvas.setAttribute('aria-label', 'World scene: click to move object A');
    host.appendChild(application.canvas);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
