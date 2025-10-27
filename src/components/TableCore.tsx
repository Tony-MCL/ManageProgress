/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useEffect, useMemo, useRef, useState } from "react"
import type { Aktivitet, FargeKey } from "@/types"
import { diffDaysInclusive } from "@/core/date"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Column model] BEGIN ==== */
type ColKey = "aktivitet" | "start" | "slutt" | "varighet" | "avhengigheter" | "ansvar" | "farge"
type Col = { key: ColKey; title: string; width?: number; readonly?: boolean; type?: "text" | "date" | "select" }

const COLS: Col[] = [
  { key: "aktivitet",      title: "Aktivitet",      width: 260, type: "text" },
  { key: "start",          title: "Start",          width: 140, type: "date" },
  { key: "slutt",          title: "Slutt",          width: 140, type: "date" },
  { key: "varighet",       title: "Varighet (d)",   width: 120, readonly: true, type: "text" },
  { key: "avhengigheter",  title: "Avhengigheter",  width: 150, type: "text" },
  { key: "ansvar",         title: "Ansvar",         width: 160, type: "text" },
  { key: "farge",          title: "Farge",          width: 140, type: "select" }
]

const FARGER: FargeKey[] = ["auto", "blå", "grønn", "gul", "rød", "lilla"]
/* ==== [BLOCK: Column model] END ==== */

/* ==== [BLOCK: Props] BEGIN ==== */
export type TableCoreProps = {
  rows: Aktivitet[]
  onRowsChange: (next: Aktivitet[]) => void
}
/* ==== [BLOCK: Props] END ==== */

