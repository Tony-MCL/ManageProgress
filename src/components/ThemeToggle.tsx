// src/components/ThemeToggle.tsx
import React, { useEffect, useState } from "react";

function getIsDark(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => getIsDark());

  const apply = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.setAttribute("data-theme", "dark");
      try { localStorage.setItem("mcl.theme", "dark"); } catch {}
    } else {
      html.removeAttribute("data-theme");
      try { localStorage.setItem("mcl.theme", "light"); } catch {}
    }
    setIsDark(dark);
  };

  // last lagret preferanse én gang (uten “auto”)
  useEffect(() => {
    const saved = localStorage.getItem("mcl.theme");
    if (saved === "dark") apply(true);
    else if (saved === "light") apply(false);
    else setIsDark(getIsDark()); // respekter evt. eksisterende attr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      title={isDark ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
      onClick={() => apply(!isDark)}
    >
      {isDark ? "🌙 Mørk" : "☀️ Lys"}
    </button>
  );
}
