/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { ColumnDef, RowData, TableChangeEvent, TableCoreApi } from "../types"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Props] BEGIN ==== */
export type TableCoreProps = {
  columns: ColumnDef[]
  rows: RowData[]
  onChange?: (ev: TableChangeEvent, nextRows: RowData[]) => void
}
/* ==== [BLOCK: Props] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
export const TableCore = React.forwardRef<TableCoreApi, TableCoreProps>(function TableCore (
  { columns, rows, onChange },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Internt speil av rader – grid er "source of truth" visuelt,
  // men alle endringer sendes ut via onChange slik at appen kan holde domenelogikk utenfor.
  const [data, setData] = useState<RowData[]>(() => structuredClone(rows))
  useEffect(() => { setData(structuredClone(rows)) }, [rows])

  // Kolonnebredder (lokal UI-tilstand, ikke domenedata)
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    columns.forEach(c => m[c.id] = c.width ?? 140)
    return m
  })
  useEffect(() => {
    setWidths(p => {
      const next = { ...p }
      for (const c of columns) if (!(c.id in next)) next[c.id] = c.width ?? 140
      return next
    })
  }, [columns])

  // Utvalg (rektangel): r0,r1,c0,c1 – lagres som indeksbasert
  const [sel, setSel] = useState<[number, number, number, number] | null>(null)
  const cols = columns
  const colIds = useMemo(() => cols.map(c => c.id), [cols])

  /* ==== [BLOCK: Helpers] BEGIN ==== */
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const normalizeSel = (r0: number, r1: number, c0: number, c1: number): [number, number, number, number] => {
    const nr0 = Math.min(r0, r1)
    const nr1 = Math.max(r0, r1)
    const nc0 = Math.min(c0, c1)
    const nc1 = Math.max(c0, c1)
    return [nr0, nr1, nc0, nc1]
  }
  const cellRect = (row: number, col: number): DOMRect | null => {
    if (!containerRef.current) return null
    const table = containerRef.current.querySelector("table.gridTable") as HTMLTableElement | null
    if (!table) return null
    const tr = table.rows.item(row + 1) // +1 pga header-rad
    if (!tr) return null
    const td = tr.cells.item(col)
    if (!td) return null
    return td.getBoundingClientRect()
  }
  /* ==== [BLOCK: Helpers] END ==== */

  /* ==== [BLOCK: API] BEGIN ==== */
  useImperativeHandle(ref, (): TableCoreApi => ({
    getData: () => structuredClone(data),
    setData: (rows: RowData[]) => { setData(structuredClone(rows)) },
    setCell: (r, colId, value) => {
      setData(prev => {
        const next = structuredClone(prev)
        if (!next[r]) return prev
        next[r][colId] = value
        onChange?.({ type: "edit", row: r, colId, value }, next)
        return next
      })
    },
    getSelection: () => sel ? [...sel] as [number,number,number,number] : null
  }), [data, sel, onChange])
  /* ==== [BLOCK: API] END ==== */

  /* ==== [BLOCK: Mouse Selection] BEGIN ==== */
  const anchorRef = useRef<{ r: number; c: number } | null>(null)
  const isDraggingRef = useRef(false)

  const onMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if ((e.target as HTMLElement).classList.contains("colResizer")) return
    anchorRef.current = { r, c }
    isDraggingRef.current = true
    setSel([r, r, c, c])
  }

  const onMouseMove = (e: React.MouseEvent, r: number, c: number) => {
    if (!isDraggingRef.current || !anchorRef.current) return
    const { r: ar, c: ac } = anchorRef.current
    setSel(normalizeSel(ar, r, ac, c))
  }

  const onMouseUp = () => { isDraggingRef.current = false }
  /* ==== [BLOCK: Mouse Selection] END ==== */

  /* ==== [BLOCK: Keyboard] BEGIN ==== */
  const activeCellRef = useRef<{ r: number; c: number } | null>(null)

  const moveActive = (dr: number, dc: number) => {
    if (!activeCellRef.current) return
    const nr = clamp(activeCellRef.current.r + dr, 0, data.length - 1)
    const nc = clamp(activeCellRef.current.c + dc, 0, colIds.length - 1)
    activeCellRef.current = { r: nr, c: nc }
    setSel([nr, nr, nc, nc])
    // Scroll into view
    const rect = cellRect(nr, nc)
    rect && containerRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Piltaster / Tab / Enter: navigasjon
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); moveActive(0, -1); return
      case "ArrowRight": e.preventDefault(); moveActive(0, +1); return
      case "ArrowUp": e.preventDefault(); moveActive(-1, 0); return
      case "ArrowDown": e.preventDefault(); moveActive(+1, 0); return
      case "Tab": e.preventDefault(); moveActive(0, e.shiftKey ? -1 : +1); return
      case "Enter": e.preventDefault(); moveActive(e.shiftKey ? -1 : +1, 0); return
    }

    // Kopier / Lim inn (enkelt TSV/CSV)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      // lim inn håndteres av onPaste på container
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      // kopier – la browser ordne via Selection API (fallback)
    }
  }
  /* ==== [BLOCK: Keyboard] END ==== */

  /* ==== [BLOCK: Paste] BEGIN ==== */
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text")
    if (!text) return

    // Parse CSV/TSV grovt
    const rowsRaw = text.split(/\r?\n/).filter(Boolean)
    const matrix = rowsRaw.map(line => {
      if (line.includes("\t")) return line.split("\t")
      return line.split(",")
    })

    setData(prev => {
      const next = structuredClone(prev)
      let startR = sel ? sel[0] : (activeCellRef.current?.r ?? 0)
      let startC = sel ? sel[2] : (activeCellRef.current?.c ?? 0)
      startR = clamp(startR, 0, next.length - 1)
      startC = clamp(startC, 0, colIds.length - 1)

      for (let r = 0; r < matrix.length; r++) {
        const rr = startR + r
        if (rr >= next.length) next.push({})
        for (let c = 0; c < matrix[r].length; c++) {
          const cc = startC + c
          if (cc >= colIds.length) break
          const colId = colIds[cc]
          next[rr][colId] = matrix[r][c]
        }
      }
      onChange?.({ type: "paste", top: startR, leftColId: colIds[startC], data: matrix }, next)
      return next
    })
  }
  /* ==== [BLOCK: Paste] END ==== */

  /* ==== [BLOCK: Edit Cell] BEGIN ==== */
  const onCellInput = (r: number, colId: string, value: string) => {
    setData(prev => {
      const next = structuredClone(prev)
      if (!next[r]) return prev
      next[r][colId] = value
      onChange?.({ type: "edit", row: r, colId, value }, next)
      return next
    })
  }
  /* ==== [BLOCK: Edit Cell] END ==== */

  /* ==== [BLOCK: Column Resize] BEGIN ==== */
  const resizingRef = useRef<{ colId: string; startX: number; startW: number } | null>(null)

  const onResizerDown = (e: React.MouseEvent, colId: string) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = { colId, startX: e.clientX, startW: widths[colId] ?? 140 }
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const dx = ev.clientX - resizingRef.current.startX
      const w = Math.max(60, resizingRef.current.startW + dx)
      setWidths(p => ({ ...p, [colId]: w }))
    }
    const onUp = () => {
      if (resizingRef.current) {
        const { colId } = resizingRef.current
        const w = widths[colId]
        onChange?.({ type: "resizeCol", colId, width: w }, data)
      }
      resizingRef.current = null
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }
  /* ==== [BLOCK: Column Resize] END ==== */

  /* ==== [BLOCK: Render] BEGIN ==== */
  // Beregn markeringsrektangel (visuelt)
  const [selStyle, setSelStyle] = useState<React.CSSProperties | null>(null)
  useEffect(() => {
    if (!sel) { setSelStyle(null); return }
    const [r0, r1, c0, c1] = sel
    const rect0 = cellRect(r0, c0)
    const rect1 = cellRect(r1, c1)
    const host = containerRef.current?.getBoundingClientRect()
    if (!rect0 || !rect1 || !host) { setSelStyle(null); return }
    const left = rect0.left - host.left + containerRef.current!.scrollLeft
    const top  = rect0.top  - host.top  + containerRef.current!.scrollTop
    const right= rect1.right - host.left + containerRef.current!.scrollLeft
    const bottom= rect1.bottom - host.top + containerRef.current!.scrollTop
    setSelStyle({
      left: Math.floor(left),
      top: Math.floor(top),
      width: Math.ceil(right - left),
      height: Math.ceil(bottom - top)
    })
  }, [sel, data, widths])
  /* ==== [BLOCK: Render] END ==== */

  return (
    <div
      ref={containerRef}
      className="grid"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onMouseUp={onMouseUp}
    >
      <table className="gridTable">
        <thead>
          <tr>
            {cols.map((c, ci) => (
              <th key={c.id} style={{ width: widths[c.id] ?? 140 }}>
                {c.label}
                <span className="colResizer" onMouseDown={(e) => onResizerDown(e, c.id)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              {colIds.map((colId, ci) => (
                <td key={colId}
                  onMouseDown={(e) => { activeCellRef.current = { r: ri, c: ci }; onMouseDown(e, ri, ci) }}
                  onMouseMove={(e) => onMouseMove(e, ri, ci)}
                >
                  <div
                    className="cell"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => onCellInput(ri, colId, (e.target as HTMLElement).innerText)}
                    onFocus={() => { activeCellRef.current = { r: ri, c: ci }; setSel([ri,ri,ci,ci]) }}
                    spellCheck={false}
                  >
                    {row[colId] ?? ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {selStyle && <div className="selRect" style={selStyle} />}
    </div>
  )
})
/* ==== [BLOCK: Component] END ==== */
