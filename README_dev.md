# ⚙️ TableCore – Developer Cookbook

Dette dokumentet er en *teknisk kokebok* for TableCore, tabellmotoren i **Progress LITE**.  
Den beskriver arkitektur, filstruktur, API og interne prinsipper slik at utviklere kan bygge videre uten å bryte stabilitet.

---

## 🧩 1. Arkitektur og filosofi

**TableCore** er designet som en nøytral grid-motor:
- Den **lagrer og rendrer tekst** i celler, men forstår ikke datatyper (dato, tall, farger osv.).
- Alt spesialisert logikk (beregning, validering, database, Gantt-kobling) ligger i app-laget.
- Kommunikasjon skjer kun via `onChange(nextRows, event)` og `ref.getData()/setData()`.

---

## 🗂️ 2. Filstruktur

src/
├─ core/
│ ├─ TableCore.tsx ← Grid-motoren
│ └─ (fremtidig: CellEditors/, Keyboard/, Utils/)
├─ App.tsx ← Demo / App-laget for Progress LITE
└─ styles.css ← Tabell- og layout-stil

yaml
Copy code

---

## 🧱 3. Interne byggeklosser

| Modul / blokk | Beskrivelse |
|----------------|-------------|
| **[BLOCK: Types]** | Definerer `TableColumn`, `TableEvent`, `TableCoreProps`, `TableCoreRef` |
| **[BLOCK: Helpers]** | Små hjelpefunksjoner (`clamp`, `splitClipboard`) |
| **[BLOCK: Component]** | Hele grid-motoren: state, events, rendering |
| **Colgroup renderer** | Holder piksel-presise kolonnebredder |
| **Header renderer** | Sticky overskrifter med resize-håndtak |
| **Body renderer** | contentEditable celler, selection, fokus |
| **Key handler** | Navigasjon, redigering, utvalg, hurtigtaster |
| **Drag handlers** | Kolonne-resize, rad-reorder |
| **ARIA** | Tilgjengelighetsstøtte (`role="grid"`, `aria-*`) |

---

## 🧠 4. Hendelser (API)

### `onChange(nextRows, event)`
Sendes ved:
- `type: "edit"` — én eller flere celler endret  
- `type: "paste"` — lim inn fra clipboard  
- `type: "resize"` — kolonnebredde endret  
- `type: "reorder-rows"` — rad flyttet  
*(Andre operasjoner som tømmer/legger til rader kalles også som “edit”.)*

### `ref`
- `getData()` – returnerer nåværende radsett  
- `setData(next)` – setter nytt datasett (trigger ikke re-render i TableCore)

---

## ⌨️ 5. Tastatursnarveier (Core)

| Taster | Handling |
|--------|-----------|
| Piltaster, Tab, Enter | Navigasjon mellom celler |
| Shift+Enter | Oppover |
| Esc | Tilbakestill celle til før redigering |
| Ctrl/Cmd+C | Kopier utvalg til utklippstavle |
| Ctrl/Cmd+V | Lim inn (Excel/CSV) |
| Delete / Backspace | Tøm innhold i markerte celler |
| Ctrl/Cmd+Enter | Sett inn rad under aktiv |
| Ctrl/Cmd+Shift+Backspace | Slett aktiv rad |

---

## 🧮 6. Dataflyt

Brukerinput → contentEditable cell → blur/onChange
↓
TableCore
↓
onChange(nextRows, evt)
↓
App-laget
↓
(beregninger, lagring)

yaml
Copy code

---

## 🎨 7. Design- og UX-retningslinjer

- Ingen visuelle “rammer” ved fokus – bruk bakgrunn (`var(--select)`).
- Ingen flex i celler (`display:block`) for caret-stabilitet.
- Sticky header, glidende scroll (native overflow).
- Håndtak (`⋮⋮`) i `#`-kolonnen for rad-flytting.
- Resize-håndtak (`│`) på høyrekant av header-celler.
- Horisontal scroll når tabellen blir bredere enn containeren.

---

## 🔒 8. Stabilitetskontrakt (for fremtidige versjoner)

Når TableCore er “låst”:
- Den skal **ikke ha intern datalogikk** (ingen beregninger).
- Den skal **ikke kjenne** Gantt, farger eller datoer.
- All utvidelse skjer via:
  - `onChange`
  - `onColumnsReorder` (senere)
  - props eller eksterne editor-komponenter

---

## 🧾 9. Fremtidige utvidelser (planlagt)

| Funksjon | Legges hvor |
|-----------|-------------|
| Kolonne-reordering | TableCore (UI) + App (kolonnerekkefølge) |
| Celle-editors (dato/farge/dropdown) | App-laget |
| Persistente bredder | App-laget (`localStorage`) |
| Sortering / filtrering | App-laget |
| Gantt-kobling | App-laget |
| PDF/Excel-eksport | Utenfor TableCore |
| Database-synk / backend | Utenfor TableCore |

---

## 📅 10. Versjonshistorikk

| Dato | Versjon | Endring |
|------|----------|---------|
| 2025-10-29 | v1.0 (LITE Core) | Første stabile TableCore med kopier, slett, radinn/ut, ARIA |
| 2025-10-30+ | v1.1 (Full) | Planlagt: kolonne-reorder, custom editors |

---

**Forfatter:** MorningCoffee Labs / ManageProgress  
**Kontakt:** Tony-MCL (GitHub)  
**Lisens:** Intern (brukes i Progress-plattformen)
