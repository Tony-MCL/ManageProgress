// src/components/ThemeToggle.tsx
import React, { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  // lagre valget i localStorage
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.setAttribute("data-theme", "dark");
      localStorage.setItem("mcl.theme", "dark");
    } else {
      html.removeAttribute("data-theme");
      localStorage.setItem("mcl.theme", "light");
    }
  }, [dark]);

  // last lagret preferanse ved start
  useEffect(() => {
    const saved = localStorage.getItem("mcl.theme");
    if (saved === "dark") setDark(true);
  }, []);

  return (
    <button
      title={dark ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
      onClick={() => setDark(!dark)}
      style={{
        fontSize: "16px",
        border: "1px solid var(--grid-border)",
        borderRadius: "8px",
        padding: "6px 10px",
        background: "var(--mcl-header)",
        color: "var(--button-text)",
        cursor: "pointer",
      }}
    >
      {dark ? "🌙 Mørk" : "☀️ Lys"}
    </button>
  );
}
