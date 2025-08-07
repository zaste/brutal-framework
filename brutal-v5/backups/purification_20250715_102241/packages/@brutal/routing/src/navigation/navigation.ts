/**
 * Navigation utilities
 */

/**
 * Navigate to a URL
 */
export function navigate(url: string, replace = false): void {
  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }
  
  // Trigger popstate event
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Go back in history
 */
export function back(): void {
  window.history.back();
}

/**
 * Go forward in history
 */
export function forward(): void {
  window.history.forward();
}