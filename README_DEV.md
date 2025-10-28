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

🧩 Felleskomponent: HelpPanel

Formål:
HelpPanel gir en lettvekts, høyrejustert hjelpeside som kan åpnes direkte i appen uten å forstyrre arbeidet. Den brukes for å vise brukerhjelp, tastatursnarveier, funksjonsforklaringer og tips – hentet fra help.md i public-mappen.

📁 Filstruktur
/src/components/HelpPanel.tsx   ← selve komponenten
/public/help.md                 ← markdown-fil med hjelpetekst


help.md inneholder teksten som vises i appen (samme innhold som README_USER.md, men uten repo-metadata).
Markdownen gjengis med vår interne parser uten eksterne biblioteker.

⚙️ Bruk
import HelpPanel from "@/components/HelpPanel";

const [helpOpen, setHelpOpen] = useState(false);

<button onClick={() => setHelpOpen(true)}>Hjelp</button>

<HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

🧠 Teknisk virkemåte

Innhold lastes fra public/help.md via:

const url = new URL("help.md", document.baseURI).toString();
fetch(url)


Dette fungerer både lokalt (Vite dev server) og på GitHub Pages.

Parseren støtter:

#, ##, ### for overskrifter

- punktlister

Enkle tabeller (| Header | Header |)

Avsnitt og linjeskift

🎨 Styling

CSS ligger i index.css under:

/* ==== [BLOCK: Help Panel Markdown Styling] BEGIN ==== */


Denne definerer utseende på headings, lister og tabeller i panelet, samt bakgrunn og fargekontraster som passer mørk layout.

🔁 Gjenbruk

Ved opprettelse av ny app i Manage-serien:

Kopier HelpPanel.tsx og de relevante CSS-blokkene fra eksisterende app.

Opprett public/help.md med app-spesifikk hjelpetekst.

Importer komponenten og koble den til hovedverktøylinjen (Hjelp-knapp).

Ingen justeringer i build-oppsett nødvendig.

© 2025 MorningCoffee Labs · Internal Development Notes
