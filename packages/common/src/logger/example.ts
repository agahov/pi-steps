import { createLogger } from './index.js';
import type { ContextLogger } from './index.js';

// Illustrative functions, not implemented game behavior.
function updateWorld(log: ContextLogger) {
  log.trace('Applying move');
  log.debug('World updated', { objectId: 'A' });
}

function renderWorld(log: ContextLogger) {
  log.trace('Reading World');
  log.debug('Frame drawn');
}

const logger = createLogger({
  level: 'warn',
  rules: [
    { feature: 'resolve-move', level: 'trace' },
    { module: 'renderer', level: 'debug' },
  ],
  // JSON lines make every context label visible and are easy to save or search.
  sink: entry => console.log(JSON.stringify(entry)),
});

const move = logger.forContext({ module: 'input', feature: 'resolve-move', traceId: 'move-42' });
move.trace('Move requested');
updateWorld(move.withContext({ module: 'game-logic' }));
renderWorld(move.withContext({ module: 'renderer' }));

const resize = logger.forContext({ module: 'renderer', feature: 'resize' });
resize.trace('Hidden: renderer threshold is debug for other features');
resize.debug('Viewport resized', { width: 800, height: 600 });

const audio = logger.forContext({ module: 'audio' });
audio.info('Hidden: default threshold is warn');
audio.warn('Audio unavailable');
