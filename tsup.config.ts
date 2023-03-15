import { defineConfig } from 'tsup';

export default defineConfig({
  clean: false,
  minify: true,
  dts: true,
  format: ['esm', 'cjs'],
});
