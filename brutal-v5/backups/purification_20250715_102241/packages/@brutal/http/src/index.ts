/**
 * @brutal/http - Ultra-lightweight HTTP client
 * @packageDocumentation
 */

// Export minimal implementation with proper names
export { h as createHttp } from './minimal';

// Type exports
export type {
  RequestConfig,
  RetryConfig,
  Response,
  Interceptor,
  InterceptorManager,
  Transformer,
  HttpClient
} from './types';

// Constants
export const VERSION = '__VERSION__';
export const PACKAGE_NAME = '@brutal/http';