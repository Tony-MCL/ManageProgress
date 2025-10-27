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

