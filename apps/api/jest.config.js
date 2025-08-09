/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest'] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/src'],
};