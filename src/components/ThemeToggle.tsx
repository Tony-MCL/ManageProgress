// src/components/ThemeToggle.tsx
import React, { useEffect, useState } from "react";

function applyTheme(explicit: "light" | "dark") {
  const html = document.documentElement;
  const body = document.body;

  // nullstill begge retninger
  html.classList.remove("light", "dark");
  body.classList.remove("light", "dark");
  html.removeAttribute("data-theme");
  body.removeAttribute("data-theme");

  // sett eksplisitt valg
  html.classList.add(explicit);
  body.classList.add(explicit);
  html.setAttribute("data-theme", explicit);
  body.setAttribute("data-theme", explicit);

  try { localStorage.setItem("mcl.theme", explicit); } catch {}
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">(() =>
    (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    const saved = localStorage.getItem("mcl.theme") as "light" | "dark" | null;
    applyTheme(saved ?? "light");
    setMode(saved ?? "light");
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    applyTheme(next);
    setMode(next);
  };

  return (
    <button
      title={mode === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
      onClick={toggle}
    >
      {mode === "dark" ? "🌙 Mørk" : "☀️ Lys"}
    </button>
  );
}
