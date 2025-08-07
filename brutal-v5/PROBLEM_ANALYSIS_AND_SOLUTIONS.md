# 🔍 Problem Analysis and Solutions

## 📊 Problem Summary

### Critical Issues (Blocking Development)
1. **ESM/CommonJS Mismatch** - All config files use CommonJS in ESM project
2. **TypeScript Build Error** - @brutal/templates has type error
3. **Missing Base tsconfig.json** - Root TypeScript config missing
4. **Jest Configuration** - Incompatible with ESM modules

### Major Issues (Affecting Quality)
5. **Incorrect tsconfig paths** - Wrong relative paths in some packages
6. **Missing Dependencies** - Some packages missing required deps
7. **Size Limit Configuration** - Missing preset dependencies

### Minor Issues (Warnings)
8. **TypeScript declarationDir** - Needs declaration: true
9. **Deprecated Dependencies** - ESLint 8.57.1 deprecated

## 🎯 Solution Plan (Priority Order)

### 1. Fix ESM/CommonJS Configuration
**Problem**: All .js config files use module.exports in ESM project
**Solution**: Convert all config files to .mjs or use ESM syntax

### 2. Create Base tsconfig.json
**Problem**: Missing root TypeScript configuration
**Solution**: Create comprehensive base config

### 3. Fix TypeScript Build Error
**Problem**: Type error in @brutal/templates
**Solution**: Add proper type guards or default values

### 4. Fix Jest for ESM
**Problem**: Jest doesn't support ESM by default
**Solution**: Use experimental ESM support or ts-jest

### 5. Fix Package Dependencies
**Problem**: Missing workspace dependencies
**Solution**: Add correct dependencies per dependency graph

### 6. Configure Size Limit
**Problem**: Missing size-limit presets
**Solution**: Install proper presets and configure

## 🛠️ Implementation Order

1. **Base Configuration** (Foundation for everything else)
   - Create tsconfig.json at root
   - Create jest.config.base.mjs
   - Create .eslintrc.base.cjs

2. **Package Configuration Updates**
   - Fix tsconfig extends paths
   - Convert jest.config.js to .mjs
   - Convert .eslintrc.js to .cjs

3. **Fix Code Issues**
   - Fix TypeScript error in templates
   - Add missing dependencies

4. **Quality Tools**
   - Configure size-limit properly
   - Update deprecated dependencies

## 📋 Expected Outcome

After applying these solutions:
- ✅ All packages build without errors
- ✅ Tests run successfully
- ✅ Linting works
- ✅ Type checking passes
- ✅ Size limits enforced
- ✅ Zero warnings in development