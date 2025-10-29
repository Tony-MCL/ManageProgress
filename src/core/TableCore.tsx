import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { ColumnDef, RowData, TableChangeEvent, TableCoreApi } from "../types"

export type TableCoreProps = {
  columns: ColumnDef[]
  rows: RowData[]
  onChange?: (ev: TableChangeEvent, nextRows: RowData[]) => void
}

export const TableCore = React.forwardRef<TableCoreApi, TableCoreProps>(function TableCore (
  { columns, rows, onChange },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [data, setData] = useState<RowData[]>(() => structuredClone(rows))
  useEffect(() => { setData(structuredClone(rows)) }, [rows])

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

  const [sel, setSel] = useState<[number, number, number, number] | null>(null)
  const cols = columns
  const colIds = useMemo(() => cols.map(c => c.id), [cols])

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const normalizeSel = (r0: number, r1: number, c0: number, c1: number) =>
    [Math.min(r0, r1), Math.max(r0, r1), Math.min(c0, c1), Math.max(c0, c1)] as [number,number,number,number]

  const cellRect = (row: number, col: number): DOMRect | null => {
    if (!containerRef.current) return null
    const table = containerRef.current.querySelector("table.gridTable") as HTMLTableElement | null
    if (!table) return null
    const tr = table.rows.item(row + 1)
    if (!tr) return null
    const td = tr.cells.item(col)
    if (!td) return null
    return td.getBoundingClientRect()
  }

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

  const anchorRef = useRef<{ r: number; c: number } | null>(null)
  const isDraggingRef = useRef(false)

  const onMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if ((e.target as HTMLElement).classList.contains("colResizer")) return
    anchorRef.current = { r, c }
    isDraggingRef.current = true
    setSel([r, r, c, c])
  }
  const onMouseMove = (_e: React.MouseEvent, r: number, c: number) => {
    if (!isDraggingRef.current || !anchorRef.current) return
    const { r: ar, c: ac } = anchorRef.current
    setSel(normalizeSel(ar, r, ac, c))
  }
  const onMouseUp = () => { isDraggingRef.current = false }

  const activeCellRef = useRef<{ r: number; c: number } | null>(null)
  const moveActive = (dr: number, dc: number) => {
    if (!activeCellRef.current) return
    const nr = clamp(activeCellRef.current.r + dr, 0, data.length - 1)
    const nc = clamp(activeCellRef.current.c + dc, 0, colIds.length - 1)
    activeCellRef.current = { r: nr, c: nc }
    setSel([nr, nr, nc, nc])
    const rect = cellRect(nr, nc)
    rect && containerRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); moveActive(0, -1); return
      case "ArrowRight": e.preventDefault(); moveActive(0, +1); return
      case "ArrowUp": e.preventDefault(); moveActive(-1, 0); return
      case "ArrowDown": e.preventDefault(); moveActive(+1, 0); return
      case "Tab": e.preventDefault(); moveActive(0, e.shiftKey ? -1 : +1); return
      case "Enter": e.preventDefault(); moveActive(e.shiftKey ? -1 : +1, 0); return
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text")
    if (!text) return
    const rowsRaw = text.split(/\r?\n/).filter(Boolean)
    const matrix = rowsRaw.map(line => line.includes("\t") ? line.split("\t") : line.split(","))
    setData(prev => {
      const next = structuredClone(prev)
      const startR = sel ? sel[0] : (activeCellRef.current?.r ?? 0)
      const startC = sel ? sel[2] : (activeCellRef.current?.c ?? 0)
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

  const onCellInput = (r: number, colId: string, value: string) => {
    setData(prev => {
      const next = structuredClone(prev)
      if (!next[r]) return prev
      next[r][colId] = value
      onChange?.({ type: "edit", row: r, colId, value }, next)
      return next
    })
  }

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
            {cols.map((c) => (
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
              {colIds.map((colId, ci) => {
                const col = cols[ci]
                const value = row[colId] ?? ""
                const readOnly = !!col.readOnly
                return (
                  <td key={colId}
                    onMouseDown={(e) => { activeCellRef.current = { r: ri, c: ci }; onMouseDown(e, ri, ci) }}
                    onMouseMove={(e) => onMouseMove(e, ri, ci)}
                  >
                    <div
                      className="cell"
                      data-col={colId}
                      data-ph={col.placeholder ?? ""}
                      contentEditable={!readOnly}
                      suppressContentEditableWarning
                      onInput={(e) => onCellInput(ri, colId, (e.target as HTMLElement).innerText)}
                      onFocus={() => { activeCellRef.current = { r: ri, c: ci }; setSel([ri,ri,ci,ci]) }}
                      spellCheck={false}
                    >
                      {value}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selStyle && <div className="selRect" style={selStyle} />}
    </div>
  )
})
