import { describe, expect, it, vi } from 'vitest';
import {
  createConsoleSink, createLogger,
  type ConsoleTarget, type ContextLogger, type LogEntry, type LogLevel, type LogThreshold,
} from './index.js';

const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
const thresholds: LogThreshold[] = [...levels, 'silent'];
const emitAll = (log: ContextLogger) => { for (const level of levels) log[level](level); };

describe('log filtering', () => {
  it.each(thresholds)('emits levels at or above %s', level => {
    const entries: LogEntry[] = [];
    emitAll(createLogger({ level, sink: entry => entries.push(entry) }).forContext({ module: 'game-logic' }));
    expect(entries.map(entry => entry.level)).toEqual(levels.slice(thresholds.indexOf(level)));
  });

  it('defaults to info', () => {
    const sink = vi.fn();
    emitAll(createLogger({ sink }).forContext({ module: 'game-logic' }));
    expect(sink.mock.calls.map(([entry]) => entry.level)).toEqual(['info', 'warn', 'error']);
  });

  it('traces one feature across modules while retaining unrelated warnings', () => {
    const entries: LogEntry[] = [];
    const logger = createLogger({
      sink: entry => entries.push(entry), level: 'warn',
      rules: [{ feature: 'resolve-move', level: 'trace' }],
    });
    for (const module of ['input', 'game-logic', 'renderer']) {
      logger.forContext({ module, feature: 'resolve-move' }).trace('step');
      logger.forContext({ module, feature: 'load-level' }).debug('hidden');
    }
    logger.forContext({ module: 'audio' }).warn('unrelated warning');
    expect(entries.map(entry => [entry.module, entry.level])).toEqual([
      ['input', 'trace'], ['game-logic', 'trace'], ['renderer', 'trace'], ['audio', 'warn'],
    ]);
  });

  it('debugs one module across features with a silent default', () => {
    const sink = vi.fn();
    const logger = createLogger({ sink, level: 'silent', rules: [{ module: 'renderer', level: 'debug' }] });
    for (const feature of ['resolve-move', 'resize']) logger.forContext({ module: 'renderer', feature }).debug('visible');
    logger.forContext({ module: 'game-logic', feature: 'resolve-move' }).error('hidden by explicit silent default');
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('requires every label in a rule to match exactly', () => {
    const sink = vi.fn();
    const logger = createLogger({
      sink, level: 'silent',
      rules: [{ module: 'renderer', feature: 'resolve-move', traceId: 'move-42', level: 'trace' }],
    });
    for (const context of [
      { module: 'renderer', feature: 'resolve-move', traceId: 'move-42' },
      { module: 'renderer', feature: 'resolve-move', traceId: 'move-43' },
      { module: 'renderer', feature: 'resize', traceId: 'move-42' },
      { module: 'renderer.extra', feature: 'resolve-move', traceId: 'move-42' },
      { module: 'renderer' },
    ]) logger.forContext(context).trace('step');
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('uses the first matching rule, including silent overrides', () => {
    const sink = vi.fn();
    const logger = createLogger({ sink, rules: [
      { module: 'renderer', feature: 'resolve-move', level: 'silent' },
      { feature: 'resolve-move', level: 'trace' },
      { module: 'renderer', level: 'debug' },
    ] });
    logger.forContext({ module: 'renderer', feature: 'resolve-move' }).error('hidden');
    logger.forContext({ module: 'game-logic', feature: 'resolve-move' }).trace('visible');
    logger.forContext({ module: 'renderer', feature: 'resize' }).debug('visible');
    expect(sink.mock.calls.map(([entry]) => entry.module)).toEqual(['game-logic', 'renderer']);
  });

  it('traces a single operation across modules and features', () => {
    const sink = vi.fn();
    const logger = createLogger({ sink, level: 'silent', rules: [{ traceId: 'move-42', level: 'trace' }] });
    logger.forContext({ module: 'input', traceId: 'move-42' }).trace('accepted');
    logger.forContext({ module: 'game-logic', feature: 'resolve-move', traceId: 'move-42' }).trace('committed');
    logger.forContext({ module: 'input', traceId: 'move-43' }).trace('hidden');
    expect(sink).toHaveBeenCalledTimes(2);
  });
});

describe('context and output', () => {
  it('inherits feature and traceId while changing module without mutating the parent', () => {
    const sink = vi.fn();
    const parent = createLogger({ sink, level: 'trace' }).forContext({
      module: 'input', feature: 'resolve-move', traceId: 'move-42',
    });
    const child = parent.withContext({ module: 'game-logic' });
    child.trace('committed');
    parent.trace('requested');
    expect(sink.mock.calls.map(([entry]) => [entry.module, entry.feature, entry.traceId])).toEqual([
      ['game-logic', 'resolve-move', 'move-42'], ['input', 'resolve-move', 'move-42'],
    ]);
  });

  it('re-evaluates filters for child contexts', () => {
    const sink = vi.fn();
    const parent = createLogger({ sink, level: 'silent', rules: [{ module: 'renderer', level: 'debug' }] })
      .forContext({ module: 'game-logic' });
    parent.debug('hidden');
    parent.withContext({ module: 'renderer' }).debug('visible');
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('snapshots configuration and contexts and isolates logger instances', () => {
    const sink = vi.fn();
    const rules: { module: string; level: LogThreshold }[] = [{ module: 'renderer', level: 'trace' }];
    const context = { module: 'renderer' };
    const logger = createLogger({ sink, level: 'silent', rules });
    const log = logger.forContext(context);
    rules[0]!.level = 'silent';
    context.module = 'other';
    log.trace('retains context');
    logger.forContext({ module: 'renderer' }).trace('retains rules');
    const otherSink = vi.fn();
    createLogger({ sink: otherSink, level: 'silent' }).forContext({ module: 'renderer' }).error('hidden');
    expect(sink).toHaveBeenCalledTimes(2);
    expect(otherSink).not.toHaveBeenCalled();
  });

  it('calls the clock and sink only for accepted entries; metadata stays separate', () => {
    const sink = vi.fn();
    const clock = vi.fn(() => 123);
    const log = createLogger({ sink, clock }).forContext({ module: 'renderer' });
    const data = { module: 'not-a-label', objectId: 3 };
    log.debug('hidden', data);
    log.info('drawn', data);
    expect(clock).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledExactlyOnceWith({ timestamp: 123, module: 'renderer', level: 'info', message: 'drawn', data });
    expect(sink.mock.calls[0]![0].data).toBe(data);
  });

  it.each([null, false, 0, ''])('preserves falsy metadata %s', data => {
    const sink = vi.fn();
    createLogger({ sink }).forContext({ module: 'app' }).info('metadata', data);
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ data }));
  });

  it('omits absent metadata and timestamps with epoch milliseconds by default', () => {
    const sink = vi.fn();
    const start = Date.now();
    createLogger({ sink }).forContext({ module: 'app' }).info('ready');
    const entry = sink.mock.calls[0]![0];
    expect(entry).not.toHaveProperty('data');
    expect(entry.timestamp).toBeGreaterThanOrEqual(start);
    expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('propagates sink errors', () => {
    const log = createLogger({ sink() { throw new Error('sink failed'); } }).forContext({ module: 'app' });
    expect(() => log.info('ready')).toThrow('sink failed');
  });
});

describe('console output', () => {
  it.each(levels)('routes %s without generating stack traces', level => {
    const target: ConsoleTarget = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const entry: LogEntry = { timestamp: 123, level, module: 'renderer', message: 'frame' };
    createConsoleSink(target)(entry);
    const method = level === 'trace' ? 'debug' : level;
    expect(target[method]).toHaveBeenCalledExactlyOnceWith(entry);
    expect(Object.values(target).reduce((count, fn) => count + vi.mocked(fn).mock.calls.length, 0)).toBe(1);
  });

  it('preserves the console receiver', () => {
    const target: ConsoleTarget = {
      debug() {}, info() {}, warn() {},
      error(this: ConsoleTarget) { expect(this).toBe(target); },
    };
    createConsoleSink(target)({ timestamp: 0, level: 'error', module: 'app', message: 'oops' });
  });
});
