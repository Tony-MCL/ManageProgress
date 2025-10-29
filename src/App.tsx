/* =========================================================================
   App-laget (Progress LITE)
   - Holder kolonner/rader (ren tekst)
   - Lytter på onChange fra TableCore
   - Beregner "Varighet" (tekstlig) når Start/Slutt er gyldige ISO-datoer
   - Knapp for å legge til/slette rader (App-styrt)
   ========================================================================= */

/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo, useRef, useState } from "react";
import TableCore, { TableCoreRef, TableColumn, TableEvent } from "./core/TableCore";
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Columns Definition] BEGIN ==== */
const COLUMNS: TableColumn[] = [
  { key: "id",      title: "ID",      width: 80,  minWidth: 60, maxWidth: 140 },
  { key: "navn",    title: "Navn",    width: 260, minWidth: 120, maxWidth: 420 },
  { key: "start",   title: "Start (YYYY-MM-DD)", width: 160 },
  { key: "slutt",   title: "Slutt (YYYY-MM-DD)", width: 160 },
  { key: "varighet",title: "Varighet (dager)", width: 140 },
  { key: "farge",   title: "Farge",   width: 120 }
];
/* ==== [BLOCK: Columns Definition] END ==== */

/* ==== [BLOCK: Initial Rows] BEGIN ==== */
const INITIAL: Record<string, string>[] = [
  { id: "1", navn: "Oppstart",        start: "2025-11-03", slutt: "2025-11-05", varighet: "", farge: "#6aa9ff" },
  { id: "2", navn: "Planlegging",     start: "2025-11-06", slutt: "2025-11-10", varighet: "", farge: "#a688ff" },
  { id: "3", navn: "Utførelse",       start: "2025-11-11", slutt: "2025-11-20", varighet: "", farge: "#7bd389" }
];
/* ==== [BLOCK: Initial Rows] END ==== */

/* ==== [BLOCK: Helpers] BEGIN ==== */
function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function daysBetween(a: string, b: string) {
  const d1 = new Date(a + "T00:00:00Z").getTime();
  const d2 = new Date(b + "T00:00:00Z").getTime();
  if (isNaN(d1) || isNaN(d2)) return "";
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1; // inklusiv
  return diff >= 0 ? String(diff) : "";
}
function applyDurations(rows: Record<string,string>[]) {
  return rows.map((r) => {
    const start = r.start ?? "";
    const slutt = r.slutt ?? "";
    const varighet = (isIsoDate(start) && isIsoDate(slutt)) ? daysBetween(start, slutt) : "";
    return (varighet === (r.varighet ?? "")) ? r : { ...r, varighet };
  });
}
/* ==== [BLOCK: Helpers] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
export default function App() {
  const apiRef = useRef<TableCoreRef>(null);
  const [rows, setRows] = useState(applyDurations(INITIAL));

  const onGridChange = (next: Record<string,string>[], evt: TableEvent) => {
    // Beregn varighet i App-laget
    const withDur = applyDurations(next);
    setRows(withDur);
    // evt kan brukes senere (integrasjon mot Gantt, logging, osv.)
    if (evt.type === "resize") {
      // kolonnebredde kan lagres i state / storage senere
    }
  };

  const addRow = () => {
    const next = [...rows];
    const nextId = String((rows.map(r => Number(r.id) || 0).reduce((a,b)=>Math.max(a,b),0) + 1));
    next.push({ id: nextId, navn: "", start: "", slutt: "", varighet: "", farge: "" });
    setRows(next);
  };

  const deleteLast = () => {
    if (!rows.length) return;
    const next = rows.slice(0, -1);
    setRows(next);
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
