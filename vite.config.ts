import { defineConfig } from "vite"

// ==== [BLOCK: GitHub Pages base] BEGIN ====
// For GitHub Pages prosjekt-sider (user.github.io/REPO):
// 1) Sett base til `"/REPO/"`.
// 2) For custom domain eller user.github.io root: bruk "/".
// LITE nå: vi starter med "/" og kan endre senere når repo-navnet er klart.
const BASE = "/"
// ==== [BLOCK: GitHub Pages base] END ====

export default defineConfig({
  base: BASE
})
