/**
 * Security Sandbox for BRUTAL V5
 * 
 * Provides isolated execution environments for untrusted code
 * with fine-grained permission control
 */

import { Worker } from 'worker_threads';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as vm from 'vm';
import * as crypto from 'crypto';

export interface SandboxPermissions {
  // File system access
  fs?: {
    read?: string[];  // Allowed read paths
    write?: string[]; // Allowed write paths
    delete?: boolean; // Allow file deletion
  };
  
  // Network access
  network?: {
    http?: boolean;
    https?: boolean;
    allowedHosts?: string[];
    blockedHosts?: string[];
  };
  
  // Process capabilities
  process?: {
    env?: string[];      // Allowed environment variables
    spawn?: boolean;     // Allow spawning child processes
    exit?: boolean;      // Allow process termination
  };
  
  // Resource limits
  resources?: {
    maxMemoryMB?: number;
    maxCpuPercent?: number;
    timeoutMs?: number;
    maxFileSize?: number;
  };
  
  // API access
  apis?: {
    console?: boolean;
    timers?: boolean;
    crypto?: boolean;
    globals?: string[];  // Allowed global variables
  };
}

export interface SandboxOptions {
  permissions: SandboxPermissions;
  trusted?: boolean;
  monitoring?: boolean;
  logPath?: string;
}

export interface SandboxResult {
  success: boolean;
  result?: any;
  error?: string;
  violations?: SecurityViolation[];
  metrics?: {
    executionTime: number;
    memoryUsed: number;
    cpuTime: number;
  };
}

