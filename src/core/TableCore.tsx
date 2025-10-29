/* =========================================================================
   TableCore – nøytral grid-motor (tekst inn/ut)
   - Ingen domene-logikk (dato, varighet etc. håndteres i App-laget)
   - Støtter:
     * Dynamiske rader/kolonner (styres av App gjennom props)
     * Piltaster/Tab/Enter/Shift+Enter
     * contentEditable med stabil caret
     * Sticky header
     * Kolonnebredde med drag-resize (min/max)
     * Aktiv celle + enkel rektangulær seleksjon
     * Lim inn fra Excel/CSV (tab/linjeskift), auto-utvide rader
     * onChange(nextRows, event)
     * Imperativt API via ref: getData(), setData()
   ========================================================================= */

/* ==== [BLOCK: Imports] BEGIN ==== */
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Types] BEGIN ==== */
export type TableColumn = {
  key: string;
  title: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
};

export type TableEvent =
  | { type: "edit"; row: number; colKey: string }
  | { type: "paste"; startRow: number; startCol: number; rows: number; cols: number }
  | { type: "resize"; colKey: string; width: number };

export type TableCoreProps = {
  columns: TableColumn[];
  rows: Record<string, string>[];
  onChange: (next: Record<string, string>[], evt: TableEvent) => void;
};

export type TableCoreRef = {
  getData: () => Record<string, string>[];
  setData: (next: Record<string, string>[]) => void;
};
/* ==== [BLOCK: Types] END ==== */

/* ==== [BLOCK: Helpers] BEGIN ==== */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function splitClipboard(text: string): string[][] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.split("\t"));
}
/* ==== [BLOCK: Helpers] END ==== */

