/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useEffect, useMemo, useRef, useState } from "react"
import type { Aktivitet, FargeKey } from "@/types"
import { diffDaysInclusive } from "@/core/date"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Column model] BEGIN ==== */
type ColKey = "nr" | "aktivitet" | "start" | "slutt" | "varighet" | "avhengigheter" | "ansvar" | "farge"
type Col = { key: ColKey; title: string; width?: number; readonly?: boolean; type?: "text" | "date" | "select" }

const INITIAL_COLS: Col[] = [
  { key: "nr", title: "#", width: 50, readonly: true, type: "text" },
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

/* ==== [BLOCK: Selection types] BEGIN ==== */
type CellPoint = { r: number; c: number } // bruker kolonneindeks for enkel mat.
type RangeSel = { anchor: CellPoint; focus: CellPoint } // rektangel mellom anchor↔focus
/* ==== [BLOCK: Selection types] END ==== */

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

/* ==== [BLOCK: Helpers] BEGIN ==== */
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function rectFrom(sel: RangeSel) {
  const r1 = Math.min(sel.anchor.r, sel.focus.r)
  const r2 = Math.max(sel.anchor.r, sel.focus.r)
  const c1 = Math.min(sel.anchor.c, sel.focus.c)
  const c2 = Math.max(sel.anchor.c, sel.focus.c)
  return { r1, r2, c1, c2 }
}
/* ==== [BLOCK: Helpers] END ==== */

const TableCore: React.FC<TableCoreProps> = ({ rows, onRowsChange }) => {
  /* ==== [BLOCK: Local state] BEGIN ==== */
const [cols, setCols] = useState<Col[]>(INITIAL_COLS)
const [sel, setSel] = useState<RangeSel | null>(
  rows.length ? { anchor: { r: 0, c: 0 }, focus: { r: 0, c: 0 } } : null
)

// Undo/redo stack – lagrer kun rows (dyp kopi).
const [undoStack, setUndo] = useState<Aktivitet[][]>([])
const [redoStack, setRedo] = useState<Aktivitet[][]>([])

// Kolonne-resize
const [resizing, setResizing] = useState<{ c: number; startX: number; startW: number } | null>(null)

// Markerer vi med mus akkurat nå?
const [isDraggingSel, setIsDraggingSel] = useState(false)

const tableRef = useRef<HTMLTableElement>(null)
/* ==== [BLOCK: Local state] END ==== */

  /* ==== [BLOCK: History helpers] BEGIN ==== */
  function pushUndo(snapshot?: Aktivitet[]) {
    const snap = snapshot ? snapshot : rows.map(r => ({ ...r }))
    setUndo(s => [...s, snap])
    setRedo([]) // Invalider redo ved ny handling
  }
  function handleUndo() {
    setUndo(s => {
      if (s.length === 0) return s
      const prev = s[s.length - 1]
      setRedo(r => [...r, rows.map(x => ({ ...x }))])
      onRowsChange(prev.map(x => ({ ...x })))
      return s.slice(0, -1)
    })
  }
  function handleRedo() {
    setRedo(s => {
      if (s.length === 0) return s
      const next = s[s.length - 1]
      setUndo(u => [...u, rows.map(x => ({ ...x }))])
      onRowsChange(next.map(x => ({ ...x })))
      return s.slice(0, -1)
    })
  }
  /* ==== [BLOCK: History helpers] END ==== */

  /* ==== [BLOCK: Cell set/update] BEGIN ==== */
  function recalcVarighet(row: Aktivitet): Aktivitet {
    return { ...row, varighet: diffDaysInclusive(row.start, row.slutt) }
  }
  function setCell(rIndex: number, cIndex: number, rawValue: string | number | undefined) {
    const col = cols[cIndex]
    if (!col || col.readonly) return
    pushUndo()
    const next = rows.slice()
    const row = { ...next[rIndex] }
    const key = col.key
    let value: any = rawValue
    if (col.type === "date") value = normalizeDate(String(rawValue ?? ""))
    if (col.type === "select") value = normalizeFarge(String(rawValue ?? ""))
    ;(row as any)[key] = value
    next[rIndex] = recalcVarighet(row)
    onRowsChange(next)
  }

  function clearRange() {
    if (!sel) return
    pushUndo()
    const { r1, r2, c1, c2 } = rectFrom(sel)
    const next = rows.slice()
    for (let r = r1; r <= r2; r++) {
      const row = { ...next[r] }
      for (let c = c1; c <= c2; c++) {
        const col = cols[c]
        if (!col || col.readonly) continue
        ;(row as any)[col.key] = col.type === "select" ? "auto" : ""
      }
      next[r] = recalcVarighet(row)
    }
    onRowsChange(next)
  }

  function pasteRect(text: string) {
    if (!sel) return
    pushUndo()
    const { r1, c1 } = rectFrom(sel)
    const sepRow = /\r?\n/
    const rowsStr = text.split(sepRow).filter(Boolean)
    const sep = text.includes("\t") ? "\t" : (text.includes(";") ? ";" : ",")
    const clone = rows.slice()

    for (let i = 0; i < rowsStr.length; i++) {
      const parts = rowsStr[i].split(sep)
      const rIndex = r1 + i
      while (rIndex >= clone.length) {
        clone.push({
          id: newId(), aktivitet: "", start: undefined, slutt: undefined,
          varighet: undefined, avhengigheter: "", ansvar: "", farge: "auto"
        })
      }
      const row = { ...clone[rIndex] }
      for (let j = 0; j < parts.length; j++) {
        const cIndex = c1 + j
        if (cIndex >= cols.length) break
        const col = cols[cIndex]
        if (col.readonly) continue
        const raw = parts[j].trim()
        const val = (col.type === "date")
          ? normalizeDate(raw)
          : (col.type === "select")
          ? normalizeFarge(raw)
          : raw
        ;(row as any)[col.key] = val
      }
      clone[rIndex] = recalcVarighet(row)
    }
    onRowsChange(clone)
  }
  /* ==== [BLOCK: Cell set/update] END ==== */

  /* ==== [BLOCK: Add/Delete rows] BEGIN ==== */
  function addRow() {
    pushUndo()
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
    setSel({ anchor: { r: rows.length, c: 0 }, focus: { r: rows.length, c: 0 } })
  }
  function deleteRow() {
    if (!sel) return
    pushUndo()
    const { r1, r2 } = rectFrom(sel)
    const next = rows.slice()
    next.splice(r1, r2 - r1 + 1)
    onRowsChange(next)
    if (next.length) {
      const newR = clamp(r1, 0, next.length - 1)
      setSel({ anchor: { r: newR, c: 0 }, focus: { r: newR, c: 0 } })
    } else {
      setSel(null)
    }
  }
  /* ==== [BLOCK: Add/Delete rows] END ==== */

  /* ==== [BLOCK: Keyboard & clipboard] BEGIN ==== */
useEffect(() => {
  function selectionRectAndSize() {
    if (!sel) return null
    const rect = rectFrom(sel)
    const rowsN = rect.r2 - rect.r1 + 1
    const colsN = rect.c2 - rect.c1 + 1
    return { rect, rowsN, colsN }
  }

  function onKey(e: KeyboardEvent) {
    if (!sel) return
    const srs = selectionRectAndSize()
    const maxR = Math.max(0, rows.length - 1)
    const maxC = cols.length - 1

    const target = e.target as HTMLElement
    const inForm = target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable)

    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); handleUndo(); return }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); handleRedo(); return }

    // Navigasjon + multi (Shift)
    const move = (dr: number, dc: number, extend: boolean) => {
      e.preventDefault()
      const endR = clamp((sel?.focus.r ?? 0) + dr, 0, maxR)
      const endC = clamp((sel?.focus.c ?? 0) + dc, 0, maxC)
      if (extend && sel) setSel({ anchor: sel.anchor, focus: { r: endR, c: endC } })
      else { const p = { r: endR, c: endC }; setSel({ anchor: p, focus: p }) }
    }

    if (e.key === "ArrowDown") return move(1, 0, e.shiftKey)
    if (e.key === "ArrowUp") return move(-1, 0, e.shiftKey)
    if (e.key === "ArrowLeft") return move(0, -1, e.shiftKey)
    if (e.key === "ArrowRight" || e.key === "Tab") return move(0, 1, e.shiftKey)
    if (e.key === "Enter") { e.preventDefault(); focusCellInput(sel.focus.r, sel.focus.c); return }
    if (e.key === "Delete") { e.preventDefault(); clearRange(); return }

    // Copy/Cut/Paste håndteres i egne events under
  }

  function onCopy(ev: ClipboardEvent) {
    if (!sel) return
    const srs = selectionRectAndSize()
    if (!srs) return

    // Hvis utvalget er større enn én celle → overstyr alltid og kopier hele utvalget
    // Hvis bare én celle: overstyr hvis fokus IKKE er i et input/select (da ønsker vi celleverdi, ikke deltekst)
    const ae = document.activeElement as HTMLElement | null
    const editing = ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.isContentEditable)

    if (srs.rowsN > 1 || srs.colsN > 1 || !editing) {
      const tsv = serializeSelection(srs.rect)
      ev.preventDefault()
      ev.clipboardData?.setData("text/plain", tsv)
    }
  }

  function onCut(ev: ClipboardEvent) {
    if (!sel) return
    const srs = selectionRectAndSize()
    if (!srs) return
    const ae = document.activeElement as HTMLElement | null
    const editing = ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.isContentEditable)

    if (srs.rowsN > 1 || srs.colsN > 1 || !editing) {
      const tsv = serializeSelection(srs.rect)
      ev.preventDefault()
      ev.clipboardData?.setData("text/plain", tsv)
      clearRange()
    }
  }

  function onPaste(e: ClipboardEvent) {
    if (!sel) return
    const srs = selectionRectAndSize()
    if (!srs) return
    const text = e.clipboardData?.getData("text/plain") ?? ""
    if (!text) return

    // Sjekk om clipboard er "rektangel" (flere rader/kolonner)
    const rowsArr = text.split(/\r?\n/).filter(Boolean)
    const sep = text.includes("\t") ? "\t" : (text.includes(";") ? ";" : ",")
    const colsCounts = rowsArr.map(r => r.split(sep).length)
    const clipRows = rowsArr.length
    const clipCols = Math.max(...colsCounts, 1)

    const ae = document.activeElement as HTMLElement | null
    const editing = ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.isContentEditable)

    const shouldGridPaste =
      clipRows > 1 || clipCols > 1 || srs.rowsN > 1 || srs.colsN > 1 || !editing

    if (shouldGridPaste) {
      e.preventDefault()
      pasteRect(text)
    }
    // ellers: la en-celle-innliming skje i input/select (standard browser)
  }

  window.addEventListener("keydown", onKey)
  window.addEventListener("copy", onCopy)
  window.addEventListener("cut", onCut)
  window.addEventListener("paste", onPaste)
  return () => {
    window.removeEventListener("keydown", onKey)
    window.removeEventListener("copy", onCopy)
    window.removeEventListener("cut", onCut)
    window.removeEventListener("paste", onPaste)
  }
}, [rows, cols, sel])
/* ==== [BLOCK: Keyboard & clipboard] END ==== */



  /* ==== [BLOCK: Mouse selection (drag)] BEGIN ==== */
