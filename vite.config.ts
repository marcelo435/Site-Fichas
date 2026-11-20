import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // O Three.js (fundo 3D) é grande, mas carrega separado e depois da página.
  build: { chunkSizeWarningLimit: 800 },
});
