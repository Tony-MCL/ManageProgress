/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useEffect, useRef, useState } from "react"
import type { Aktivitet, FargeKey } from "@/types"
import { diffDaysInclusive } from "@/core/date"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Column model] BEGIN ==== */
type ColKey = "nr" | "aktivitet" | "start" | "slutt" | "varighet" | "avhengigheter" | "ansvar" | "farge"
type Col = { key: ColKey; title: string; width?: number; readonly?: boolean; type?: "text" | "date" | "select" }

const INITIAL_COLS: Col[] = [
  { key: "nr",            title: "#",              width: 48,  readonly: true, type: "text" },
  { key: "aktivitet",     title: "Aktivitet",      width: 260, type: "text" },
  { key: "start",         title: "Start",          width: 140, type: "date" },
  { key: "slutt",         title: "Slutt",          width: 140, type: "date" },
  { key: "varighet",      title: "Varighet (d)",   width: 120, readonly: true, type: "text" },
  { key: "avhengigheter", title: "Avhengigheter",  width: 150, type: "text" },
  { key: "ansvar",        title: "Ansvar",         width: 160, type: "text" },
  { key: "farge",         title: "Farge",          width: 140, type: "select" },
]

const FARGER: FargeKey[] = ["auto", "blå", "grønn", "gul", "rød", "lilla"]
/* ==== [BLOCK: Column model] END ==== */

/* ==== [BLOCK: Selection types] BEGIN ==== */
type CellPoint = { r: number; c: number }
type RangeSel = { anchor: CellPoint; focus: CellPoint }
function rectFrom(sel: RangeSel) {
  const r1 = Math.min(sel.anchor.r, sel.focus.r)
  const r2 = Math.max(sel.anchor.r, sel.focus.r)
  const c1 = Math.min(sel.anchor.c, sel.focus.c)
  const c2 = Math.max(sel.anchor.c, sel.focus.c)
  return { r1, r2, c1, c2 }
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
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

/* ==== [BLOCK: Reorder helpers] BEGIN ==== */
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const a = arr.slice()
  const [it] = a.splice(from, 1)
  a.splice(to, 0, it)
  return a
}
/* ==== [BLOCK: Reorder helpers] END ==== */

/* ==== [BLOCK: Dragging indicator] BEGIN ==== */
function setBodyDragging(active: boolean) {
  if (typeof document === "undefined") return
  const body = document.body
  if (active) body.classList.add("dragging")
  else body.classList.remove("dragging")
}
/* ==== [BLOCK: Dragging indicator] END ==== */

