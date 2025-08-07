import { describe, it, expect, beforeEach } from '@jest/globals';
import { DocumentationValidator } from '../doc-validator.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('DocumentationValidator', () => {
  let validator: DocumentationValidator;
  let testDir: string;

  beforeEach(async () => {
    validator = new DocumentationValidator();
    testDir = join(tmpdir(), `doc-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createDoc(filename: string, content: string) {
    const filePath = join(testDir, filename);
    const dir = join(testDir, filename.split('/').slice(0, -1).join('/'));
    if (dir !== testDir) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(filePath, content);
    return filePath;
  }

  describe('File Validation', () => {
    it('should validate well-structured documentation', async () => {
      await createDoc('README.md', `# Project Title

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)

## Installation

Install the package using npm:

\`\`\`bash
npm install my-package
\`\`\`

## Usage

Here's how to use this package:

\`\`\`javascript
const pkg = require('my-package');
pkg.doSomething();
\`\`\`

## API

The package exports the following functions...
`);

      const result = await validator.validateDocumentation(testDir);
      
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(90);
      expect(result.files[0].issues).toHaveLength(0);
    });

    it('should detect missing table of contents', async () => {
      const longContent = Array(150).fill('Lorem ipsum dolor sit amet.').join('\n');
      await createDoc('long-doc.md', `# Long Document\n\n${longContent}`);

      const result = await validator.validateDocumentation(testDir);
      
      const tocIssue = result.files[0].issues.find(i => 
        i.message.includes('Missing table of contents')
      );
      expect(tocIssue).toBeDefined();
      expect(tocIssue?.severity).toBe('medium');
    });

    it('should check header hierarchy', async () => {
      await createDoc('bad-headers.md', `# Title

### Skipped Level

##### Too Deep
`);

      const result = await validator.validateDocumentation(testDir);
      
      const hierarchyIssue = result.files[0].issues.find(i => 
        i.message.includes('Header level jumped')
      );
      expect(hierarchyIssue).toBeDefined();
    });

    it('should validate code blocks', async () => {
      await createDoc('code-examples.md', `# Examples

\`\`\`
// No language specified
console.log('hello');
\`\`\`

\`\`\`javascript
// Proper code block
console.log('world');
\`\`\`
`);

      const result = await validator.validateDocumentation(testDir);
      
      const codeIssue = result.files[0].issues.find(i => 
        i.message.includes('Code block without language')
      );
      expect(codeIssue).toBeDefined();
      expect(codeIssue?.severity).toBe('low');
    });
  });

  describe('Security Validation', () => {
    it('should detect potential secrets', async () => {
      await createDoc('config.md', `# Configuration

Set your API key:

\`\`\`
API_KEY="sk_test_EXAMPLE_KEY_DO_NOT_USE"
SECRET="EXAMPLE_SECRET_DO_NOT_USE"
\`\`\`
`);

      const result = await validator.validateDocumentation(testDir);
      
      const secretIssues = result.files[0].issues.filter(i => 
        i.type === 'security' && i.message.includes('secret')
      );
      expect(secretIssues.length).toBeGreaterThan(0);
      expect(secretIssues[0].severity).toBe('critical');
    });

    it('should detect PII', async () => {
      await createDoc('example.md', `# Example

Contact John Doe at john.doe@example.com or 555-123-4567.
`);

      const result = await validator.validateDocumentation(testDir);
      
      const piiIssues = result.files[0].issues.filter(i => 
        i.type === 'security' && i.message.includes('PII')
      );
      expect(piiIssues.length).toBe(2); // Email and phone
    });

    it('should detect malicious code patterns', async () => {
      await createDoc('dangerous.md', `# Dangerous Examples

\`\`\`javascript
// This is bad
eval(userInput);
document.write('<script>' + data + '</script>');
require(\`\${userPath}/module\`);
\`\`\`
`);

      const result = await validator.validateDocumentation(testDir);
      
      const maliciousIssues = result.files[0].issues.filter(i => 
        i.message.includes('malicious code')
      );
      expect(maliciousIssues.length).toBe(1);
      expect(maliciousIssues[0].severity).toBe('critical');
    });

    it('should check for insecure links', async () => {
      await createDoc('links.md', `# Resources

- [Example](http://example.com)
- [Shortened](https://bit.ly/abc123)
- [Secure](https://secure.example.com)
`);

      const result = await validator.validateDocumentation(testDir);
      
      const httpIssue = result.files[0].issues.find(i => 
        i.message.includes('Insecure HTTP link')
      );
      expect(httpIssue).toBeDefined();

      const shortenerIssue = result.files[0].issues.find(i => 
        i.message.includes('URL shortener')
      );
      expect(shortenerIssue).toBeDefined();
      expect(shortenerIssue?.severity).toBe('high');
    });
  });

  describe('Accessibility Validation', () => {
    it('should check for image alt text', async () => {
      await createDoc('images.md', `# Images

![](image1.png)
![Good alt text](image2.png)
<img src="image3.png">
<img src="image4.png" alt="Another good alt">
`);

      const result = await validator.validateDocumentation(testDir);
      
      const altIssues = result.files[0].issues.filter(i => 
        i.type === 'accessibility' && i.message.includes('alt text')
      );
      expect(altIssues).toHaveLength(2); // Two images without alt text
    });
  });

  describe('Content Validation', () => {
    it('should check document length', async () => {
      await createDoc('short.md', '# Title\n\nToo short.');

      const result = await validator.validateDocumentation(testDir, {
        minWordCount: 50
      });
      
      const lengthIssue = result.files[0].issues.find(i => 
        i.message.includes('Document too short')
      );
      expect(lengthIssue).toBeDefined();
    });

    it('should require examples in API docs', async () => {
      await createDoc('api-reference.md', `# API Reference

## Functions

### calculate(a, b)

Calculates the sum of two numbers.

Parameters:
- a: First number
- b: Second number

Returns: The sum
`);

      const result = await validator.validateDocumentation(testDir);
      
      const exampleIssue = result.files[0].issues.find(i => 
        i.message.includes('without code examples')
      );
      expect(exampleIssue).toBeDefined();
    });
  });

  describe('Coverage Calculation', () => {
    it('should calculate documentation coverage', async () => {
      // Create some standard files
      await createDoc('README.md', '# Project');
      await createDoc('LICENSE', 'MIT License');
      await createDoc('CONTRIBUTING.md', '# Contributing');

      const result = await validator.validateDocumentation(testDir);
      
      expect(result.summary.coverage).toBe(50); // 3 out of 6 expected files
    });
  });

  describe('Custom Rules', () => {
    it('should apply custom validation rules', async () => {
      await createDoc('custom.md', '# Custom Doc');

      const result = await validator.validateDocumentation(testDir, {
        requireTableOfContents: false,
        minWordCount: 10,
        maxWordCount: 20,
        checkForSecrets: false
      });
      
      // Should not have TOC issue
      const tocIssue = result.files[0].issues.find(i => 
        i.message.includes('table of contents')
      );
      expect(tocIssue).toBeUndefined();
    });
  });

  describe('Report Generation', () => {
    it('should generate validation report', async () => {
      await createDoc('test.md', `# Test

API_KEY="secret123"

![](no-alt.png)
`);

      const result = await validator.validateDocumentation(testDir);
      const report = validator.generateValidationReport(result);

      expect(report).toContain('Documentation Validation Report');
      expect(report).toContain('Critical Issues');
      expect(report).toContain('secret detected');
      expect(report).toContain('Recommendations');
    });
  });

  describe('File Discovery', () => {
    it('should find documentation files recursively', async () => {
      await createDoc('README.md', '# Root');
      await createDoc('docs/api.md', '# API');
      await createDoc('docs/guides/getting-started.md', '# Getting Started');
      await createDoc('CHANGELOG.md', '# Changelog');
      await createDoc('src/code.js', '// Not a doc file');

      const result = await validator.validateDocumentation(testDir);
      
      expect(result.summary.totalFiles).toBe(4); // Only .md files
      expect(result.files.map(f => f.path)).toContain(
        expect.stringContaining('getting-started.md')
      );
    });
  });
});