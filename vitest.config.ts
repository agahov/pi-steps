import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'games/**/*.test.ts', 'prototypes/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
