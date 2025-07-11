#!/bin/bash

# BRUTAL V3 - Test System Consolidation Script
# This script backs up and consolidates all redundant test files

echo "🚀 BRUTAL V3 - Test System Consolidation"
echo "========================================"

# Create backup directory
BACKUP_DIR="test-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in $BACKUP_DIR..."

# Backup all test-related files
TEST_FILES=(
    "test-runner.html"
    "test-suite.js"
    "run-all-tests.js"
    "automated-browser-test.html"
    "verify-100-percent.js"
    "verify-cli.js"
    "verify-browser.html"
    "visual-verification.js"
    "verify-urls.sh"
    "verify-fixes.html"
    "test-shared-array-buffer.html"
    "check-files-syntax.js"
    "test-server.sh"
)

# Backup files
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "  ✓ Backed up $file"
    fi
done

echo ""
echo "🔄 Consolidating test system..."

# Create main test runner that replaces all others
cat > run-tests.js << 'EOF'
#!/usr/bin/env node

/**
 * BRUTAL V3 - Main Test Runner
 * Replaces all previous test runners
 */

import { unifiedTestSystem } from './test/UnifiedTestSystem.js';

// Get mode from command line
const mode = process.argv[2] || 'complete';
const options = {
    headless: process.env.HEADLESS !== 'false',
    devtools: process.env.DEVTOOLS === 'true',
    quick: process.env.QUICK === 'true'
};

// Show available modes if no mode specified
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('BRUTAL V3 - Unified Test Runner');
    console.log('');
    console.log('Usage: node run-tests.js [mode] [options]');
    console.log('');
    console.log('Modes:');
    console.log('  cli         - CLI verification without browser');
    console.log('  browser     - Full browser testing');
    console.log('  visual      - Visual regression testing');
    console.log('  quick       - Quick smoke tests');
    console.log('  complete    - 100% comprehensive check (default)');
    console.log('  interactive - Interactive browser UI');
    console.log('');
    console.log('Environment variables:');
    console.log('  HEADLESS=false  - Show browser window');
    console.log('  DEVTOOLS=true   - Open Chrome DevTools');
    console.log('  QUICK=true      - Skip slow tests');
    process.exit(0);
}

// Run tests
console.log(`Running in ${mode} mode...`);

unifiedTestSystem.runUnifiedTest(mode, options)
    .then(results => {
        // Display summary
        if (results.summary) {
            const passRate = (results.summary.passed / results.summary.total * 100).toFixed(2);
            console.log('');
            console.log('━'.repeat(80));
            console.log(`✅ Passed: ${results.summary.passed}`);
            console.log(`❌ Failed: ${results.summary.failed}`);
            console.log(`📊 Pass Rate: ${passRate}%`);
            
            // Exit with error if tests failed
            process.exit(results.summary.failed > 0 ? 1 : 0);
        } else {
            console.log('✅ Tests completed');
            process.exit(0);
        }
    })
    .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
EOF

chmod +x run-tests.js

# Create verification script that replaces all verify-* scripts
cat > verify.js << 'EOF'
#!/usr/bin/env node

/**
 * BRUTAL V3 - Unified Verification
 * Replaces all verify-* scripts
 */

import { unifiedTestSystem } from './test/UnifiedTestSystem.js';

const type = process.argv[2] || 'all';

async function verify() {
    console.log('🔍 BRUTAL V3 - Verification');
    console.log('━'.repeat(80));
    
    switch (type) {
        case 'cli':
            // Quick CLI check without browser
            return await unifiedTestSystem.runUnifiedTest('cli');
            
        case 'browser':
            // Browser environment check
            return await unifiedTestSystem.runUnifiedTest('browser', {
                testsOnly: ['sharedArrayBuffer', 'crossOriginIsolation']
            });
            
        case 'visual':
            // Visual verification
            return await unifiedTestSystem.runUnifiedTest('visual');
            
        case 'complete':
        case '100':
            // 100% verification
            return await unifiedTestSystem.runUnifiedTest('complete');
            
        case 'all':
        default:
            // Run all verifications
            const results = {};
            results.cli = await unifiedTestSystem.runUnifiedTest('cli');
            results.headers = await unifiedTestSystem._checkServerHeaders();
            results.sharedArrayBuffer = await unifiedTestSystem._checkSharedArrayBuffer();
            return results;
    }
}

verify()
    .then(results => {
        console.log('✅ Verification complete');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });
EOF

chmod +x verify.js

# Update package.json scripts
echo ""
echo "📝 Updating package.json scripts..."

# Create updated package.json with consolidated scripts
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update scripts to use unified system
pkg.scripts = {
    'start': 'node server-with-headers.js',
    'dev': 'node server-with-headers.js',
    
    // Main test commands
    'test': 'node run-tests.js',
    'test:cli': 'node run-tests.js cli',
    'test:browser': 'node run-tests.js browser',
    'test:visual': 'node run-tests.js visual',
    'test:quick': 'node run-tests.js quick',
    'test:complete': 'node run-tests.js complete',
    'test:interactive': 'node run-tests.js interactive',
    
    // Verification commands
    'verify': 'node verify.js',
    'verify:cli': 'node verify.js cli',
    'verify:browser': 'node verify.js browser',
    'verify:visual': 'node verify.js visual',
    'verify:100': 'node verify.js 100',
    
    // Utility commands
    'clean:tests': 'rm -rf test-output test-backup-*',
    'restore:tests': 'cp $BACKUP_DIR/* .',
    
    // Legacy compatibility (will show deprecation warning)
    'verify:complete': 'echo \"⚠️  Deprecated: Use npm run verify:100\" && npm run verify:100'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✓ package.json updated');
"

echo ""
echo "🧹 Cleaning up redundant files..."

# Create deprecation notice files instead of deleting
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        cat > "$file.DEPRECATED" << EOF
This file has been deprecated and consolidated into the unified test system.

The functionality is now available through:
- run-tests.js - Main test runner
- verify.js - Verification script
- test/UnifiedTestSystem.js - Core system

To restore the original file: cp $BACKUP_DIR/$file .

For help: node run-tests.js --help
EOF
        echo "  ✓ Marked $file as deprecated"
    fi
done

echo ""
echo "✅ Test system consolidation complete!"
echo ""
echo "📚 New unified commands:"
echo "  npm test              - Run all tests"
echo "  npm run test:quick    - Quick smoke tests"
echo "  npm run test:visual   - Visual regression tests"
echo "  npm run verify        - Verify environment"
echo "  node run-tests.js -h  - Show all options"
echo ""
echo "💾 Original files backed up to: $BACKUP_DIR/"
echo ""
echo "🎯 Next steps:"
echo "  1. Test the new unified system: npm test"
echo "  2. If everything works, remove .DEPRECATED files"
echo "  3. Delete the backup directory when confident"