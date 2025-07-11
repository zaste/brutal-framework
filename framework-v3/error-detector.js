#!/usr/bin/env node

/**
 * Error Detector - Find all console errors in our pages
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function findHTMLFiles() {
    const files = await readdir('.');
    return files.filter(f => f.endsWith('.html'));
}

async function checkFile(filename) {
    const content = await readFile(filename, 'utf-8');
    const issues = [];
    
    // Check for common issues
    
    // 1. Missing imports
    const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            issues.push(`⚠️  Non-relative import: ${importPath}`);
        }
    }
    
    // 2. Missing DOM elements referenced
    const getElementRegex = /getElementById\(['"](.+?)['"]\)/g;
    while ((match = getElementRegex.exec(content)) !== null) {
        const id = match[1];
        if (!content.includes(`id="${id}"`) && !content.includes(`id='${id}'`)) {
            issues.push(`❌ Missing element with id: ${id}`);
        }
    }
    
    // 3. Event listeners on potentially null elements
    const queryRegex = /document\.querySelector\(['"](.+?)['"]\)\.addEventListener/g;
    while ((match = queryRegex.exec(content)) !== null) {
        issues.push(`⚠️  Unsafe querySelector: ${match[1]} - might be null`);
    }
    
    // 4. Check for undefined window properties
    const windowRegex = /window\.(\w+)/g;
    const knownGlobals = ['location', 'document', 'console', 'alert', '__BRUTAL__', '__BRUTAL_DEBUG__', 'addEventListener'];
    while ((match = windowRegex.exec(content)) !== null) {
        const prop = match[1];
        if (!knownGlobals.includes(prop) && !content.includes(`window.${prop} =`)) {
            issues.push(`❓ Potentially undefined: window.${prop}`);
        }
    }
    
    // 5. Check module exports/imports alignment
    if (content.includes('export') && !content.includes('type="module"')) {
        issues.push(`❌ ES modules used without type="module"`);
    }
    
    if (issues.length > 0) {
        issues.forEach(issue => );
    } else {
        }
    
    return { filename, issues };
}

async function main() {
    const htmlFiles = await findHTMLFiles();
    const results = [];
    
    for (const file of htmlFiles) {
        const result = await checkFile(file);
        results.push(result);
    }
    
    // Summary
    );
    const filesWithIssues = results.filter(r => r.issues.length > 0);
    
    if (filesWithIssues.length === 0) {
        } else {
        filesWithIssues.forEach(({ filename, issues }) => {
            });
    }
}

main().catch(console.error);