/**
 * CONFIGURATION MANAGER
 * Centralized configuration system for Native Web Components Framework
 * 
 * Supports: Development, Staging, Production environments
 * Features: Hot reloading, validation, environment-specific overrides
 * Infrastructure: Cloudflare, Vercel, AWS, Azure native integration
 */

export interface CloudflareConfig {
  workersEnabled: boolean;
  edgeLocations: string[];
  kvNamespace?: string;
  r2Bucket?: string;
  analytics: {
    webVitals: boolean;
    customMetrics: boolean;
  };
  security: {
    ddosProtection: boolean;
    waf: boolean;
    botManagement: boolean;
  };
}

export interface VercelConfig {
  functions: {
    runtime: 'nodejs18.x' | 'nodejs20.x' | 'edge';
    regions: string[];
  };
  edge: {
    enabled: boolean;
    config: string;
  };
  analytics: {
    enabled: boolean;
    customEvents: boolean;
  };
  deployment: {
    builds: Array<{
      src: string;
      use: string;
    }>;
  };
}

export interface FrameworkInfrastructureConfig {
  cloudflare?: CloudflareConfig;
  vercel?: VercelConfig;
  aws?: {
    region: string;
    cloudfront: boolean;
    lambda: boolean;
  };
  azure?: {
    region: string;
    cdn: boolean;
    functions: boolean;
  };
}

export interface PerformanceConfig {
  targetMultiplier: number; // 50x React default
  optimization: {
    shadowDOM: boolean;
    templateCaching: boolean;
    eventDelegation: boolean;
    lazyLoading: boolean;
  };
  caching: {
    strategy: 'aggressive' | 'balanced' | 'minimal';
    ttl: number;
    compression: boolean;
  };
  bundling: {
    treeshaking: boolean;
    minification: boolean;
    splitting: boolean;
  };
}

export interface SecurityConfig {
  level: 'basic' | 'enhanced' | 'enterprise';
  csp: {
    enabled: boolean;
    policy: string;
    reportOnly: boolean;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  encryption: {
    quantumSafe: boolean;
    algorithm: string;
  };
}

export interface ComplianceConfig {
  standards: Array<'GDPR' | 'CCPA' | 'HIPAA' | 'SOC2' | 'PCI-DSS'>;
  dataRetention: number;
  auditLogging: boolean;
  privacyControls: {
    anonymization: boolean;
    rightToErasure: boolean;
    dataPortability: boolean;
  };
}

export interface MonitoringConfig {
  performance: {
    realUserMonitoring: boolean;
    syntheticMonitoring: boolean;
    coreWebVitals: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    structured: boolean;
    retention: number;
  };
  alerts: {
    performance: boolean;
    errors: boolean;
    security: boolean;
  };
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256' | 'ChaCha20-Poly1305';
  keyRotation: boolean;
  keyRotationInterval: number; // hours
  storage: 'local' | 'remote' | 'hsm';
  certificate: {
    authority: string;
    autoRenewal: boolean;
    validity: number; // days
  };
}

export interface RemoteConfigConfig {
  enabled: boolean;
  endpoint: string;
  authentication: {
    type: 'bearer' | 'apikey' | 'oauth2';
    credentials: string;
  };
  polling: {
    enabled: boolean;
    interval: number; // seconds
  };
  cache: {
    enabled: boolean;
    ttl: number; // seconds
  };
  fallback: {
    enabled: boolean;
    localPath: string;
  };
}

export interface AdvancedMonitoringConfig {
  realTimeMetrics: boolean;
  customDashboard: boolean;
  alerting: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    thresholds: {
      performance: number;
      error: number;
      security: number;
    };
  };
  analytics: {
    userBehavior: boolean;
    performance: boolean;
    security: boolean;
    business: boolean;
  };
  exporters: {
    prometheus: boolean;
    datadog: boolean;
    newrelic: boolean;
    custom: boolean;
  };
}

export interface GovernanceConfig {
  codeReview: {
    required: boolean;
    minimumReviewers: number;
    blockedFiles: string[];
  };
  deployment: {
    approvalRequired: boolean;
    approvers: string[];
    environments: string[];
  };
  security: {
    vulnerabilityScanning: boolean;
    dependencyScanning: boolean;
    secretScanning: boolean;
    complianceChecks: boolean;
  };
  documentation: {
    required: boolean;
    templates: string[];
    autoGeneration: boolean;
  };
}

