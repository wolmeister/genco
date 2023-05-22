import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
};

export default config;