const TableCore: React.FC<TableCoreProps> = ({ rows, onRowsChange }) => {
  /* ==== [BLOCK: Local state] BEGIN ==== */
  const [cols, setCols] = useState<Col[]>(INITIAL_COLS)
  const [sel, setSel] = useState<RangeSel | null>(
    rows.length ? { anchor: { r: 0, c: 1 }, focus: { r: 0, c: 1 } } : null
  )

  // Undo/redo
  const [undoStack, setUndo] = useState<Aktivitet[][]>([])
  const [redoStack, setRedo] = useState<Aktivitet[][]>([])

  // Resize
  const [resizing, setResizing] = useState<{ c: number; startX: number; startW: number } | null>(null)

  // Drag-select
  const [isDraggingSel, setIsDraggingSel] = useState(false)

  // Row/Col drag
  const [dragRow, setDragRow] = useState<{ from: number; over: number | null } | null>(null)
  const [dragCol, setDragCol] = useState<{ from: number; over: number | null } | null>(null)

  const tableRef = useRef<HTMLTableElement>(null)
  /* ==== [BLOCK: Local state] END ==== */

  /* ==== [BLOCK: History helpers] BEGIN ==== */
  function pushUndo(snapshot?: Aktivitet[]) {
    const snap = snapshot ? snapshot : rows.map(r => ({ ...r }))
    setUndo(s => [...s, snap])
    setRedo([]) // invalidate redo on new action
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

  function normalizeDate(s: string): string | undefined {
    const t = s.trim()
    if (!t) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t)
    if (m) {
      const [, dd, mm, yyyy] = m
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
          varighet: undefined, avhengigheter: "", ansvar: "", farge: "auto",
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
      farge: "auto",
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
    }

    function onCopy(ev: ClipboardEvent) {
      if (!sel) return
      const srs = selectionRectAndSize()
      if (!srs) return
      const ae = document.activeElement as HTMLElement | null
      const editing = ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.isContentEditable)
      if (srs.rowsN > 1 || srs.colsN > 1 || !editing) {
        const tsv = serializeSelection(srs.rect!)
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
        const tsv = serializeSelection(srs.rect!)
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
      // Grid-paste hvis rektangel eller utvidet utvalg, ellers la input håndtere.
      const rowsArr = text.split(/\r?\n/).filter(Boolean)
      const sep = text.includes("\t") ? "\t" : (text.includes(";") ? ";" : ",")
      const clipCols = Math.max(...rowsArr.map(r => r.split(sep).length), 1)
      const ae = document.activeElement as HTMLElement | null
      const editing = ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT" || ae.isContentEditable)
      const shouldGridPaste = rowsArr.length > 1 || clipCols > 1 || srs.rowsN > 1 || srs.colsN > 1 || !editing
      if (shouldGridPaste) { e.preventDefault(); pasteRect(text) }
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
        parts.push(line.join("\t"))
      }
      return parts.join("\n")
    }

    function focusCellInput(r: number, c: number) {
      const key = cols[c]?.key
      if (!key) return
      const el = tableRef.current?.querySelector<HTMLElement>(`[data-rc="${r}:${key}"] input, [data-rc="${r}:${key}"] select`)
      el?.focus()
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
    const ae = document.activeElement as HTMLElement | null
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT")) ae.blur()

    if (e.shiftKey && sel) setSel({ anchor: sel.anchor, focus: { r, c } })
    else setSel({ anchor: { r, c }, focus: { r, c } })

    setIsDraggingSel(true)
    const onUp = () => { setIsDraggingSel(false); window.removeEventListener("mouseup", onUp) }
    window.addEventListener("mouseup", onUp)
  }
  function onCellMouseEnter(r: number, c: number) {
    if (!isDraggingSel) return
    setSel(curr => curr ? ({ anchor: curr.anchor, focus: { r, c } }) : ({ anchor: { r, c }, focus: { r, c } }))
  }
  /* ==== [BLOCK: Mouse selection (drag)] END ==== */

  /* ==== [BLOCK: Row drag & drop] BEGIN ==== */
  function startRowDrag(r: number, e: React.MouseEvent) {
    e.preventDefault()
    setDragRow({ from: r, over: r })
    setBodyDragging(true)
    const onUp = () => {
      setDragRow(curr => {
        if (!curr || curr.over == null || curr.over === curr.from) return null
        pushUndo()
        const next = arrayMove(rows, curr.from, curr.over).map(r => ({ ...r }))
        onRowsChange(next)
        setSel(s => s ? { anchor: { r: curr.over!, c: s.anchor.c }, focus: { r: curr.over!, c: s.focus.c } } : s)
        return null
      })
      setBodyDragging(false)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mouseup", onUp)
  }
  function onRowMouseEnter(r: number) {
    if (!dragRow) return
    setDragRow(d => d ? { ...d, over: r } : d)
  }
  /* ==== [BLOCK: Row drag & drop] END ==== */

  /* ==== [BLOCK: Column resize] BEGIN ==== */
  function startResize(c: number, e: React.MouseEvent) {
    if (c === 0) return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = cols[c].width ?? 140
    setResizing({ c, startX, startW })

    const onMove = (ev: MouseEvent) => {
      setCols(prev => {
        const dx = ev.clientX - startX
        const next = prev.slice()
        const w = Math.max(32, (resizing?.startW ?? startW) + dx)
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
  function isSelected(r: number, c: number) {
    if (!sel) return false
    const { r1, r2, c1, c2 } = rectFrom(sel)
    return r >= r1 && r <= r2 && c >= c1 && c <= c2
  }
  /* ==== [BLOCK: Rendering helpers] END ==== */

  /* ==== [BLOCK: UI] BEGIN ==== */
  return (
    <div className="table-wrap">
      <div className="table-scroller">
        <table className="grid" ref={tableRef}>
          <thead>
            <tr>
              {cols.map((col, cIndex) => (
                <th
                  key={col.key}
                  style={{ width: col.width, position: "relative" }}
                  className={(cIndex !== 0 ? "draggable " : "") + (
                    dragCol && dragCol.over === cIndex
                      ? (dragCol.from! > cIndex ? "th-drop-left" : "th-drop-right")
                      : ""
                  )}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest(".col-resizer")) return
                    if (cIndex === 0) return
                    if (e.button !== 0) return
                    setDragCol({ from: cIndex, over: cIndex })
                    setBodyDragging(true)
                    const onUp = () => {
                      setDragCol(curr => {
                        if (!curr || curr.over == null || curr.from === curr.over) return null
                        const to = Math.max(1, curr.over)
                        const from = curr.from!
                        const moved = arrayMove(cols, from, to)
                        setCols(moved)
                        setSel(s => {
                          if (!s) return s
                          const mapIndex = (i: number) => {
                            if (i === from) return to
                            if (from < to && i > from && i <= to) return i - 1
                            if (from > to && i >= to && i < from) return i + 1
                            return i
                          }
                          return { anchor: { r: s.anchor.r, c: mapIndex(s.anchor.c) }, focus: { r: s.focus.r, c: mapIndex(s.focus.c) } }
                        })
                        return null
                      })
                      setBodyDragging(false)
                      window.removeEventListener("mouseup", onUp)
                    }
                    window.addEventListener("mouseup", onUp)
                  }}
                  onMouseEnter={() => {
                    if (!dragCol) return
                    if (cIndex === 0) return
                    setDragCol(d => d ? { ...d, over: cIndex } : d)
                  }}
                >
                  {col.title}
                  {cIndex !== 0 && (
                    <div
                      className="col-resizer"
                      onMouseDown={(e) => startResize(cIndex, e)}
                      title="Dra for å endre bredde"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => {
              const rowHasData = Object.values(row).some(v => v !== null && v !== undefined && v !== "")
              return (
                <tr key={rowIndex} onMouseEnter={() => onRowMouseEnter(rowIndex)}>
                  {cols.map((col, cIndex) => {
                    const key = col.key
                    const cur = (row as any)[key] ?? ""
                    const isReadOnly = !!col.readonly

                    // # -kolonnen (drag + viser nummer bare hvis det er innhold)
                    if (cIndex === 0) {
                      return (
                        <td
                          key={key}
                          data-rc={`${rowIndex}:${key}`}
                          className={`cell ${isSelected(rowIndex, cIndex) ? "selected" : ""} readonly`}
                          onMouseDown={(e) => startRowDrag(rowIndex, e)}
                        >
                          {rowHasData ? String(rowIndex + 1) : ""}
                        </td>
                      )
                    }

                    // Dato-kolonner: plain <input type="date"> (synlig, ingen placeholder-magi)
                    if (col.type === "date") {
                      return (
                        <td
                          key={key}
                          data-rc={`${rowIndex}:${key}`}
                          className={`cell ${isSelected(rowIndex, cIndex) ? "selected" : ""} ${isReadOnly ? "readonly" : ""}`}
                          onMouseDown={(e) => {
                            const el = e.target as HTMLElement
                            if (el.tagName !== "INPUT") onCellMouseDown(rowIndex, cIndex, e)
                          }}
                          onMouseEnter={() => onCellMouseEnter(rowIndex, cIndex)}
                        >
                          <input
                            type="date"
                            value={cur || ""}        {/* ISO yyyy-mm-dd */}
                            disabled={isReadOnly}
                            onChange={(e) => setCell(rowIndex, cIndex, (e.target.value || "").trim() || undefined)}
                          />
                        </td>
                      )
                    }

                    // Øvrige: contentEditable + save on blur
                    const handleBlur = (e: React.FocusEvent<HTMLTableCellElement>) => {
                      if (isReadOnly) return
                      const raw = (e.currentTarget.textContent ?? "").trim()
                      let nextVal: any = raw
                      if (col.type === "select") nextVal = normalizeFarge(raw)
                      if (String(nextVal) === String(cur ?? "")) return
                      setCell(rowIndex, cIndex, nextVal)
                    }

                    return (
                      <td
                        key={key}
                        data-rc={`${rowIndex}:${key}`}
                        className={`cell ${isSelected(rowIndex, cIndex) ? "selected" : ""} ${isReadOnly ? "readonly" : ""}`}
                        contentEditable={!isReadOnly}
                        suppressContentEditableWarning
                        onMouseDown={(e) => onCellMouseDown(rowIndex, cIndex, e)}
                        onMouseEnter={() => onCellMouseEnter(rowIndex, cIndex)}
                        onBlur={handleBlur}
                      >
                        {String(cur ?? "")}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