/* ==== [BLOCK: util: id] BEGIN ==== */
let _seq = 1
function newId() { return String(_seq++) }
/* ==== [BLOCK: util: id] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
const TableCore: React.FC<TableCoreProps> = ({ rows, onRowsChange }) => {
  const [sel, setSel] = useState<{ r: number; c: ColKey } | null>(rows.length ? { r: 0, c: "aktivitet" } : null)
  const tableRef = useRef<HTMLTableElement>(null)

  // Kalkuler varighet ved endring av start/slutt
  useEffect(() => {
    const next = rows.map(r => ({
      ...r,
      varighet: diffDaysInclusive(r.start, r.slutt)
    }))
    onRowsChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // kun init – vi setter varighet fortløpende i setCell

  function setCell(rIndex: number, key: ColKey, value: string | number | undefined) {
    const next = rows.slice()
    const row = { ...next[rIndex] }
    ;(row as any)[key] = value
    if (key === "start" || key === "slutt") {
      row.varighet = diffDaysInclusive(row.start, row.slutt)
    }
    next[rIndex] = row
    onRowsChange(next)
  }

  function addRow() {
    const next: Aktivitet = {
      id: newId(),
      aktivitet: "",
      start: undefined,
      slutt: undefined,
      varighet: undefined,
      avhengigheter: "",
      ansvar: "",
      farge: "auto"
    }
    onRowsChange([...rows, next])
    setSel({ r: rows.length, c: "aktivitet" })
  }

  function deleteRow() {
    if (!sel) return
    const next = rows.slice()
    next.splice(sel.r, 1)
    onRowsChange(next)
    if (next.length) setSel({ r: Math.max(0, sel.r - 1), c: sel.c })
    else setSel(null)
  }

  // CSV/TSV eksport (enkelt)
  function exportCsv() {
    const head = COLS.map(c => c.title).join(";")
    const body = rows.map(r => COLS.map(c => {
      const v = (r as any)[c.key]
      return v == null ? "" : String(v).replaceAll('"','""')
    }).join(";"))
    const csv = [head, ...body].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "progress-lite.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // Keyboard navigasjon
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!sel) return
      // Unngå konflikter når en input/select er aktiv
      const target = e.target as HTMLElement
      const editing = target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable
      if (editing) return

      const colIndex = COLS.findIndex(c => c.key === sel.c)
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSel({ r: Math.min(rows.length - 1, sel.r + 1), c: sel.c })
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSel({ r: Math.max(0, sel.r - 1), c: sel.c })
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        const ci = Math.max(0, colIndex - 1)
        setSel({ r: sel.r, c: COLS[ci].key })
      } else if (e.key === "ArrowRight" || e.key === "Tab") {
        e.preventDefault()
        const ci = Math.min(COLS.length - 1, colIndex + 1)
        setSel({ r: sel.r, c: COLS[ci].key })
      } else if (e.key === "Enter") {
        e.preventDefault()
        // Fokuser inn på input/select i valgt celle
        focusCellInput(sel.r, sel.c)
      } else if (e.key === "Delete") {
        e.preventDefault()
        if (COLS[colIndex].readonly) return
        setCell(sel.r, sel.c, "")
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault()
        const v = (rows[sel.r] as any)[sel.c] ?? ""
        navigator.clipboard.writeText(String(v))
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        e.preventDefault()
        const c = COLS[colIndex]
        if (c.readonly) return
        const v = (rows[sel.r] as any)[sel.c] ?? ""
        navigator.clipboard.writeText(String(v))
        setCell(sel.r, sel.c, "")
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        // håndteres av paste-event på container
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [rows, sel])

  // Lim-inn fra Excel/CSV (TSV/CSV autodetect)
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!sel) return
      const text = e.clipboardData?.getData("text/plain")
      if (!text) return
      // Hvis det er mer enn én celle: fyll over flere kolonner/rader fra sel-pos
      const rowsStr = text.split(/\r?\n/).filter(Boolean)
      if (!rowsStr.length) return
      e.preventDefault()

      const startCol = COLS.findIndex(c => c.key === sel.c)
      const sep = text.includes("\t") ? "\t" : ";"
      const clone = rows.slice()

      for (let i = 0; i < rowsStr.length; i++) {
        const parts = rowsStr[i].split(sep)
        const rIndex = sel.r + i
        // Legg til rader ved behov
        while (rIndex >= clone.length) {
          clone.push({
            id: newId(), aktivitet: "", start: undefined, slutt: undefined,
            varighet: undefined, avhengigheter: "", ansvar: "", farge: "auto"
          })
        }
        const rObj = { ...clone[rIndex] }
        for (let j = 0; j < parts.length; j++) {
          const cIndex = startCol + j
          if (cIndex >= COLS.length) break
          const col = COLS[cIndex]
          if (col.readonly) continue
          const raw = parts[j].trim()
          // Normaliser datoer ala dd.mm.yyyy -> yyyy-mm-dd
          const val = (col.type === "date")
            ? normalizeDate(raw)
            : (col.type === "select")
            ? normalizeFarge(raw)
            : raw
          ;(rObj as any)[col.key] = val
        }
        // Re-kalk varighet
        rObj.varighet = diffDaysInclusive(rObj.start, rObj.slutt)
        clone[rIndex] = rObj
      }
      onRowsChange(clone)
    }
    const el = tableRef.current
    el?.addEventListener("paste", onPaste)
    return () => el?.removeEventListener("paste", onPaste)
  }, [rows, sel, onRowsChange])

  function normalizeDate(s: string): string | undefined {
    const t = s.trim()
    if (!t) return undefined
    // aksepter "yyyy-mm-dd"
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
    // aksepter "dd.mm.yyyy"
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t)
    if (m) {
      const [_, dd, mm, yyyy] = m
      const d = String(dd).padStart(2, "0")
      const mo = String(mm).padStart(2, "0")
      return `${yyyy}-${mo}-${d}`
    }
    return undefined
  }

  function normalizeFarge(s: string): FargeKey {
    const t = s.toLowerCase()
    if (t.includes("blå") || t.includes("blue")) return "blå"
    if (t.includes("grønn") || t.includes("green")) return "grønn"
    if (t.includes("gul") || t.includes("yellow")) return "gul"
    if (t.includes("rød") || t.includes("red")) return "rød"
    if (t.includes("lilla") || t.includes("purple")) return "lilla"
    return "auto"
  }

  function focusCellInput(r: number, c: ColKey) {
    const el = tableRef.current?.querySelector<HTMLElement>(`[data-rc="${r}:${c}"] input, [data-rc="${r}:${c}"] select`)
    el?.focus()
  }

  function cellClass(r: number, c: ColKey, readonly?: boolean) {
    const isSel = sel && sel.r === r && sel.c === c
    return "cell" + (isSel ? " selected" : "") + (readonly ? " readonly" : "")
  }

  function fargeDot(f: FargeKey | undefined) {
    const map: Record<FargeKey, string> = {
      auto: "#7a7f8f",
      blå: "#3b82f6",
      grønn: "#22c55e",
      gul: "#eab308",
      rød: "#ef4444",
      lilla: "#a855f7"
    }
    return <span className="color-dot" style={{ background: map[f ?? "auto"] }} />
  }

  return (
    <div className="table-wrap">
      <table className="grid" ref={tableRef}>
        <thead>
          <tr>
            {COLS.map(col => (
              <th key={col.key} style={{ width: col.width }}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIndex) => (
            <tr className="row" key={row.id}>
              {COLS.map(col => {
                const v = (row as any)[col.key]
                const rc = `${rIndex}:${col.key}`
                return (
                  <td key={col.key}>
                    <div
                      className={cellClass(rIndex, col.key, !!col.readonly)}
                      tabIndex={0}
                      data-rc={rc}
                      onClick={() => setSel({ r: rIndex, c: col.key })}
                    >
                      {col.readonly ? (
                        <span>{v ?? ""}</span>
                      ) : col.type === "date" ? (
                        <input
                          type="date"
                          value={v ?? ""}
                          onChange={(e) => setCell(rIndex, col.key, e.target.value || undefined)}
                        />
                      ) : col.type === "select" ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {fargeDot(v)}
                          <select
                            value={v ?? "auto"}
                            onChange={(e) => setCell(rIndex, col.key, e.target.value as FargeKey)}
                          >
                            {FARGER.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={v ?? ""}
                          onChange={(e) => setCell(rIndex, col.key, e.target.value)}
                        />
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Enkle actions under tabellen (mobilvennlig; dupliseres i hoved-toolbar senere hvis ønsket) */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="toolbtn ok" onClick={addRow}>➕ Ny rad</button>
        <button className="toolbtn danger" onClick={deleteRow}>🗑️ Slett valgt rad</button>
        <button className="toolbtn" onClick={exportCsv}>⤓ Eksporter CSV</button>
      </div>
    </div>
  )
}
/* ==== [BLOCK: Component] END ==== */

export default TableCore
