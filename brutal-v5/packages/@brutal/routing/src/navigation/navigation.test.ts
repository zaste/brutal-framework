import { jest } from '@jest/globals';
import { navigate, back, forward } from './navigation';

describe('@brutal/routing - Navigation', () => {
  // Save original functions
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  const originalBack = window.history.back;
  const originalForward = window.history.forward;
  const originalDispatchEvent = window.dispatchEvent;
  
  let events: Event[] = [];
  
  beforeEach(() => {
    events = [];
    
    // Mock history methods
    window.history.pushState = jest.fn();
    window.history.replaceState = jest.fn();
    window.history.back = jest.fn();
    window.history.forward = jest.fn();
    window.dispatchEvent = jest.fn((event) => {
      events.push(event);
      return true;
    });
  });
  
  afterEach(() => {
    // Restore original functions
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.history.back = originalBack;
    window.history.forward = originalForward;
    window.dispatchEvent = originalDispatchEvent;
  });
  
  describe('navigate', () => {
    it('should push state by default', () => {
      navigate('/about');
      expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/about');
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
    
    it('should replace state when specified', () => {
      navigate('/about', true);
      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/about');
      expect(window.history.pushState).not.toHaveBeenCalled();
    });
    
    it('should dispatch popstate event', () => {
      navigate('/about');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('popstate');
    });
  });
  
  describe('back', () => {
    it('should call history.back', () => {
      back();
      expect(window.history.back).toHaveBeenCalled();
    });
  });
  
  describe('forward', () => {
    it('should call history.forward', () => {
      forward();
      expect(window.history.forward).toHaveBeenCalled();
    });
  });
});