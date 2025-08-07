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
    targetMultiplier: number;
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
    keyRotationInterval: number;
    storage: 'local' | 'remote' | 'hsm';
    certificate: {
        authority: string;
        autoRenewal: boolean;
        validity: number;
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
        interval: number;
    };
    cache: {
        enabled: boolean;
        ttl: number;
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
export declare class ConfigurationManager {
    private config;
    private readonly defaultConfig;
    private readonly configValidators;
    private readonly configWatchers;
    constructor(userConfig?: Partial<FrameworkConfig>);
    /**
     * Get complete configuration
     */
    getConfig(): FrameworkConfig;
    /**
     * Get performance configuration
     */
    getPerformanceConfig(): PerformanceConfig;
    /**
     * Get performance target multiplier
     */
    getPerformanceTarget(): number;
    /**
     * Get security configuration
     */
    getSecurityConfig(): SecurityConfig;
    /**
     * Get infrastructure configuration
     */
    getInfrastructureConfig(): FrameworkInfrastructureConfig;
    /**
     * Get Cloudflare-specific configuration
     */
    getCloudflareConfig(): CloudflareConfig | undefined;
    /**
     * Get Vercel-specific configuration
     */
    getVercelConfig(): VercelConfig | undefined;
    /**
     * Get extensions configuration
     */
    getExtensionsConfig(): {
        aiml?: boolean | undefined;
        developerExperience?: boolean | undefined;
        performanceScale?: boolean | undefined;
        advancedSecurity?: boolean | undefined;
        industrySpecific?: boolean | undefined;
        crossPlatform?: boolean | undefined;
    };
    /**
     * Get compliance configuration
     */
    getComplianceConfig(): ComplianceConfig;
    /**
     * Get monitoring configuration
     */
    getMonitoringConfig(): MonitoringConfig;
    /**
     * Get enterprise configuration
     */
    getEnterpriseConfig(): {
        multiTenant: boolean;
        sso: boolean;
        rbac: boolean;
        auditTrail: boolean;
        encryption: EncryptionConfig;
        remoteConfig: RemoteConfigConfig;
        advancedMonitoring: AdvancedMonitoringConfig;
        governance: GovernanceConfig;
    };
    /**
     * Get encryption configuration
     */
    getEncryptionConfig(): EncryptionConfig;
    /**
     * Get remote configuration settings
     */
    getRemoteConfigConfig(): RemoteConfigConfig;
    /**
     * Get advanced monitoring configuration
     */
    getAdvancedMonitoringConfig(): AdvancedMonitoringConfig;
    /**
     * Get governance configuration
     */
    getGovernanceConfig(): GovernanceConfig;
    /**
     * Update configuration dynamically
     */
    updateConfig(updates: Partial<FrameworkConfig>): void;
    /**
     * Watch for configuration changes
     */
    watchConfig(path: string, callback: Function): void;
    /**
     * Generate infrastructure-specific deployment config
     */
    generateDeploymentConfig(platform: 'cloudflare' | 'vercel' | 'aws' | 'azure'): any;
    /**
     * Environment-specific configuration loading
     */
    loadEnvironmentConfig(environment: string): Partial<FrameworkConfig>;
    private createDefaultConfig;
    private mergeConfigs;
    private deepMerge;
    private setupValidators;
    private validateConfiguration;
    private notifyConfigWatchers;
    private getNestedProperty;
    private generateCloudflareConfig;
    private generateVercelConfig;
    private generateAWSConfig;
    private generateAzureConfig;
}
//# sourceMappingURL=configuration-manager.d.ts.map