/* ==== [BLOCK: Imports] BEGIN ==== */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
/* ==== [BLOCK: Imports] END ==== */

export default defineConfig({
  /* ==== [BLOCK: Vite Base for GitHub Pages] BEGIN ==== */
  base: "/ManageProgress/",
  /* ==== [BLOCK: Vite Base for GitHub Pages] END ==== */
  plugins: [react()]
});
