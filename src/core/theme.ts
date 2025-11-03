// src/core/theme.ts
type ThemePref = "auto" | "light" | "dark";
const KEY = "mcl.theme";

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement; // <html>
  if (pref === "auto") {
    root.removeAttribute("data-theme");  // lar CSS + prefers-color-scheme styre
  } else {
    root.setAttribute("data-theme", pref); // 'light' eller 'dark'
  }
  try { localStorage.setItem(KEY, pref); } catch {}
}

export function initTheme() {
  // 1) les lagret
  let pref = (localStorage.getItem(KEY) as ThemePref) || "auto";
  // 2) bruk
  applyTheme(pref);

  // 3) Hvis auto: lytt på systemendringer og re-apply (valgfritt)
  if (pref === "auto" && window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      // Vi trigger reflow ved å fjerne/ikke røre data-theme (forblir uten attr)
      // CSS-blokka håndterer verdiene automatisk.
      applyTheme("auto");
    };
    mq.addEventListener?.("change", onChange);
  }
}
