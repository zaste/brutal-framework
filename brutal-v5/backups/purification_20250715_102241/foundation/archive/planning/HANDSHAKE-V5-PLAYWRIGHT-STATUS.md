# 🤝 BRUTAL V5 - Playwright Setup Status
*Updated: 2025-07-13*
*Context: Setting up Playwright for enhanced-components testing*

## 📊 Current Status

### ✅ Completed
1. **Playwright installed**: `@playwright/test` added to enhanced-components
2. **Browsers installed**: Chromium, Firefox, WebKit downloaded
3. **Test files created**:
   - `tests/browser/portal.spec.ts` - 7 tests for Portal component
   - `tests/browser/observer.spec.ts` - 6 tests for Observer components
   - `tests/browser/async.spec.ts` - 8 tests for AsyncComponent
4. **Server setup**:
   - `serve-enhanced.js` created with importmap support
   - `playwright.config.ts` configured for port 3334
5. **Dependencies built**:
   - `@brutal/components` ✅
   - `@brutal/events` ✅
   - `@brutal/shared` ✅
   - `@brutal/templates` ⚠️ (JS built, TS types failing)

### 🔴 Issues Found
1. **Module resolution**: Tests can't access `window.BrutalEnhanced`
   - Components import workspace dependencies that aren't resolved
   - Need proper module bundling or importmap setup
2. **Templates package**: TypeScript errors in type generation
   - `html.ts:71` - htmlEntities type issue
   - `template.ts:23,43,82` - undefined type issues
3. **System dependencies**: Missing libraries for full browser support
   - GTK, graphene, vpx, etc. (can use headless mode)

### 🎯 Next Steps
1. **Fix module resolution**:
   ```bash
   # Option 1: Bundle with dependencies
   cd /workspaces/web/brutal-v5/packages/@brutal/enhanced-components
   # Create a bundled version with all dependencies included
   
   # Option 2: Use Vite for test server
   pnpm add -D vite
   # Create vite.config.ts with proper alias resolution
   ```

2. **Fix templates TypeScript errors**:
   ```typescript
   // Add proper null checks in template.ts
   if (value !== undefined) {
     // process value
   }
   ```

3. **Run tests successfully**:
   ```bash
   # After fixing module resolution
   pnpm run test:playwright
   ```

### 📁 File Structure
```
enhanced-components/
├── playwright.config.ts (port 3334)
├── serve-enhanced.js (with importmap)
├── test-manual.html (for debugging)
├── tests/
│   └── browser/
│       ├── portal.spec.ts (7 tests)
│       ├── observer.spec.ts (6 tests)
│       └── async.spec.ts (8 tests)
└── dist/
    └── index.js (18.12KB, built)
```

### 💡 Key Learning
- JSDOM cannot properly test Custom Elements, Portals, Observers
- Playwright is the correct architectural choice for BRUTAL
- Module resolution in tests needs careful setup for workspace dependencies
- Bundle sizes after compression are much smaller (2.75KB vs 18.12KB raw)

### 🚨 Critical Path
The main blocker is module resolution. The components are built and tests are written, but the test environment can't load the modules properly due to workspace dependencies.

## Ready to Continue
All Playwright infrastructure is in place. Just need to fix module resolution to run the 21 browser tests successfully.