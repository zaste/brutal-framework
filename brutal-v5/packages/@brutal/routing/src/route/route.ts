/**
 * Route class
 */

import type { RouteConfig } from '../types.js';

export class Route {
  private regex: RegExp;
  private paramNames: string[] = [];
  
  constructor(public config: RouteConfig) {
    // Convert path to regex and extract param names
    let tempPath = config.path;
    const paramPositions: Array<{ name: string; index: number }> = [];
    
    // First, find all parameters and their positions
    let match;
    const paramRegex = /:(\w+)(\?)?/g;
    while ((match = paramRegex.exec(config.path)) !== null) {
      paramPositions.push({ name: match[1]!, index: match.index });
    }
    
    // Sort by position to maintain order
    paramPositions.sort((a, b) => a.index - b.index);
    this.paramNames = paramPositions.map(p => p.name);
    
    // Now convert path to regex - order matters!
    let pattern = tempPath;
    
    // Replace optional params first (they end with ?)
    // Include the preceding slash in the optional group
    pattern = pattern.replace(/\/:(\w+)\?/g, '(?:\\/([^/]*))?');
    
    // Then replace required params
    pattern = pattern.replace(/:(\w+)/g, '([^/]+)');
    
    // Escape forward slashes
    pattern = pattern.replace(/\//g, '\\/');
    
    // Finally replace wildcards
    pattern = pattern.replace(/\*/g, '.*');
    
    this.regex = new RegExp(`^${pattern}$`);
  }
  
  /**
   * Check if URL matches this route
   */
  matches(url: string): boolean {
    return this.regex.test(url);
  }
  
  /**
   * Extract params from URL
   */
  extractParams(url: string): Record<string, string> {
    const match = url.match(this.regex);
    const params: Record<string, string> = {};
    
    if (match) {
      this.paramNames.forEach((name, index) => {
        params[name] = match[index + 1] || '';
      });
    }
    
    return params;
  }
}