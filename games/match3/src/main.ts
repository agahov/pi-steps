import { createGameWorld, initializeArchetypes } from '@pi-steps/game-logic';
import { ApplicationShell } from '@pi-steps/ui';
import { createApp, h } from 'vue';

const world = createGameWorld();
initializeArchetypes(world, []);
// Match-3 has no entity templates or systems yet. No update loop is started.

const app = createApp({
  render: () => h(ApplicationShell, {
    title: 'Match-3',
    status: 'World created. No archetypes or systems configured.',
  }),
});
app.mount('#app');
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
