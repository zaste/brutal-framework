/**
 * Type definitions for @brutal/http
 */

export interface RequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
  retry?: RetryConfig;
  transformRequest?: Transformer | Transformer[];
  transformResponse?: Transformer | Transformer[];
}

export interface RetryConfig {
  count?: number;
  delay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

export interface Interceptor<T = any> {
  onFulfilled?: (value: T) => T | Promise<T>;
  onRejected?: (error: any) => any;
}

export interface InterceptorManager<T = any> {
  use(onFulfilled?: (value: T) => T | Promise<T>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}

export type Transformer = (data: any, headers?: Record<string, string>) => any;

export interface HttpClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  head<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  options<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  request<T = any>(config: RequestConfig): Promise<Response<T>>;
  interceptors: {
    request: InterceptorManager<RequestConfig>;
    response: InterceptorManager<Response>;
  };
}