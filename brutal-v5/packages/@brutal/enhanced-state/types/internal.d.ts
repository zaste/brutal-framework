/**
 * Internal type definitions (not exported)
 */

export interface InternalConfig {
  _initialized: boolean;
  _debug: boolean;
}

export type InternalState = 
  | 'idle'
  | 'processing'
  | 'complete'
  | 'error';
