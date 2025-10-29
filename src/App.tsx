/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo, useRef, useState } from "react"
import TableCore, { type TableCoreRef, type TcColumn, type TableChange } from "./core/TableCore"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Columns Definition] BEGIN ==== */
/** Nøytral kolonnedefinisjon — TableCore kjenner ikke typer. */
const COLUMNS: TcColumn[] = [
  { id: "aktivitet", title: "Aktivitet", width: 260 },
  { id: "start",     title: "Start",     width: 120 },
  { id: "slutt",     title: "Slutt",     width: 120 },
  { id: "varighet",  title: "Varighet",  width: 100 },   // Kalkuleres i App-laget
  { id: "avheng",    title: "Avheng.",   width: 100 },   // Tekst (f.eks. 1FS, 3SS)
  { id: "farge",     title: "Farge",     width: 90 }     // Hex/navn — kun datafelt
]
/* ==== [BLOCK: Columns Definition] END ==== */

/* ==== [BLOCK: Helpers - App Logic] BEGIN ==== */
/** App-laget: enkel ISO-dato parser (YYYY-MM-DD) */
function parseISO(d: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null
  const t = Date.parse(d + "T00:00:00")
  return Number.isNaN(t) ? null : new Date(t)
}
function diffDays(a: Date, b: Date): number {
  const MS = 24*60*60*1000
  // avrund til hele dager
  return Math.round((b.getTime() - a.getTime()) / MS) + 1 /* inkl. slutt-dag */
}

/** Kalkulerer "Varighet" for alle rader basert på Start/Slutt (App-lag, ikke i TableCore). */
function recalcVarighet(rows: string[][]): string[][] {
  const ci = {
    start: COLUMNS.findIndex(c => c.id === "start"),
    slutt: COLUMNS.findIndex(c => c.id === "slutt"),
    varig: COLUMNS.findIndex(c => c.id === "varighet")
  }
  const next = rows.map(r => r.slice())
  for (let i = 0; i < next.length; i++) {
    const s = parseISO(next[i][ci.start] || "")
    const e = parseISO(next[i][ci.slutt] || "")
    if (s && e && e >= s) {
      next[i][ci.varig] = String(diffDays(s, e))
    } else {
      next[i][ci.varig] = ""
    }
  }
  return next
}
/* ==== [BLOCK: Helpers - App Logic] END ==== */

/* ==== [BLOCK: Initial Data] BEGIN ==== */
const INITIAL_ROWS: string[][] = [
  ["Oppstart og planlegging", "2025-11-03", "2025-11-04", "", "", "#3ea6ff"],
  ["Grunnstruktur TableCore", "2025-11-05", "2025-11-06", "", "", "#2dd4bf"],
  ["Import/lim inn (TSV)",   "2025-11-07", "2025-11-07", "", "", "#f59e0b"],
  ["Navigasjon & markering",  "2025-11-10", "2025-11-11", "", "", "#e879f9"],
  ["App: Varighet-beregning", "2025-11-12", "2025-11-12", "", "", "#22c55e"]
]
/* ==== [BLOCK: Initial Data] END ==== */

/* ==== [BLOCK: App Component] BEGIN ==== */
export default function App() {
  const ref = useRef<TableCoreRef>(null)
  const [rows, setRows] = useState<string[][]>(() => recalcVarighet(INITIAL_ROWS))

  const handleChange = (nextRows: string[][], change: TableChange) => {
    // App-laget: re-kalkulerer varighet ved relevante endringer
    let out = nextRows
    if (change.type === "cell-edit" || change.type === "paste") {
      out = recalcVarighet(nextRows)
    }
    setRows(out)
  }

  const addRow = () => {
    const empty = COLUMNS.map(() => "")
    setRows(prev => {
      const next = recalcVarighet([...prev, empty])
      // fokus på første celle i ny rad
      setTimeout(() => ref.current?.focusCell(next.length - 1, 0), 0)
      return next
    })
  }

  const delLastRow = () => {
    setRows(prev => (prev.length ? prev.slice(0, prev.length - 1) : prev))
  }

  const getSnapshot = () => {
    const data = ref.current?.getData() ?? []
    alert(JSON.stringify(data, null, 2))
  }

  const visibleCount = useMemo(() => rows.length, [rows.length])

  return (
    <div className="app">
      <h1>Manage Progress – TableCore (LITE)</h1>
      <div className="sub">
        Nøytral grid-motor. App-lag gjør dato/varighet. <span className="badge">{visibleCount} rader</span>
      </div>

      <div className="toolbar">
        <button onClick={addRow}>+ Ny rad</button>
        <button onClick={delLastRow}>Slett siste rad</button>
        <button onClick={getSnapshot}>Vis getData()</button>
      </div>

      <TableCore
        ref={ref}
        columns={COLUMNS}
        rows={rows}
        onChange={handleChange}
      />
    </div>
  )
}
/* ==== [BLOCK: App Component] END ==== */
