/**
 * Configuration loader for BRUTAL
 */

export interface BrutalConfig {
  debug?: boolean;
  env?: string;
  features?: Record<string, boolean>;
  [key: string]: any;
}

export const configLoader = {
  config: {} as BrutalConfig,
  
  load(config: BrutalConfig): void {
    this.config = { ...this.config, ...config };
  },
  
  get(key: string): any {
    // Support nested path access like 'packages.@brutal/test.enabled'
    const keys = key.split('.');
    let value: any = this.config;
    
    for (const k of keys) {
      if (value == null) return undefined;
      value = value[k];
    }
    
    return value;
  },
  
  set(key: string, value: any): void {
    // Support nested path setting
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;
    
    for (const k of keys) {
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[lastKey] = value;
  },
  
  reset(): void {
    this.config = {};
  }
};
