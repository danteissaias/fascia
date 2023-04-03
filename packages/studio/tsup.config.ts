import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  clean: true,
  injectStyle: true,
  format: ["esm", "cjs"],
});
