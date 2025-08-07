# BRUTAL Testing Philosophy

## Principle: Always Add Tests for Defensive Code

When achieving 100% code coverage, we follow this principle:

### ✅ DO: Add Tests for Defensive Code
- Defensive programming (edge cases, error handling) should be tested
- Even "unreachable" branches deserve tests to verify they work if conditions change
- Tests document the intended behavior of defensive code

### ❌ DON'T: Remove Defensive Code for Coverage
- Never remove safety checks just to achieve 100% coverage
- Defensive code protects against future changes and unexpected conditions
- Better to have tested defensive code than no defensive code

## Example

**Bad approach (removing defensive code):**
```typescript
// Before: Safe defensive check
const params = pathname ? route.extractParams(pathname) : {};

// After: Removed safety for coverage ❌
const params = route.extractParams(pathname);
```

**Good approach (testing defensive code):**
```typescript
// Keep the defensive check
const params = pathname ? route.extractParams(pathname) : {};

// Add a test for the edge case
it('should handle empty pathname', () => {
  const result = router.extractParams('', mockRoute);
  expect(result.params).toEqual({});
  expect(mockRoute.extractParams).not.toHaveBeenCalled();
});
```

## Benefits
1. **Robustness**: Code remains safe against edge cases
2. **Documentation**: Tests document why defensive code exists
3. **Future-proof**: Protected when code evolves
4. **Quality**: True 100% coverage, not artificial

Remember: The goal is not just high coverage numbers, but thoroughly tested, robust code.