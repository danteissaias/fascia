import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts', 'src/run.ts'],
  dts: true,
  splitting: false,
  minify: true,
  // Must be run before vite
  clean: true,
  treeshake: true,
  format: ['esm', 'cjs'],
});
