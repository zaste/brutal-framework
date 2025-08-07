export interface TestResult {
  passed: number;
  failed: number;
  errors: Error[];
}

export type TestFunction = () => void | Promise<void>;

export interface Suite {
  name: string;
  tests: TestFunction[];
}

export interface MockFunction<T extends (...args: any[]) => any = (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  calls: Array<{ args: any[]; result?: any; error?: any }>;
  returns: (value: any) => MockFunction<T>;
  throws: (error: any) => MockFunction<T>;
  withCall: (n: number) => any;
  lastCall: () => any;
  size: () => number;
  reset: () => void;
}

export interface Assertions {
  equal: (actual: any, expected: any, message?: string) => void;
  is: (actual: any, expected: any, message?: string) => void;
  ok: (value: any, message?: string) => void;
  fail: (message?: string) => void;
  throws: (fn: () => any, expected?: RegExp | string, message?: string) => Promise<void>;
}

export interface DOMHelpers {
  render: (html: string) => HTMLElement;
  find: (selector: string, element?: Element) => Element | null;
  findAll: (selector: string, element?: Element) => Element[];
  fire: (element: Element, event: string, detail?: any) => void;
  cleanup: () => void;
}

export interface AsyncHelpers {
  wait: (ms: number) => Promise<void>;
  waitFor: (condition: () => boolean, timeout?: number, interval?: number) => Promise<void>;
  flush: () => Promise<void>;
}