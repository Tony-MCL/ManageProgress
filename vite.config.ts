// vite.config.ts
/* ==== [BLOCK: Imports] BEGIN ==== */
import { defineConfig } from "vite"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: BASE auto-detect] BEGIN ==== */
// Hvis vi bygger i GitHub Actions: bruk /<repo>/ som base for prosjekt-sider.
// Hvis ikke (lokalt eller custom domain): bruk "/".
const isCI = process.env.GITHUB_ACTIONS === "true"
const repo = process.env.GITHUB_REPOSITORY?.split("/")?.[1]
const BASE = isCI && repo ? `/${repo}/` : "/"
/* ==== [BLOCK: BASE auto-detect] END ==== */

export default defineConfig({
  base: BASE
})
