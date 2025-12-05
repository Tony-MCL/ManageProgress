# MCL Standard Header v1.0

Dette dokumentet beskriver hvordan **MCL standard header** er satt opp i dette prosjektet,
og hvordan den kan gjenbrukes i andre Morning Coffee Labs-apper.

Målet er at alle apper skal ha:

- Samme logo- og brand-uttrykk
- Samme høyde og "glass"-følelse
- Støtte for lys/mørk modus via MCL-paletten
- Plass til språkvalg, tema-toggle og hjelpfunksjon

---

## 1. Komponenter som inngår

For å bruke headeren trenger du følgende filer:

- `src/components/Header.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/LangToggle.tsx`
- `src/i18n/index.ts`
- `src/styles/mcl-theme.css`
- `src/styles/header.css`

I tillegg må du ha en logo-fil:

- `src/assets/mcl-logo.png`  
  (kan byttes, men beholder samme navn for enklest mulig gjenbruk)

---

## 2. Hvordan headeren fungerer

### 2.1. Tema (lys / mørk)

Tema styres via en `data-theme`-attributt på `<html>`:

- Lys modus (default): `document.documentElement.dataset.theme` **ikke** satt
- Mørk modus: `document.documentElement.dataset.theme = "dark"`

`ThemeToggle.tsx` håndterer dette:

- Leser og lagrer valgt tema i `localStorage` under nøkkelen:
  - `mcl-progress-theme` (kan endres per app)
- Oppdaterer `document.documentElement.dataset.theme`

MCL-paletten (`mcl-theme.css`) definerer farger for:

- `:root { ... }` → lys modus
- `html[data-theme="dark"] { ... }` → mørk modus

Headeren bruker disse variablene:

- `--mcl-bg`, `--mcl-surface`, `--mcl-header`
- `--mcl-text`, `--mcl-muted`
- `--mcl-accent`, `--mcl-outline`
- `--elev-1` (skygge)

### 2.2. Språk (NO / EN)

`src/i18n/index.ts` gir:

- `I18nProvider` – legger språk og `t()`-funksjon på context
- `useI18n()` – hook for å hente `lang`, `setLang`, `t`

`LangToggle.tsx`:

- Leser og setter språk via `useI18n()`
- Lagrer valgt språk i `localStorage` (`mcl-progress-lang`)
- Viser knappene `NO` / `EN`, der aktiv knapp har egen bakgrunn

Headeren bruker `t()` for å oversette disse nøklene:

- `header.appName`
- `header.tagline`
- `header.help`

Hver app kan ha sitt eget sett med nøkler i `translations`-objektet i `i18n/index.ts`.

---

## 3. Layout og størrelser

Headeren i denne appen er definert i `src/styles/header.css`.

Viktige verdier:

- **Total headerhøyde (variant C)**:
  - `padding: 1.1rem 1.5rem` på `.mcl-header-inner`
  - Gir ca. **84 px** total høyde
- **Logo-høyde**:
  - `.mcl-logo-wrap { height: 68px; }`
  - På små skjermer:
    - `@media (max-width: 720px) { height: 52px; }`
- **Maks bredde**:
  - `max-width: 1120px;` i `.mcl-header-inner`
- **Posisjonering**:
  - Sticky på toppen: `position: sticky; top: 0; z-index: 40;`
  - Glass-effekt: `backdrop-filter: blur(16px);`

### 3.1. Farge- og bakgrunnslogikk

Lys modus:

```css
.mcl-header {
  background: linear-gradient(
    to bottom,
    rgba(215, 194, 168, 0.96),
    rgba(215, 194, 168, 0.84),
    rgba(215, 194, 168, 0.0)
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
Mørk modus:
html[data-theme="dark"] .mcl-header {
  background: linear-gradient(
    to bottom,
    rgba(15, 11, 9, 0.88),
    rgba(15, 11, 9, 0.72),
    transparent
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

Dette gir samme visuelle uttrykk som MCL-nettsiden (mørk header) og en
lys cappuccino-variant i lys modus.

4. Hvordan ta headeren i bruk i et nytt prosjekt
4.1. Kopier filer


Kopier følgende filer inn i nytt prosjekt (juster stier om nødvendig):


components/Header.tsx


components/ThemeToggle.tsx


components/LangToggle.tsx


i18n/index.ts


styles/mcl-theme.css


styles/header.css


assets/mcl-logo.png




Oppdater imports i Header.tsx hvis mappestruktur er annerledes.


4.2. Pakk inn appen i I18nProvider
I main.tsx (eller tilsvarende entry):
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);

4.3. Bruk headeren i App.tsx
import React, { useState } from "react";
import Header from "./components/Header";
import "./styles/mcl-theme.css";
import "./styles/header.css";

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="app-shell">
      <Header onToggleHelp={() => setHelpOpen(true)} />
      {/* resten av appen */}
    </div>
  );
}

Merk: onToggleHelp kan være en no-op hvis appen ikke har hjelpepanelet ennå.

5. Tilpasning per app
For en ny app trenger du typisk bare å:


Endre teksten i translations i i18n/index.ts:


header.appName


header.tagline




Eventuelt bytte logo-fil (mcl-logo.png).


Justere nøklene for help.* hvis hjelpetekstene skal være app-spesifikke.


Selve layouten og stilen bør ikke røres, slik at alle MCL-apper får
samme visuelle header-standard.

6. Versjon


Navn: MCL Standard Header


Versjon: v1.0 (variant C – app-optimalisert)


Brukes i: Manage Progress (TableCore-demo) og planlagte MCL-apper.



---

Når du har limt inn disse tre filene:

- `Header.tsx`
- `header.css`
- `HEADER-README.md`

…skal headeren se ut som en veldig nær tvilling av nettside-headeren i mørk modus, og samtidig fungere elegant i lys modus – og du har en dokumentert standard du kan gjenbruke i alle nye prosjekter.
