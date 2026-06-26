export default {
  testEnvironment: 'node',
  transform: {}, 
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', 
  },
  coveragePathIgnorePatterns: ['/node_modules/'],
};
