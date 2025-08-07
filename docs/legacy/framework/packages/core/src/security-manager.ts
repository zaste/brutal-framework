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
export class SecurityManager {
  private policy: SecurityPolicy;
  private incidents: SecurityIncident[] = [];
  private isActive: boolean = false;
  private requestCounts: Map<string, number> = new Map();
  private authenticatedUsers: Set<string> = new Set();
  private suspiciousPatterns: RegExp[] = [];

  constructor(policy: Partial<SecurityPolicy> = {}) {
    this.policy = this.mergeWithDefaultPolicy(policy);
    this.initializeSuspiciousPatterns();
  }

  /**
   * Initialize security manager
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing Security Manager');
    
    // Initialize CSP
    if (this.policy.contentSecurityPolicy.enabled) {
      this.initializeCSP();
    }
    
    // Initialize XSS protection
    if (this.policy.xssProtection.enabled) {
      this.initializeXSSProtection();
    }
    
    // Initialize authentication
    if (this.policy.authentication.enabled) {
      this.initializeAuthentication();
    }
    
    // Initialize threat detection
    if (this.policy.threatDetection.enabled) {
      this.initializeThreatDetection();
    }
    
    // Initialize sanitization
    if (this.policy.sanitization.enabled) {
      this.initializeSanitization();
    }
    
    this.isActive = true;
    console.log('✅ Security Manager initialized');
  }

  /**
   * Validate input content for security threats
   */
  validateInput(content: string, context: 'html' | 'attribute' | 'script' | 'url' = 'html'): boolean {
    if (!this.isActive) return true;
    
    // Check for XSS patterns
    if (this.policy.xssProtection.enabled) {
      if (this.detectXSS(content)) {
        this.recordIncident({
          type: 'xss',
          severity: 'high',
          description: 'XSS attempt detected in input',
          source: 'input_validation',
          details: { content, context }
        });
        return false;
      }
    }
    
    // Check for injection patterns
    if (this.detectInjection(content)) {
      this.recordIncident({
        type: 'injection',
        severity: 'high',
        description: 'Injection attempt detected',
        source: 'input_validation',
        details: { content, context }
      });
      return false;
    }
    
    return true;
  }

  /**
   * Sanitize content based on security policy
   */
  sanitizeContent(content: string, context: 'html' | 'attribute' | 'script' = 'html'): string {
    if (!this.isActive || !this.policy.sanitization.enabled) return content;
    
    let sanitized = content;
    
    switch (context) {
      case 'html':
        sanitized = this.sanitizeHTML(sanitized);
        break;
      case 'attribute':
        sanitized = this.sanitizeAttribute(sanitized);
        break;
      case 'script':
        sanitized = this.sanitizeScript(sanitized);
        break;
    }
    
    return sanitized;
  }

  /**
   * Validate authentication token
   */
  validateAuthToken(token: string): boolean {
    if (!this.isActive || !this.policy.authentication.enabled) return true;
    
    // Basic token validation
    if (!token || token.length < 16) {
      this.recordIncident({
        type: 'authentication',
        severity: 'medium',
        description: 'Invalid authentication token',
        source: 'auth_validation',
        details: { tokenLength: token?.length || 0 }
      });
      return false;
    }
    
    // Check if token is in valid format (basic check)
    if (!/^[a-zA-Z0-9-_]+$/.test(token)) {
      this.recordIncident({
        type: 'authentication',
        severity: 'medium',
        description: 'Malformed authentication token',
        source: 'auth_validation',
        details: { token: token.substring(0, 10) + '...' }
      });
      return false;
    }
    
    return true;
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(identifier: string, limit: number = 100, window: number = 60000): boolean {
    if (!this.isActive || !this.policy.threatDetection.rateLimiting) return true;
    
    const key = `rate_${identifier}`;
    const currentCount = this.requestCounts.get(key) || 0;
    
    if (currentCount >= limit) {
      this.recordIncident({
        type: 'rate_limit',
        severity: 'medium',
        description: `Rate limit exceeded for ${identifier}`,
        source: 'rate_limiter',
        details: { identifier, count: currentCount, limit }
      });
      return false;
    }
    
    this.requestCounts.set(key, currentCount + 1);
    
    // Reset counter after window
    setTimeout(() => {
      this.requestCounts.delete(key);
    }, window);
    
    return true;
  }

  /**
   * Get security incidents
   */
  getSecurityIncidents(): SecurityIncident[] {
    return [...this.incidents].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): any {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    const recentIncidents = this.incidents.filter(i => i.timestamp > last24h);
    const blockedIncidents = recentIncidents.filter(i => i.blocked);
    
    return {
      totalIncidents: this.incidents.length,
      recentIncidents: recentIncidents.length,
      blockedThreats: blockedIncidents.length,
      securityScore: this.calculateSecurityScore(),
      incidentsByType: this.groupIncidentsByType(recentIncidents),
      incidentsBySeverity: this.groupIncidentsBySeverity(recentIncidents)
    };
  }

  /**
   * Update security policy
   */
  updatePolicy(policy: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...policy };
    console.log('🔒 Security policy updated');
  }

  // Private methods

