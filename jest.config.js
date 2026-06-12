module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  forceExit: true,
  clearMocks: true,
  verbose: true,
  setupFiles: ['dotenv/config'],
};
