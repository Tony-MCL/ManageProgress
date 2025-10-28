import React, { useEffect, useState } from "react"

type HelpPanelProps = {
  open: boolean
  onClose: () => void
}

// Enkel, intern markdown→HTML-parser med TS-typer
function renderMarkdown(md: string): string {
  // 1) Escape
  let html: string = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // 2) Headings
  html = html.replace(/^### (.*)$/gm, (_m: string, h3: string) => `<h3>${h3}</h3>`)
  html = html.replace(/^## (.*)$/gm, (_m: string, h2: string) => `<h2>${h2}</h2>`)
  html = html.replace(/^# (.*)$/gm, (_m: string, h1: string) => `<h1>${h1}</h1>`)

  // 3) List items
  html = html.replace(/^- +(.+)$/gm, (_m: string, item: string) => `<li>${item}</li>`)

  // 4) Group consecutive <li>...</li> into a single <ul>…</ul>
  html = html.replace(
    /(?:<li>[\s\S]*?<\/li>\s*)+/g,
    (m: string) => `<ul>${m.replace(/\s+$/g, "")}</ul>`
  )

  // 5) Very simple GitHub-style tables:
  // | H1 | H2 |
  // |----|----|
  // | c1 | c2 |
  html = html.replace(
    /^\|(.+)\|\n\|([-| :]+)\|\n([\s\S]*?)(?:\n{2,}|\n?$)/gm,
    (_m: string, header: string, _sep: string, body: string) => {
      const headers: string[] = header.split("|").map((h: string) => h.trim())
      const rows: string[] = body
        .trim()
        .split("\n")
        .filter((r: string) => r.trim().length > 0)

      const thead = `<thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join("")}</tr></thead>`
      const tbody = `<tbody>${rows
        .map((r: string) => {
          const cells: string[] = r.split("|").map((c: string) => c.trim())
          return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`
        })
        .join("")}</tbody>`

      return `<table>${thead}${tbody}</table>`
    }
  )

  // 6) Paragraphs (enkelt): del på blanklinjer
  const parts: string[] = html.split(/\n{2,}/).map((p: string) => p.trim()).filter(Boolean)
  html = parts.map((p: string) => {
    // ikke pakk tabeller/ul/headers i <p>
    if (/^(<h\d|<ul>|<table>)/.test(p)) return p
    return `<p>${p.replace(/\n/g, "<br>")}</p>`
  }).join("\n")

  return html
}

const HelpPanel: React.FC<HelpPanelProps> = ({ open, onClose }) => {
  const [content, setContent] = useState<string>("")

  # Manage Progress – Huskelapp / Hjelp

Denne filen brukes som grunnlag for hjelpepanelet i Manage Progress LITE.  
Alt innhold skal kunne vises som kort tekst i appen (tooltip, modal eller hjelpeside).

---

## 📑 Navigasjon og markering

| Handling | Beskrivelse |
|-----------|-------------|
| Klikk på celle | Velger cellen for redigering |
| **Shift + klikk** | Marker område mellom to celler |
| **Piltaster** | Flytt markering mellom celler |
| **Enter / Tab** | Gå til neste celle |
| **Ctrl + C / Ctrl + V** | Kopier / lim inn mellom Progress og Excel |
| **Ctrl + X** | Klipp ut valgt område |
| **Ctrl + Z / Ctrl + Y** | Angre / Gjenta |
| **Ctrl + Enter** | Legg til ny rad nederst |

---

## 🧱 Rader

| Handling | Beskrivelse |
|-----------|-------------|
| **➕ Ny rad** | Legger til en tom rad nederst |
| **🗑️ Slett valgt rad** | Fjerner raden der markøren står |
| **Dra i `#`-kolonnen** | Endre rekkefølge på rader |
| **Tall i `#`-kolonnen** | Vises kun når raden inneholder data |
| **Radnummerering** | Tas med på utskrift, men ikke ved kopiering |

---

## 📊 Kolonner

| Handling | Beskrivelse |
|-----------|-------------|
| **Dra i kolonnenavn** | Flytt kolonne til ny plassering |
| **Dra i høyrekant av kolonnenavn** | Endre kolonnebredde |
| **Kolonnebredde** | Kan være svært smal, tabellen får horisontal scroll |
| **#-kolonne** | Fast bredde, ikke redigerbar og ikke flyttbar |

---

## 🖨️ Utskrift og eksport

| Handling | Beskrivelse |
|-----------|-------------|
| **🖨️ Skriv ut / PDF** | Åpner utskriftsdialog, klar for PDF |
| **CSV-eksport** | Ikke tilgjengelig i LITE-versjonen |
| **Lagring** | Ikke tilgjengelig i LITE-versjonen |

---

## 🎨 Brukeropplevelse

| Element | Beskrivelse |
|----------|-------------|
| **Mørkt tema** | Designet for lav kontrast og rolige overganger |
| **Hover / markering** | Diskret og uten sterke farger |
| **Pekeren** | Viser “grabbing” under flytting av rader eller kolonner |
| **Skjermtilpasning** | Tabellen kan overskride skjermbredden (scroll horisontalt) |

---

## 🔜 Kommer i neste versjon

- Lagring og gjenåpning av planer  
- CSV-eksport  
- Gantt-visning med farger per ansvar  
- Firmalogo i utskrift  
- Skytilkobling (Firestore / Supabase)

---

© 2025 MorningCoffee Labs – For bruk i Manage Progress LITE

  return (
    <div className={`help-panel ${open ? "open" : ""}`}>
      <div className="help-header">
        <h2>Hjelp</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div
        className="help-body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

export default HelpPanel
