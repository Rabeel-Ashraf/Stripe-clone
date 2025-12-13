// Optional: Add any global test setup here
// This file runs before each test file

// Set up global test environment
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}
