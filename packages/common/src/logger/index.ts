export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type LogThreshold = LogLevel | 'silent';

export interface LogContext {
  readonly module: string;
  readonly feature?: string;
  /** Correlates one operation across modules; not a distributed tracing span. */
  readonly traceId?: string;
}

export interface LogEntry extends LogContext {
  readonly timestamp: number;
  readonly level: LogLevel;
  readonly message: string;
  readonly data?: unknown;
}

/** All supplied labels must match exactly. The first matching rule wins. */
export interface LogRule extends Partial<LogContext> {
  readonly level: LogThreshold;
}

export type LogSink = (entry: LogEntry) => void;
export type LogMethod = (message: string, data?: unknown) => void;
export type ContextLogger = Readonly<Record<LogLevel, LogMethod>> & {
  withContext(context: Partial<LogContext>): ContextLogger;
};

export interface LoggerOptions {
  sink: LogSink;
  level?: LogThreshold;
  rules?: readonly LogRule[];
  clock?: () => number;
}

export interface Logger {
  forContext(context: LogContext): ContextLogger;
}

const priorities: Record<LogThreshold, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
};

/** Configuration is snapshotted. Context handles are independent, not global state. */
export function createLogger(options: LoggerOptions): Logger {
  const { sink, level = 'info', clock = Date.now } = options;
  const rules = options.rules?.map(rule => ({ ...rule })) ?? [];

  function forContext(context: LogContext): ContextLogger {
    const labels = { ...context };
    const rule = rules.find(rule =>
      (rule.module === undefined || rule.module === labels.module)
      && (rule.feature === undefined || rule.feature === labels.feature)
      && (rule.traceId === undefined || rule.traceId === labels.traceId),
    );
    const threshold = priorities[rule?.level ?? level];
    const method = (entryLevel: LogLevel): LogMethod => (message, data) => {
      if (priorities[entryLevel] < threshold) return;
      const entry: LogEntry = { ...labels, timestamp: clock(), level: entryLevel, message };
      sink(data === undefined ? entry : { ...entry, data });
    };

    return {
      withContext: context => forContext({ ...labels, ...context }),
      trace: method('trace'),
      debug: method('debug'),
      info: method('info'),
      warn: method('warn'),
      error: method('error'),
    };
  }

  return { forContext };
}

export type ConsoleTarget = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;

/** Trace uses console.debug: verbose records should not generate stack traces. */
export function createConsoleSink(target: ConsoleTarget = console): LogSink {
  return entry => target[entry.level === 'trace' ? 'debug' : entry.level](entry);
}
