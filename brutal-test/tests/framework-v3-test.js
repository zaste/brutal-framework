/**
 * BRUTAL Test Suite for Framework V3
 * Comprehensive testing with zero mercy
 */

import { TestEngine } from '../core/TestEngine.js';
import { BrowserController } from '../core/BrowserController.js';
import { EmbeddedServer } from '../core/EmbeddedServer.js';
import { ComponentValidator } from '../validators/component-validator.js';
import { FrameworkAlignmentValidator } from '../validators/framework-alignment.js';
import { ComponentFixer } from '../fix/component-fixer.js';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class FrameworkV3Test {
    constructor(config = {}) {
        this.config = {
            frameworkPath: './framework-v3',
            fix: false,
            headless: true,
            ...config
        };
        
        this.validator = new ComponentValidator();
        this.alignmentValidator = new FrameworkAlignmentValidator();
        this.fixer = new ComponentFixer();
        
        this.results = {
            validation: [],
            alignment: [],
            browserTests: [],
            performance: [],
            errors: []
        };
    }
    
    async run() {
        console.log('🔥 BRUTAL Framework V3 Test Suite 🔥\n');
        
        try {
            // Step 1: Validate all components
            await this.validateComponents();
            
            // Step 2: Check framework alignment
            await this.checkAlignment();
            
            // Step 3: Run browser tests
            await this.runBrowserTests();
            
            // Step 4: Performance tests
            await this.runPerformanceTests();
            
            // Step 5: Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            this.results.errors.push(error);
        }
    }
    
    async validateComponents() {
        console.log('📋 Validating components...');
        
        const componentsPath = join(this.config.frameworkPath, '04-components');
        const files = await this.findJSFiles(componentsPath);
        
        for (const file of files) {
            const content = await readFile(file, 'utf8');
            const issues = await this.validator.validateFile(file, content);
            
            if (issues.length > 0) {
                console.log(`❌ ${file.split('/').pop()}: ${issues.length} issues`);
                
                if (this.config.fix) {
                    const fixed = await this.fixer.fixContent(content, issues);
                    await writeFile(file, fixed);
                    console.log(`  ✅ Fixed automatically`);
                }
            } else {
                console.log(`✅ ${file.split('/').pop()}`);
            }
        }
        
        this.results.validation = this.validator.getResults();
    }
    
    async checkAlignment() {
        console.log('\n🔗 Checking framework alignment...');
        
        const componentFiles = await this.findJSFiles(
            join(this.config.frameworkPath, '04-components')
        );
        
        const alignmentResults = [];
        
        for (const file of componentFiles) {
            try {
                const module = await import('file://' + file);
                const ComponentClass = module.default || Object.values(module)[0];
                
                if (ComponentClass && typeof ComponentClass === 'function') {
                    const result = this.alignmentValidator.validateComponent(ComponentClass);
                    alignmentResults.push(result);
                    
                    if (result.failed.length > 0) {
                        console.log(`❌ ${ComponentClass.name}: ${result.failed.length} alignment issues`);
                    } else {
                        console.log(`✅ ${ComponentClass.name}: Perfectly aligned`);
                    }
                }
            } catch (error) {
                console.log(`⚠️  Cannot test ${file.split('/').pop()}: ${error.message}`);
            }
        }
        
        this.results.alignment = this.alignmentValidator.generateReport(alignmentResults);
    }
    
    async runBrowserTests() {
        console.log('\n🌐 Running browser tests...');
        
        const server = new EmbeddedServer();
        await server.start({ root: this.config.frameworkPath });
        
        const browser = new BrowserController({
            headless: this.config.headless,
            browser: 'chrome'
        });
        
        try {
            await browser.init();
            
            // Test framework loading
            console.log('  Testing framework modules...');
            const page = await browser.newPage();
            
            const testResults = await page.evaluate(async () => {
                const results = { passed: 0, failed: 0, errors: [] };
                
                try {
                    // Test core module
                    const core = await import('./01-core/index.js');
                    if (core.Component) results.passed++; 
                    else results.errors.push('Component not exported from core');
                    
                    // Test components
                    const components = await import('./04-components/index.js');
                    if (components.Toast) results.passed++;
                    else results.errors.push('Toast not exported from components');
                    
                    // Test creating a component
                    const testEl = document.createElement('div');
                    testEl.innerHTML = '<brutal-toast message="test"></brutal-toast>';
                    document.body.appendChild(testEl);
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const toast = testEl.querySelector('brutal-toast');
                    if (toast && toast.shadowRoot) results.passed++;
                    else results.errors.push('Toast component did not initialize');
                    
                } catch (error) {
                    results.errors.push(error.message);
                    results.failed++;
                }
                
                return results;
            });
            
            this.results.browserTests = testResults;
            
            console.log(`  ✅ Passed: ${testResults.passed}`);
            console.log(`  ❌ Failed: ${testResults.failed}`);
            
            if (testResults.errors.length > 0) {
                console.log('  Errors:');
                testResults.errors.forEach(err => console.log(`    - ${err}`));
            }
            
        } finally {
            await browser.close();
            await server.stop();
        }
    }
    
    async runPerformanceTests() {
        console.log('\n⚡ Running performance tests...');
        
        // Placeholder for performance tests
        console.log('  Performance testing not yet implemented');
        
        this.results.performance = {
            bundleSize: 'TBD',
            loadTime: 'TBD',
            renderSpeed: 'TBD'
        };
    }
    
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('BRUTAL TEST REPORT');
        console.log('='.repeat(60));
        
        console.log('\n📋 Validation Results:');
        console.log(`  Total files checked: ${this.results.validation.total || 0}`);
        console.log(`  Files with issues: ${this.results.validation.issues?.length || 0}`);
        
        console.log('\n🔗 Alignment Results:');
        if (this.results.alignment.summary) {
            console.log(`  Components tested: ${this.results.alignment.summary.total}`);
            console.log(`  Passed: ${this.results.alignment.summary.passed}`);
            console.log(`  Failed: ${this.results.alignment.summary.failed}`);
        }
        
        console.log('\n🌐 Browser Test Results:');
        if (this.results.browserTests.passed !== undefined) {
            console.log(`  Passed: ${this.results.browserTests.passed}`);
            console.log(`  Failed: ${this.results.browserTests.failed}`);
        }
        
        if (this.config.fix) {
            console.log('\n🔧 Auto-fixes Applied:');
            const fixReport = this.fixer.getReport();
            Object.entries(fixReport).forEach(([type, count]) => {
                if (count > 0) {
                    console.log(`  ${type}: ${count}`);
                }
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        const totalIssues = (this.results.validation.issues?.length || 0) + 
                          (this.results.alignment.summary?.failed || 0) +
                          (this.results.browserTests.failed || 0);
        
        if (totalIssues === 0) {
            console.log('✅ ALL TESTS PASSED - FRAMEWORK IS BRUTAL!');
        } else {
            console.log(`❌ ${totalIssues} ISSUES FOUND - FRAMEWORK NEEDS WORK`);
        }
    }
    
    async findJSFiles(dir) {
        const files = [];
        
        async function scan(currentDir) {
            const entries = await readdir(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = join(currentDir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    await scan(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        }
        
        await scan(dir);
        return files;
    }
}

// Export for use in main test system
export default FrameworkV3Test;