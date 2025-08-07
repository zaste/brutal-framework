export default {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.cjs'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};