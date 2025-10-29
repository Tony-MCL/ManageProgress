// vite.config.mjs
import { defineConfig } from "vite";

// NB: bytt til "/MangeProgress/" hvis repo-navnet ditt er det.
// Du skrev at repoet heter ManageProgress.
export default defineConfig({
  base: "/ManageProgress/",
  server: { port: 5173 },
  build: { outDir: "dist" }
});
