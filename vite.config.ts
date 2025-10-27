// vite.config.ts
/* ==== [BLOCK: Imports] BEGIN ==== */
import { defineConfig } from "vite"
import path from "node:path"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: BASE auto-detect] BEGIN ==== */
const isCI = process.env.GITHUB_ACTIONS === "true"
const repo = process.env.GITHUB_REPOSITORY?.split("/")?.[1]
const BASE = isCI && repo ? `/${repo}/` : "/"
/* ==== [BLOCK: BASE auto-detect] END ==== */

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
})
