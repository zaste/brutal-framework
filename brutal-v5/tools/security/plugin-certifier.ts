/**
 * Plugin Certification Pipeline for BRUTAL V5
 * 
 * Automated security analysis and certification for plugins
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import * as crypto from 'crypto';
import { SecuritySandbox, SandboxPermissions } from './security-sandbox.js';
import { PermissionSystem, PermissionDeclaration } from './permission-system.js';

export interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  main: string;
  repository?: string;
  homepage?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
}

export interface CertificationResult {
  pluginId: string;
  version: string;
  certified: boolean;
  score: number; // 0-100
  timestamp: string;
  expires: string;
  certificate?: Certificate;
  analysis: SecurityAnalysis;
  recommendations: string[];
}

export interface Certificate {
  id: string;
  pluginId: string;
  version: string;
  issuedAt: string;
  expiresAt: string;
  issuer: string;
  signature: string;
  level: 'basic' | 'standard' | 'premium';
  restrictions?: string[];
}

export interface SecurityAnalysis {
  codeQuality: {
    score: number;
    issues: CodeIssue[];
  };
  dependencies: {
    score: number;
    vulnerabilities: Vulnerability[];
  };
  permissions: {
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    concerns: string[];
  };
  behavior: {
    score: number;
    suspiciousPatterns: string[];
  };
  performance: {
    score: number;
    concerns: string[];
  };
}

export interface CodeIssue {
  type: 'security' | 'quality' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  message: string;
  rule: string;
}

export interface Vulnerability {
  package: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cve?: string;
  description: string;
  fixVersion?: string;
}

export class PluginCertifier {
  private sandbox: SecuritySandbox;
  private permissionSystem: PermissionSystem;
  private certificates: Map<string, Certificate> = new Map();
  
  constructor() {
    this.permissionSystem = new PermissionSystem();
    this.sandbox = new SecuritySandbox({
      permissions: {
        apis: {
          console: true,
          timers: true
        },
        resources: {
          maxMemoryMB: 256,
          timeoutMs: 30000
        }
      },
      monitoring: true
    });
  }
  
  async certifyPlugin(pluginPath: string): Promise<CertificationResult> {
    try {
      // Load plugin metadata
      const metadata = await this.loadPluginMetadata(pluginPath);
      const pluginId = `${metadata.name}@${metadata.version}`;
      
      // Perform security analysis
      const analysis = await this.analyzePlugin(pluginPath, metadata);
      
      // Calculate certification score
      const score = this.calculateScore(analysis);
      
      // Determine certification status
      const certified = score >= 70; // 70% minimum for certification
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);
      
      let certificate: Certificate | undefined;
      
      if (certified) {
        // Issue certificate
        certificate = await this.issueCertificate(
          pluginId,
          metadata.version,
          score
        );
        
        this.certificates.set(certificate.id, certificate);
      }
      
      return {
        pluginId,
        version: metadata.version,
        certified,
        score,
        timestamp: new Date().toISOString(),
        expires: this.calculateExpiration(score),
        certificate,
        analysis,
        recommendations
      };
    } catch (error) {
      return {
        pluginId: 'unknown',
        version: 'unknown',
        certified: false,
        score: 0,
        timestamp: new Date().toISOString(),
        expires: new Date().toISOString(),
        analysis: this.createEmptyAnalysis(),
        recommendations: [
          `Certification failed: ${error instanceof Error ? error.message : String(error)}`
        ]
      };
    }
  }
  
  private async loadPluginMetadata(pluginPath: string): Promise<PluginMetadata> {
    const packageJsonPath = join(pluginPath, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    
    return {
      name: packageJson.name,
      version: packageJson.version,
      author: packageJson.author || 'unknown',
      description: packageJson.description || '',
      main: packageJson.main || 'index.js',
      repository: packageJson.repository,
      homepage: packageJson.homepage,
      license: packageJson.license,
      keywords: packageJson.keywords,
      dependencies: packageJson.dependencies
    };
  }
  
  private async analyzePlugin(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<SecurityAnalysis> {
    // Analyze code quality
    const codeQuality = await this.analyzeCodeQuality(pluginPath);
    
    // Analyze dependencies
    const dependencies = await this.analyzeDependencies(metadata.dependencies || {});
    
    // Analyze permissions
    const permissions = await this.analyzePermissions(pluginPath);
    
    // Analyze behavior
    const behavior = await this.analyzeBehavior(pluginPath, metadata);
    
    // Analyze performance
    const performance = await this.analyzePerformance(pluginPath, metadata);
    
    return {
      codeQuality,
      dependencies,
      permissions,
      behavior,
      performance
    };
  }
  
  private async analyzeCodeQuality(pluginPath: string): Promise<{
    score: number;
    issues: CodeIssue[];
  }> {
    const issues: CodeIssue[] = [];
    const files = await this.getJavaScriptFiles(pluginPath);
    
    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      
      // Check for dangerous patterns
      const dangerousPatterns = [
        { pattern: /eval\s*\(/, message: 'Use of eval() is dangerous', severity: 'critical' as const },
        { pattern: /new\s+Function\s*\(/, message: 'Dynamic function creation', severity: 'high' as const },
        { pattern: /require\s*\(\s*[^'"]/,  message: 'Dynamic require', severity: 'high' as const },
        { pattern: /process\.env\./g, message: 'Environment variable access', severity: 'medium' as const },
        { pattern: /child_process/, message: 'Child process usage', severity: 'high' as const },
        { pattern: /\.exec\s*\(/, message: 'Command execution', severity: 'critical' as const },
        { pattern: /fs\.(unlink|rmdir|rm)/, message: 'File deletion', severity: 'high' as const }
      ];
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        for (const { pattern, message, severity } of dangerousPatterns) {
          if (pattern.test(line)) {
            issues.push({
              type: 'security',
              severity,
              file: file.replace(pluginPath, '.'),
              line: index + 1,
              message,
              rule: 'dangerous-pattern'
            });
          }
        }
      });
      
      // Check for quality issues
      if (lines.length > 500) {
        issues.push({
          type: 'quality',
          severity: 'medium',
          file: file.replace(pluginPath, '.'),
          message: 'File too large (>500 lines)',
          rule: 'file-size'
        });
      }
      
      // Check for missing error handling
      if (content.includes('async') && !content.includes('try') && !content.includes('catch')) {
        issues.push({
          type: 'quality',
          severity: 'medium',
          file: file.replace(pluginPath, '.'),
          message: 'Async code without error handling',
          rule: 'error-handling'
        });
      }
    }
    
    // Calculate score (100 - penalty points)
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }
    
    return {
      score: Math.max(0, score),
      issues
    };
  }
  
  private async analyzeDependencies(dependencies: Record<string, string>): Promise<{
    score: number;
    vulnerabilities: Vulnerability[];
  }> {
    const vulnerabilities: Vulnerability[] = [];
    
    // Simple vulnerability check (in real implementation, use a vulnerability database)
    const knownVulnerabilities: Record<string, Vulnerability> = {
      'lodash': {
        package: 'lodash',
        version: '<4.17.21',
        severity: 'high',
        cve: 'CVE-2021-23337',
        description: 'Prototype pollution vulnerability',
        fixVersion: '4.17.21'
      },
      'minimist': {
        package: 'minimist',
        version: '<1.2.6',
        severity: 'medium',
        cve: 'CVE-2021-44906',
        description: 'Prototype pollution vulnerability',
        fixVersion: '1.2.6'
      }
    };
    
    for (const [pkg, version] of Object.entries(dependencies)) {
      if (knownVulnerabilities[pkg]) {
        vulnerabilities.push(knownVulnerabilities[pkg]);
      }
    }
    
    // Check for suspicious packages
    const suspiciousPatterns = [
      /^@[a-z]{1,3}\//,  // Very short scoped names
      /test|demo|example/i, // Test packages in production
      /[0-9]{5,}/  // Packages with long numbers
    ];
    
    for (const pkg of Object.keys(dependencies)) {
      if (suspiciousPatterns.some(p => p.test(pkg))) {
        vulnerabilities.push({
          package: pkg,
          version: dependencies[pkg],
          severity: 'medium',
          description: 'Suspicious package name pattern'
        });
      }
    }
    
    // Calculate score
    let score = 100;
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    return {
      score: Math.max(0, score),
      vulnerabilities
    };
  }
  
  private async analyzePermissions(pluginPath: string): Promise<{
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    concerns: string[];
  }> {
    const concerns: string[] = [];
    
    try {
      // Load permission declaration
      const permissionPath = join(pluginPath, 'permissions.json');
      const declaration: PermissionDeclaration = JSON.parse(
        await readFile(permissionPath, 'utf-8')
      );
      
      // Validate permissions
      const validation = await this.permissionSystem.validateDeclaration(declaration);
      
      concerns.push(...validation.warnings);
      
      // Calculate score based on risk
      let score = 100;
      switch (validation.riskAssessment.overallRisk) {
        case 'critical': score = 25; break;
        case 'high': score = 50; break;
        case 'medium': score = 75; break;
        case 'low': score = 100; break;
      }
      
      return {
        score,
        riskLevel: validation.riskAssessment.overallRisk,
        concerns
      };
    } catch (error) {
      // No permission declaration
      concerns.push('No permission declaration found');
      return {
        score: 50,
        riskLevel: 'medium',
        concerns
      };
    }
  }
  
  private async analyzeBehavior(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<{
    score: number;
    suspiciousPatterns: string[];
  }> {
    const suspiciousPatterns: string[] = [];
    
    try {
      // Load and analyze main file
      const mainPath = join(pluginPath, metadata.main);
      const mainContent = await readFile(mainPath, 'utf-8');
      
      // Check for suspicious behaviors
      const behaviorPatterns = [
        {
          pattern: /setTimeout\s*\(\s*[^,]+,\s*0\s*\)/,
          description: 'Zero-delay timeouts (possible timing attacks)'
        },
        {
          pattern: /setInterval\s*\(\s*[^,]+,\s*\d{1,2}\s*\)/,
          description: 'Very short interval timers'
        },
        {
          pattern: /navigator\.(sendBeacon|geolocation)/,
          description: 'Tracking or location access'
        },
        {
          pattern: /document\.cookie/,
          description: 'Cookie access'
        },
        {
          pattern: /localStorage|sessionStorage/,
          description: 'Storage access'
        },
        {
          pattern: /fetch\s*\(\s*['"`][^'"`]*\$\{/,
          description: 'Dynamic URL construction'
        }
      ];
      
      for (const { pattern, description } of behaviorPatterns) {
        if (pattern.test(mainContent)) {
          suspiciousPatterns.push(description);
        }
      }
      
      // Test in sandbox
      const sandboxResult = await this.sandbox.execute(
        `(function() { ${mainContent} })()`,
        {}
      );
      
      if (sandboxResult.violations && sandboxResult.violations.length > 0) {
        for (const violation of sandboxResult.violations) {
          suspiciousPatterns.push(`Sandbox violation: ${violation.action}`);
        }
      }
    } catch (error) {
      suspiciousPatterns.push(`Behavior analysis failed: ${error}`);
    }
    
    // Calculate score
    const score = Math.max(0, 100 - (suspiciousPatterns.length * 10));
    
    return {
      score,
      suspiciousPatterns
    };
  }
  
  private async analyzePerformance(
    pluginPath: string,
    metadata: PluginMetadata
  ): Promise<{
    score: number;
    concerns: string[];
  }> {
    const concerns: string[] = [];
    
    try {
      // Check bundle size
      const files = await this.getJavaScriptFiles(pluginPath);
      let totalSize = 0;
      
      for (const file of files) {
        const content = await readFile(file, 'utf-8');
        totalSize += Buffer.byteLength(content);
      }
      
      if (totalSize > 1024 * 1024) { // 1MB
        concerns.push(`Large bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Check for performance anti-patterns
      const mainPath = join(pluginPath, metadata.main);
      const mainContent = await readFile(mainPath, 'utf-8');
      
      if (mainContent.match(/for\s*\([^)]*in\s+/g)?.length || 0 > 5) {
        concerns.push('Excessive use of for...in loops');
      }
      
      if (mainContent.includes('JSON.parse') && mainContent.includes('JSON.stringify')) {
        const parseCount = (mainContent.match(/JSON\.parse/g) || []).length;
        const stringifyCount = (mainContent.match(/JSON\.stringify/g) || []).length;
        
        if (parseCount + stringifyCount > 10) {
          concerns.push('Heavy JSON serialization detected');
        }
      }
    } catch (error) {
      concerns.push(`Performance analysis failed: ${error}`);
    }
    
    // Calculate score
    const score = Math.max(0, 100 - (concerns.length * 15));
    
    return {
      score,
      concerns
    };
  }
  
  private async getJavaScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDir = async (currentDir: string) => {
      const entries = await readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
          files.push(fullPath);
        }
      }
    };
    
    await scanDir(dir);
    return files;
  }
  
  private calculateScore(analysis: SecurityAnalysis): number {
    // Weighted average of all scores
    const weights = {
      codeQuality: 0.25,
      dependencies: 0.20,
      permissions: 0.25,
      behavior: 0.20,
      performance: 0.10
    };
    
    const score = 
      analysis.codeQuality.score * weights.codeQuality +
      analysis.dependencies.score * weights.dependencies +
      analysis.permissions.score * weights.permissions +
      analysis.behavior.score * weights.behavior +
      analysis.performance.score * weights.performance;
    
    return Math.round(score);
  }
  
  private generateRecommendations(analysis: SecurityAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Code quality recommendations
    if (analysis.codeQuality.score < 70) {
      recommendations.push('Address critical security issues in code');
    }
    
    const criticalIssues = analysis.codeQuality.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Remove dangerous patterns: ${criticalIssues.map(i => i.message).join(', ')}`);
    }
    
    // Dependency recommendations
    if (analysis.dependencies.vulnerabilities.length > 0) {
      recommendations.push('Update vulnerable dependencies');
    }
    
    // Permission recommendations
    if (analysis.permissions.riskLevel === 'critical' || analysis.permissions.riskLevel === 'high') {
      recommendations.push('Reduce permission requirements following principle of least privilege');
    }
    
    // Behavior recommendations
    if (analysis.behavior.suspiciousPatterns.length > 0) {
      recommendations.push('Review and justify suspicious code patterns');
    }
    
    // Performance recommendations
    if (analysis.performance.score < 70) {
      recommendations.push('Optimize performance to reduce resource usage');
    }
    
    return recommendations;
  }
  
  private async issueCertificate(
    pluginId: string,
    version: string,
    score: number
  ): Promise<Certificate> {
    const certificateId = crypto.randomBytes(16).toString('hex');
    
    // Determine certificate level
    let level: Certificate['level'] = 'basic';
    if (score >= 90) level = 'premium';
    else if (score >= 80) level = 'standard';
    
    const certificate: Certificate = {
      id: certificateId,
      pluginId,
      version,
      issuedAt: new Date().toISOString(),
      expiresAt: this.calculateExpiration(score),
      issuer: 'BRUTAL Security Team',
      signature: this.generateSignature(certificateId, pluginId, version),
      level,
      restrictions: score < 80 ? ['Periodic review required'] : undefined
    };
    
    return certificate;
  }
  
  private calculateExpiration(score: number): string {
    // Higher scores get longer validity
    const days = score >= 90 ? 365 : score >= 80 ? 180 : 90;
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    return expiration.toISOString();
  }
  
  private generateSignature(certificateId: string, pluginId: string, version: string): string {
    const data = `${certificateId}:${pluginId}:${version}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  verifyCertificate(certificate: Certificate): boolean {
    // Check signature
    const expectedSignature = this.generateSignature(
      certificate.id,
      certificate.pluginId,
      certificate.version
    );
    
    if (certificate.signature !== expectedSignature) {
      return false;
    }
    
    // Check expiration
    if (new Date(certificate.expiresAt) < new Date()) {
      return false;
    }
    
    return true;
  }
  
  private createEmptyAnalysis(): SecurityAnalysis {
    return {
      codeQuality: { score: 0, issues: [] },
      dependencies: { score: 0, vulnerabilities: [] },
      permissions: { score: 0, riskLevel: 'critical', concerns: [] },
      behavior: { score: 0, suspiciousPatterns: [] },
      performance: { score: 0, concerns: [] }
    };
  }
  
  async generateCertificationReport(result: CertificationResult): Promise<string> {
    let report = `# Plugin Certification Report\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Plugin**: ${result.pluginId}\n`;
    report += `- **Version**: ${result.version}\n`;
    report += `- **Certified**: ${result.certified ? '✅ Yes' : '❌ No'}\n`;
    report += `- **Score**: ${result.score}/100\n`;
    report += `- **Expires**: ${new Date(result.expires).toLocaleDateString()}\n\n`;
    
    if (result.certificate) {
      report += `## Certificate\n\n`;
      report += `- **ID**: ${result.certificate.id}\n`;
      report += `- **Level**: ${result.certificate.level}\n`;
      report += `- **Issued**: ${new Date(result.certificate.issuedAt).toLocaleDateString()}\n\n`;
    }
    
    report += `## Security Analysis\n\n`;
    
    // Code Quality
    report += `### Code Quality (${result.analysis.codeQuality.score}/100)\n\n`;
    if (result.analysis.codeQuality.issues.length > 0) {
      report += `Issues found:\n`;
      for (const issue of result.analysis.codeQuality.issues) {
        report += `- **${issue.severity}**: ${issue.message} (${issue.file}:${issue.line || '?'})\n`;
      }
      report += '\n';
    }
    
    // Dependencies
    report += `### Dependencies (${result.analysis.dependencies.score}/100)\n\n`;
    if (result.analysis.dependencies.vulnerabilities.length > 0) {
      report += `Vulnerabilities:\n`;
      for (const vuln of result.analysis.dependencies.vulnerabilities) {
        report += `- **${vuln.severity}**: ${vuln.package}@${vuln.version} - ${vuln.description}\n`;
      }
      report += '\n';
    }
    
    // Permissions
    report += `### Permissions (${result.analysis.permissions.score}/100)\n\n`;
    report += `Risk Level: **${result.analysis.permissions.riskLevel}**\n\n`;
    if (result.analysis.permissions.concerns.length > 0) {
      report += `Concerns:\n`;
      for (const concern of result.analysis.permissions.concerns) {
        report += `- ${concern}\n`;
      }
      report += '\n';
    }
    
    // Behavior
    report += `### Behavior (${result.analysis.behavior.score}/100)\n\n`;
    if (result.analysis.behavior.suspiciousPatterns.length > 0) {
      report += `Suspicious patterns:\n`;
      for (const pattern of result.analysis.behavior.suspiciousPatterns) {
        report += `- ${pattern}\n`;
      }
      report += '\n';
    }
    
    // Performance
    report += `### Performance (${result.analysis.performance.score}/100)\n\n`;
    if (result.analysis.performance.concerns.length > 0) {
      report += `Concerns:\n`;
      for (const concern of result.analysis.performance.concerns) {
        report += `- ${concern}\n`;
      }
      report += '\n';
    }
    
    // Recommendations
    if (result.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      for (const rec of result.recommendations) {
        report += `- ${rec}\n`;
      }
    }
    
    return report;
  }
}