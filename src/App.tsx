/* =========================================================================
   App-laget (Progress LITE) — Kolonnesett v1
   - Alle felt som ren tekst i TableCore.
   - App beregner "Varighet" (inkluderende dager) når Start/Slutt er ISO-datoer.
   - Kolonner: #, Aktivitet, Start, Slutt, Varighet, Avhengighet, Ansvarlig, Farge, Kommentar
   ========================================================================= */

/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo, useRef, useState } from "react";
import TableCore, { TableCoreRef, TableColumn, TableEvent } from "./core/TableCore";
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Columns Definition] BEGIN ==== */
const COLUMNS: TableColumn[] = [
  { key: "nr",           title: "#",                    width: 60,  minWidth: 50,  maxWidth: 100 },
  { key: "aktivitet",    title: "Aktivitet",            width: 260, minWidth: 140, maxWidth: 480 },
  { key: "start",        title: "Start (YYYY-MM-DD)",   width: 160, minWidth: 120, maxWidth: 220 },
  { key: "slutt",        title: "Slutt (YYYY-MM-DD)",   width: 160, minWidth: 120, maxWidth: 220 },
  { key: "varighet",     title: "Varighet (dager)",     width: 140, minWidth: 120, maxWidth: 200 },
  { key: "avhengighet",  title: "Avhengighet",          width: 140, minWidth: 120, maxWidth: 260 },
  { key: "ansvarlig",    title: "Ansvarlig",            width: 160, minWidth: 120, maxWidth: 240 },
  { key: "farge",        title: "Farge",                width: 120, minWidth: 100, maxWidth: 180 },
  { key: "kommentar",    title: "Kommentar",            width: 300, minWidth: 160, maxWidth: 800 }
];
/* ==== [BLOCK: Columns Definition] END ==== */

/* ==== [BLOCK: Initial Rows] BEGIN ==== */
const INITIAL: Record<string, string>[] = [
  { nr: "1", aktivitet: "Oppstart",     start: "2025-11-03", slutt: "2025-11-05", varighet: "", avhengighet: "", ansvarlig: "TM", farge: "#6aa9ff", kommentar: "" },
  { nr: "2", aktivitet: "Planlegging",  start: "2025-11-06", slutt: "2025-11-10", varighet: "", avhengighet: "1", ansvarlig: "PM", farge: "#a688ff", kommentar: "" },
  { nr: "3", aktivitet: "Utførelse",    start: "2025-11-11", slutt: "2025-11-20", varighet: "", avhengighet: "2", ansvarlig: "Team A", farge: "#7bd389", kommentar: "" }
];
/* ==== [BLOCK: Initial Rows] END ==== */

/* ==== [BLOCK: Helpers] BEGIN ==== */
function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function daysBetweenInclusive(a: string, b: string) {
  const d1 = new Date(a + "T00:00:00Z").getTime();
  const d2 = new Date(b + "T00:00:00Z").getTime();
  if (isNaN(d1) || isNaN(d2)) return "";
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1; // inklusiv
  return diff >= 0 ? String(diff) : "";
}
function applyDurations(rows: Record<string, string>[]) {
  return rows.map((r) => {
    const start = r.start ?? "";
    const slutt = r.slutt ?? "";
    const varighet = (isIsoDate(start) && isIsoDate(slutt)) ? daysBetweenInclusive(start, slutt) : "";
    return (varighet === (r.varighet ?? "")) ? r : { ...r, varighet };
  });
}
function renumber(rows: Record<string, string>[]) {
  return rows.map((r, i) => ({ ...r, nr: String(i + 1) }));
}
/* ==== [BLOCK: Helpers] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
export default function App() {
  const apiRef = useRef<TableCoreRef>(null);
  const [rows, setRows] = useState(() => renumber(applyDurations(INITIAL)));

  const onGridChange = (next: Record<string, string>[], evt: TableEvent) => {
    // Re-beregn varighet, og hold # sekvensen stram
    const withDur = applyDurations(next);
    const withNr = renumber(withDur);
    setRows(withNr);
    // evt.type kan brukes senere (resize-logging, osv.)
  };

  const addRow = () => {
    const next = [...rows, {
      nr: "", aktivitet: "", start: "", slutt: "", varighet: "",
      avhengighet: "", ansvarlig: "", farge: "", kommentar: ""
    }];
    setRows(renumber(next));
  };

  const deleteLast = () => {
    if (!rows.length) return;
    const next = rows.slice(0, -1);
    setRows(renumber(next));
  };

  return (
    <div className="app">
      <h1>Progress (LITE) – TableCore</h1>
      <div className="toolbar">
        <button onClick={addRow}>+ Legg til rad</button>
        <button onClick={deleteLast}>− Slett siste rad</button>
      </div>

      <TableCore
        ref={apiRef}
        columns={COLUMNS}
        rows={rows}
        onChange={onGridChange}
      />
    </div>
  );
}
/* ==== [BLOCK: Component] END ==== */
