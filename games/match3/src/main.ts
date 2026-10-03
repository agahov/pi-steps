import type { GameDefinition } from '@pi-steps/core';
import { createGameWorld } from '@pi-steps/game-logic';
import { createConsoleSink, createLogger } from '@pi-steps/logger';
import { AppShell } from '@pi-steps/ui';
import { createApp, h, shallowRef } from 'vue';

const game: GameDefinition = { id: 'match3', title: 'Match-3' };
const logger = createLogger({ sink: createConsoleSink(), level: 'info' });
const world = createGameWorld();
logger.forDomain('game').debug('ECS world created', { worldCreated: !!world });

const app = createApp({
  setup() {
    const uiState = shallowRef({ status: 'Scaffold ready' });
    logger.forDomain('app').info('Application started', { id: game.id });
    return () => h(AppShell, {
      title: game.title,
      status: uiState.value.status,
      onCheck: () => {
        logger.forDomain('ui').info('Setup checked');
        uiState.value = { status: 'Setup checked' };
      },
    });
  },
});
app.mount('#app');
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
