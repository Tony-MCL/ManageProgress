/* ==== [BLOCK: Imports] BEGIN ==== */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
/* ==== [BLOCK: Imports] END ==== */

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
