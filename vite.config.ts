/* ==== [BLOCK: Imports] BEGIN ==== */
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
/* ==== [BLOCK: Imports] END ==== */

export default defineConfig({
  /* ==== [BLOCK: BasePath] BEGIN ==== */
  // Viktig for GitHub Pages (project pages). Endre om repo-navnet er annet.
  base: "/ManageProgress/",
  /* ==== [BLOCK: BasePath] END ==== */
  plugins: [react()],
  build: { target: "es2020" }
})
