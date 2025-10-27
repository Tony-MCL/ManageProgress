# Manage Progress — Brukerens Kokebok (Huskelapp)

Denne filen fungerer som grunnlag for hjelpetekster, FAQ og tooltips i Progress-appen.  
Den skal beskrive hvordan brukeren **styrer tabellen**, **bruker hurtigtaster**, og **finner funksjoner i menyen**.

---

## 🧭 Navigasjon og Hoveddeler

- **Header:** viser appnavn og versjon (Progress LITE).
- **Verktøylinje (toolbar):**
  - ➕ **Ny rad** – legger til en ny aktivitet nederst.
  - 🗑️ **Slett valgt rad** – sletter raden du står i.
  - ⤓ **Eksporter CSV** – laster ned tabellen som `.csv`-fil.
- **Tabellen (TableCore):**
  - Hovedområdet der aktiviteter vises og redigeres.
  - Kolonner: Aktivitet, Start, Slutt, Varighet, Avhengigheter, Ansvar, Farge.
- **Footer:** viser app-versjon og informasjon.

---

## ⌨️ Tastatursnarveier

| Handling | Hurtigtast |
|-----------|-------------|
| Flytt opp/ned | ⬆️ / ⬇️ |
| Flytt til venstre/høyre | ⬅️ / ➡️ |
| Gå til neste celle | Tab |
| Start redigering i celle | Enter |
| Slett innhold | Delete |
| Kopier celle | Ctrl/Cmd + C |
| Klipp ut celle | Ctrl/Cmd + X |
| Lim inn (fra Excel, CSV osv.) | Ctrl/Cmd + V |
| Ny rad | (Bruk knapp eller Ctrl + Shift + N \[planlagt\]) |
| Lagre / eksporter | Bruk "Eksporter CSV" i menyen |

---

## 🖱️ Musehandlinger

| Handling | Beskrivelse |
|-----------|-------------|
| Klikk på celle | Marker celle |
| Dobbeltklikk / Enter | Start redigering |
| Klikk og dra (planlagt i v0.2) | Marker flere celler |
| Høyreklikk (planlagt) | Åpner kontekstmeny |

---

## 🎨 Kolonnebeskrivelse

| Kolonne | Beskrivelse |
|----------|-------------|
| **Aktivitet** | Navnet på oppgaven |
| **Start** | Startdato (kalenderformat) |
| **Slutt** | Sluttdato (kalenderformat) |
| **Varighet (d)** | Beregnes automatisk (inkl. sluttdag) |
| **Avhengigheter** | Angi ID-er for aktiviteter som må være ferdige først |
| **Ansvar** | Hvem som har ansvaret for oppgaven |
| **Farge** | Velg farge som styrer utseendet i Gantt-diagrammet |

---

## 📂 Eksport og import

- **Eksporter:** Klikk ⤓ Eksporter CSV for å laste ned plan som `.csv`.
- **Import (lim-inn):** Kopier data fra Excel og lim rett inn i tabellen.  
  Appen gjenkjenner automatisk komma-, semikolon- og tabulatorseparerte data.

---

## 🧱 Planlagte funksjoner (kommende versjoner)

- Multi-seleksjon (Shift + klikk / dra)
- Kolonnebredde-justering
- Undo/Redo
- Gantt-visning
- Print/PDF-eksport
- Temavelger (lys/mørk)
- Tooltips med disse hjelpetekstene

---

> ✨ Denne “kokeboken” blir til selve hjelpesystemet i Progress, og brukes for å bygge opp tooltips og hjelpesider i kommende versjoner.
