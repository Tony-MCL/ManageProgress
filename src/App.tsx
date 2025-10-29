import React, { useMemo, useRef, useState } from "react"
import "./styles/index.css"
import { TableCore, type TableCoreProps } from "./core/TableCore"
import type { ColumnDef, RowData, TableCoreApi } from "./types"

export default function App() {
  /* Kolonner – Varighet er redigerbar tekst; rn og varig beregnes/vises i App  */
  const columns: ColumnDef[] = useMemo(() => [
    { id: "rn",      label: "#",           width: 60,  readOnly: true },
    { id: "task",    label: "Aktivitet",   width: 240 },
    { id: "start",   label: "Start",       width: 130, placeholder: "yyyy-mm-dd" },
    { id: "slutt",   label: "Slutt",       width: 130, placeholder: "yyyy-mm-dd" },
    { id: "varig",   label: "Varighet",    width: 120 },                 // redigerbar
    { id: "dep",     label: "Avhengighet", width: 150 },                 // f.eks. "3", "3+2d", "5+1w"
    { id: "ansvar",  label: "Ansvar",      width: 140 },
    { id: "farge",   label: "Farge",       width: 120 },
    { id: "kom",     label: "Kommentarer", width: 260 }
  ], [])

  /* Demo-data */
  const [rows, setRows] = useState<RowData[]>([
    { task: "Kickoff-møte", start: "2025-11-03", slutt: "2025-11-03", ansvar: "PL",       farge: "kaffe" },
    { task: "Forprosjekt",  start: "2025-11-04", slutt: "2025-11-18", ansvar: "Ingeniør", farge: "kaffe" },
    { task: "Bestillinger", start: "2025-11-05", slutt: "2025-11-12", ansvar: "Innkjøp",  farge: "kaffe" }
  ])

  const gridRef = useRef<TableCoreApi | null>(null)

  /* ===== Helpers (dato/varighet/dep) ===== */
  const parseDate = (s?: string): Date | null => {
    if (!s) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
    if (!m) return null
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return isNaN(d.getTime()) ? null : d
  }
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

  const diffDaysIncl = (a: Date, b: Date) =>
    Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000) + 1) // inkl. slutt-dagen

  // Varighet: "10" / "10d" -> 10, "2w" -> 14 (avrundet til hele dager)
  const parseDurDays = (s?: string): number | null => {
    if (!s) return null
    const t = s.trim().toLowerCase()
    if (t === "") return null
    const m = /^(\d+(\.\d+)?)([dw])?$/.exec(t)
    if (!m) return null
    const n = parseFloat(m[1])
    const unit = m[3] ?? "d"
    if (unit === "d") return Math.max(1, Math.round(n))
    if (unit === "w") return Math.max(1, Math.round(n * 7))
    return null
  }

  // Avhengighet: "3", "3+2d", "3+1w"  -> { rowIdx: 2, offsetDays: 2 | 7 }
  const parseDep = (s?: string): { rowIdx: number; offsetDays: number } | null => {
    if (!s) return null
    const m = /^(\d+)([+-]\d+(?:\.\d+)?[dw])?$/.exec(s.trim().toLowerCase())
    if (!m) return null
    const base = Number(m[1])
    if (!base || base < 1) return null
    let offsetDays = 0
    if (m[2]) {
      const m2 = /^([+-])(\d+(?:\.\d+)?)([dw])$/.exec(m[2])
      if (m2) {
        const sign = m2[1] === "-" ? -1 : 1
        const val = parseFloat(m2[2])
        const unit = m2[3]
        offsetDays = Math.round(val * (unit === "w" ? 7 : 1)) * sign
      }
    }
    return { rowIdx: base - 1, offsetDays }
  }

  // Legg på n dager og returnér ny dato
  const addDays = (d: Date, n: number) => {
    const x = new Date(d)
    x.setDate(x.getDate() + n)
    return x
  }

  /* ===== Solver: anvend reglene pr. rad ===== */
  const recompute = (src: RowData[]): RowData[] => {
    const next = src.map((r) => ({ ...r })) // klon

    // Først: løft ut alle dato/varighet/dep-parsed
    const parsed = next.map(r => ({
      s: parseDate(r.start),
      e: parseDate(r.slutt),
      v: parseDurDays(r.varig),
      dep: parseDep(r.dep)
    }))

    // Kjør regler pr. rad
    for (let i = 0; i < next.length; i++) {
      const r = next[i]
      let { s, e, v, dep } = parsed[i]

      // 4) V + Avh. => S + E
      if (!s && !e && v && dep) {
        const depRow = next[dep.rowIdx]
        const depEnd = parseDate(depRow?.slutt)
        if (depEnd) {
          s = addDays(depEnd, 1 + dep.offsetDays)               // start etter dep slutt + ev. offset
          e = addDays(s, v - 1)
        }
      }

      // 1) S & E ⇒ V
      if (s && e) {
        v = diffDaysIncl(s, e)
      }
      // 2) S & V ⇒ E
      else if (s && v && !e) {
        e = addDays(s, v - 1)
      }
      // 3) E & V ⇒ S
      else if (e && v && !s) {
        s = addDays(e, -(v - 1))
      }

      // Skriv tilbake i r (tekstformat), men ikke overstyr manuelle verdier
      if (s) r.start = fmtDate(s)
      if (e) r.slutt = fmtDate(e)
      if (v) r.varig = `${v} d`   // vis som "Xd" (vi kan senere støtte "u" via innstilling)

      // Radnummer – vis kun hvis raden har relevant innhold
      const hasData = !!(r.task || r.start || r.slutt || r.varig || r.dep || r.ansvar || r.farge || r.kom)
      r.rn = hasData ? String(i + 1) : ""
    }
    return next
  }

  const handleChange: TableCoreProps["onChange"] = (_ev, nextRows) => {
    setRows(recompute(nextRows))
  }

  const addRow = () => setRows(r => recompute([...r, {}]))
  const deleteLastRow = () => setRows(r => recompute(r.length ? r.slice(0, -1) : r))

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={addRow}>+ Ny rad</button>
        <button className="secondary" onClick={deleteLastRow}>Slett siste rad</button>
        <div className="info">
          Start+Slutt⇄Varighet • Varighet+Avhengighet ⇒ Start+Slutt (dep: "3", "3+2d", "5+1w")
        </div>
      </div>

      <TableCore
        ref={gridRef}
        columns={columns}
        rows={recompute(rows)}
        onChange={handleChange}
      />
    </div>
  )
}