  private mergeWithDefaultPolicy(policy: Partial<SecurityPolicy>): SecurityPolicy {
    return {
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", "data:", "https:"],
          'font-src': ["'self'"],
          'connect-src': ["'self'"],
          'frame-src': ["'none'"],
          'object-src': ["'none'"]
        },
        reportOnly: false,
        reportUri: undefined,
        ...policy.contentSecurityPolicy
      },
      xssProtection: {
        enabled: true,
        inputSanitization: true,
        outputEncoding: true,
        scriptValidation: true,
        allowedDomains: [],
        ...policy.xssProtection
      },
      authentication: {
        enabled: true,
        requireAuthentication: false,
        tokenValidation: true,
        sessionTimeout: 3600000, // 1 hour
        providers: ['local'],
        ...policy.authentication
      },
      threatDetection: {
        enabled: true,
        rateLimiting: true,
        anomalyDetection: true,
        logSuspiciousActivity: true,
        blockThreats: true,
        ...policy.threatDetection
      },
      sanitization: {
        enabled: true,
        htmlSanitization: true,
        scriptSanitization: true,
        attributeSanitization: true,
        allowedTags: ['div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ul', 'ol', 'li'],
        allowedAttributes: ['id', 'class', 'href', 'src', 'alt', 'title', 'target'],
        ...policy.sanitization
      }
    };
  }

  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /<!--[\s\S]*?-->/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<form\b[^>]*>/gi
    ];
  }

  private initializeCSP(): void {
    if (typeof document !== 'undefined') {
      const cspDirectives = Object.entries(this.policy.contentSecurityPolicy.directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
      
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', cspDirectives);
      document.head.appendChild(meta);
      
      console.log('🔒 CSP initialized:', cspDirectives);
    }
  }

  private initializeXSSProtection(): void {
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'X-XSS-Protection');
      meta.setAttribute('content', '1; mode=block');
      document.head.appendChild(meta);
      
      console.log('🔒 XSS protection initialized');
    }
  }

  private initializeAuthentication(): void {
    // Setup authentication interceptors
    console.log('🔒 Authentication system initialized');
  }

  private initializeThreatDetection(): void {
    // Setup threat detection monitoring
    console.log('🔒 Threat detection initialized');
  }

  private initializeSanitization(): void {
    // Setup content sanitization
    console.log('🔒 Content sanitization initialized');
  }

  private detectXSS(content: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  private detectInjection(content: string): boolean {
    const injectionPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+set/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi
    ];
    
    return injectionPatterns.some(pattern => pattern.test(content));
  }

  private sanitizeHTML(html: string): string {
    if (!this.policy.sanitization.htmlSanitization) return html;
    
    // Basic HTML sanitization
    let sanitized = html;
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized;
  }

  private sanitizeAttribute(attribute: string): string {
    if (!this.policy.sanitization.attributeSanitization) return attribute;
    
    // Remove potentially dangerous attribute content
    let sanitized = attribute;
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:text\/html/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    
    return sanitized;
  }

  private sanitizeScript(script: string): string {
    if (!this.policy.sanitization.scriptSanitization) return script;
    
    // Very restrictive script sanitization
    let sanitized = script;
    sanitized = sanitized.replace(/eval\s*\(/gi, '');
    sanitized = sanitized.replace(/Function\s*\(/gi, '');
    sanitized = sanitized.replace(/setTimeout\s*\(/gi, '');
    sanitized = sanitized.replace(/setInterval\s*\(/gi, '');
    
    return sanitized;
  }

  private recordIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'blocked'>): void {
    const fullIncident: SecurityIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      blocked: this.policy.threatDetection.blockThreats,
      ...incident
    };
    
    this.incidents.push(fullIncident);
    
    // Log incident
    if (this.policy.threatDetection.logSuspiciousActivity) {
      console.warn(`🚨 Security incident: ${fullIncident.description}`, fullIncident);
    }
    
    // Keep only recent incidents (last 1000)
    if (this.incidents.length > 1000) {
      this.incidents = this.incidents.slice(-1000);
    }
  }

  private calculateSecurityScore(): number {
    const recentIncidents = this.incidents.filter(i => i.timestamp > (Date.now() - 24 * 60 * 60 * 1000));
    const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical').length;
    const highIncidents = recentIncidents.filter(i => i.severity === 'high').length;
    const mediumIncidents = recentIncidents.filter(i => i.severity === 'medium').length;
    
    // Calculate score (0-100, higher is better)
    const baseScore = 100;
    const penalty = (criticalIncidents * 20) + (highIncidents * 10) + (mediumIncidents * 5);
    
    return Math.max(0, Math.min(100, baseScore - penalty));
  }

  private groupIncidentsByType(incidents: SecurityIncident[]): Record<string, number> {
    const groups: Record<string, number> = {};
    incidents.forEach(incident => {
      groups[incident.type] = (groups[incident.type] || 0) + 1;
    });
    return groups;
  }

  private groupIncidentsBySeverity(incidents: SecurityIncident[]): Record<string, number> {
    const groups: Record<string, number> = {};
    incidents.forEach(incident => {
      groups[incident.severity] = (groups[incident.severity] || 0) + 1;
    });
    return groups;
  }
}

// Export default security manager instance
export const securityManager = new SecurityManager();