import { describe, it, expect, beforeEach } from '@jest/globals';
import { StateHistory } from './history.js';

describe('StateHistory', () => {
  interface TestState {
    count: number;
    name: string;
  }

  let history: StateHistory<TestState>;
  let initialState: TestState;

  beforeEach(() => {
    history = new StateHistory<TestState>();
    initialState = { count: 0, name: 'test' };
  });

  describe('snapshot', () => {
    it('should take a snapshot of state', () => {
      history.snapshot(initialState);
      const snapshots = history.getHistory();
      
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].state).toEqual(initialState);
      expect(snapshots[0].id).toBeDefined();
      expect(snapshots[0].timestamp).toBeDefined();
    });

    it('should track actions when enabled', () => {
      const action = { type: 'INCREMENT', payload: 1 };
      history.snapshot(initialState, action);
      
      const snapshots = history.getHistory();
      expect(snapshots[0].action).toEqual(action);
    });

    it('should respect maxSnapshots limit', () => {
      const smallHistory = new StateHistory<TestState>({ maxSnapshots: 3 });
      
      for (let i = 0; i < 5; i++) {
        smallHistory.snapshot({ count: i, name: 'test' });
      }
      
      expect(smallHistory.getHistory()).toHaveLength(3);
      expect(smallHistory.getHistory()[0].state.count).toBe(2);
    });

    it('should clear forward history on new snapshot', () => {
      history.snapshot({ count: 1, name: 'one' });
      history.snapshot({ count: 2, name: 'two' });
      history.snapshot({ count: 3, name: 'three' });
      
      history.back(2);
      history.snapshot({ count: 4, name: 'four' });
      
      expect(history.getHistory()).toHaveLength(2);
    });
  });

  describe('back', () => {
    beforeEach(() => {
      history.snapshot({ count: 1, name: 'one' });
      history.snapshot({ count: 2, name: 'two' });
      history.snapshot({ count: 3, name: 'three' });
    });

    it('should go back one step by default', () => {
      const state = history.back();
      expect(state).toEqual({ count: 2, name: 'two' });
      expect(history.getCurrentIndex()).toBe(1);
    });

    it('should go back multiple steps', () => {
      const state = history.back(2);
      expect(state).toEqual({ count: 1, name: 'one' });
      expect(history.getCurrentIndex()).toBe(0);
    });

    it('should not go before first snapshot', () => {
      history.back(10);
      expect(history.getCurrentIndex()).toBe(0);
    });

    it('should return undefined when already at start', () => {
      history.back(2);
      const state = history.back();
      expect(state).toBeUndefined();
    });
  });

  describe('forward', () => {
    beforeEach(() => {
      history.snapshot({ count: 1, name: 'one' });
      history.snapshot({ count: 2, name: 'two' });
      history.snapshot({ count: 3, name: 'three' });
      history.back(2);
    });

    it('should go forward one step by default', () => {
      const state = history.forward();
      expect(state).toEqual({ count: 2, name: 'two' });
      expect(history.getCurrentIndex()).toBe(1);
    });

    it('should go forward multiple steps', () => {
      const state = history.forward(2);
      expect(state).toEqual({ count: 3, name: 'three' });
      expect(history.getCurrentIndex()).toBe(2);
    });

    it('should not go beyond last snapshot', () => {
      history.forward(10);
      expect(history.getCurrentIndex()).toBe(2);
    });

    it('should return undefined when already at end', () => {
      history.forward(2);
      const state = history.forward();
      expect(state).toBeUndefined();
    });
  });

  describe('goto', () => {
    let snapshotIds: string[] = [];

    beforeEach(() => {
      history.snapshot({ count: 1, name: 'one' });
      history.snapshot({ count: 2, name: 'two' });
      history.snapshot({ count: 3, name: 'three' });
      snapshotIds = history.getHistory().map(s => s.id);
    });

    it('should jump to specific snapshot', () => {
      const state = history.goto(snapshotIds[0]);
      expect(state).toEqual({ count: 1, name: 'one' });
      expect(history.getCurrentIndex()).toBe(0);
    });

    it('should return undefined for invalid snapshot id', () => {
      const state = history.goto('invalid-id');
      expect(state).toBeUndefined();
      expect(history.getCurrentIndex()).toBe(2);
    });
  });

  describe('canUndo/canRedo', () => {
    it('should correctly report undo/redo availability', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      
      history.snapshot({ count: 1, name: 'one' });
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      
      history.snapshot({ count: 2, name: 'two' });
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      
      history.back();
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      history.snapshot({ count: 1, name: 'one' });
      history.snapshot({ count: 2, name: 'two' });
      
      history.clear();
      
      expect(history.getHistory()).toHaveLength(0);
      expect(history.getCurrentIndex()).toBe(-1);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });

  describe('custom serializer', () => {
    it('should use custom serializer', () => {
      const customHistory = new StateHistory<TestState>({
        serializer: (state) => ({ ...state, serialized: true } as any)
      });
      
      customHistory.snapshot({ count: 1, name: 'test' });
      const snapshots = customHistory.getHistory();
      
      expect((snapshots[0].state as any).serialized).toBe(true);
    });
  });
});