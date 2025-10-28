# Manage Progress – Dev Log / Kokebok

## 📦 Status per nå
**TableCore** er ferdigstilt og "låst" som felles tabellmotor for Progress-appen og fremtidige Manage-apper.  
Den gir Excel-følelse, med full støtte for:

- Multi-markering (Shift+klikk, drag)
- Kopier / lim inn (kompatibel med Excel)
- Rad- og kolonnerekkefølge via drag-and-drop
- Kolonne-resize direkte på kantlinjen
- Utskrift / PDF-eksport med automatisk format
- Horisontal scroll og faste kolonnebredder
- Ikke-markérbar `#`-kolonne med dynamisk synlighet
- Diskré, konsekvent mørk-modusdesign
- Global `body.dragging`-indikator med `cursor: grabbing`

TableCore er nå definert som **“stabil kjerne”**, og videreutvikling skjer kun dersom en funksjon må støtte hele Manage-systemet (ikke app-spesifikt).

---

## 🧱 Struktur

/src
├── components
│ ├── TableCore.tsx ← tabellmotor (låst)
│ ├── Toolbar.tsx ← verktøylinje (app-spesifikk)
│ └── App.tsx ← samler tabell + toolbar
├── index.css ← global stil inkl. TableCore-blocks
├── main.tsx / index.html ← Vite standard bootstrap
└── README_DEV.md / README_USER.md

yaml
Copy code

---

## 🧰 Tekniske detaljer

- Bygget med **React + TypeScript + Vite**
- Deploy via **GitHub Pages**
- Node 20 / TS target `es2021` / lib `es2021,dom`
- Ingen eksterne grid-biblioteker; alt håndskrevet og optimalisert for kontroll
- CSS følger “block markers” slik at store filer kan byttes ut blokkvis

---

## ⚙️ Interne prinsipper

| Område | Retningslinje |
|---------|----------------|
| **Design** | Nøytral mørk base, lav kontrast, ingen "bling" |
| **Input** | Alt skjer med standard HTML `<input>` for maksimal kontroll |
| **Respons** | Ingen automatisk wrapping, tabellen scroller horisontalt |
| **Utskrift** | Alt utenom tabellen skjules med `@media print` |
| **#-kolonne** | Ikke-redigerbar, fast bredde, ikke med i kopier/klipp |
| **Undo/Redo** | Rader støttes via `pushUndo()`, kolonner ikke (enda) |

---

## 🚀 Neste milepæl: App-nivå

Vi går nå fra **tabellmotor** → **app-spesifikke lag**:

1. **Progress UI**
   - Legge til topprad for prosjektnavn, dato, ansvarlig
   - Implementere Gantt-fanen (visualisering)
   - Bygge meny for eksport, tema og hjelp
2. **Dataflyt**
   - Midlertidig lagring i `localStorage`
   - Klargjøring for fremtidig Firestore-/Supabase-lagring
3. **UX**
   - Innføring av fargetema pr. ansvar
   - PDF-utskrift med firmalogo og watermark
   - Verktøytips (tooltip-system basert på README_USER.md)

---

## 📚 Videre bruk av denne README

Når du starter neste app (Estimate, Workflow, osv.),  
kopiér denne README_DEV.md som første instruks, slik at oppsett, arkitektur og konvensjoner arves 1-til-1.

---

© 2025 MorningCoffee Labs · Internal Development Notes
