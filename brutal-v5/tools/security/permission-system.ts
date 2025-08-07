/**
 * Permission Declaration and Management System for BRUTAL V5
 * 
 * Provides a declarative permission system for plugins and extensions
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as crypto from 'crypto';

export interface PermissionDeclaration {
  name: string;
  version: string;
  author?: string;
  description?: string;
  permissions: {
    required: Permission[];
    optional?: Permission[];
  };
  justification?: Record<string, string>; // Permission ID -> Justification
  signedBy?: string;
  timestamp?: string;
}

export interface Permission {
  id: string;
  type: 'fs' | 'network' | 'process' | 'system' | 'api';
  scope: PermissionScope;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export interface PermissionScope {
  // File system scopes
  fs?: {
    read?: string[];
    write?: string[];
    delete?: string[];
    watch?: boolean;
  };
  
  // Network scopes
  network?: {
    protocols?: ('http' | 'https' | 'ws' | 'wss')[];
    hosts?: string[];
    ports?: number[];
    methods?: string[];
  };
  
  // Process scopes
  process?: {
    spawn?: string[];  // Allowed executables
    env?: string[];    // Environment variables
    signals?: boolean; // Signal handling
    exit?: boolean;    // Process termination
  };
  
  // System scopes
  system?: {
    os?: boolean;      // OS information
    hardware?: boolean; // Hardware information
    memory?: boolean;  // Memory usage
    cpu?: boolean;     // CPU usage
  };
  
  // API scopes
  api?: {
    brutal?: string[]; // BRUTAL APIs
    node?: string[];   // Node.js modules
    global?: string[]; // Global variables
  };
}

export interface PermissionGrant {
  pluginId: string;
  permissions: string[]; // Permission IDs
  granted: boolean;
  grantedBy?: string;
  grantedAt?: string;
  expires?: string;
  conditions?: GrantCondition[];
}

export interface GrantCondition {
  type: 'time' | 'usage' | 'scope';
  value: any;
}

export interface PermissionAudit {
  pluginId: string;
  action: 'request' | 'grant' | 'deny' | 'revoke' | 'use';
  permission: string;
  timestamp: string;
  actor?: string;
  reason?: string;
  result?: 'success' | 'failure';
}

export class PermissionSystem {
  private permissions: Map<string, Permission> = new Map();
  private grants: Map<string, PermissionGrant> = new Map();
  private audits: PermissionAudit[] = [];
  
  constructor() {
    this.initializeStandardPermissions();
  }
  
  private initializeStandardPermissions() {
    // File system permissions
    this.registerPermission({
      id: 'fs.read.config',
      type: 'fs',
      scope: { fs: { read: ['./config/*', './.brutalrc'] } },
      description: 'Read configuration files',
      risk: 'low'
    });
    
    this.registerPermission({
      id: 'fs.write.cache',
      type: 'fs',
      scope: { fs: { write: ['./.cache/*', './tmp/*'] } },
      description: 'Write to cache directories',
      risk: 'low'
    });
    
    this.registerPermission({
      id: 'fs.write.any',
      type: 'fs',
      scope: { fs: { write: ['*'] } },
      description: 'Write to any file',
      risk: 'critical'
    });
    
    // Network permissions
    this.registerPermission({
      id: 'network.fetch.https',
      type: 'network',
      scope: { network: { protocols: ['https'] } },
      description: 'Make HTTPS requests',
      risk: 'medium'
    });
    
    this.registerPermission({
      id: 'network.fetch.any',
      type: 'network',
      scope: { network: { protocols: ['http', 'https'], hosts: ['*'] } },
      description: 'Make requests to any host',
      risk: 'high'
    });
    
    // Process permissions
    this.registerPermission({
      id: 'process.spawn.node',
      type: 'process',
      scope: { process: { spawn: ['node', 'npm', 'npx'] } },
      description: 'Spawn Node.js processes',
      risk: 'high'
    });
    
    // System permissions
    this.registerPermission({
      id: 'system.info',
      type: 'system',
      scope: { system: { os: true, hardware: true } },
      description: 'Access system information',
      risk: 'low'
    });
    
    // API permissions
    this.registerPermission({
      id: 'api.brutal.core',
      type: 'api',
      scope: { api: { brutal: ['core', 'utils'] } },
      description: 'Access BRUTAL core APIs',
      risk: 'low'
    });
  }
  
  registerPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }
  
  async validateDeclaration(declaration: PermissionDeclaration): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high' | 'critical';
      criticalPermissions: Permission[];
      suggestions: string[];
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalPermissions: Permission[] = [];
    
    // Validate required fields
    if (!declaration.name) {
      errors.push('Plugin name is required');
    }
    
    if (!declaration.version) {
      errors.push('Plugin version is required');
    }
    
    // Validate permissions
    const allPermissions = [
      ...declaration.permissions.required,
      ...(declaration.permissions.optional || [])
    ];
    
    for (const perm of allPermissions) {
      if (!this.permissions.has(perm.id)) {
        warnings.push(`Unknown permission: ${perm.id}`);
      }
      
      if (perm.risk === 'critical') {
        criticalPermissions.push(perm);
        
        if (!declaration.justification?.[perm.id]) {
          warnings.push(`Critical permission ${perm.id} lacks justification`);
        }
      }
    }
    
    // Check for permission combinations that increase risk
    const hasFileWrite = allPermissions.some(p => 
      p.scope.fs?.write && p.scope.fs.write.includes('*')
    );
    const hasNetworkAny = allPermissions.some(p => 
      p.scope.network?.hosts?.includes('*')
    );
    const hasProcessSpawn = allPermissions.some(p => 
      p.scope.process?.spawn && p.scope.process.spawn.length > 0
    );
    
    if (hasFileWrite && hasNetworkAny) {
      warnings.push('Combination of unrestricted file write and network access is dangerous');
    }
    
    if (hasProcessSpawn && hasNetworkAny) {
      warnings.push('Combination of process spawning and network access could enable remote code execution');
    }
    
    // Calculate overall risk
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (criticalPermissions.length > 0) {
      overallRisk = 'critical';
    } else if (allPermissions.some(p => p.risk === 'high')) {
      overallRisk = 'high';
    } else if (allPermissions.some(p => p.risk === 'medium')) {
      overallRisk = 'medium';
    }
    
    // Generate suggestions
    const suggestions: string[] = [];
    
    if (hasFileWrite) {
      suggestions.push('Consider restricting file write permissions to specific directories');
    }
    
    if (hasNetworkAny) {
      suggestions.push('Consider restricting network access to specific hosts');
    }
    
    if (declaration.permissions.required.length > 5) {
      suggestions.push('Consider moving some permissions to optional to follow principle of least privilege');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      riskAssessment: {
        overallRisk,
        criticalPermissions,
        suggestions
      }
    };
  }
  
  async requestPermissions(
    pluginId: string,
    declaration: PermissionDeclaration
  ): Promise<PermissionGrant> {
    // Validate declaration first
    const validation = await this.validateDeclaration(declaration);
    
    if (!validation.valid) {
      throw new Error(`Invalid permission declaration: ${validation.errors.join(', ')}`);
    }
    
    // Audit the request
    this.audit({
      pluginId,
      action: 'request',
      permission: declaration.permissions.required.map(p => p.id).join(','),
      timestamp: new Date().toISOString()
    });
    
    // Check if already granted
    const existingGrant = this.grants.get(pluginId);
    if (existingGrant) {
      return existingGrant;
    }
    
    // For now, auto-grant low risk permissions
    const autoGrant = validation.riskAssessment.overallRisk === 'low';
    
    const grant: PermissionGrant = {
      pluginId,
      permissions: declaration.permissions.required.map(p => p.id),
      granted: autoGrant,
      grantedAt: autoGrant ? new Date().toISOString() : undefined
    };
    
    if (autoGrant) {
      this.grants.set(pluginId, grant);
      this.audit({
        pluginId,
        action: 'grant',
        permission: grant.permissions.join(','),
        timestamp: new Date().toISOString(),
        reason: 'Auto-granted (low risk)'
      });
    }
    
    return grant;
  }
  
  grantPermissions(
    pluginId: string,
    permissions: string[],
    grantedBy: string,
    conditions?: GrantCondition[]
  ): PermissionGrant {
    const grant: PermissionGrant = {
      pluginId,
      permissions,
      granted: true,
      grantedBy,
      grantedAt: new Date().toISOString(),
      conditions
    };
    
    this.grants.set(pluginId, grant);
    
    this.audit({
      pluginId,
      action: 'grant',
      permission: permissions.join(','),
      timestamp: new Date().toISOString(),
      actor: grantedBy
    });
    
    return grant;
  }
  
  revokePermissions(pluginId: string, reason?: string): void {
    const grant = this.grants.get(pluginId);
    if (grant) {
      this.grants.delete(pluginId);
      
      this.audit({
        pluginId,
        action: 'revoke',
        permission: grant.permissions.join(','),
        timestamp: new Date().toISOString(),
        reason
      });
    }
  }
  
  checkPermission(pluginId: string, permissionId: string): boolean {
    const grant = this.grants.get(pluginId);
    if (!grant || !grant.granted) {
      return false;
    }
    
    // Check if permission is granted
    if (!grant.permissions.includes(permissionId)) {
      this.audit({
        pluginId,
        action: 'use',
        permission: permissionId,
        timestamp: new Date().toISOString(),
        result: 'failure',
        reason: 'Permission not granted'
      });
      return false;
    }
    
    // Check conditions
    if (grant.conditions) {
      for (const condition of grant.conditions) {
        if (!this.checkCondition(condition)) {
          this.audit({
            pluginId,
            action: 'use',
            permission: permissionId,
            timestamp: new Date().toISOString(),
            result: 'failure',
            reason: `Condition failed: ${condition.type}`
          });
          return false;
        }
      }
    }
    
    // Check expiration
    if (grant.expires && new Date(grant.expires) < new Date()) {
      this.audit({
        pluginId,
        action: 'use',
        permission: permissionId,
        timestamp: new Date().toISOString(),
        result: 'failure',
        reason: 'Grant expired'
      });
      return false;
    }
    
    // Permission granted and valid
    this.audit({
      pluginId,
      action: 'use',
      permission: permissionId,
      timestamp: new Date().toISOString(),
      result: 'success'
    });
    
    return true;
  }
  
  private checkCondition(condition: GrantCondition): boolean {
    switch (condition.type) {
      case 'time':
        // Check time-based conditions
        const now = new Date();
        const { start, end } = condition.value;
        if (start && new Date(start) > now) return false;
        if (end && new Date(end) < now) return false;
        return true;
        
      case 'usage':
        // Check usage limits
        // TODO: Implement usage tracking
        return true;
        
      case 'scope':
        // Check scope restrictions
        // TODO: Implement scope checking
        return true;
        
      default:
        return true;
    }
  }
  
  private audit(entry: PermissionAudit): void {
    this.audits.push(entry);
    
    // Keep only last 10000 audit entries
    if (this.audits.length > 10000) {
      this.audits = this.audits.slice(-10000);
    }
  }
  
  getAuditLog(
    filter?: {
      pluginId?: string;
      action?: PermissionAudit['action'];
      since?: string;
      until?: string;
    }
  ): PermissionAudit[] {
    let filtered = this.audits;
    
    if (filter) {
      if (filter.pluginId) {
        filtered = filtered.filter(a => a.pluginId === filter.pluginId);
      }
      if (filter.action) {
        filtered = filtered.filter(a => a.action === filter.action);
      }
      if (filter.since) {
        filtered = filtered.filter(a => a.timestamp >= filter.since!);
      }
      if (filter.until) {
        filtered = filtered.filter(a => a.timestamp <= filter.until!);
      }
    }
    
    return filtered;
  }
  
  async exportPermissions(path: string): Promise<void> {
    const data = {
      permissions: Array.from(this.permissions.entries()),
      grants: Array.from(this.grants.entries()),
      audits: this.audits,
      exported: new Date().toISOString()
    };
    
    await writeFile(path, JSON.stringify(data, null, 2));
  }
  
  async importPermissions(path: string): Promise<void> {
    const data = JSON.parse(await readFile(path, 'utf-8'));
    
    // Import permissions
    for (const [id, permission] of data.permissions) {
      this.permissions.set(id, permission);
    }
    
    // Import grants
    for (const [pluginId, grant] of data.grants) {
      this.grants.set(pluginId, grant);
    }
    
    // Import audits
    this.audits = data.audits || [];
  }
  
  generatePermissionReport(): string {
    let report = '# Permission System Report\n\n';
    
    // Summary
    report += '## Summary\n\n';
    report += `- Total permissions defined: ${this.permissions.size}\n`;
    report += `- Active grants: ${this.grants.size}\n`;
    report += `- Audit entries: ${this.audits.length}\n\n`;
    
    // Risk distribution
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const perm of this.permissions.values()) {
      riskCounts[perm.risk]++;
    }
    
    report += '## Risk Distribution\n\n';
    report += `- Low risk: ${riskCounts.low}\n`;
    report += `- Medium risk: ${riskCounts.medium}\n`;
    report += `- High risk: ${riskCounts.high}\n`;
    report += `- Critical risk: ${riskCounts.critical}\n\n`;
    
    // Active grants
    report += '## Active Grants\n\n';
    for (const [pluginId, grant] of this.grants) {
      if (grant.granted) {
        report += `### ${pluginId}\n`;
        report += `- Permissions: ${grant.permissions.join(', ')}\n`;
        report += `- Granted at: ${grant.grantedAt}\n`;
        if (grant.expires) {
          report += `- Expires: ${grant.expires}\n`;
        }
        report += '\n';
      }
    }
    
    // Recent activity
    report += '## Recent Activity\n\n';
    const recentAudits = this.audits.slice(-20);
    for (const audit of recentAudits) {
      report += `- ${audit.timestamp}: ${audit.pluginId} - ${audit.action} ${audit.permission}`;
      if (audit.result) {
        report += ` (${audit.result})`;
      }
      report += '\n';
    }
    
    return report;
  }
}