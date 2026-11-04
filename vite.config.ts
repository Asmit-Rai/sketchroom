import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    setupFiles: ['tests/setup.ts'],
    // Node 22+ has its own localStorage global, which hides the jsdom one in tests
    execArgv: process.allowedNodeEnvironmentFlags.has('--experimental-webstorage')
      ? ['--no-experimental-webstorage']
      : [],
  },
});
