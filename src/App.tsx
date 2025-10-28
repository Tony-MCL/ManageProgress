/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo, useRef, useState } from "react"
import "./styles/index.css"
import { TableCore, type TableCoreProps } from "./core/TableCore"
import type { ColumnDef, RowData, TableCoreApi } from "./types"
/* ==== [BLOCK: Imports] END ==== */

export default function App() {
  /* ==== [BLOCK: Columns] BEGIN ==== */
  const columns: ColumnDef[] = useMemo(() => [
    { id: "task", label: "Aktivitet", width: 220 },
    { id: "start", label: "Start (tekst)", width: 140 },
    { id: "slutt", label: "Slutt (tekst)", width: 140 },
    { id: "ansvar", label: "Ansvar", width: 140 },
    { id: "farge", label: "Farge", width: 100 }
  ], [])
  /* ==== [BLOCK: Columns] END ==== */

  /* ==== [BLOCK: DemoData] BEGIN ==== */
  const [rows, setRows] = useState<RowData[]>([
    { task: "Kickoff-møte", start: "2025-11-03", slutt: "2025-11-03", ansvar: "PL", farge: "kaffe" },
    { task: "Forprosjekt", start: "2025-11-04", slutt: "2025-11-18", ansvar: "Ingeniør", farge: "kaffe" },
    { task: "Bestillinger", start: "2025-11-05", slutt: "2025-11-12", ansvar: "Innkjøp", farge: "kaffe" }
  ])
  /* ==== [BLOCK: DemoData] END ==== */

  /* ==== [BLOCK: GridRef] BEGIN ==== */
  const gridRef = useRef<TableCoreApi | null>(null)
  /* ==== [BLOCK: GridRef] END ==== */

  /* ==== [BLOCK: HandlersOutsideGrid] BEGIN ==== */
  const handleChange: TableCoreProps["onChange"] = (ev, nextRows) => {
    // Domenelogikk (beregninger, validering) bor her senere – IKKE i TableCore.
    setRows(nextRows)
  }

  const addRow = () => setRows(r => [...r, {}])
  const deleteLastRow = () => setRows(r => r.length ? r.slice(0, -1) : r)

  const logSelection = () => {
    const sel = gridRef.current?.getSelection()
    console.log("Selection", sel)
    alert(sel ? `Utvalg: r${sel[0]}..${sel[1]} c${sel[2]}..${sel[3]}` : "Ingen utvalg")
  }
  /* ==== [BLOCK: HandlersOutsideGrid] END ==== */

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={addRow}>+ Ny rad</button>
        <button className="secondary" onClick={deleteLastRow}>Slett siste rad</button>
        <button className="secondary" onClick={logSelection}>Vis utvalg</button>
        <div className="info">Progress LITE – ren grid-motor (kopier/lim inn fra Excel fungerer)</div>
      </div>

      <TableCore
        ref={gridRef}
        columns={columns}
        rows={rows}
        onChange={handleChange}
      />
    </div>
  )
}
