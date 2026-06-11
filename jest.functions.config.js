module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/supabase/tests/functions-shared.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Deno-style '.ts' extension in import paths (e.g. './http.ts') triggers
        // TS5097 in the standard compiler. Disable diagnostics so ts-jest skips
        // type-checking and only transforms the code; Jest's module resolver
        // finds the file by exact path regardless.
        diagnostics: false,
        tsconfig: {
          module: 'CommonJS',
          esModuleInterop: true,
          strict: false,
          target: 'ES2020',
          lib: ['ES2020', 'DOM'],
        },
      },
    ],
  },
};
