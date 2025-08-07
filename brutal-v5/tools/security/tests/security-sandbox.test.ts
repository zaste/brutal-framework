import { describe, it, expect, beforeEach } from '@jest/globals';
import { SecuritySandbox, SandboxPermissions } from '../security-sandbox.js';

describe('SecuritySandbox', () => {
  let sandbox: SecuritySandbox;

  beforeEach(() => {
    sandbox = new SecuritySandbox({
      permissions: {
        apis: {
          console: true,
          timers: true
        },
        resources: {
          maxMemoryMB: 128,
          timeoutMs: 5000
        }
      },
      trusted: true
    });
  });

  describe('Basic Execution', () => {
    it('should execute simple code', async () => {
      const result = await sandbox.execute('1 + 1');
      expect(result.success).toBe(true);
      expect(result.result).toBe(2);
    });

    it('should execute code with context', async () => {
      const result = await sandbox.execute('x + y', { x: 5, y: 3 });
      expect(result.success).toBe(true);
      expect(result.result).toBe(8);
    });

    it('should handle errors gracefully', async () => {
      const result = await sandbox.execute('throw new Error("test error")');
      expect(result.success).toBe(false);
      expect(result.error).toContain('test error');
    });

    it('should respect timeout', async () => {
      const sandbox = new SecuritySandbox({
        permissions: {
          resources: {
            timeoutMs: 100
          }
        },
        trusted: true
      });

      const result = await sandbox.execute('while(true) {}');
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Permission Validation', () => {
    it('should validate overly permissive settings', async () => {
      const permissions: SandboxPermissions = {
        fs: {
          write: ['/*']
        },
        process: {
          spawn: true
        }
      };

      const validation = await sandbox.validatePermissions(permissions);
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('Write access to root directory is extremely dangerous');
      expect(validation.warnings).toContain('Process spawning can be used to escape sandbox');
    });

    it('should warn about missing timeout', async () => {
      const permissions: SandboxPermissions = {
        apis: {
          console: true
        }
      };

      const validation = await sandbox.validatePermissions(permissions);
      expect(validation.warnings).toContain('No timeout specified - code could run indefinitely');
    });
  });

  describe('Monitored APIs', () => {
    it('should monitor console usage', async () => {
      const monitored = new SecuritySandbox({
        permissions: {
          apis: {
            console: true
          }
        },
        trusted: true,
        monitoring: true
      });

      const result = await monitored.execute('console.log("test")');
      expect(result.success).toBe(true);
    });

    it('should block unauthorized file system access', async () => {
      const restricted = new SecuritySandbox({
        permissions: {
          fs: {
            read: ['./allowed/*']
          }
        },
        trusted: true
      });

      const result = await restricted.execute(`
        fs.readFile('/etc/passwd')
      `);
      
      expect(result.success).toBe(false);
      expect(result.violations?.length).toBeGreaterThan(0);
      expect(result.violations?.[0].type).toBe('permission');
    });
  });

  describe('Resource Limits', () => {
    it('should track execution metrics', async () => {
      const result = await sandbox.execute('Math.sqrt(16)');
      
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.memoryUsed).toBeGreaterThan(0);
    });
  });

  describe('Isolated Execution', () => {
    it('should isolate untrusted code', async () => {
      const untrusted = new SecuritySandbox({
        permissions: {
          apis: {
            console: false
          },
          resources: {
            timeoutMs: 1000
          }
        },
        trusted: false
      });

      const result = await untrusted.execute('2 * 3');
      expect(result.success).toBe(true);
      expect(result.result).toBe(6);
    });
  });
});