/**
 * Internal types for example feature
 */

export interface FeatureState {
  initialized: boolean;
  processing: boolean;
  errorCount: number;
}

export interface ProcessOptions {
  timeout?: number;
  signal?: AbortSignal;
}
