// Test environment setup

// Polyfill for structuredClone (not available in Jest/Node < 17)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});
