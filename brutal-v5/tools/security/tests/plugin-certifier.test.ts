import { describe, it, expect, beforeEach } from '@jest/globals';
import { PluginCertifier } from '../plugin-certifier.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('PluginCertifier', () => {
  let certifier: PluginCertifier;
  let testDir: string;

  beforeEach(async () => {
    certifier = new PluginCertifier();
    testDir = join(tmpdir(), `plugin-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createTestPlugin(
    name: string,
    content: string,
    permissions?: any,
    dependencies?: Record<string, string>
  ) {
    const pluginDir = join(testDir, name);
    await mkdir(pluginDir, { recursive: true });

    // Create package.json
    await writeFile(
      join(pluginDir, 'package.json'),
      JSON.stringify({
        name,
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test plugin',
        main: 'index.js',
        dependencies
      }, null, 2)
    );

    // Create main file
    await writeFile(join(pluginDir, 'index.js'), content);

    // Create permissions file if provided
    if (permissions) {
      await writeFile(
        join(pluginDir, 'permissions.json'),
        JSON.stringify(permissions, null, 2)
      );
    }

    return pluginDir;
  }

  describe('Plugin Certification', () => {
    it('should certify a safe plugin', async () => {
      const pluginPath = await createTestPlugin(
        'safe-plugin',
        `
          // Safe plugin code
          function greet(name) {
            return 'Hello ' + name;
          }
          
          module.exports = { greet };
        `,
        {
          name: 'safe-plugin',
          version: '1.0.0',
          permissions: {
            required: [{
              id: 'api.brutal.core',
              type: 'api',
              scope: { api: { brutal: ['core'] } },
              description: 'Core API access',
              risk: 'low'
            }]
          }
        }
      );

      const result = await certifier.certifyPlugin(pluginPath);

      expect(result.certified).toBe(true);
      expect(result.score).toBeGreaterThan(70);
      expect(result.certificate).toBeDefined();
      expect(result.analysis.codeQuality.issues).toHaveLength(0);
    });

    it('should fail plugin with dangerous patterns', async () => {
      const pluginPath = await createTestPlugin(
        'dangerous-plugin',
        `
          // Dangerous plugin code
          const fs = require('fs');
          
          function deleteFile(path) {
            eval('fs.unlinkSync("' + path + '")');
          }
          
          module.exports = { deleteFile };
        `
      );

      const result = await certifier.certifyPlugin(pluginPath);

      expect(result.certified).toBe(false);
      expect(result.score).toBeLessThan(70);
      expect(result.analysis.codeQuality.issues).toContainEqual(
        expect.objectContaining({
          severity: 'critical',
          message: 'Use of eval() is dangerous'
        })
      );
    });

    it('should detect vulnerable dependencies', async () => {
      const pluginPath = await createTestPlugin(
        'vulnerable-plugin',
        'module.exports = {};',
        undefined,
        {
          'lodash': '4.17.20',  // Old version with vulnerabilities
          'minimist': '1.2.0'   // Old version with vulnerabilities
        }
      );

      const result = await certifier.certifyPlugin(pluginPath);

      expect(result.analysis.dependencies.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Update vulnerable dependencies');
    });

    it('should analyze permission risks', async () => {
      const pluginPath = await createTestPlugin(
        'risky-permissions',
        'module.exports = {};',
        {
          name: 'risky-permissions',
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
                description: 'Fetch from anywhere',
                risk: 'high'
              }
            ]
          }
        }
      );

      const result = await certifier.certifyPlugin(pluginPath);

      expect(result.analysis.permissions.riskLevel).toBe('critical');
      expect(result.analysis.permissions.score).toBeLessThan(50);
      expect(result.recommendations).toContain(
        'Reduce permission requirements following principle of least privilege'
      );
    });

    it('should detect suspicious behavior patterns', async () => {
      const pluginPath = await createTestPlugin(
        'suspicious-plugin',
        `
          // Suspicious patterns
          setInterval(function() {
            fetch('http://tracker.example.com/ping');
          }, 10);
          
          navigator.sendBeacon('/analytics', data);
          
          localStorage.setItem('tracking', '1');
        `
      );

      const result = await certifier.certifyPlugin(pluginPath);

      expect(result.analysis.behavior.suspiciousPatterns).toContain(
        'Very short interval timers'
      );
      expect(result.analysis.behavior.suspiciousPatterns).toContain(
        'Tracking or location access'
      );
      expect(result.analysis.behavior.suspiciousPatterns).toContain(
        'Storage access'
      );
    });

    it('should check performance concerns', async () => {
      // Create large file
      const largeCode = 'const data = "' + 'x'.repeat(1024 * 1024) + '";\n';
      
      const pluginPath = await createTestPlugin(
        'large-plugin',
        largeCode + `
          // Performance issues
          for (let i in largeArray) {
            for (let j in largeArray) {
              for (let k in largeArray) {
                process(i, j, k);
              }
            }
          }
          
          ${Array(20).fill('JSON.parse(JSON.stringify(data))').join(';\n')};
        `
      );

      const result = await certifier.certifyPlugin(pluginPath);

      expect(result.analysis.performance.concerns).toContainEqual(
        expect.stringContaining('Large bundle size')
      );
      expect(result.analysis.performance.concerns).toContain(
        'Excessive use of for...in loops'
      );
      expect(result.analysis.performance.concerns).toContain(
        'Heavy JSON serialization detected'
      );
    });
  });

  describe('Certificate Management', () => {
    it('should issue different certificate levels based on score', async () => {
      // High score plugin
      const excellentPlugin = await createTestPlugin(
        'excellent-plugin',
        'module.exports = { version: "1.0.0" };',
        {
          name: 'excellent-plugin',
          version: '1.0.0',
          permissions: {
            required: [{
              id: 'api.brutal.core',
              type: 'api',
              scope: { api: { brutal: ['core'] } },
              description: 'Core API',
              risk: 'low'
            }]
          }
        }
      );

      const excellentResult = await certifier.certifyPlugin(excellentPlugin);
      expect(excellentResult.score).toBeGreaterThan(90);
      expect(excellentResult.certificate?.level).toBe('premium');

      // Medium score plugin (with some issues)
      const mediumPlugin = await createTestPlugin(
        'medium-plugin',
        `
          // Some quality issues
          async function getData() {
            const result = await fetch('/api/data');
            return result;
          }
          // Missing error handling
        `
      );

      const mediumResult = await certifier.certifyPlugin(mediumPlugin);
      expect(mediumResult.certificate?.level).toBe('basic');
    });

    it('should verify certificates', async () => {
      const pluginPath = await createTestPlugin(
        'certified-plugin',
        'module.exports = {};'
      );

      const result = await certifier.certifyPlugin(pluginPath);
      
      if (result.certificate) {
        const isValid = certifier.verifyCertificate(result.certificate);
        expect(isValid).toBe(true);

        // Tamper with certificate
        const tamperedCert = {
          ...result.certificate,
          pluginId: 'different-plugin'
        };
        
        const isTampered = certifier.verifyCertificate(tamperedCert);
        expect(isTampered).toBe(false);
      }
    });

    it('should set appropriate expiration dates', async () => {
      const pluginPath = await createTestPlugin(
        'test-expiration',
        'module.exports = {};'
      );

      const result = await certifier.certifyPlugin(pluginPath);
      
      if (result.certificate) {
        const expires = new Date(result.certificate.expiresAt);
        const now = new Date();
        const daysDiff = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (result.score >= 90) {
          expect(daysDiff).toBeGreaterThan(300); // ~1 year
        } else if (result.score >= 80) {
          expect(daysDiff).toBeGreaterThan(150); // ~6 months
        } else {
          expect(daysDiff).toBeLessThan(100); // ~3 months
        }
      }
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive certification report', async () => {
      const pluginPath = await createTestPlugin(
        'report-test',
        `
          const risky = eval('1+1');
          console.log('Hello');
        `
      );

      const result = await certifier.certifyPlugin(pluginPath);
      const report = await certifier.generateCertificationReport(result);

      expect(report).toContain('Plugin Certification Report');
      expect(report).toContain('report-test@1.0.0');
      expect(report).toContain('Security Analysis');
      expect(report).toContain('Code Quality');
      expect(report).toContain('eval()');
      expect(report).toContain('Recommendations');
    });
  });
});