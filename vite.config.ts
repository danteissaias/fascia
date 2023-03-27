import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import paths from 'vite-tsconfig-paths';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  base: './',
  plugins: [react(), paths(), topLevelAwait()],
  build: { outDir: 'dist/app' },
});