export interface FrameworkConfig {
  environment: 'development' | 'staging' | 'production';
  performance: PerformanceConfig;
  security: SecurityConfig;
  compliance: ComplianceConfig;
  monitoring: MonitoringConfig;
  infrastructure: FrameworkInfrastructureConfig;
  extensions: {
    aiml?: boolean;
    developerExperience?: boolean;
    performanceScale?: boolean;
    advancedSecurity?: boolean;
    industrySpecific?: boolean;
    crossPlatform?: boolean;
  };
  enterprise: {
    multiTenant: boolean;
    sso: boolean;
    rbac: boolean;
    auditTrail: boolean;
    encryption: EncryptionConfig;
    remoteConfig: RemoteConfigConfig;
    advancedMonitoring: AdvancedMonitoringConfig;
    governance: GovernanceConfig;
  };
}

/**
 * Configuration Manager Class
 * 
 * Handles all framework configuration with environment-specific overrides,
 * validation, and hot reloading capabilities.
 */
export class ConfigurationManager {
  private config: FrameworkConfig;
  private readonly defaultConfig: FrameworkConfig;
  private readonly configValidators: Map<string, Function> = new Map();
  private readonly configWatchers: Map<string, Function[]> = new Map();

  constructor(userConfig?: Partial<FrameworkConfig>) {
    this.defaultConfig = this.createDefaultConfig();
    this.config = this.mergeConfigs(this.defaultConfig, userConfig || {});
    this.setupValidators();
    this.validateConfiguration();
  }

