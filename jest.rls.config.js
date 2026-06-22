module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/supabase/tests/**/*.test.ts'],
  testTimeout: 30_000,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          esModuleInterop: true,
          strict: true,
          types: ['jest', 'node'],
          target: 'ES2020',
          lib: ['ES2020'],
        },
      },
    ],
  },
};
