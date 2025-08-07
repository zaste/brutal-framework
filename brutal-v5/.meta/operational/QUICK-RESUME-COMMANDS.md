# 🚀 Quick Resume Commands - Coverage Fix

## Immediate Commands on Resume

```bash
# 1. Navigate to project
cd /workspaces/web/brutal-v5

# 2. Check exact coverage gaps
cd packages/@brutal/templates
pnpm test:coverage 2>&1 | grep -A5 "engine\|html\|template"

cd ../routing  
pnpm test:coverage 2>&1 | grep -A5 "route\|router"

# 3. See all branch coverage
cd /workspaces/web/brutal-v5
for pkg in templates routing; do 
  echo "=== @brutal/$pkg ==="
  cd "packages/@brutal/$pkg" 
  pnpm test:coverage 2>&1 | tail -20 | head -15
  cd /workspaces/web/brutal-v5
done
```

## Files to Edit

### @brutal/templates (83.87% → 95%)
1. `packages/@brutal/templates/src/engine/engine.test.ts`
   - Add test for undefined match groups
   
2. `packages/@brutal/templates/src/html/html.test.ts`
   - Add test for object serialization
   
3. `packages/@brutal/templates/src/template/template.test.ts`
   - Add test for unknown escape characters

### @brutal/routing (94.44% → 95%)  
1. `packages/@brutal/routing/src/route/route.test.ts`
   - Find the 0.56% missing branch
   
## Test Templates

```typescript
// For engine.ts undefined match
it('should handle regex with undefined capture groups', () => {
  const template = compile('${(missing)?}');
  expect(template.render({})).toBe('...');
});

// For html.ts object branch
it('should JSON.stringify non-array objects', () => {
  const date = new Date('2025-01-12');
  const result = html`<div data-date='${date}'></div>`;
  expect(result).toContain(JSON.stringify(date));
});

// For template.ts escape fallback
it('should pass through unknown characters in escapeHtml', () => {
  // Mock escapeHtml or test with character like \u0000
});

// For routing - check line 40 in route.ts
it('should handle empty match groups in params', () => {
  const route = new Route({ path: '/users/:id/:optional?' });
  // Test when optional is missing
});
```

## Verification

```bash
# After fixes, verify all packages
cd /workspaces/web/brutal-v5
pnpm test

# Check final coverage
for pkg in foundation shared events templates cache routing state components scheduling a11y plugins; do
  echo -n "@brutal/$pkg: "
  cd "packages/@brutal/$pkg"
  pnpm test:coverage 2>&1 | grep "All files" | head -1
  cd /workspaces/web/brutal-v5
done
```

---

**Goal**: Get @brutal/templates from 83.87% to 95% branches and @brutal/routing from 94.44% to 95% branches.