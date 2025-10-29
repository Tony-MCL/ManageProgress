import { defineConfig } from "vite"

export default defineConfig({
  base: "/ManageProgress/",   // ← må matche repo-navnet nøyaktig
  server: { port: 5173 },
  build: { outDir: "dist" }
})
