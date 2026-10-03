export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type LogThreshold = LogLevel | 'silent';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  domain: string;
  message: string;
  data?: unknown;
}

export type LogSink = (entry: LogEntry) => void;
export type LogClock = () => number;
export type LogMethod = (message: string, data?: unknown) => void;
export type DomainLogger = Readonly<Record<LogLevel, LogMethod>>;

export interface LoggerOptions {
  sink: LogSink;
  level?: LogThreshold;
  domainLevels?: Readonly<Record<string, LogThreshold>>;
  clock?: LogClock;
}

export interface Logger {
  forDomain(domain: string): DomainLogger;
}

const priorities: Record<LogThreshold, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
};

/** Create an independent logger. Domain overrides match exact names only. */
export function createLogger(options: LoggerOptions): Logger {
  const { sink, level = 'info', clock = Date.now } = options;
  const domainLevels = new Map(Object.entries(options.domainLevels ?? {}));

  return {
    forDomain(domain) {
      const threshold = priorities[domainLevels.get(domain) ?? level];
      const method = (entryLevel: LogLevel): LogMethod => (message, data) => {
        if (priorities[entryLevel] < threshold) return;

        const entry: LogEntry = {
          timestamp: clock(),
          level: entryLevel,
          domain,
          message,
        };
        if (data !== undefined) entry.data = data;
        sink(entry);
      };

      return {
        trace: method('trace'),
        debug: method('debug'),
        info: method('info'),
        warn: method('warn'),
        error: method('error'),
      };
    },
  };
}

export type ConsoleTarget = Pick<Console, LogLevel>;

/** Forward structured entries to their matching console methods without patching console. */
export function createConsoleSink(target: ConsoleTarget = console): LogSink {
  return (entry) => target[entry.level](entry);
}
