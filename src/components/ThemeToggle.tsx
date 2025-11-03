// src/components/ThemeToggle.tsx
import React, { useEffect, useState } from "react";

function isDarkNow(): boolean {
  const html = document.documentElement;
  return html.getAttribute("data-theme") === "dark" || html.classList.contains("dark");
}

function applyDark(dark: boolean) {
  const html = document.documentElement;
  const body = document.body;

  if (dark) {
    html.setAttribute("data-theme", "dark");
    html.classList.add("dark");
    body.setAttribute("data-theme", "dark");
    body.classList.add("dark");
    try { localStorage.setItem("mcl.theme", "dark"); } catch {}
  } else {
    html.removeAttribute("data-theme");
    html.classList.remove("dark");
    body.removeAttribute("data-theme");
    body.classList.remove("dark");
    try { localStorage.setItem("mcl.theme", "light"); } catch {}
  }

  // (valgfritt) tving lett repaint
  void html.offsetHeight; // no-op som sikrer reflow i noen nettlesere
}

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => isDarkNow());

  useEffect(() => {
    const saved = localStorage.getItem("mcl.theme");
    if (saved === "dark") { applyDark(true); setDark(true); }
    else if (saved === "light") { applyDark(false); setDark(false); }
    else { setDark(isDarkNow()); }
  }, []);

  return (
    <button
      title={dark ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
      onClick={() => { applyDark(!dark); setDark(!dark); }}
    >
      {dark ? "🌙 Mørk" : "☀️ Lys"}
    </button>
  );
}
