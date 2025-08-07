/**
 * Redux DevTools integration
 */

import type { State, StoreApi, DevtoolsConfig } from '../types';

// DevTools extension interface
interface ReduxDevtoolsExtension {
  connect(options?: {
    name?: string;
    features?: {
      pause?: boolean;
      lock?: boolean;
      persist?: boolean;
      export?: boolean;
      import?: boolean;
      jump?: boolean;
      skip?: boolean;
      reorder?: boolean;
      dispatch?: boolean;
      test?: boolean;
    };
  }): {
    init(state: any): void;
    send(action: string | { type: string }, state: any): void;
    subscribe(listener: (message: any) => void): () => void;
    unsubscribe(): void;
    error(message: string): void;
  };
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevtoolsExtension;
  }
}

/**
 * Connect store to Redux DevTools
 */
export const devtools = <T extends State>(
  api: StoreApi<T>,
  config: DevtoolsConfig = {}
): (() => void) | undefined => {
  if (typeof window === 'undefined' || !window.__REDUX_DEVTOOLS_EXTENSION__) {
    return undefined;
  }
  
  if (config.enabled === false) {
    return undefined;
  }
  
  const extension = window.__REDUX_DEVTOOLS_EXTENSION__;
  const name = config.name || 'BrutalStore';
  
  const connection = extension.connect({
    name,
    features: {
      pause: true,
      lock: true,
      persist: true,
      export: true,
      import: true,
      jump: true,
      skip: true,
      reorder: true,
      dispatch: true,
      test: true
    }
  });
  
  // Initialize with current state
  connection.init(api.getState());
  
  // Subscribe to state changes
  const unsubscribe = api.subscribe((state) => {
    connection.send('STATE_UPDATE', state);
  });
  
  // Handle time travel debugging
  const unsubscribeDevtools = connection.subscribe((message: any) => {
    if (message.type === 'DISPATCH') {
      switch (message.payload.type) {
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          if (message.state) {
            api.setState(JSON.parse(message.state));
          }
          break;
          
        case 'COMMIT':
          connection.init(api.getState());
          break;
          
        case 'RESET':
          connection.init(api.getState());
          break;
          
        case 'ROLLBACK':
          if (message.state) {
            api.setState(JSON.parse(message.state));
            connection.init(api.getState());
          }
          break;
          
        case 'IMPORT_STATE':
          if (message.payload.nextLiftedState?.computedStates) {
            const states = message.payload.nextLiftedState.computedStates;
            const lastState = states[states.length - 1]?.state;
            if (lastState) {
              api.setState(lastState);
            }
          }
          break;
      }
    }
  });
  
  // Return cleanup function
  return () => {
    unsubscribe();
    unsubscribeDevtools();
    connection.unsubscribe();
  };
};