import { describe, expect, it, vi } from 'vitest';
import {
  createConsoleSink,
  createLogger,
  type ConsoleTarget,
  type LogEntry,
  type LogLevel,
  type LogThreshold,
} from './index.js';

const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
const thresholds: LogThreshold[] = [...levels, 'silent'];

function emitAll(logger: ReturnType<typeof createLogger>, domain = 'game') {
  const scoped = logger.forDomain(domain);
  for (const level of levels) scoped[level](level);
}

describe('createLogger', () => {
  it.each(thresholds)('filters every message level at threshold %s', (level) => {
    const entries: LogEntry[] = [];
    const logger = createLogger({ level, sink: (entry) => entries.push(entry) });
    emitAll(logger);
    expect(entries.map((entry) => entry.level)).toEqual(
      levels.slice(thresholds.indexOf(level)),
    );
  });

  it('defaults to info', () => {
    const sink = vi.fn();
    emitAll(createLogger({ sink }));
    expect(sink.mock.calls.map(([entry]) => entry.level)).toEqual(['info', 'warn', 'error']);
  });

  it('applies exact domain overrides above and below the default threshold', () => {
    const sink = vi.fn();
    const logger = createLogger({
      sink,
      level: 'warn',
      domainLevels: { game: 'debug', render: 'error', ui: 'silent' },
    });
    for (const domain of ['app', 'game', 'game.physics', 'render', 'ui']) {
      emitAll(logger, domain);
    }
    expect(sink.mock.calls.map(([entry]) => [entry.domain, entry.level])).toEqual([
      ['app', 'warn'], ['app', 'error'],
      ['game', 'debug'], ['game', 'info'], ['game', 'warn'], ['game', 'error'],
      ['game.physics', 'warn'], ['game.physics', 'error'],
      ['render', 'error'],
    ]);
  });

  it('allows domain overrides to enable logging with a silent default', () => {
    const sink = vi.fn();
    const logger = createLogger({ sink, level: 'silent', domainLevels: { app: 'trace' } });
    emitAll(logger, 'game');
    emitAll(logger, 'app');
    expect(sink.mock.calls.map(([entry]) => entry.level)).toEqual(levels);
  });

  it('does not mistake inherited object properties for overrides', () => {
    const sink = vi.fn();
    const logger = createLogger({ sink });
    logger.forDomain('toString').info('ordinary domain');
    logger.forDomain('__proto__').info('also ordinary');
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('keeps instances, domain handles, and supplied configuration isolated', () => {
    const firstSink = vi.fn();
    const secondSink = vi.fn();
    const domainLevels: Record<string, LogThreshold> = { game: 'trace' };
    const first = createLogger({ sink: firstSink, domainLevels });
    const second = createLogger({ sink: secondSink, level: 'error' });
    domainLevels.game = 'silent';
    const game = first.forDomain('game');
    const ui = first.forDomain('ui');
    game.trace('first');
    ui.debug('filtered');
    game.info('still game');
    second.forDomain('game').info('filtered too');
    expect(firstSink.mock.calls.map(([entry]) => entry.domain)).toEqual(['game', 'game']);
    expect(secondSink).not.toHaveBeenCalled();
    first.forDomain('game').trace('new handle retains snapshot');
    expect(firstSink).toHaveBeenCalledTimes(3);
  });

  it('preserves metadata and uses the injected clock for each accepted entry', () => {
    const sink = vi.fn();
    const clock = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(200);
    const game = createLogger({ sink, clock }).forDomain('game');
    const data = { score: 20, nested: { chain: 2 } };
    game.debug('filtered', data);
    game.info('scored', data);
    game.error('failed');
    expect(clock).toHaveBeenCalledTimes(2);
    expect(sink.mock.calls).toEqual([
      [{ timestamp: 100, level: 'info', domain: 'game', message: 'scored', data }],
      [{ timestamp: 200, level: 'error', domain: 'game', message: 'failed' }],
    ]);
    expect(sink.mock.calls[0]?.[0].data).toBe(data);
    expect(sink.mock.calls[1]?.[0]).not.toHaveProperty('data');
  });

  it.each([null, false, 0, ''])('preserves falsy metadata %s', (data) => {
    const sink = vi.fn();
    createLogger({ sink }).forDomain('app').info('metadata', data);
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ data }));
  });

  it('uses epoch milliseconds by default', () => {
    const sink = vi.fn();
    const start = Date.now();
    createLogger({ sink }).forDomain('app').info('now');
    const timestamp = sink.mock.calls[0]?.[0].timestamp;
    expect(timestamp).toBeGreaterThanOrEqual(start);
    expect(timestamp).toBeLessThanOrEqual(Date.now());
  });
});

describe('createConsoleSink', () => {
  it.each(levels)('routes %s entries to the corresponding console method', (level) => {
    const target: ConsoleTarget = {
      trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    };
    const methods = { ...target };
    const entry: LogEntry = {
      timestamp: 123, level, domain: 'render', message: 'frame', data: { fps: 60 },
    };
    createConsoleSink(target)(entry);
    for (const candidate of levels) {
      expect(target[candidate]).toBe(methods[candidate]);
      expect(target[candidate]).toHaveBeenCalledTimes(candidate === level ? 1 : 0);
    }
    expect(target[level]).toHaveBeenCalledWith(entry);
  });

  it('preserves the receiver for console implementations that require it', () => {
    const target: ConsoleTarget = {
      trace() {}, debug() {}, info() {}, warn() {},
      error(this: ConsoleTarget) { expect(this).toBe(target); },
    };
    createConsoleSink(target)({ timestamp: 0, level: 'error', domain: 'app', message: 'oops' });
  });

  it('can use the global console without replacing its methods', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const sink = createConsoleSink();
      const entry: LogEntry = { timestamp: 0, level: 'info', domain: 'app', message: 'ready' };
      expect(console.info).toBe(spy);
      sink(entry);
      expect(spy).toHaveBeenCalledWith(entry);
      expect(console.info).toBe(spy);
    } finally {
      spy.mockRestore();
    }
  });
});
