// src/config/edition.ts
export type Edition = "lite" | "full";

function readFromUrl(): Edition | null {
  try {
    const u = new URL(window.location.href);
    const e = (u.searchParams.get("edition") || "").toLowerCase();
    if (e === "lite" || e === "full") return e as Edition;
    return null;
  } catch {
    return null;
  }
}

function readFromLocal(): Edition | null {
  try {
    const e = (localStorage.getItem("mp.edition") || "").toLowerCase();
    if (e === "lite" || e === "full") return e as Edition;
    return null;
  } catch {
    return null;
  }
}

function readFromEnv(): Edition {
  const v = (import.meta as any)?.env?.VITE_EDITION;
  return v === "full" ? "full" : "lite";
}

/** Best effort prioritet: URL > localStorage > build-env > default(lite) */
export function getEdition(): Edition {
  return readFromUrl() ?? readFromLocal() ?? readFromEnv() ?? "lite";
}

/** Valgfritt: endre edition i runtime (lagres lokalt for neste besøk) */
export function setEdition(e: Edition) {
  try { localStorage.setItem("mp.edition", e); } catch {}
}
