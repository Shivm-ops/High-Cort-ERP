import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    // Completely disable source maps so original source code is not exposed in DevTools
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        compact: true,
      },
    },
  },
  esbuild: {
    // Drop all console.* and debugger statements in production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));

