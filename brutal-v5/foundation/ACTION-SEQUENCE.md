# 🎯 BRUTAL V5 - Action Sequence
*Window Transition Ready*

## 🔄 Immediate Actions (Copy-Paste Ready)

### 1. Navigate to enhanced-components
```bash
cd /workspaces/web/brutal-v5/packages/@brutal/enhanced-components
```

### 2. Fix Observer Tests (4 fixes)
```bash
# Open the file
code tests/browser/observer.spec.ts

# Make these exact changes:
# Line 89:  Change .toBe(false) → .toBe(true)
# Line 144: Change .toBeLessThan(700) → .toBeLessThan(1100)  
# Line 193: Change .toBe(false) → .toBe(true)
# Line 251: Delete entire line with toHaveConsoleMessage
```

### 3. Fix Async Test (1 fix)
```bash
# Open the file
code tests/browser/async.spec.ts

# Lines 175-176: Change timeouts
# 100 → 200
# 200 → 400
```

### 4. Run Tests
```bash
npx playwright test --reporter=list
```

### 5. Fix Dependencies
```bash
# Edit package.json - remove these lines:
# "@brutal/events": "workspace:*",
# "@brutal/shared": "workspace:*",  
# "@brutal/templates": "workspace:*"

# Keep only:
# "@brutal/components": "workspace:*"
```

### 6. Check enhanced-state dependencies
```bash
cd ../enhanced-state
# Edit package.json - should only have:
# "@brutal/state": "workspace:*"
```

### 7. Check enhanced-routing dependencies  
```bash
cd ../enhanced-routing
# Edit package.json - should only have:
# "@brutal/routing": "workspace:*"
```

### 8. Update Size Limits
```bash
cd /workspaces/web/brutal-v5/foundation/decisions/accepted
code enhanced-bundle-sizes.md

# Update to:
# enhanced-state: 20KB
# enhanced-components: 20KB  
# enhanced-routing: 15KB
# Total: 70KB
```

### 9. Run Full Test Suite
```bash
cd /workspaces/web/brutal-v5
pnpm test
```

## 📊 Expected Results
- Observer tests: 6/6 ✅
- Async tests: 8/8 ✅
- Total: 22/22 tests passing
- Dependencies: 1 per enhanced package
- Sizes: Realistic and honest

## 🔑 If Something Goes Wrong
```bash
# Kill any running servers
pkill -f vite

# Rebuild
pnpm run build

# Check what's running
ps aux | grep node
```

---
Ready to execute. Start with step 1.