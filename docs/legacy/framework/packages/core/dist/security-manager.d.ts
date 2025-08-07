/**
 * SECURITY MANAGER
 * Enterprise-grade security features for Native Web Components Framework
 *
 * Provides comprehensive security controls including CSP, XSS protection,
 * authentication integration, and threat detection.
 */
export interface SecurityPolicy {
    contentSecurityPolicy: CSPConfig;
    xssProtection: XSSConfig;
    authentication: AuthConfig;
    threatDetection: ThreatConfig;
    sanitization: SanitizationConfig;
}
export interface CSPConfig {
    enabled: boolean;
    directives: Record<string, string[]>;
    reportOnly: boolean;
    reportUri?: string;
}
export interface XSSConfig {
    enabled: boolean;
    inputSanitization: boolean;
    outputEncoding: boolean;
    scriptValidation: boolean;
    allowedDomains: string[];
}
export interface AuthConfig {
    enabled: boolean;
    requireAuthentication: boolean;
    tokenValidation: boolean;
    sessionTimeout: number;
    providers: string[];
}
export interface ThreatConfig {
    enabled: boolean;
    rateLimiting: boolean;
    anomalyDetection: boolean;
    logSuspiciousActivity: boolean;
    blockThreats: boolean;
}
export interface SanitizationConfig {
    enabled: boolean;
    htmlSanitization: boolean;
    scriptSanitization: boolean;
    attributeSanitization: boolean;
    allowedTags: string[];
    allowedAttributes: string[];
}
export interface SecurityIncident {
    id: string;
    type: 'xss' | 'csrf' | 'injection' | 'authentication' | 'rate_limit' | 'anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    source: string;
    timestamp: number;
    blocked: boolean;
    details: any;
}
/**
 * Security Manager Class
 *
 * Provides comprehensive security management for the framework
 */
export declare class SecurityManager {
    private policy;
    private incidents;
    private isActive;
    private requestCounts;
    private authenticatedUsers;
    private suspiciousPatterns;
    constructor(policy?: Partial<SecurityPolicy>);
    /**
     * Initialize security manager
     */
    initialize(): Promise<void>;
    /**
     * Validate input content for security threats
     */
    validateInput(content: string, context?: 'html' | 'attribute' | 'script' | 'url'): boolean;
    /**
     * Sanitize content based on security policy
     */
    sanitizeContent(content: string, context?: 'html' | 'attribute' | 'script'): string;
    /**
     * Validate authentication token
     */
    validateAuthToken(token: string): boolean;
    /**
     * Check rate limiting
     */
    checkRateLimit(identifier: string, limit?: number, window?: number): boolean;
    /**
     * Get security incidents
     */
    getSecurityIncidents(): SecurityIncident[];
    /**
     * Get security metrics
     */
    getSecurityMetrics(): any;
    /**
     * Update security policy
     */
    updatePolicy(policy: Partial<SecurityPolicy>): void;
    private mergeWithDefaultPolicy;
    private initializeSuspiciousPatterns;
    private initializeCSP;
    private initializeXSSProtection;
    private initializeAuthentication;
    private initializeThreatDetection;
    private initializeSanitization;
    private detectXSS;
    private detectInjection;
    private sanitizeHTML;
    private sanitizeAttribute;
    private sanitizeScript;
    private recordIncident;
    private calculateSecurityScore;
    private groupIncidentsByType;
    private groupIncidentsBySeverity;
}
export declare const securityManager: SecurityManager;
//# sourceMappingURL=security-manager.d.ts.map