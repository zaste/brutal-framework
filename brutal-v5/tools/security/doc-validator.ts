/**
 * Documentation Validator for BRUTAL V5
 * 
 * Validates and ensures documentation quality and security
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export interface DocumentationValidation {
  valid: boolean;
  score: number; // 0-100
  files: FileValidation[];
  summary: {
    totalFiles: number;
    validFiles: number;
    coverage: number;
    issues: number;
    criticalIssues: number;
  };
  recommendations: string[];
}

export interface FileValidation {
  path: string;
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  metrics: {
    lines: number;
    words: number;
    codeBlocks: number;
    links: number;
    images: number;
  };
}

export interface ValidationIssue {
  type: 'structure' | 'content' | 'security' | 'quality' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
}

export interface ValidationRules {
  // Structure rules
  requireTableOfContents?: boolean;
  requireHeaders?: boolean;
  maxHeaderLevel?: number;
  requireCodeBlockLanguage?: boolean;
  
  // Content rules
  minWordCount?: number;
  maxWordCount?: number;
  requireExamples?: boolean;
  requireApiDocs?: boolean;
  
  // Security rules
  checkForSecrets?: boolean;
  checkForPII?: boolean;
  validateUrls?: boolean;
  checkForMaliciousCode?: boolean;
  
  // Quality rules
  checkSpelling?: boolean;
  checkGrammar?: boolean;
  checkBrokenLinks?: boolean;
  checkImageAlt?: boolean;
  
  // Custom patterns
  forbiddenPatterns?: RegExp[];
  requiredSections?: string[];
}

export class DocumentationValidator {
  private defaultRules: ValidationRules = {
    requireTableOfContents: true,
    requireHeaders: true,
    maxHeaderLevel: 4,
    requireCodeBlockLanguage: true,
    minWordCount: 50,
    requireExamples: true,
    checkForSecrets: true,
    checkForPII: true,
    validateUrls: true,
    checkForMaliciousCode: true,
    checkBrokenLinks: true,
    checkImageAlt: true
  };
  
  async validateDocumentation(
    path: string,
    rules?: Partial<ValidationRules>
  ): Promise<DocumentationValidation> {
    const appliedRules = { ...this.defaultRules, ...rules };
    const files = await this.findDocumentationFiles(path);
    const fileValidations: FileValidation[] = [];
    
    let totalIssues = 0;
    let criticalIssues = 0;
    
    for (const file of files) {
      const validation = await this.validateFile(file, appliedRules);
      fileValidations.push(validation);
      
      totalIssues += validation.issues.length;
      criticalIssues += validation.issues.filter(i => i.severity === 'critical').length;
    }
    
    const validFiles = fileValidations.filter(f => f.valid).length;
    const totalScore = fileValidations.reduce((sum, f) => sum + f.score, 0);
    const averageScore = files.length > 0 ? totalScore / files.length : 0;
    
    // Calculate coverage
    const coverage = await this.calculateCoverage(path);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(fileValidations, coverage);
    
    return {
      valid: criticalIssues === 0 && averageScore >= 70,
      score: Math.round(averageScore),
      files: fileValidations,
      summary: {
        totalFiles: files.length,
        validFiles,
        coverage,
        issues: totalIssues,
        criticalIssues
      },
      recommendations
    };
  }
  
  private async findDocumentationFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDir = async (currentDir: string) => {
      try {
        const entries = await readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile() && this.isDocumentationFile(entry.name)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory not accessible
      }
    };
    
    await scanDir(dir);
    return files;
  }
  
  private isDocumentationFile(filename: string): boolean {
    const docExtensions = ['.md', '.mdx', '.rst', '.txt', '.adoc'];
    const docPatterns = [/readme/i, /changelog/i, /contributing/i, /license/i, /doc/i];
    
    return docExtensions.some(ext => filename.endsWith(ext)) ||
           docPatterns.some(pattern => pattern.test(filename));
  }
  
  private async validateFile(
    filePath: string,
    rules: ValidationRules
  ): Promise<FileValidation> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues: ValidationIssue[] = [];
    
    // Structure validation
    if (rules.requireTableOfContents) {
      const hasToc = this.hasTableOfContents(content);
      if (!hasToc && lines.length > 100) {
        issues.push({
          type: 'structure',
          severity: 'medium',
          message: 'Missing table of contents for long document',
          suggestion: 'Add a table of contents at the beginning of the document'
        });
      }
    }
    
    if (rules.requireHeaders) {
      const headers = this.extractHeaders(content);
      if (headers.length === 0) {
        issues.push({
          type: 'structure',
          severity: 'high',
          message: 'No headers found in document',
          suggestion: 'Add proper markdown headers to structure the content'
        });
      }
      
      // Check header hierarchy
      let lastLevel = 0;
      for (const header of headers) {
        if (header.level - lastLevel > 1) {
          issues.push({
            type: 'structure',
            severity: 'low',
            line: header.line,
            message: `Header level jumped from ${lastLevel} to ${header.level}`,
            suggestion: 'Maintain proper header hierarchy'
          });
        }
        lastLevel = header.level;
      }
    }
    
    // Content validation
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    if (rules.minWordCount && wordCount < rules.minWordCount) {
      issues.push({
        type: 'content',
        severity: 'medium',
        message: `Document too short (${wordCount} words, minimum ${rules.minWordCount})`,
        suggestion: 'Add more detailed content'
      });
    }
    
    if (rules.maxWordCount && wordCount > rules.maxWordCount) {
      issues.push({
        type: 'content',
        severity: 'low',
        message: `Document too long (${wordCount} words, maximum ${rules.maxWordCount})`,
        suggestion: 'Consider splitting into multiple documents'
      });
    }
    
    // Code block validation
    const codeBlocks = this.extractCodeBlocks(content);
    
    if (rules.requireCodeBlockLanguage) {
      for (const block of codeBlocks) {
        if (!block.language) {
          issues.push({
            type: 'quality',
            severity: 'low',
            line: block.line,
            message: 'Code block without language specification',
            suggestion: 'Add language identifier after ``` for syntax highlighting'
          });
        }
      }
    }
    
    if (rules.requireExamples && codeBlocks.length === 0 && filePath.includes('api')) {
      issues.push({
        type: 'content',
        severity: 'medium',
        message: 'API documentation without code examples',
        suggestion: 'Add code examples to demonstrate usage'
      });
    }
    
    // Security validation
    if (rules.checkForSecrets) {
      const secrets = this.detectSecrets(content);
      for (const secret of secrets) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: secret.line,
          message: `Potential secret detected: ${secret.type}`,
          suggestion: 'Remove sensitive information and use environment variables'
        });
      }
    }
    
    if (rules.checkForPII) {
      const pii = this.detectPII(content);
      for (const item of pii) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: item.line,
          message: `Potential PII detected: ${item.type}`,
          suggestion: 'Remove or redact personal information'
        });
      }
    }
    
    if (rules.checkForMaliciousCode) {
      for (const block of codeBlocks) {
        const malicious = this.detectMaliciousPatterns(block.content);
        if (malicious.length > 0) {
          issues.push({
            type: 'security',
            severity: 'critical',
            line: block.line,
            message: `Potentially malicious code: ${malicious.join(', ')}`,
            suggestion: 'Review and remove dangerous code patterns'
          });
        }
      }
    }
    
    // Link validation
    const links = this.extractLinks(content);
    
    if (rules.validateUrls) {
      for (const link of links) {
        if (link.url.startsWith('http://') && !link.url.includes('localhost')) {
          issues.push({
            type: 'security',
            severity: 'medium',
            line: link.line,
            message: 'Insecure HTTP link',
            suggestion: `Use HTTPS: ${link.url.replace('http://', 'https://')}`
          });
        }
        
        if (link.url.includes('bit.ly') || link.url.includes('tinyurl')) {
          issues.push({
            type: 'security',
            severity: 'high',
            line: link.line,
            message: 'URL shortener detected',
            suggestion: 'Use full URLs for transparency'
          });
        }
      }
    }
    
    // Image validation
    const images = this.extractImages(content);
    
    if (rules.checkImageAlt) {
      for (const image of images) {
        if (!image.alt || image.alt.trim() === '') {
          issues.push({
            type: 'accessibility',
            severity: 'medium',
            line: image.line,
            message: 'Image without alt text',
            suggestion: 'Add descriptive alt text for accessibility'
          });
        }
      }
    }
    
    // Calculate metrics
    const metrics = {
      lines: lines.length,
      words: wordCount,
      codeBlocks: codeBlocks.length,
      links: links.length,
      images: images.length
    };
    
    // Calculate score
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    return {
      path: filePath,
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      score: Math.max(0, score),
      issues,
      metrics
    };
  }
  
  private hasTableOfContents(content: string): boolean {
    const tocPatterns = [
      /^#{1,2}\s*table\s*of\s*contents/im,
      /^#{1,2}\s*contents/im,
      /^#{1,2}\s*toc/im,
      /\[toc\]/i,
      /\[\[toc\]\]/i
    ];
    
    return tocPatterns.some(pattern => pattern.test(content));
  }
  
  private extractHeaders(content: string): Array<{
    level: number;
    text: string;
    line: number;
  }> {
    const headers: Array<{ level: number; text: string; line: number }> = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headers.push({
          level: match[1].length,
          text: match[2],
          line: index + 1
        });
      }
    });
    
    return headers;
  }
  
  private extractCodeBlocks(content: string): Array<{
    language?: string;
    content: string;
    line: number;
  }> {
    const blocks: Array<{ language?: string; content: string; line: number }> = [];
    const lines = content.split('\n');
    
    let inBlock = false;
    let currentBlock: { language?: string; content: string; line: number } | null = null;
    
    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (!inBlock) {
          inBlock = true;
          const language = line.slice(3).trim();
          currentBlock = {
            language: language || undefined,
            content: '',
            line: index + 1
          };
        } else {
          inBlock = false;
          if (currentBlock) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
        }
      } else if (inBlock && currentBlock) {
        currentBlock.content += line + '\n';
      }
    });
    
    return blocks;
  }
  
  private detectSecrets(content: string): Array<{
    type: string;
    line: number;
  }> {
    const secrets: Array<{ type: string; line: number }> = [];
    const lines = content.split('\n');
    
    const secretPatterns = [
      { pattern: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i, type: 'API Key' },
      { pattern: /secret\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i, type: 'Secret' },
      { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/i, type: 'Password' },
      { pattern: /token\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i, type: 'Token' },
      { pattern: /private[_-]?key\s*[:=]/i, type: 'Private Key' },
      { pattern: /BEGIN\s+(RSA|DSA|EC)\s+PRIVATE\s+KEY/i, type: 'Private Key' },
      { pattern: /[a-zA-Z0-9]{40}/, type: 'SHA1 Hash (possible token)' }
    ];
    
    lines.forEach((line, index) => {
      for (const { pattern, type } of secretPatterns) {
        if (pattern.test(line)) {
          // Exclude common false positives
          if (!line.includes('example') && !line.includes('your-') && !line.includes('<') && !line.includes('xxx')) {
            secrets.push({ type, line: index + 1 });
          }
        }
      }
    });
    
    return secrets;
  }
  
  private detectPII(content: string): Array<{
    type: string;
    line: number;
  }> {
    const pii: Array<{ type: string; line: number }> = [];
    const lines = content.split('\n');
    
    const piiPatterns = [
      { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, type: 'Email' },
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, type: 'Phone Number' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN' },
      { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/, type: 'Credit Card' }
    ];
    
    lines.forEach((line, index) => {
      for (const { pattern, type } of piiPatterns) {
        if (pattern.test(line)) {
          // Exclude examples and documentation
          if (!line.includes('example') && !line.includes('XXX') && !line.includes('test')) {
            pii.push({ type, line: index + 1 });
          }
        }
      }
    });
    
    return pii;
  }
  
  private detectMaliciousPatterns(code: string): string[] {
    const malicious: string[] = [];
    
    const patterns = [
      { pattern: /eval\s*\(/, name: 'eval()' },
      { pattern: /new\s+Function\s*\(/, name: 'Function constructor' },
      { pattern: /document\.write/, name: 'document.write' },
      { pattern: /innerHTML\s*=/, name: 'innerHTML assignment' },
      { pattern: /\$\(.*\)\.html\(/, name: 'jQuery html()' },
      { pattern: /exec\s*\(/, name: 'exec()' },
      { pattern: /spawn\s*\(/, name: 'spawn()' },
      { pattern: /require\s*\(\s*[`'"][^`'"]*\$\{/, name: 'Dynamic require' }
    ];
    
    for (const { pattern, name } of patterns) {
      if (pattern.test(code)) {
        malicious.push(name);
      }
    }
    
    return malicious;
  }
  
  private extractLinks(content: string): Array<{
    text: string;
    url: string;
    line: number;
  }> {
    const links: Array<{ text: string; url: string; line: number }> = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Markdown links
      const mdLinks = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const match of mdLinks) {
        links.push({
          text: match[1],
          url: match[2],
          line: index + 1
        });
      }
      
      // Plain URLs
      const urlPattern = /https?:\/\/[^\s<>"{}\[\]]+/g;
      const urls = line.matchAll(urlPattern);
      for (const match of urls) {
        if (!links.some(l => l.url === match[0])) {
          links.push({
            text: match[0],
            url: match[0],
            line: index + 1
          });
        }
      }
    });
    
    return links;
  }
  
  private extractImages(content: string): Array<{
    alt: string;
    src: string;
    line: number;
  }> {
    const images: Array<{ alt: string; src: string; line: number }> = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Markdown images
      const mdImages = line.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);
      for (const match of mdImages) {
        images.push({
          alt: match[1],
          src: match[2],
          line: index + 1
        });
      }
      
      // HTML images
      const htmlImages = line.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g);
      for (const match of htmlImages) {
        const altMatch = match[0].match(/alt=["']([^"']*)['"]/);
        images.push({
          alt: altMatch ? altMatch[1] : '',
          src: match[1],
          line: index + 1
        });
      }
    });
    
    return images;
  }
  
  private async calculateCoverage(projectPath: string): Promise<number> {
    // Simple coverage calculation based on presence of key documentation
    const expectedDocs = [
      'README.md',
      'CONTRIBUTING.md',
      'LICENSE',
      'CHANGELOG.md',
      'docs/api.md',
      'docs/getting-started.md'
    ];
    
    let found = 0;
    for (const doc of expectedDocs) {
      try {
        await readFile(join(projectPath, doc));
        found++;
      } catch {
        // File doesn't exist
      }
    }
    
    return Math.round((found / expectedDocs.length) * 100);
  }
  
  private generateRecommendations(
    validations: FileValidation[],
    coverage: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Coverage recommendations
    if (coverage < 50) {
      recommendations.push('Add essential documentation files (README, LICENSE, CONTRIBUTING)');
    } else if (coverage < 80) {
      recommendations.push('Improve documentation coverage by adding API docs and guides');
    }
    
    // Common issues
    const allIssues = validations.flatMap(v => v.issues);
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const securityCount = allIssues.filter(i => i.type === 'security').length;
    
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical issues immediately`);
    }
    
    if (securityCount > 0) {
      recommendations.push('Review and fix security issues in documentation');
    }
    
    // Missing examples
    const noExamples = validations.filter(v => 
      v.metrics.codeBlocks === 0 && v.path.includes('api')
    );
    if (noExamples.length > 0) {
      recommendations.push('Add code examples to API documentation');
    }
    
    // Accessibility
    const accessibilityIssues = allIssues.filter(i => i.type === 'accessibility');
    if (accessibilityIssues.length > 0) {
      recommendations.push('Improve accessibility by adding alt text to images');
    }
    
    // Structure
    const structureIssues = allIssues.filter(i => i.type === 'structure');
    if (structureIssues.length > 5) {
      recommendations.push('Improve document structure with proper headers and organization');
    }
    
    return recommendations;
  }
  
  generateValidationReport(validation: DocumentationValidation): string {
    let report = '# Documentation Validation Report\n\n';
    
    report += '## Summary\n\n';
    report += `- **Valid**: ${validation.valid ? '✅ Yes' : '❌ No'}\n`;
    report += `- **Score**: ${validation.score}/100\n`;
    report += `- **Files**: ${validation.summary.totalFiles} total, ${validation.summary.validFiles} valid\n`;
    report += `- **Coverage**: ${validation.summary.coverage}%\n`;
    report += `- **Issues**: ${validation.summary.issues} total, ${validation.summary.criticalIssues} critical\n\n`;
    
    if (validation.summary.criticalIssues > 0) {
      report += '## Critical Issues\n\n';
      for (const file of validation.files) {
        const criticalIssues = file.issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
          report += `### ${file.path}\n\n`;
          for (const issue of criticalIssues) {
            report += `- **${issue.type}**: ${issue.message}`;
            if (issue.line) report += ` (line ${issue.line})`;
            report += '\n';
            if (issue.suggestion) {
              report += `  *Suggestion*: ${issue.suggestion}\n`;
            }
          }
          report += '\n';
        }
      }
    }
    
    report += '## File Analysis\n\n';
    for (const file of validation.files) {
      report += `### ${file.path}\n\n`;
      report += `- Score: ${file.score}/100\n`;
      report += `- Metrics: ${file.metrics.lines} lines, ${file.metrics.words} words\n`;
      report += `- Content: ${file.metrics.codeBlocks} code blocks, ${file.metrics.links} links, ${file.metrics.images} images\n`;
      
      if (file.issues.length > 0) {
        report += `- Issues:\n`;
        for (const issue of file.issues) {
          report += `  - **${issue.severity}** (${issue.type}): ${issue.message}\n`;
        }
      }
      report += '\n';
    }
    
    if (validation.recommendations.length > 0) {
      report += '## Recommendations\n\n';
      for (const rec of validation.recommendations) {
        report += `- ${rec}\n`;
      }
    }
    
    return report;
  }
}