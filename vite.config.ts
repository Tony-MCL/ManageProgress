import { defineConfig } from "vite"

export default defineConfig({
  base: "/MangeProgress/",         // ← VIKTIG for GitHub Pages (repo-navn)
  server: { port: 5173 },
  build: { outDir: "dist" }
})
