module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/supabase/tests/**/*.test.ts'],
  testTimeout: 30_000,
  // Surface per-test failures as GitHub Actions annotations (readable via API
  // even when raw log download is restricted).
  reporters: ['default', 'github-actions'],
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
