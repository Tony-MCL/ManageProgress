# Manage Progress — Utviklerkokebok (Internt)

Dette dokumentet fungerer som **internt design- og historienotat** for Progress-appen.  
Det beskriver hva vi har gjort, hvorfor, og hvordan prosjektet er strukturert.  
Når nye Manage-apper skal bygges, kan denne README kopieres som første instruksjon.

---

## ☕ Konsept og filosofi

**Progress** er den første appen i *Manage*-systemet under *MorningCoffee Labs*.  
Alle Manage-appene skal føles som **samme produkt**, med samme visuelle stil, kodearkitektur og brukerlogikk.  
Forskjellen skal kun være *funksjonelt innhold* (f.eks. Progress = fremdrift, Estimates = kalkyle).

---

## ⚙️ Teknisk arkitektur

| Nivå | Beskrivelse |
|------|--------------|
| **Kjerne (TableCore)** | Egenbygd tabellmotor, Excel-lignende, reagerer på tastatur og musehandlinger. |
| **UI (Toolbar, Header, Footer)** | Enkle, stilrene komponenter som skal gjenbrukes på tvers av apper. |
| **Motor** | React + TypeScript + Vite (ES2021), ingen tredjeparts grid. |
| **Deploy** | GitHub Pages via Actions (`vite build → dist → deploy-pages`). |
| **Base-konfig** | Automatisk basepath for GitHub Pages, alias `@` → `src`. |

---

## 📂 Kodestruktur

src/
├─ components/
│ ├─ TableCore.tsx ← tabellmotor (grunnlaget for alle apper)
│ ├─ Toolbar.tsx ← knappelinje for handlinger
│ └─ ...
├─ core/
│ ├─ date.ts ← hjelpefunksjoner for dato
├─ types.ts ← felles typer
├─ App.tsx ← hovedkomponent (UI + table)
├─ index.css ← grunnstil (kaffe-tema)
├─ main.tsx ← oppstartspunkt

---

## 🧱 Design og fargepalett

- **Primærfarge:** kaffe-brun (`--accent: #7a4b2e`)
- **Sekundær:** mørk bakgrunn (`--panel`, `--panel-2`)
- **Tekst:** lys grå / hvit (`--text`, `--muted`)
- **Font:** system-ui sans-serif
- **Stil:** flate komponenter, myke hjørner, minimalisme
- **UI-filosofi:** Alt skal se ut som ett sammenhengende panel – ikke “kort + kort + kort”.

---

## 🧩 Funksjoner per versjon

### v0.1 – **LITE Start**
✅ Bygg og deploy via GitHub Pages  
✅ Funksjonell tabell (legg til/slett rader, rediger celler)  
✅ Lim-inn fra Excel/CSV  
✅ Automatisk varighet (Slutt - Start + 1)  
✅ Fargevalg i tabell  
✅ Eksporter CSV  
✅ Tastaturnavigasjon (piler, Enter, Tab, Delete)  
✅ Kaffe-palett & strukturert kodebase  

### v0.2 – **TableCore-forbedringer (pågående)**
🔹 Multi-seleksjon (Shift + piltaster / dra)  
🔹 Undo/Redo  
🔹 Kolonne-resize  
🔹 Drag-fyll og autofill  
🔹 Print/PDF-eksport  

### v0.3 – **Gantt & Rapport**
🔸 Gantt-view generert fra tabellen  
🔸 Fargekobling mot ansvar  
🔸 Utskrift og PDF-eksport av Gantt  

---

## 🧠 Gjenbruk i fremtidige apper

Alle Manage-appene skal bruke:
- **TableCore** som tabellmotor
- **ToolbarCore** (kommer)
- **Platform Shell** for navigasjon, språk og brukerprofiler

Målet er å lage et økosystem der hver app kan:
1. Kjøre alene (standalone)
2. Koble seg til systemmodus (multi-app hub)
3. Dele felles komponenter og stil

---

## 🚀 Deploy-oppsett (kortversjon)

- Actions workflow i `.github/workflows/deploy.yml`
- Automatisk `base` i `vite.config.ts`
- SPA fallback med `404.html`
- `.nojekyll` i rot
- Branch: `main`

---

## 💡 Retningslinjer for videre utvikling

1. **Alt som kan gjenbrukes → flytt til “core” eller “components”.**
2. **Alt skal være modulært.** Store filer deles opp i `[BLOCK:]`-bolker.
3. **Ingen snarveier.** Vi bygger kvalitet først, så ytelse.
4. **Visuell identitet skal være konsistent** mellom alle apper.
5. **Kode skal være “copy-paste-ready”** for bruk i GitHub – aldri avhengig av lokale justeringer.

---

> 🧾 *Denne README fungerer som “oppskriften” for nye Manage-prosjekter.*  
> Når du starter et nytt prosjekt (f.eks. *Manage Estimates*), kopier denne filen inn og oppdater navnene.
