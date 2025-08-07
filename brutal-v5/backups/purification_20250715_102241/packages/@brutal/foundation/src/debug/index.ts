/**
 * Debug utilities for BRUTAL foundation
 */

// import type { DebugInfo } from '../types.js';

// Debug levels
export const DebugLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
} as const;

export type DebugLevel = keyof typeof DebugLevels;

// Color codes
const colors = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[32m',
  trace: '\x1b[90m',
  reset: '\x1b[0m'
} as const;

/**
 * Debug configuration
 */
interface DebugConfig {
  enabled: boolean;
  level: DebugLevel;
  namespaces: Set<string>;
  timestamp: boolean;
  colors: boolean;
}

const config: DebugConfig = {
  enabled: false,
  level: 'INFO',
  namespaces: new Set(['*']),
  timestamp: true,
  colors: typeof process !== 'undefined' && process.stdout?.isTTY === true
};

/**
 * Configure debug settings
 */
export function configureDebug(options: Partial<DebugConfig>): void {
  Object.assign(config, options);
}

/**
 * Check if debug is enabled for namespace
 */
function isEnabled(namespace?: string): boolean {
  if (!config.enabled) return false;
  if (!namespace) return true;
  
  // Check if namespace matches any pattern
  for (const pattern of config.namespaces) {
    if (pattern === '*') return true;
    if (pattern === namespace) return true;
    
    // Wildcard matching
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (namespace.startsWith(prefix)) return true;
    }
  }
  
  return false;
}

/**
 * Format debug message
 */
function formatMessage(
  level: DebugLevel,
  namespace: string | undefined,
  message: string,
  ...args: any[]
): string {
  const parts: string[] = [];
  
  // Timestamp
  if (config.timestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  // Level
  const levelStr = `[${level}]`;
  if (config.colors) {
    const color = colors[level.toLowerCase() as keyof typeof colors] || '';
    parts.push(`${color}${levelStr}${colors.reset}`);
  } else {
    parts.push(levelStr);
  }
  
  // Namespace
  if (namespace) {
    parts.push(`[${namespace}]`);
  }
  
  // Message
  parts.push(message);
  
  // Format args
  if (args.length > 0) {
    parts.push(...args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ));
  }
  
  return parts.join(' ');
}

/**
 * Create debug instance
 */
export function createDebug(namespace?: string) {
  const log = (level: DebugLevel, message: string, ...args: any[]) => {
    if (!isEnabled(namespace)) return;
    if (DebugLevels[level] > DebugLevels[config.level]) return;
    
    const formatted = formatMessage(level, namespace, message, ...args);
    
    // Output based on level
    switch (level) {
      case 'ERROR':
        console.error(formatted);
        break;
      case 'WARN':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  };
  
  return {
    error: (message: string, ...args: any[]) => log('ERROR', message, ...args),
    warn: (message: string, ...args: any[]) => log('WARN', message, ...args),
    info: (message: string, ...args: any[]) => log('INFO', message, ...args),
    debug: (message: string, ...args: any[]) => log('DEBUG', message, ...args),
    trace: (message: string, ...args: any[]) => log('TRACE', message, ...args),
    
    // Timing utilities
    time: (label: string) => {
      if (!isEnabled(namespace)) return;
      console.time(label);
    },
    
    timeEnd: (label: string) => {
      if (!isEnabled(namespace)) return;
      console.timeEnd(label);
    },
    
    // Group utilities
    group: (label: string) => {
      if (!isEnabled(namespace)) return;
      console.group(label);
    },
    
    groupEnd: () => {
      if (!isEnabled(namespace)) return;
      console.groupEnd();
    },
    
    // Table utility
    table: (data: any) => {
      if (!isEnabled(namespace)) return;
      console.table(data);
    }
  };
}

// Default debug instance
export const debug = createDebug('brutal:foundation');

/**
 * Performance measurement utility
 */
export class PerformanceMeasure {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();
  
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`);
    }
    
    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      throw new Error(`End mark "${endMark}" not found`);
    }
    
    const duration = end - start;
    this.measures.set(name, duration);
    
    return duration;
  }
  
  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }
  
  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }
  
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Memory usage utility (Node.js only)
 */
export function getMemoryUsage(): Record<string, number> | null {
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return null;
  }
  
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024) // MB
  };
}

/**
 * Stack trace utility
 */
export function getStackTrace(limit = 10): string[] {
  const obj = {} as any;
  Error.captureStackTrace(obj, getStackTrace);
  
  return obj.stack
    ?.split('\n')
    .slice(1, limit + 1)
    .map((l: string) => l.trim())
    .filter((l: string) => l.startsWith('at ')) || [];
}

/**
 * Object inspector
 */
export function inspect(obj: any, _depth = 2): string {
  return JSON.stringify(obj, (_key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    
    // Handle functions
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    
    // Handle undefined
    if (value === undefined) {
      return '[undefined]';
    }
    
    return value;
  }, 2);
}

const seen = new WeakSet();

// Export debug API
export const debugAPI = {
  configure: configureDebug,
  create: createDebug,
  measure: new PerformanceMeasure(),
  getMemoryUsage,
  getStackTrace,
  inspect
};