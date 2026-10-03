import { createEventBus } from '@pi-steps/core';
import type { MoveObject, ObjectMoved } from '@pi-steps/core';
import { createMoveGame } from '@pi-steps/game-logic';
import { createConsoleSink, createLogger } from '@pi-steps/logger';
import { mountMoveScene } from '@pi-steps/renderer';
import { createMoveProjection, createUiMoveAction, MoveDemo } from '@pi-steps/ui';
import { createApp, h } from 'vue';

const logger = createLogger({
  sink: createConsoleSink(),
  level: import.meta.env.DEV ? 'debug' : 'info',
});
const commands = createEventBus<MoveObject>();
const events = createEventBus<ObjectMoved>();
const game = createMoveGame({ initialObject: { id: 'A', x: 10, y: 20 }, emit: events.send });
const projection = createMoveProjection(game.readObject('A'));
const unsubscribeCommands = commands.subscribe(game.handle);
const unsubscribeEvents = events.subscribe(projection.apply);
const move = createUiMoveAction(commands.send);
const app = createApp({
  setup() {
    return () => h(MoveDemo, {
      object: projection.state.value,
      move,
      mountScene: host => mountMoveScene(host, {
        readObject: () => game.readObject('A'),
        send: commands.send,
        camera: {},
      }),
    });
  },
});
app.mount('#app');
logger.forDomain('app').info('Bootstrap move demo started');
if (import.meta.hot) import.meta.hot.dispose(() => {
  app.unmount();
  unsubscribeCommands();
  unsubscribeEvents();
});