function onCellMouseDown(r: number, c: number, e: React.MouseEvent) {
  // Slå av evt. input-fokus så ikke browser kopierer kun den ene cellen
  const ae = document.activeElement as HTMLElement | null
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT")) ae.blur()

  if (e.shiftKey && sel) {
    // SHIFT+klikk: utvid eksisterende utvalg til denne cellen
    setSel({ anchor: sel.anchor, focus: { r, c } })
  } else {
    const p = { r, c }
    setSel({ anchor: p, focus: p })
  }

  // Start "drag-select"
  setIsDraggingSel(true)

  // Avslutt når museknappen slippes (globalt)
  const onUp = () => {
    setIsDraggingSel(false)
    window.removeEventListener("mouseup", onUp)
  }
  window.addEventListener("mouseup", onUp)
}

function onCellMouseEnter(r: number, c: number) {
  if (!isDraggingSel) return
  setSel(curr => curr ? { anchor: curr.anchor, focus: { r, c } } : { anchor: { r, c }, focus: { r, c } })
}
/* ==== [BLOCK: Mouse selection (drag)] END ==== */


  /* ==== [BLOCK: Column resize] BEGIN ==== */
  function startResize(c: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = cols[c].width ?? 140
    setResizing({ c, startX, startW })

    const onMove = (ev: MouseEvent) => {
      setCols(prev => {
        const dx = ev.clientX - startX
        const next = prev.slice()
        const w = Math.max(60, (resizing?.startW ?? startW) + dx)
        next[c] = { ...next[c], width: w }
        return next
      })
    }
    const onUp = () => {
      setResizing(null)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }
  /* ==== [BLOCK: Column resize] END ==== */

  /* ==== [BLOCK: Rendering helpers] BEGIN ==== */
  function focusCellInput(r: number, c: number) {
    const key = cols[c]?.key
    if (!key) return
    const el = tableRef.current?.querySelector<HTMLElement>(`[data-rc="${r}:${key}"] input, [data-rc="${r}:${key}"] select`)
    el?.focus()
  }
  function colIndexFromKey(k: ColKey) { return cols.findIndex(c => c.key === k) }
  function isSelected(r: number, c: number) {
    if (!sel) return false
    const { r1, r2, c1, c2 } = rectFrom(sel)
    return r >= r1 && r <= r2 && c >= c1 && c <= c2
  }
  function cellClass(r: number, c: number, readonly?: boolean) {
    const inside = isSelected(r, c)
    return "cell" + (inside ? " selected" : "") + (readonly ? " readonly" : "")
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
  function serializeSelection(rect: { r1: number; r2: number; c1: number; c2: number }) {
    const parts: string[] = []
    for (let r = rect.r1; r <= rect.r2; r++) {
      const row = rows[r]
      const line: string[] = []
      for (let c = rect.c1; c <= rect.c2; c++) {
        const col = cols[c]
        const v = (row as any)[col.key]
        line.push(v == null ? "" : String(v).replaceAll('"', '""'))
      }
      parts.push(line.join("\t")) // bruk TSV for best Excel-interop
    }
    return parts.join("\n")
  }
  /* ==== [BLOCK: Rendering helpers] END ==== */

  /* ==== [BLOCK: Normalizers] BEGIN ==== */
  function normalizeDate(s: string): string | undefined {
    const t = s.trim()
    if (!t) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
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
  /* ==== [BLOCK: Normalizers] END ==== */

  /* ==== [BLOCK: UI] BEGIN ==== */
  return (
    <div className="table-wrap">
      <table className="grid" ref={tableRef}>
        <thead>
          <tr>
            {cols.map((col, cIndex) => (
              <th key={col.key} style={{ width: col.width }}>
                <div style={{ position: "relative", userSelect: "none" }}>
                  {col.title}
                  {/* Resize grip */}
                  <div
                    onMouseDown={(e) => startResize(cIndex, e)}
                    style={{
                      position: "absolute", right: 0, top: 0, bottom: 0,
                      width: 6, cursor: "col-resize"
                    }}
                    title="Dra for å endre bredde"
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIndex) => (
            <tr className="row" key={row.id}>
              {cols.map((col, cIndex) => {
                const v = (row as any)[col.key]
              if (col.key === "nr") {
                  const hasData = Object.entries(row).some(([k, val]) =>
                    k !== "id" && k !== "nr" && val && String(val).trim() !== ""
                  )
                  return (
                    <td key="nr" style={{ textAlign: "right", opacity: hasData ? 0.6 : 0 }}>
                      {hasData ? rIndex + 1 : ""}
                    </td>
                  )
                }
                const rcKey = `${rIndex}:${col.key}`
                return (
                  <td key={col.key}>
                    <div
                      className={cellClass(rIndex, cIndex, !!col.readonly)}
                      tabIndex={0}
                      data-rc={rcKey}
                      onMouseDown={(e) => onCellMouseDown(rIndex, cIndex, e)}
                      onMouseEnter={() => onCellMouseEnter(rIndex, cIndex)} 
                    >
                      {col.readonly ? (
                        <span>{v ?? ""}</span>
                      ) : col.type === "date" ? (
                        <input
                          type="date"
                          value={v ?? ""}
                          onChange={(e) => setCell(rIndex, cIndex, e.target.value || undefined)}
                        />
                      ) : col.type === "select" ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {fargeDot(v)}
                          <select
                            value={v ?? "auto"}
                            onChange={(e) => setCell(rIndex, cIndex, e.target.value as FargeKey)}
                          >
                            {FARGER.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={v ?? ""}
                          onChange={(e) => setCell(rIndex, cIndex, e.target.value)}
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

      {/* Aksjoner under tabellen (mobilvennlig) */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button className="toolbtn ok" onClick={addRow}>➕ Ny rad</button>
        <button className="toolbtn danger" onClick={deleteRow}>🗑️ Slett valgt rad</button>
        <div style={{ marginLeft: "auto", opacity: 0.8 }}>
          <span title="Hurtigtaster">⌨️ Piltaster • Shift+Piler • Del • Ctrl/Cmd+C/V/X • Ctrl/Cmd+Z/Y</span>
        </div>
      </div>
    </div>
  )
  /* ==== [BLOCK: UI] END ==== */
}

export default TableCore