  /**
   * Get complete configuration
   */
  getConfig(): FrameworkConfig {
    return { ...this.config };
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.config.performance };
  }

  /**
   * Get performance target multiplier
   */
  getPerformanceTarget(): number {
    return this.config.performance.targetMultiplier;
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.config.security };
  }

  /**
   * Get infrastructure configuration
   */
  getInfrastructureConfig(): FrameworkInfrastructureConfig {
    return { ...this.config.infrastructure };
  }

  /**
   * Get Cloudflare-specific configuration
   */
  getCloudflareConfig(): CloudflareConfig | undefined {
    return this.config.infrastructure.cloudflare ? 
      { ...this.config.infrastructure.cloudflare } : undefined;
  }

  /**
   * Get Vercel-specific configuration
   */
  getVercelConfig(): VercelConfig | undefined {
    return this.config.infrastructure.vercel ? 
      { ...this.config.infrastructure.vercel } : undefined;
  }

  /**
   * Get extensions configuration
   */
  getExtensionsConfig() {
    return { ...this.config.extensions };
  }

  /**
   * Get compliance configuration
   */
  getComplianceConfig(): ComplianceConfig {
    return { ...this.config.compliance };
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): MonitoringConfig {
    return { ...this.config.monitoring };
  }

  /**
   * Get enterprise configuration
   */
  getEnterpriseConfig() {
    return { ...this.config.enterprise };
  }

  /**
   * Get encryption configuration
   */
  getEncryptionConfig(): EncryptionConfig {
    return { ...this.config.enterprise.encryption };
  }

  /**
   * Get remote configuration settings
   */
  getRemoteConfigConfig(): RemoteConfigConfig {
    return { ...this.config.enterprise.remoteConfig };
  }

  /**
   * Get advanced monitoring configuration
   */
  getAdvancedMonitoringConfig(): AdvancedMonitoringConfig {
    return { ...this.config.enterprise.advancedMonitoring };
  }

  /**
   * Get governance configuration
   */
  getGovernanceConfig(): GovernanceConfig {
    return { ...this.config.enterprise.governance };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(updates: Partial<FrameworkConfig>): void {
    const newConfig = this.mergeConfigs(this.config, updates);
    this.validateConfiguration(newConfig);
    
    const oldConfig = this.config;
    this.config = newConfig;
    
    this.notifyConfigWatchers(oldConfig, newConfig);
  }

  /**
   * Watch for configuration changes
   */
  watchConfig(path: string, callback: Function): void {
    if (!this.configWatchers.has(path)) {
      this.configWatchers.set(path, []);
    }
    this.configWatchers.get(path)!.push(callback);
  }

  /**
   * Generate infrastructure-specific deployment config
   */
  generateDeploymentConfig(platform: 'cloudflare' | 'vercel' | 'aws' | 'azure'): any {
    switch (platform) {
      case 'cloudflare':
        return this.generateCloudflareConfig();
      case 'vercel':
        return this.generateVercelConfig();
      case 'aws':
        return this.generateAWSConfig();
      case 'azure':
        return this.generateAzureConfig();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Environment-specific configuration loading
   */
  loadEnvironmentConfig(environment: string): Partial<FrameworkConfig> {
    const envConfigs = {
      development: {
        performance: {
          targetMultiplier: 50,
          optimization: {
            shadowDOM: true,
            templateCaching: true,
            eventDelegation: true,
            lazyLoading: false // Disabled for dev debugging
          }
        },
        security: {
          level: 'basic' as const,
          csp: { enabled: false, policy: '', reportOnly: true }
        },
        monitoring: {
          logging: { level: 'debug' as const }
        }
      },
      staging: {
        performance: {
          targetMultiplier: 50,
          optimization: {
            shadowDOM: true,
            templateCaching: true,
            eventDelegation: true,
            lazyLoading: true
          }
        },
        security: {
          level: 'enhanced' as const,
          csp: { enabled: true, policy: "default-src 'self'", reportOnly: true }
        },
        monitoring: {
          logging: { level: 'info' as const }
        }
      },
      production: {
        performance: {
          targetMultiplier: 50,
          optimization: {
            shadowDOM: true,
            templateCaching: true,
            eventDelegation: true,
            lazyLoading: true
          },
          caching: {
            strategy: 'aggressive' as const,
            ttl: 86400,
            compression: true
          }
        },
        security: {
          level: 'enterprise' as const,
          csp: { enabled: true, policy: "default-src 'self'; script-src 'self' 'unsafe-inline'", reportOnly: false }
        },
        monitoring: {
          logging: { level: 'warn' as const },
          performance: {
            realUserMonitoring: true,
            syntheticMonitoring: true,
            coreWebVitals: true
          }
        }
      }
    };

    return envConfigs[environment as keyof typeof envConfigs] || {};
  }

  private createDefaultConfig(): FrameworkConfig {
    return {
      environment: 'development',
      performance: {
        targetMultiplier: 50,
        optimization: {
          shadowDOM: true,
          templateCaching: true,
          eventDelegation: true,
          lazyLoading: true
        },
        caching: {
          strategy: 'balanced',
          ttl: 3600,
          compression: true
        },
        bundling: {
          treeshaking: true,
          minification: true,
          splitting: true
        }
      },
      security: {
        level: 'enhanced',
        csp: {
          enabled: true,
          policy: "default-src 'self'",
          reportOnly: false
        },
        cors: {
          origins: ['*'],
          credentials: false
        },
        encryption: {
          quantumSafe: false,
          algorithm: 'AES-256-GCM'
        }
      },
      compliance: {
        standards: ['GDPR'],
        dataRetention: 365,
        auditLogging: true,
        privacyControls: {
          anonymization: true,
          rightToErasure: true,
          dataPortability: true
        }
      },
      monitoring: {
        performance: {
          realUserMonitoring: true,
          syntheticMonitoring: false,
          coreWebVitals: true
        },
        logging: {
          level: 'info',
          structured: true,
          retention: 30
        },
        alerts: {
          performance: true,
          errors: true,
          security: true
        }
      },
      infrastructure: {
        cloudflare: {
          workersEnabled: true,
          edgeLocations: ['auto'],
          analytics: {
            webVitals: true,
            customMetrics: true
          },
          security: {
            ddosProtection: true,
            waf: true,
            botManagement: true
          }
        },
        vercel: {
          functions: {
            runtime: 'nodejs20.x',
            regions: ['iad1', 'sfo1']
          },
          edge: {
            enabled: true,
            config: 'edge.config.js'
          },
          analytics: {
            enabled: true,
            customEvents: true
          },
          deployment: {
            builds: [
              { src: 'packages/*/package.json', use: '@vercel/node' }
            ]
          }
        }
      },
      extensions: {
        aiml: false,
        developerExperience: true,
        performanceScale: true,
        advancedSecurity: false,
        industrySpecific: false,
        crossPlatform: false
      },
      enterprise: {
        multiTenant: false,
        sso: false,
        rbac: false,
        auditTrail: true,
        encryption: {
          enabled: false,
          algorithm: 'AES-256',
          keyRotation: false,
          keyRotationInterval: 24,
          storage: 'local',
          certificate: {
            authority: 'letsencrypt',
            autoRenewal: true,
            validity: 90
          }
        },
        remoteConfig: {
          enabled: false,
          endpoint: '',
          authentication: {
            type: 'bearer',
            credentials: ''
          },
          polling: {
            enabled: false,
            interval: 300
          },
          cache: {
            enabled: true,
            ttl: 3600
          },
          fallback: {
            enabled: true,
            localPath: './config/fallback.json'
          }
        },
        advancedMonitoring: {
          realTimeMetrics: false,
          customDashboard: false,
          alerting: {
            enabled: false,
            channels: ['email'],
            thresholds: {
              performance: 95,
              error: 5,
              security: 10
            }
          },
          analytics: {
            userBehavior: false,
            performance: true,
            security: true,
            business: false
          },
          exporters: {
            prometheus: false,
            datadog: false,
            newrelic: false,
            custom: false
          }
        },
        governance: {
          codeReview: {
            required: false,
            minimumReviewers: 1,
            blockedFiles: ['package.json', 'yarn.lock']
          },
          deployment: {
            approvalRequired: false,
            approvers: [],
            environments: ['staging', 'production']
          },
          security: {
            vulnerabilityScanning: false,
            dependencyScanning: false,
            secretScanning: false,
            complianceChecks: false
          },
          documentation: {
            required: false,
            templates: ['readme', 'api', 'changelog'],
            autoGeneration: false
          }
        }
      }
    };
  }

  private mergeConfigs(base: FrameworkConfig, override: Partial<FrameworkConfig>): FrameworkConfig {
    // Deep merge implementation
    return this.deepMerge(base, override) as FrameworkConfig;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private setupValidators(): void {
    this.configValidators.set('performance.targetMultiplier', (value: number) => {
      if (value < 1 || value > 100) {
        throw new Error('Performance target multiplier must be between 1 and 100');
      }
    });

    this.configValidators.set('security.level', (value: string) => {
      if (!['basic', 'enhanced', 'enterprise'].includes(value)) {
        throw new Error('Security level must be basic, enhanced, or enterprise');
      }
    });
  }

  private validateConfiguration(config = this.config): void {
    // Validation logic for configuration
    if (config.performance.targetMultiplier < 1) {
      throw new Error('Performance target must be at least 1x');
    }

    if (config.environment === 'production' && config.security.level === 'basic') {
      console.warn('Warning: Basic security level not recommended for production');
    }
  }

  private notifyConfigWatchers(oldConfig: FrameworkConfig, newConfig: FrameworkConfig): void {
    // Notify watchers of configuration changes
    this.configWatchers.forEach((callbacks, path) => {
      const oldValue = this.getNestedProperty(oldConfig, path);
      const newValue = this.getNestedProperty(newConfig, path);
      
      if (oldValue !== newValue) {
        callbacks.forEach(callback => callback(newValue, oldValue));
      }
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateCloudflareConfig(): any {
    const cfConfig = this.getCloudflareConfig();
    if (!cfConfig) return null;

    return {
      // wrangler.toml configuration
      main: "dist/worker.js",
      compatibility_date: "2024-01-01",
      workers_dev: this.config.environment !== 'production',
      kv_namespaces: cfConfig.kvNamespace ? [
        { binding: "FRAMEWORK_KV", id: cfConfig.kvNamespace }
      ] : [],
      r2_buckets: cfConfig.r2Bucket ? [
        { binding: "FRAMEWORK_R2", bucket_name: cfConfig.r2Bucket }
      ] : [],
      analytics: cfConfig.analytics,
      build: {
        command: "npm run build",
        upload: {
          format: "modules"
        }
      }
    };
  }

  private generateVercelConfig(): any {
    const vercelConfig = this.getVercelConfig();
    if (!vercelConfig) return null;

    return {
      // vercel.json configuration
      version: 2,
      builds: vercelConfig.deployment.builds,
      functions: vercelConfig.functions,
      rewrites: [
        {
          source: "/api/(.*)",
          destination: "/api/$1"
        }
      ],
      headers: [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Frame-Options",
              value: "DENY"
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff"
            }
          ]
        }
      ]
    };
  }

  private generateAWSConfig(): any {
    return {
      // CloudFormation template
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        FrameworkCluster: {
          Type: "AWS::ECS::Cluster",
          Properties: {
            ClusterName: "native-web-components-framework"
          }
        }
      }
    };
  }

  private generateAzureConfig(): any {
    return {
      // ARM template
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      contentVersion: "1.0.0.0",
      resources: []
    };
  }
}