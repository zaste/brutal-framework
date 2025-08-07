/**
 * Time travel debugging middleware
 */

import type { State, StoreApi, TimeTravelState, TimeTravelActions } from '../types';

interface TimeTravelConfig {
  limit?: number; // Maximum number of states to keep
}

/**
 * Add time travel debugging capabilities
 */
export const timeTravel = <T extends State>(
  api: StoreApi<T>,
  config: TimeTravelConfig = {}
): TimeTravelActions => {
  const { limit = 50 } = config;
  
  const history: TimeTravelState<T> = {
    past: [],
    present: api.getState(),
    future: []
  };
  
  // Track if we're in time travel mode
  let isTimeTraveling = false;
  
  // Subscribe to state changes
  const unsubscribe = api.subscribe((state, prevState) => {
    if (isTimeTraveling) {
      return;
    }
    
    // Add previous state to past
    history.past.push(history.present);
    history.present = state;
    history.future = []; // Clear future on new change
    
    // Enforce limit
    if (history.past.length > limit) {
      history.past.shift();
    }
  });
  
  const actions: TimeTravelActions = {
    undo: () => {
      if (history.past.length === 0) return;
      
      isTimeTraveling = true;
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);
      
      history.past = newPast;
      history.future = [history.present, ...history.future];
      history.present = previous;
      
      api.setState(previous);
      isTimeTraveling = false;
    },
    
    redo: () => {
      if (history.future.length === 0) return;
      
      isTimeTraveling = true;
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      
      history.past = [...history.past, history.present];
      history.future = newFuture;
      history.present = next;
      
      api.setState(next);
      isTimeTraveling = false;
    },
    
    jump: (index: number) => {
      const allStates = [...history.past, history.present, ...history.future];
      if (index < 0 || index >= allStates.length) return;
      
      isTimeTraveling = true;
      const targetState = allStates[index];
      
      history.past = allStates.slice(0, index);
      history.present = targetState;
      history.future = allStates.slice(index + 1);
      
      api.setState(targetState);
      isTimeTraveling = false;
    },
    
    clear: () => {
      history.past = [];
      history.future = [];
      history.present = api.getState();
    }
  };
  
  // Add cleanup
  (actions as any).destroy = () => {
    unsubscribe();
    history.past = [];
    history.future = [];
  };
  
  return actions;
};