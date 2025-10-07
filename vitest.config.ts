import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config/index'),
      '@constants': path.resolve(__dirname, './src/constants/index'),
      '@app-types': path.resolve(__dirname, './src/types/index'),
      '@schemas': path.resolve(__dirname, './src/schemas/index'),
      '@services': path.resolve(__dirname, './src/services'),
      '@repositories': path.resolve(__dirname, './src/repositories'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@graphql': path.resolve(__dirname, './src/graphql'),
      '@utils': path.resolve(__dirname, './src/utils/index'),
    },
  },
});
