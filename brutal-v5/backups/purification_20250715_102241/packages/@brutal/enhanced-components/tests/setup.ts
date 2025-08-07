// Test environment setup

// Mock performance.now
jest.spyOn(global.performance, 'now').mockImplementation(() => Date.now());

// Mock timers
jest.spyOn(global, 'setInterval');
jest.spyOn(global, 'clearInterval');
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearTimeout');

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
  jest.restoreAllMocks();
});
