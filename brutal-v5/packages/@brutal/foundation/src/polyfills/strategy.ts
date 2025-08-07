/**
 * Polyfill loading strategy for BRUTAL
 */

export interface PolyfillConfig {
  /** Feature to polyfill */
  feature: string;
  /** Test function to check if polyfill is needed */
  test: () => boolean;
  /** Polyfill loader function */
  load: () => Promise<void>;
}

export const polyfillStrategy = {
  configs: [] as PolyfillConfig[],
  
  register(config: PolyfillConfig): void {
    this.configs.push(config);
  },
  
  async loadRequired(): Promise<void> {
    const needed = this.configs.filter(config => !config.test());
    
    await Promise.all(
      needed.map(config => config.load())
    );
  }
};
