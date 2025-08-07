# Broken Paths and References Analysis Report

Generated: 2025-07-11

## Executive Summary

After thorough analysis of the repository following the directory reorganization, I've identified several categories of broken paths and references that need attention.

## 1. Critical Issues Found

### 1.1 Test Suite Import References

**Location**: `/framework-v3/tests/*.js`
**Issue**: All test files are importing from `../test-suite.js` which doesn't exist at that location.

**Affected Files**:
- `/framework-v3/tests/01-test-component.js`
- `/framework-v3/tests/02-test-state.js`
- `/framework-v3/tests/03-test-router.js`
- `/framework-v3/tests/04-test-performance-gems.js`
- `/framework-v3/tests/05-test-visual-debug.js`

**Problem**: 
```javascript
import { TestRunner, assert, assertEquals, assertLessThan, benchmark } from '../test-suite.js';
```

**Reality**: The actual file is located at `/framework-v3/test/archived/test-suite.js`

**Fix Required**: Update all imports to:
```javascript
import { TestRunner, assert, assertEquals, assertLessThan, benchmark } from '../test/archived/test-suite.js';
```

### 1.2 Hardcoded Framework Path References

**Location**: `/brutal-test/` configuration and scripts
**Issue**: Several files have hardcoded references to `./framework-v3`

**Affected Files**:
- `/brutal-test/cli.js` (line 37): `.option('-p, --path <path>', 'Path to test', './framework-v3')`
- `/brutal-test/index.js` (line 110): `async run(testPath = './framework-v3')`
- `/brutal-test/config/brutal-test.config.js` (lines 7, 13): References to `./framework-v3`
- `/brutal-test/run-framework-v3-test.js` (line 22): `frameworkPath: '../framework-v3'`
- `/brutal-test/core/EmbeddedServer.js` (line 16): `root: config.root || path.resolve(__dirname, '../../framework-v3')`

### 1.3 Script References in brutal-test

**Location**: `/brutal-test/scripts/run-brutal-analysis.js`
**Issue**: Hardcoded paths to framework-v3 test files

```javascript
const targetPages = [
    'framework-v3/component-showcase.html',
    'framework-v3/test-modal.html',
    'framework-v3/final-test-all.html',
    // ... etc
];
```

### 1.4 Missing Import in brutal-test

**Location**: `/brutal-test/scripts/test-brutal-basic.js`
**Issue**: Incorrect import path
```javascript
import BrutalTestSystem from './brutal-test/index.js';
```
Should be:
```javascript
import BrutalTestSystem from '../index.js';
```

## 2. Configuration File Issues

### 2.1 Package.json Scripts

**Location**: `/package.json`
**Status**: ✅ CORRECT - Uses relative cd commands which work properly

### 2.2 Test Result Archives

**Location**: `/brutal-test/results/archives/*/report.json`
**Issue**: Contains historical references to framework-v3 paths in test results
**Impact**: Low - These are archived results and don't affect functionality

## 3. Documentation References

### 3.1 Architecture Documentation

**Location**: `/docs/architecture/CJS-TO-JS-MAPPING.md`
**Issue**: References to old `/framework/` structure that no longer exists
**Example**: `/framework/core/systems/state-manager.js`

### 3.2 Migration Scripts

**Location**: `/docs/legacy/migration/scripts/*.sh`
**Issue**: Contains references to old directory structures
**Impact**: Low - These are legacy migration scripts

## 4. No Issues Found In

### 4.1 Import/Export Statements
- ✅ No relative imports between moved files found
- ✅ No broken ES6 module imports detected

### 4.2 HTML Script References
- ✅ All HTML files use relative paths correctly
- ✅ No broken script src attributes found

### 4.3 Shell Scripts
- ✅ Active shell scripts use correct paths
- ✅ Only legacy migration scripts have old references

## 5. Recommendations

### 5.1 Immediate Actions Required

1. **Fix test suite imports** in all `/framework-v3/tests/*.js` files
2. **Update brutal-test configuration** to use absolute or configurable paths
3. **Fix the import** in `/brutal-test/scripts/test-brutal-basic.js`

### 5.2 Medium Priority

1. **Update documentation** in `/docs/architecture/` to reflect current structure
2. **Consider making paths configurable** in brutal-test system instead of hardcoded

### 5.3 Low Priority

1. **Archive or update** legacy migration scripts
2. **Clean up** old test result archives if not needed

## 6. Script to Fix Critical Issues

```bash
#!/bin/bash
# fix-broken-paths.sh

# Fix test suite imports
echo "Fixing test suite imports..."
for file in /workspaces/web/framework-v3/tests/*.js; do
    sed -i "s|from '../test-suite.js'|from '../test/archived/test-suite.js'|g" "$file"
done

# Fix brutal-test import
echo "Fixing brutal-test import..."
sed -i "s|from './brutal-test/index.js'|from '../index.js'|g" /workspaces/web/brutal-test/scripts/test-brutal-basic.js

echo "Critical fixes applied!"
```

## 7. Validation Commands

After fixes, run these commands to validate:

```bash
# Check for any remaining broken imports
grep -r "from ['\"]\.\..*test-suite" /workspaces/web/framework-v3/

# Test the brutal-test system
cd /workspaces/web
npm test

# Check syntax of all JavaScript files
find /workspaces/web/framework-v3 -name "*.js" -exec node --check {} \;
```

## 8. Summary

The reorganization was mostly successful, with only a few broken references identified:
- **5 test files** with incorrect import paths
- **6 configuration files** with hardcoded paths
- **1 script file** with incorrect import
- **Documentation files** with outdated references (low impact)

The fixes are straightforward and can be implemented quickly. The brutal-test system's hardcoded paths should ideally be made configurable for better maintainability.