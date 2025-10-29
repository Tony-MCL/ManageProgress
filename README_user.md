# 📘 Progress LITE – Tabellbrukerhåndbok

Denne tabellen er kjernen i **Progress LITE** (fremdriftsplan-appen).  
Den fungerer omtrent som et forenklet Excel-ark og er laget for å være rask, stabil og enkel i bruk.

---

## 🔹 Grunnleggende navigasjon

| Handling | Tast / metode | Effekt |
|-----------|----------------|--------|
| Flytt markør mellom celler | Piltaster / Tab / Shift+Tab | Går til neste celle |
| Neste / forrige rad | Enter / Shift+Enter | Flytter ett steg opp/ned |
| Marker flere celler | Klikk og dra | Lager rektangulær markering |
| Fokuser hele innholdet i en celle | Ctrl/Cmd + A | Marker all tekst i cellen |
| Angre redigering | **Esc** | Tilbakestiller cellen til opprinnelig verdi |

---

## 🟩 Redigering av data

1. **Dobbeltklikk** eller **trykk Enter** på en celle for å skrive.  
2. Trykk **Enter** igjen for å lagre og gå til neste rad.  
3. **Klikk utenfor cellen** for å lagre endringen automatisk.

> ✏️ Alle celler støtter ren tekst.  
> Feltene **Start** og **Slutt** kan skrives inn som dato (YYYY-MM-DD), og appen beregner automatisk **Varighet**.

---

## 🟨 Kopier og lim inn

| Handling | Tast / metode | Effekt |
|-----------|----------------|--------|
| Kopier markert område | Ctrl/Cmd + C | Kopierer som tab-separert tekst (kan limes i Excel) |
| Lim inn | Ctrl/Cmd + V | Limer inn fra Excel/CSV og utvider tabellen ved behov |
| Slett innhold | Delete / Backspace | Tømmer verdiene i markert område |

> 📋 Klipp ut (Ctrl+X) er ikke støttet i LITE-versjonen – bruk kopier + slett.

---

## 🟦 Rader

| Handling | Tast / metode | Effekt |
|-----------|----------------|--------|
| Ny rad under aktiv | Ctrl/Cmd + Enter | Setter inn en tom rad under aktiv |
| Slett aktiv rad | Ctrl/Cmd + Shift + Backspace | Fjerner raden permanent |
| Flytt rad | Dra i håndtaket `⋮⋮` i `#`-kolonnen | Endrer rekkefølge på rader |

> Rader nummereres automatisk.

---

## 🟪 Kolonner

| Handling | Metode | Effekt |
|-----------|---------|--------|
| Endre bredde | Dra i høyrekant av kolonneoverskrift | Endrer kun den kolonnen |
| Horisontal scroll | Scroll med Shift eller touchpad | Viser kolonner utenfor visning |

---

## ⚙️ Tilgjengelighet (A11y)

- Tabellen følger ARIA-standard (`role="grid"`)
- Skjermlesere får riktig kolonne- og radindeks
- Fokus og markering leses opp

---

## 🧭 Oversikt over feltene

| Kolonne | Beskrivelse |
|----------|-------------|
| **#** | Rekkefølgenummer (automatisk) |
| **Aktivitet** | Navn eller beskrivelse av oppgave |
| **Start** | Dato (YYYY-MM-DD) |
| **Slutt** | Dato (YYYY-MM-DD) |
| **Varighet** | Beregnes automatisk (inkl. start og slutt) |
| **Avhengighet** | Hvilke aktiviteter som må være fullført før denne |
| **Ansvarlig** | Navn eller initialer |
| **Farge** | Brukes senere for visuell markering i Gantt |
| **Kommentar** | Fri tekst |

---

## 💡 Tips

- Bruk **Tab** for å flytte mellom kolonner raskt.
- Hvis tabellen blir bredere enn skjermen, kan du **scrolle horisontalt**.
- Du kan **lime inn rett fra Excel**, også flere kolonner og rader.
- “Escape” (Esc) er din venn: trykk den hvis du begynner å skrive noe du angrer på.

---

**Versjon:** TableCore LITE 1.0  
**Sist oppdatert:** Oktober 2025  
