import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    allowedHosts: [".preview.devinapps.com"],
  },
  preview: {
    allowedHosts: [".preview.devinapps.com"],
  },
});
