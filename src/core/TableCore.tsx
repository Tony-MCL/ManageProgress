/* ==== [BLOCK: Imports] BEGIN ==== */
import React, {
  memo, useCallback, useEffect, useImperativeHandle,
  useMemo, useRef, useState, forwardRef
} from "react"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Types] BEGIN ==== */
export type TcColumn = {
  id: string
  title: string
  width?: number
}
export type TableChange =
  | { type: "cell-edit"; row: number; col: number; value: string }
  | { type: "paste"; row: number; col: number; rows: string[][] }
  | { type: "insert-row"; index: number; count: number }
  | { type: "delete-row"; index: number; count: number }

export type TableCoreProps = {
  columns: TcColumn[]
  rows: string[][]              // nøytral string-matrise
  onChange: (next: string[][], change: TableChange) => void
  stickyHeader?: boolean        // (forberedt, default true)
  className?: string
}

export type TableCoreRef = {
  getData: () => string[][]
  setData: (next: string[][]) => void
  focusCell: (r: number, c: number) => void
}
/* ==== [BLOCK: Types] END ==== */

/* ==== [BLOCK: Utils] BEGIN ==== */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
function ensureMatrix(rows: string[][], cols: number): string[][] {
  return rows.map(r => {
    const copy = r.slice(0, cols)
    while (copy.length < cols) copy.push("")
    return copy
  })
}
function parseTSV(text: string): string[][] {
  // Enkel TSV/CSV-innliming (tab/linje). Ikke-komma-escaping enda (LITE).
  const lines = text.replace(/\r/g, "").split("\n")
  return lines.map(line => line.split("\t"))
    .filter(arr => !(arr.length === 1 && arr[0] === ""))
}
/* ==== [BLOCK: Utils] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
const TableCore = forwardRef<TableCoreRef, TableCoreProps>(function TableCore(
  { columns, rows, onChange, stickyHeader = true, className },
  ref
) {
  const colCount = columns.length
  const [data, setData] = useState<string[][]>(() => ensureMatrix(rows, colCount))
  useEffect(() => setData(ensureMatrix(rows, colCount)), [rows, colCount])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef<{ r: number; c: number } | null>(null)
  const [active, setActive] = useState<{ r: number; c: number } | null>(null)
  const [sel, setSel] = useState<{ r0: number; c0: number; r1: number; c1: number } | null>(null)
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null)
  const [selecting, setSelecting] = useState<boolean>(false)

  /* ---- Exposed API ---- */
  useImperativeHandle(ref, () => ({
    getData: () => data.map(r => r.slice()),
    setData: (next) => setData(ensureMatrix(next, colCount)),
    focusCell: (r, c) => {
      const rr = clamp(r, 0, data.length - 1)
      const cc = clamp(c, 0, colCount - 1)
      setActive({ r: rr, c: cc })
      activeRef.current = { r: rr, c: cc }
      setTimeout(() => {
        const dom = containerRef.current?.querySelector<HTMLTableCellElement>(
          `[data-rc="${rr}-${cc}"]`
        )
        dom?.scrollIntoView({ block: "nearest", inline: "nearest" })
      }, 0)
    }
  }), [data.length, colCount])

  /* ---- Core operations ---- */
  const commitCell = useCallback((r: number, c: number, value: string) => {
    setData(prev => {
      const next = prev.map(row => row.slice())
      next[r][c] = value
      onChange(next, { type: "cell-edit", row: r, col: c, value })
      return next
    })
  }, [onChange])

  const applyPaste = useCallback((startR: number, startC: number, pasteRows: string[][]) => {
    setData(prev => {
      const next = prev.map(row => row.slice())
      for (let y = 0; y < pasteRows.length; y++) {
        const targetR = startR + y
        if (targetR >= next.length) break
        const rowData = pasteRows[y]
        for (let x = 0; x < rowData.length; x++) {
          const targetC = startC + x
          if (targetC >= colCount) break
          next[targetR][targetC] = rowData[x]
        }
      }
      onChange(next, { type: "paste", row: startR, col: startC, rows: pasteRows })
      return next
    })
  }, [colCount, onChange])

  /* ---- Mouse selection (drag) ---- */
  const onCellMouseDown = useCallback((r: number, c: number) => {
    setSelecting(true)
    const cell = { r, c }
    setActive(cell)
    activeRef.current = cell
    setSel({ r0: r, c0: c, r1: r, c1: c })
    setEditing(null)
  }, [])

  const onCellMouseEnter = useCallback((r: number, c: number) => {
    if (!selecting || !sel) return
    setSel({ ...sel, r1: r, c1: c })
  }, [selecting, sel])

  useEffect(() => {
    const up = () => setSelecting(false)
    window.addEventListener("mouseup", up)
    return () => window.removeEventListener("mouseup", up)
  }, [])

  /* ---- Keyboard nav / copy / paste ---- */
  const rectNormalized = useMemo(() => {
    if (!sel && active) {
      return { r0: active.r, c0: active.c, r1: active.r, c1: active.c }
    }
    if (!sel) return null
    const r0 = Math.min(sel.r0, sel.r1)
    const c0 = Math.min(sel.c0, sel.c1)
    const r1 = Math.max(sel.r0, sel.r1)
    const c1 = Math.max(sel.c0, sel.c1)
    return { r0, c0, r1, c1 }
  }, [sel, active])

  const moveActive = useCallback((dr: number, dc: number) => {
    setActive(cur => {
      const base = cur ?? { r: 0, c: 0 }
      const nr = clamp(base.r + dr, 0, data.length - 1)
      const nc = clamp(base.c + dc, 0, colCount - 1)
      activeRef.current = { r: nr, c: nc }
      setSel(null)
      setEditing(null)
      setTimeout(() => {
        const dom = containerRef.current?.querySelector<HTMLTableCellElement>(
          `[data-rc="${nr}-${nc}"]`
        )
        dom?.scrollIntoView({ block: "nearest", inline: "nearest" })
      }, 0)
      return { r: nr, c: nc }
    })
  }, [data.length, colCount])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ikke forstyrr når vi redigerer
    if (editing) return

    const ctrl = e.ctrlKey || e.metaKey
    if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1, 0); return }
    if (e.key === "ArrowUp")   { e.preventDefault(); moveActive(-1, 0); return }
    if (e.key === "ArrowRight"){ e.preventDefault(); moveActive(0, 1); return }
    if (e.key === "ArrowLeft") { e.preventDefault(); moveActive(0, -1); return }

    if (e.key === "Enter") { e.preventDefault(); moveActive(1, 0); return }
    if (e.key === "Tab")   { e.preventDefault(); moveActive(0, e.shiftKey ? -1 : 1); return }

    if (ctrl && e.key.toLowerCase() === "c") {
      e.preventDefault()
      if (!rectNormalized) return
      const { r0, c0, r1, c1 } = rectNormalized
      const lines: string[] = []
      for (let r = r0; r <= r1; r++) {
        const row = []
        for (let c = c0; c <= c1; c++) row.push(data[r][c] ?? "")
        lines.push(row.join("\t"))
      }
      const text = lines.join("\n")
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {/* ignore */})
      } else {
        // fallback
        const ta = document.createElement("textarea")
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      return
    }

    if (ctrl && e.key.toLowerCase() === "v") {
      // Vi lar onPaste ta seg av dette
      return
    }

    if (e.key === "F2") {
      // start redigering i aktiv celle
      if (active) setEditing(active)
      return
    }

    // Direkte skriving over aktiv celle (starter redigering)
    if (active && e.key.length === 1 && !ctrl) {
      setEditing(active)
      // La browseren skrive i contentEditable etter at vi bytter klasse
    }
  }, [active, rectNormalized, data, moveActive, editing])

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    if (editing) return
    const start = activeRef.current
    if (!start) return
    const text = e.clipboardData.getData("text/plain")
    if (!text) return
    e.preventDefault()
    const grid = parseTSV(text)
    if (grid.length === 0) return
    applyPaste(start.r, start.c, grid)
  }, [applyPaste, editing])

  /* ---- Render helpers ---- */
  const isSelected = useCallback((r: number, c: number) => {
    const rect = rectNormalized
    if (!rect) return false
    return r >= rect.r0 && r <= rect.r1 && c >= rect.c0 && c <= rect.c1
  }, [rectNormalized])

  /* ---- Cell component (memo) ---- */
  const Cell = memo(function Cell({ r, c }: { r: number; c: number }) {
    const val = data[r]?.[c] ?? ""
    const isAct = active?.r === r && active?.c === c
    const isEdit = editing?.r === r && editing?.c === c
    const selected = isSelected(r, c)

    const divRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      if (isEdit) {
        const d = divRef.current
        if (d) {
          d.setAttribute("contenteditable", "true")
          // Flytt caret til slutt
          const range = document.createRange()
          range.selectNodeContents(d)
          range.collapse(false)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
          d.focus()
        }
      } else {
        divRef.current?.removeAttribute("contenteditable")
      }
    }, [isEdit])

    const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (!isEdit) return
      const text = e.currentTarget.textContent ?? ""
      setEditing(null)
      if (text !== val) commitCell(r, c, text)
    }

    const onDoubleClick = () => setEditing({ r, c })

    return (
      <td
        className={`tc-cell${isAct ? " active" : ""}${selected ? " selected" : ""}${isEdit ? " editing" : ""}`}
        data-rc={`${r}-${c}`}
        onMouseDown={() => onCellMouseDown(r, c)}
        onMouseEnter={() => onCellMouseEnter(r, c)}
        onDoubleClick={onDoubleClick}
      >
        <div ref={divRef} onBlur={onBlur} suppressContentEditableWarning>
          {val}
        </div>
      </td>
    )
  })

  return (
    <div
      ref={containerRef}
      className={`tablecore${className ? " " + className : ""}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    >
      <table>
        <colgroup>
          {columns.map((c, i) => (
            <col key={c.id} style={c.width ? { width: `${c.width}px` } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id} title={col.id}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, r) => (
            <tr key={r}>
              {columns.map((_, c) => (
                <Cell key={c} r={r} c={c} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
/* ==== [BLOCK: Component] END ==== */

export default TableCore