export interface SecurityViolation {
  type: 'permission' | 'resource' | 'behavior';
  action: string;
  resource?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecuritySandbox {
  private violations: SecurityViolation[] = [];
  private startTime: number = 0;
  private monitoring: boolean = false;
  
  constructor(private options: SandboxOptions) {
    this.monitoring = options.monitoring || false;
  }
  
  async execute(code: string, context: any = {}): Promise<SandboxResult> {
    this.violations = [];
    this.startTime = Date.now();
    
    try {
      if (this.options.trusted) {
        // Trusted execution with monitoring
        return await this.executeTrusted(code, context);
      } else {
        // Untrusted execution in isolated environment
        return await this.executeIsolated(code, context);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        violations: this.violations
      };
    }
  }
  
  private async executeTrusted(code: string, context: any): Promise<SandboxResult> {
    // Create monitored context
    const sandbox = this.createMonitoredContext(context);
    
    try {
      const script = new vm.Script(code);
      const result = script.runInContext(sandbox, {
        timeout: this.options.permissions.resources?.timeoutMs || 5000
      });
      
      return {
        success: true,
        result,
        violations: this.violations,
        metrics: this.collectMetrics()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        violations: this.violations,
        metrics: this.collectMetrics()
      };
    }
  }
  
  private async executeIsolated(code: string, context: any): Promise<SandboxResult> {
    // Create worker for complete isolation
    // Use .ts file in development, .js in production
    const workerPath = join(__dirname.replace('/dist', ''), 'sandbox-worker.ts');
    
    return new Promise((resolve) => {
      const worker = new Worker(workerPath, {
        workerData: {
          code,
          context,
          permissions: this.options.permissions
        },
        resourceLimits: {
          maxOldGenerationSizeMb: this.options.permissions.resources?.maxMemoryMB || 128
        }
      });
      
      const timeout = setTimeout(() => {
        worker.terminate();
        this.violations.push({
          type: 'resource',
          action: 'timeout',
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });
        
        resolve({
          success: false,
          error: 'Execution timeout',
          violations: this.violations
        });
      }, this.options.permissions.resources?.timeoutMs || 5000);
      
      worker.on('message', (message) => {
        clearTimeout(timeout);
        
        if (message.type === 'result') {
          resolve({
            success: true,
            result: message.data,
            violations: [...this.violations, ...(message.violations || [])],
            metrics: message.metrics
          });
        } else if (message.type === 'error') {
          resolve({
            success: false,
            error: message.error,
            violations: [...this.violations, ...(message.violations || [])]
          });
        } else if (message.type === 'violation') {
          this.violations.push(message.violation);
        }
      });
      
      worker.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: error.message,
          violations: this.violations
        });
      });
    });
  }
  
  private createMonitoredContext(baseContext: any): vm.Context {
    const sandbox = Object.create(null);
    
    // Add allowed globals
    if (this.options.permissions.apis?.globals) {
      for (const global of this.options.permissions.apis.globals) {
        if (global in globalThis) {
          sandbox[global] = (globalThis as any)[global];
        }
      }
    }
    
    // Add monitored console
    if (this.options.permissions.apis?.console) {
      sandbox.console = this.createMonitoredConsole();
    }
    
    // Add monitored file system
    if (this.options.permissions.fs) {
      sandbox.fs = this.createMonitoredFS();
    }
    
    // Add monitored network
    if (this.options.permissions.network) {
      sandbox.fetch = this.createMonitoredFetch();
    }
    
    // Add timers
    if (this.options.permissions.apis?.timers) {
      sandbox.setTimeout = setTimeout;
      sandbox.setInterval = setInterval;
      sandbox.clearTimeout = clearTimeout;
      sandbox.clearInterval = clearInterval;
    }
    
    // Add crypto
    if (this.options.permissions.apis?.crypto) {
      sandbox.crypto = crypto;
    }
    
    // Add user context
    Object.assign(sandbox, baseContext);
    
    return vm.createContext(sandbox);
  }
  
  private createMonitoredConsole() {
    const self = this;
    return {
      log: (...args: any[]) => {
        if (self.monitoring) {
          self.logAction('console.log', args.join(' '));
        }
        console.log(...args);
      },
      error: (...args: any[]) => {
        if (self.monitoring) {
          self.logAction('console.error', args.join(' '));
        }
        console.error(...args);
      },
      warn: (...args: any[]) => {
        if (self.monitoring) {
          self.logAction('console.warn', args.join(' '));
        }
        console.warn(...args);
      }
    };
  }
  
  private createMonitoredFS() {
    const self = this;
    return {
      readFile: async (path: string) => {
        if (!self.checkFSPermission('read', path)) {
          self.violations.push({
            type: 'permission',
            action: 'fs.readFile',
            resource: path,
            timestamp: new Date().toISOString(),
            severity: 'high'
          });
          throw new Error(`Permission denied: Cannot read ${path}`);
        }
        
        if (self.monitoring) {
          self.logAction('fs.readFile', path);
        }
        
        return readFile(path, 'utf-8');
      },
      
      writeFile: async (path: string, data: string) => {
        if (!self.checkFSPermission('write', path)) {
          self.violations.push({
            type: 'permission',
            action: 'fs.writeFile',
            resource: path,
            timestamp: new Date().toISOString(),
            severity: 'critical'
          });
          throw new Error(`Permission denied: Cannot write to ${path}`);
        }
        
        // Check file size limit
        const sizeLimit = self.options.permissions.resources?.maxFileSize;
        if (sizeLimit && Buffer.byteLength(data) > sizeLimit) {
          self.violations.push({
            type: 'resource',
            action: 'fs.writeFile',
            resource: path,
            timestamp: new Date().toISOString(),
            severity: 'medium'
          });
          throw new Error(`File size exceeds limit`);
        }
        
        if (self.monitoring) {
          self.logAction('fs.writeFile', path);
        }
        
        return writeFile(path, data);
      }
    };
  }
  
  private createMonitoredFetch() {
    const self = this;
    return async (url: string, options?: any) => {
      const urlObj = new URL(url);
      
      // Check protocol
      if (urlObj.protocol === 'http:' && !self.options.permissions.network?.http) {
        self.violations.push({
          type: 'permission',
          action: 'network.fetch',
          resource: url,
          timestamp: new Date().toISOString(),
          severity: 'high'
        });
        throw new Error(`HTTP connections not allowed`);
      }
      
      if (urlObj.protocol === 'https:' && !self.options.permissions.network?.https) {
        self.violations.push({
          type: 'permission',
          action: 'network.fetch',
          resource: url,
          timestamp: new Date().toISOString(),
          severity: 'high'
        });
        throw new Error(`HTTPS connections not allowed`);
      }
      
      // Check host restrictions
      if (!self.checkNetworkPermission(urlObj.hostname)) {
        self.violations.push({
          type: 'permission',
          action: 'network.fetch',
          resource: url,
          timestamp: new Date().toISOString(),
          severity: 'critical'
        });
        throw new Error(`Host ${urlObj.hostname} not allowed`);
      }
      
      if (self.monitoring) {
        self.logAction('network.fetch', url);
      }
      
      // Perform actual fetch
      const response = await fetch(url, options);
      return response;
    };
  }
  
  private checkFSPermission(action: 'read' | 'write', path: string): boolean {
    const permissions = this.options.permissions.fs;
    if (!permissions) return false;
    
    const allowedPaths = permissions[action] || [];
    
    // Check if path matches any allowed pattern
    return allowedPaths.some(pattern => {
      if (pattern.endsWith('/*')) {
        const dir = pattern.slice(0, -2);
        return path.startsWith(dir);
      }
      return path === pattern;
    });
  }
  
  private checkNetworkPermission(hostname: string): boolean {
    const permissions = this.options.permissions.network;
    if (!permissions) return false;
    
    // Check blocked hosts first
    if (permissions.blockedHosts?.includes(hostname)) {
      return false;
    }
    
    // Check allowed hosts
    if (permissions.allowedHosts) {
      return permissions.allowedHosts.includes(hostname);
    }
    
    // Default allow if no specific host restrictions
    return true;
  }
  
  private logAction(action: string, details: string) {
    if (this.options.logPath) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        executionTime: Date.now() - this.startTime
      };
      
      // Append to log file (async, non-blocking)
      writeFile(
        this.options.logPath,
        JSON.stringify(logEntry) + '\n',
        { flag: 'a' }
      ).catch(() => {
        // Ignore logging errors
      });
    }
  }
  
  private collectMetrics() {
    return {
      executionTime: Date.now() - this.startTime,
      memoryUsed: process.memoryUsage().heapUsed,
      cpuTime: process.cpuUsage().user + process.cpuUsage().system
    };
  }
  
  async validatePermissions(permissions: SandboxPermissions): Promise<{
    valid: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    // Check for overly permissive settings
    if (permissions.fs?.write?.includes('/*')) {
      warnings.push('Write access to root directory is extremely dangerous');
    }
    
    if (permissions.process?.spawn) {
      warnings.push('Process spawning can be used to escape sandbox');
    }
    
    if (permissions.network?.allowedHosts?.length === 0 && 
        (permissions.network.http || permissions.network.https)) {
      warnings.push('Network access enabled but no hosts specified');
    }
    
    if (!permissions.resources?.timeoutMs) {
      warnings.push('No timeout specified - code could run indefinitely');
    }
    
    return {
      valid: true,
      warnings
    };
  }
}