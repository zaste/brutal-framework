import { describe, it, expect, beforeEach } from '@jest/globals';
import { PermissionSystem, PermissionDeclaration } from '../permission-system.js';

describe('PermissionSystem', () => {
  let permissionSystem: PermissionSystem;

  beforeEach(() => {
    permissionSystem = new PermissionSystem();
  });

  describe('Permission Registration', () => {
    it('should have standard permissions initialized', () => {
      // Test by requesting a standard permission
      const grant = permissionSystem.checkPermission('test-plugin', 'fs.read.config');
      expect(grant).toBe(false); // Not granted yet
    });

    it('should register custom permissions', () => {
      permissionSystem.registerPermission({
        id: 'custom.test',
        type: 'api',
        scope: { api: { brutal: ['custom'] } },
        description: 'Custom test permission',
        risk: 'low'
      });

      // Verify it was registered by using it in a declaration
      const declaration: PermissionDeclaration = {
        name: 'test-plugin',
        version: '1.0.0',
        permissions: {
          required: [{
            id: 'custom.test',
            type: 'api',
            scope: { api: { brutal: ['custom'] } },
            description: 'Custom test permission',
            risk: 'low'
          }]
        }
      };

      const validation = await permissionSystem.validateDeclaration(declaration);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Declaration Validation', () => {
    it('should validate valid declaration', async () => {
      const declaration: PermissionDeclaration = {
        name: 'test-plugin',
        version: '1.0.0',
        permissions: {
          required: [{
            id: 'fs.read.config',
            type: 'fs',
            scope: { fs: { read: ['./config/*'] } },
            description: 'Read config files',
            risk: 'low'
          }]
        }
      };

      const validation = await permissionSystem.validateDeclaration(declaration);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.riskAssessment.overallRisk).toBe('low');
    });

    it('should detect missing required fields', async () => {
      const declaration: PermissionDeclaration = {
        name: '',
        version: '',
        permissions: {
          required: []
        }
      };

      const validation = await permissionSystem.validateDeclaration(declaration);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Plugin name is required');
      expect(validation.errors).toContain('Plugin version is required');
    });

    it('should warn about dangerous permission combinations', async () => {
      const declaration: PermissionDeclaration = {
        name: 'risky-plugin',
        version: '1.0.0',
        permissions: {
          required: [
            {
              id: 'fs.write.any',
              type: 'fs',
              scope: { fs: { write: ['*'] } },
              description: 'Write anywhere',
              risk: 'critical'
            },
            {
              id: 'network.fetch.any',
              type: 'network',
              scope: { network: { hosts: ['*'] } },
              description: 'Network access',
              risk: 'high'
            }
          ]
        }
      };

      const validation = await permissionSystem.validateDeclaration(declaration);
      expect(validation.warnings).toContain(
        'Combination of unrestricted file write and network access is dangerous'
      );
      expect(validation.riskAssessment.overallRisk).toBe('critical');
    });

    it('should require justification for critical permissions', async () => {
      const declaration: PermissionDeclaration = {
        name: 'critical-plugin',
        version: '1.0.0',
        permissions: {
          required: [{
            id: 'fs.write.any',
            type: 'fs',
            scope: { fs: { write: ['*'] } },
            description: 'Write anywhere',
            risk: 'critical'
          }]
        }
      };

      const validation = await permissionSystem.validateDeclaration(declaration);
      expect(validation.warnings).toContain(
        'Critical permission fs.write.any lacks justification'
      );
    });
  });

  describe('Permission Requests', () => {
    it('should auto-grant low risk permissions', async () => {
      const declaration: PermissionDeclaration = {
        name: 'safe-plugin',
        version: '1.0.0',
        permissions: {
          required: [{
            id: 'fs.read.config',
            type: 'fs',
            scope: { fs: { read: ['./config/*'] } },
            description: 'Read config',
            risk: 'low'
          }]
        }
      };

      const grant = await permissionSystem.requestPermissions('safe-plugin', declaration);
      expect(grant.granted).toBe(true);
      expect(grant.permissions).toContain('fs.read.config');
    });

    it('should not auto-grant high risk permissions', async () => {
      const declaration: PermissionDeclaration = {
        name: 'risky-plugin',
        version: '1.0.0',
        permissions: {
          required: [{
            id: 'process.spawn.node',
            type: 'process',
            scope: { process: { spawn: ['node'] } },
            description: 'Spawn processes',
            risk: 'high'
          }]
        }
      };

      const grant = await permissionSystem.requestPermissions('risky-plugin', declaration);
      expect(grant.granted).toBe(false);
    });
  });

  describe('Permission Management', () => {
    it('should grant permissions manually', () => {
      const grant = permissionSystem.grantPermissions(
        'test-plugin',
        ['fs.read.config', 'api.brutal.core'],
        'admin'
      );

      expect(grant.granted).toBe(true);
      expect(grant.grantedBy).toBe('admin');
      expect(grant.permissions).toHaveLength(2);
    });

    it('should check granted permissions', async () => {
      // First grant permission
      permissionSystem.grantPermissions(
        'test-plugin',
        ['fs.read.config'],
        'admin'
      );

      // Then check it
      const hasPermission = permissionSystem.checkPermission('test-plugin', 'fs.read.config');
      expect(hasPermission).toBe(true);

      // Check non-granted permission
      const hasOtherPermission = permissionSystem.checkPermission('test-plugin', 'fs.write.any');
      expect(hasOtherPermission).toBe(false);
    });

    it('should revoke permissions', () => {
      // Grant then revoke
      permissionSystem.grantPermissions('test-plugin', ['fs.read.config'], 'admin');
      permissionSystem.revokePermissions('test-plugin', 'Security violation');

      const hasPermission = permissionSystem.checkPermission('test-plugin', 'fs.read.config');
      expect(hasPermission).toBe(false);
    });

    it('should handle conditional grants', () => {
      const future = new Date();
      future.setHours(future.getHours() + 1);

      const grant = permissionSystem.grantPermissions(
        'test-plugin',
        ['fs.read.config'],
        'admin',
        [
          {
            type: 'time',
            value: {
              start: new Date().toISOString(),
              end: future.toISOString()
            }
          }
        ]
      );

      expect(grant.conditions).toHaveLength(1);
      
      // Should pass time condition
      const hasPermission = permissionSystem.checkPermission('test-plugin', 'fs.read.config');
      expect(hasPermission).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    it('should track permission requests', async () => {
      const declaration: PermissionDeclaration = {
        name: 'audit-test',
        version: '1.0.0',
        permissions: {
          required: [{
            id: 'fs.read.config',
            type: 'fs',
            scope: { fs: { read: ['./config/*'] } },
            description: 'Read config',
            risk: 'low'
          }]
        }
      };

      await permissionSystem.requestPermissions('audit-test', declaration);

      const audits = permissionSystem.getAuditLog({ pluginId: 'audit-test' });
      expect(audits).toHaveLength(2); // request + grant
      expect(audits[0].action).toBe('request');
      expect(audits[1].action).toBe('grant');
    });

    it('should track permission usage', () => {
      permissionSystem.grantPermissions('test-plugin', ['fs.read.config'], 'admin');
      
      // Use permission
      permissionSystem.checkPermission('test-plugin', 'fs.read.config');
      
      // Check denied permission
      permissionSystem.checkPermission('test-plugin', 'fs.write.any');

      const audits = permissionSystem.getAuditLog({ 
        pluginId: 'test-plugin',
        action: 'use'
      });
      
      expect(audits).toHaveLength(2);
      expect(audits[0].result).toBe('success');
      expect(audits[1].result).toBe('failure');
    });

    it('should filter audit logs', () => {
      // Create some audit entries
      permissionSystem.grantPermissions('plugin1', ['fs.read.config'], 'admin');
      permissionSystem.grantPermissions('plugin2', ['api.brutal.core'], 'admin');
      permissionSystem.checkPermission('plugin1', 'fs.read.config');
      permissionSystem.checkPermission('plugin2', 'api.brutal.core');

      // Filter by plugin
      const plugin1Audits = permissionSystem.getAuditLog({ pluginId: 'plugin1' });
      expect(plugin1Audits.every(a => a.pluginId === 'plugin1')).toBe(true);

      // Filter by action
      const grantAudits = permissionSystem.getAuditLog({ action: 'grant' });
      expect(grantAudits.every(a => a.action === 'grant')).toBe(true);
    });
  });

  describe('Reporting', () => {
    it('should generate permission report', () => {
      // Set up some data
      permissionSystem.grantPermissions('plugin1', ['fs.read.config'], 'admin');
      permissionSystem.grantPermissions('plugin2', ['api.brutal.core', 'network.fetch.https'], 'admin');
      permissionSystem.checkPermission('plugin1', 'fs.read.config');

      const report = permissionSystem.generatePermissionReport();

      expect(report).toContain('Permission System Report');
      expect(report).toContain('Active grants: 2');
      expect(report).toContain('plugin1');
      expect(report).toContain('plugin2');
      expect(report).toContain('Recent Activity');
    });
  });
});