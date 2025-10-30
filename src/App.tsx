/* =========================================================================
   App-laget (Progress LITE) – Tabell + Toolbar + Summary + Gantt
   - Alle felt i tabellen som ren tekst
   - App beregner "Varighet" inklusivt når Start/Slutt er ISO
   ========================================================================= */

/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useRef, useState } from "react";
import TableCore, { TableCoreRef, TableColumn, TableEvent } from "./core/TableCore";
import MainToolbar from "./components/MainToolbar";
import SummaryBar from "./components/SummaryBar";
import GanttLite from "./components/GanttLite";
import SplitOverlay from "./components/SplitOverlay";
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
  { nr: "1", aktivitet: "Oppstart",     start: "2025-11-03", slutt: "2025-11-05", varighet: "", avhengighet: "",  ansvarlig: "TM",     farge: "#6aa9ff", kommentar: "" },
  { nr: "2", aktivitet: "Planlegging",  start: "2025-11-06", slutt: "2025-11-10", varighet: "", avhengighet: "1", ansvarlig: "PM",     farge: "#a688ff", kommentar: "" },
  { nr: "3", aktivitet: "Utførelse",    start: "2025-11-11", slutt: "2025-11-20", varighet: "", avhengighet: "2", ansvarlig: "Team A", farge: "#7bd389", kommentar: "" }
];
/* ==== [BLOCK: Initial Rows] END ==== */

/* ==== [BLOCK: Helpers] BEGIN ==== */
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const daysBetweenIncl = (a: string, b: string) => {
  const d1 = new Date(a + "T00:00:00Z").getTime();
  const d2 = new Date(b + "T00:00:00Z").getTime();
  if (isNaN(d1) || isNaN(d2)) return "";
  const diff = Math.round((d2 - d1) / 86400000) + 1;
  return diff >= 0 ? String(diff) : "";
};
const applyDurations = (rows: Record<string, string>[]) =>
  rows.map((r) => {
    const s = r.start ?? "", e = r.slutt ?? "";
    const v = (isIsoDate(s) && isIsoDate(e)) ? daysBetweenIncl(s, e) : "";
    return v === (r.varighet ?? "") ? r : { ...r, varighet: v };
  });
const renumber = (rows: Record<string, string>[]) => rows.map((r, i) => ({ ...r, nr: String(i + 1) }));
/* ==== [BLOCK: Helpers] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
export default function App() {
  const apiRef = useRef<TableCoreRef>(null);
  const [rows, setRows] = useState(() => renumber(applyDurations(INITIAL)));

  const [pxPerDay, setPxPerDay] = useState<number>(20);
  const [showToday, setShowToday] = useState<boolean>(true);
  const [ganttPercent, setGanttPercent] = useState<number>(40); // 60/40 standard

  // Ribbon-panels
  const [fileOpen, setFileOpen] = useState(false);

  const onGridChange = (next: Record<string, string>[], evt: TableEvent) => {
    const withDur = applyDurations(next);
    const withNr = renumber(withDur);
    setRows(withNr);
  };

  const addRow = () => {
    const next = [...rows, { nr: "", aktivitet: "", start: "", slutt: "", varighet: "", avhengighet: "", ansvarlig: "", farge: "", kommentar: "" }];
    setRows(renumber(next));
  };
  const deleteLast = () => {
    if (!rows.length) return;
    const next = rows.slice(0, -1);
    setRows(renumber(next));
  };

  const handleClearTable = () => {
    const empty = [{ nr: "1", aktivitet: "", start: "", slutt: "", varighet: "", avhengighet: "", ansvarlig: "", farge: "", kommentar: "" }];
    setRows(empty);
  };

  // Utskrift via body-klasse
  const doPrint = (mode: "table" | "gantt" | "both") => {
    setFileOpen(false);

    const prev = ganttPercent;
    if (mode === "both" && (prev === 0 || prev === 100)) setGanttPercent(40);

    const cls = `print-${mode}`;
    document.body.classList.add(cls);

    const restore = () => {
      document.body.classList.remove(cls);
      if (mode === "both" && (prev === 0 || prev === 100)) setGanttPercent(prev);
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
  };

  return (
    <div className="app">
      <h1 className="no-print">Progress (LITE)</h1>

      <MainToolbar
        onAddRow={addRow}
        onDeleteLast={deleteLast}
        pxPerDay={pxPerDay}
        setPxPerDay={setPxPerDay}
        showToday={showToday}
        setShowToday={setShowToday}
        ganttPercent={ganttPercent}
        setGanttPercent={setGanttPercent}
        onClearTable={handleClearTable}
        onPrintMode={doPrint}
      />

      {/* Sammendragslinje (øverst – blir alltid med i print) */}
      <div className="summarybar">
        <SummaryBar rows={rows} />
      </div>

      {/* Delt visning */}
      <div className="print-area" style={{ marginTop: 12 }}>
        <SplitOverlay
          percent={ganttPercent}
          onPercentChange={setGanttPercent}
          height="70vh"
          left={
            <TableCore
              ref={apiRef}
              columns={COLUMNS}
              rows={rows}
              onChange={onGridChange}
            />
          }
          right={
            <div className="gantt-wrap">
              <div className="gantt-scroller">
                <GanttLite rows={rows} pxPerDay={pxPerDay} showToday={showToday} />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
/* ==== [BLOCK: Component] END ==== */