/* ==== [BLOCK: Component] BEGIN ==== */
const TableCore = forwardRef<TableCoreRef, TableCoreProps>(function TableCore(
  { columns, rows, onChange },
  ref
) {
  const [widths, setWidths] = useState<number[]>(
    () => columns.map((c) => c.width ?? 160)
  );
  useEffect(() => {
    setWidths(columns.map((c, i) => widths[i] ?? c.width ?? 160));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map((c) => c.key).join("|")]);

  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [sel, setSel] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);

  /* ---- Imperativt API ---- */
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useImperativeHandle(ref, () => ({
    getData: () => rowsRef.current,
    setData: (next) => onChange(next, { type: "edit", row: -1, colKey: "" })
  }), [onChange]);

  /* ---- Focus + edit ---- */
  const tdRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const keyFor = (r: number, c: number) => `${r}:${c}`;

  const focusCell = useCallback((r: number, c: number, select = false) => {
    const k = keyFor(r, c);
    const el = tdRefs.current.get(k);
    if (el) {
      el.focus();
      if (select) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, []);

  /* ---- Navigasjon ---- */
  const move = useCallback((dr: number, dc: number) => {
    setActive((a) => {
      const r = clamp((a?.r ?? 0) + dr, 0, rowsRef.current.length - 1);
      const c = clamp((a?.c ?? 0) + dc, 0, columns.length - 1);
      setSel(null);
      requestAnimationFrame(() => focusCell(r, c, true));
      return { r, c };
    });
  }, [columns.length, focusCell]);

  /* ---- Pasting ---- */
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (!active) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    e.preventDefault();
    const matrix = splitClipboard(text);
    const neededRows = active.r + matrix.length;
    let next = rowsRef.current.slice();

    // utvid rader hvis nødvendig
    while (next.length < neededRows) {
      const empty: Record<string, string> = {};
      for (const col of columns) empty[col.key] = "";
      next.push(empty);
    }

    for (let i = 0; i < matrix.length; i++) {
      const row = next[active.r + i];
      const line = matrix[i];
      for (let j = 0; j < line.length && active.c + j < columns.length; j++) {
        const colKey = columns[active.c + j].key;
        row[colKey] = line[j] ?? "";
      }
    }
    onChange(next, { type: "paste", startRow: active.r, startCol: active.c, rows: matrix.length, cols: matrix[0]?.length ?? 1 });
  }, [active, columns, onChange]);

  /* ---- Key handling ---- */
  const onKeyDownCell = useCallback((e: React.KeyboardEvent, r: number, c: number, colKey: string) => {
    if (e.key === "Tab") { e.preventDefault(); move(0, e.shiftKey ? -1 : 1); }
    else if (e.key === "Enter") { e.preventDefault(); move(e.shiftKey ? -1 : 1, 0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (e.key === "ArrowLeft" && (window.getSelection()?.anchorOffset ?? 0) === 0) {
      e.preventDefault(); move(0, -1);
    } else if (e.key === "ArrowRight") {
      const el = tdRefs.current.get(keyFor(r,c));
      const len = el?.textContent?.length ?? 0;
      const off = window.getSelection()?.anchorOffset ?? 0;
      if (off >= len) { e.preventDefault(); move(0, 1); }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
      // select current cell text only
      e.preventDefault();
      focusCell(r, c, true);
    }
  }, [focusCell, move]);

  /* ---- Input commit ---- */
  const onBlurCell = useCallback((e: React.FocusEvent<HTMLDivElement>, r: number, colKey: string) => {
    const val = e.currentTarget.textContent ?? "";
    if (rowsRef.current[r]?.[colKey] === val) return;
    const next = rowsRef.current.slice();
    next[r] = { ...next[r], [colKey]: val };
    onChange(next, { type: "edit", row: r, colKey });
  }, [onChange]);

  /* ---- Seleksjon med mus (enkel rektangel) ---- */
  const mouseDown = useRef<{ r: number; c: number } | null>(null);
  const onMouseDown = (r: number, c: number) => (e: React.MouseEvent) => {
    setActive({ r, c });
    mouseDown.current = { r, c };
    setSel({ r1: r, c1: c, r2: r, c2: c });
  };
  const onMouseEnter = (r: number, c: number) => {
    if (!mouseDown.current) return;
    const { r: r0, c: c0 } = mouseDown.current;
    setSel({
      r1: Math.min(r0, r), c1: Math.min(c0, c),
      r2: Math.max(r0, r), c2: Math.max(c0, c)
    });
  };
  useEffect(() => {
    const up = () => { mouseDown.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  /* ---- Kolonne-resize ---- */
  const dragInfo = useRef<{ col: number; startX: number; startW: number; min: number; max: number } | null>(null);
  const onResizeDown = (idx: number, e: React.MouseEvent) => {
    const col = columns[idx];
    dragInfo.current = {
      col: idx,
      startX: e.clientX,
      startW: widths[idx],
      min: col.minWidth ?? 80,
      max: col.maxWidth ?? 480
    };
    e.preventDefault();
    e.stopPropagation();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragInfo.current) return;
      const d = e.clientX - dragInfo.current.startX;
      const w = clamp(dragInfo.current.startW + d, dragInfo.current.min, dragInfo.current.max);
      setWidths((prev) => {
        const n = prev.slice();
        n[dragInfo.current!.col] = w;
        return n;
      });
    };
    const up = () => {
      if (dragInfo.current) {
        const idx = dragInfo.current.col;
        dragInfo.current = null;
        onChange(rowsRef.current, { type: "resize", colKey: columns[idx].key, width: widths[idx] });
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [columns, onChange, widths]);

  /* ---- Render ---- */
  const cols = columns; // alias for brevity
  const header = (
    <thead>
      <tr>
        {cols.map((c, i) => (
          <th key={c.key} style={{ position: "sticky", width: widths[i] }}>
            {c.title}
            <span className="th-resizer" onMouseDown={(e) => onResizeDown(i, e)} />
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="table-wrap" onPaste={handlePaste}>
      <table className="table">
        {header}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {cols.map((c, i) => {
                const k = keyFor(r, i);
                const isActive = active?.r === r && active?.c === i;
                const inSel = sel &&
                  r >= Math.min(sel.r1, sel.r2) && r <= Math.max(sel.r1, sel.r2) &&
                  i >= Math.min(sel.c1, sel.c2) && i <= Math.max(sel.c1, sel.c2);

                return (
                  <td key={c.key} style={{ width: widths[i] }}>
                    <div
                      ref={(el) => { if (el) tdRefs.current.set(k, el); else tdRefs.current.delete(k); }}
                      className={`cell ${isActive ? "active" : ""} ${inSel ? "sel" : ""}`}
                      contentEditable
                      suppressContentEditableWarning
                      onFocus={() => setActive({ r, c: i })}
                      onBlur={(e) => onBlurCell(e, r, c.key)}
                      onKeyDown={(e) => onKeyDownCell(e, r, i, c.key)}
                      onMouseDown={onMouseDown(r, i)}
                      onMouseEnter={() => onMouseEnter(r, i)}
                      spellCheck={false}
                    >
                      {row[c.key] ?? ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
/* ==== [BLOCK: Component] END ==== */

export default TableCore;
