/**
 * Lazy loading support for routes
 */

export interface LazyRouteOptions {
  loading?: () => any;
  error?: (error: Error) => any;
  delay?: number;
  timeout?: number;
}

interface LazyRouteState {
  isLoading: boolean;
  isLoaded: boolean;
  error?: Error;
  component?: any;
}

export function lazyRoute(
  loader: () => Promise<any>,
  options: LazyRouteOptions = {}
): any {
  const state: LazyRouteState = {
    isLoading: false,
    isLoaded: false
  };

  let loadPromise: Promise<any> | null = null;

  return {
    async load(): Promise<any> {
      if (state.isLoaded && state.component) {
        return state.component;
      }

      if (loadPromise) {
        return loadPromise;
      }

      state.isLoading = true;

      loadPromise = new Promise(async (resolve, reject) => {
        try {
          // Handle delay option
          if (options.delay) {
            await new Promise(r => setTimeout(r, options.delay));
          }

          // Create timeout promise if specified
          let timeoutId: NodeJS.Timeout | undefined;
          const timeoutPromise = options.timeout
            ? new Promise((_, reject) => {
                timeoutId = setTimeout(
                  () => reject(new Error('Route loading timeout')),
                  options.timeout
                );
              })
            : null;

          // Load the component
          const loadPromise = loader();
          const module = timeoutPromise
            ? await Promise.race([loadPromise, timeoutPromise])
            : await loadPromise;

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          // Extract default export or module itself
          const component = module.default || module;

          state.component = component;
          state.isLoaded = true;
          state.isLoading = false;
          state.error = undefined;

          resolve(component);
        } catch (error) {
          state.error = error as Error;
          state.isLoading = false;
          
          if (options.error) {
            resolve(options.error(error as Error));
          } else {
            reject(error);
          }
        } finally {
          loadPromise = null;
        }
      });

      return loadPromise;
    },

    get component() {
      if (state.isLoaded) {
        return state.component;
      }
      
      if (state.isLoading && options.loading) {
        return options.loading();
      }
      
      if (state.error && options.error) {
        return options.error(state.error);
      }
      
      // Trigger load and return loading component
      this.load();
      return options.loading ? options.loading() : null;
    },

    get isLoading() {
      return state.isLoading;
    },

    get isLoaded() {
      return state.isLoaded;
    },

    get error() {
      return state.error;
    },

    preload(): Promise<any> {
      return this.load();
    }
  };
}