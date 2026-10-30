/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

// Exercise calendar calculations across daylight-saving changes in every test run.
process.env.TZ = 'Europe/Rome'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/simple-setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})