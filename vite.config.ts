import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This ensures assets are loaded with relative paths
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
