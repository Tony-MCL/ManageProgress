/* =========================================================================
   TableCore – nøytral grid-motor (tekst inn/ut) — LITE kjerne komplett
   Inkluderer:
   - Piltaster/Tab/Enter, rektangel-seleksjon, contentEditable uten flimmer
   - Lim inn fra Excel/CSV (tab/linjer), auto-utvid rader
   - Kolonne-resize (kun aktiv kolonne), faste bredder via <colgroup>, hor. scroll
   - Rad-reorder (drag i #-kolonnen)
   - [NYTT] Ctrl/Cmd+C kopier utvalg (TSV)
   - [NYTT] Delete/Backspace tømmer utvalg
   - [NYTT] Esc avbryt redigering (reverter celle)
   - [NYTT] Ctrl+Enter: sett inn rad under
   - [NYTT] Ctrl+Shift+Backspace: slett aktiv rad
   - [NYTT] ARIA (role="grid", aria-selected, aria-rowcount/colcount)
   ========================================================================= */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";

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
  | { type: "resize"; colKey: string; width: number }
  | { type: "reorder-rows"; from: number; to: number }
/* optional: bulk ops share 'edit' semantics for app-laget */
  ;

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
  /* ---- Kolonnebredder (bevar per key) ---- */
  const colsRef = useRef(columns);
  const [widths, setWidths] = useState<number[]>(
    () => columns.map((c) => c.width ?? 160)
  );
  useEffect(() => {
    const prevCols = colsRef.current;
    const prevMap = new Map<string, number>();
    prevCols.forEach((c, i) => prevMap.set(c.key, widths[i] ?? (c.width ?? 160)));
    const next = columns.map((c) => prevMap.get(c.key) ?? (c.width ?? 160));
    setWidths(next);
    colsRef.current = columns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map(c => c.key).join("|")]);

  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [sel, setSel] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);

  /* ---- Imperativt API ---- */
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useImperativeHandle(ref, () => ({
    getData: () => rowsRef.current,
    setData: (next) => onChange(next, { type: "edit", row: -1, colKey: "" }),
  }), [onChange]);

  /* ---- Focus/edit bookkeeping for Esc revert ---- */
  const tdRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const keyFor = (r: number, c: number) => `${r}:${c}`;
  const editOriginal = useRef<string>("");

  const focusCell = useCallback((r: number, c: number, select = false) => {
    const k = keyFor(r, c);
    const el = tdRefs.current.get(k);
    if (el) {
      el.focus();
      if (select) {
        const selObj = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selObj?.removeAllRanges();
        selObj?.addRange(range);
      }
    }
  }, []);

  /* ---- Tastaturnavigasjon mellom celler ---- */
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
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!active) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    e.preventDefault();
    const matrix = splitClipboard(text);
    const neededRows = active.r + matrix.length;
    let next = rowsRef.current.slice();

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
    onChange(next, {
      type: "paste",
      startRow: active.r,
      startCol: active.c,
      rows: matrix.length,
      cols: matrix[0]?.length ?? 1,
    });
  }, [active, columns, onChange]);

  /* ---- Key handling per celle (inkl. Esc revert) ---- */
  const onKeyDownCell = useCallback((e: React.KeyboardEvent, r: number, c: number, colKey: string) => {
    if (e.key === "Tab") { e.preventDefault(); move(0, e.shiftKey ? -1 : 1); return; }
    if (e.key === "Enter") { e.preventDefault(); move(e.shiftKey ? -1 : 1, 0); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); return; }

    if (e.key === "ArrowLeft" && (window.getSelection()?.anchorOffset ?? 0) === 0) {
      e.preventDefault(); move(0, -1); return;
    }
    if (e.key === "ArrowRight") {
      const el = tdRefs.current.get(keyFor(r, c));
      const len = el?.textContent?.length ?? 0;
      const off = window.getSelection()?.anchorOffset ?? 0;
      if (off >= len) { e.preventDefault(); move(0, 1); return; }
    }

    // Esc: rull tilbake celle til original verdi (før fokus)
    if (e.key === "Escape") {
      e.preventDefault();
      const k = keyFor(r, c);
      const el = tdRefs.current.get(k);
      if (el) {
        el.textContent = editOriginal.current ?? (rowsRef.current[r]?.[colKey] ?? "");
        // Velg hele for visuell bekreftelse
        const selObj = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selObj?.removeAllRanges();
        selObj?.addRange(range);
      }
      return;
    }
  }, [move]);

  /* ---- Input commit på blur ---- */
  const onFocusCell = useCallback((r: number, c: number, colKey: string) => {
    editOriginal.current = rowsRef.current[r]?.[colKey] ?? "";
  }, []);
  const onBlurCell = useCallback((e: React.FocusEvent<HTMLDivElement>, r: number, colKey: string) => {
    const val = e.currentTarget.textContent ?? "";
    if (rowsRef.current[r]?.[colKey] === val) return;
    const next = rowsRef.current.slice();
    next[r] = { ...next[r], [colKey]: val };
    onChange(next, { type: "edit", row: r, colKey });
  }, [onChange]);

  /* ---- Seleksjon med mus (rektangel) ---- */
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

  /* ---- Row drag & drop reorder ---- */
  const dragRow = useRef<number | null>(null);
  const [overRow, setOverRow] = useState<number | null>(null);

  const onRowDragStart = (r: number) => (e: React.DragEvent) => {
    dragRow.current = r;
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.textContent = String(r + 1);
    ghost.style.padding = "4px 8px";
    ghost.style.background = "#00000088";
    ghost.style.color = "white";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, -10, -10);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const onRowDragOver = (r: number) => (e: React.DragEvent) => {
    if (dragRow.current === null) return;
    e.preventDefault();
    setOverRow(r);
  };
  const onRowDrop = (r: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragRow.current;
    dragRow.current = null;
    setOverRow(null);
    if (from === null || from === r) return;

    const next = rowsRef.current.slice();
    const [moved] = next.splice(from, 1);
    next.splice(r, 0, moved);

    onChange(next, { type: "reorder-rows", from, to: r });
  };
  const onRowDragEnd = () => {
    dragRow.current = null;
    setOverRow(null);
  };

  /* ---- Global key handling (kopier / slett / rad-inn/ut) ---- */
  const handleKeyDownGlobal = useCallback((e: React.KeyboardEvent) => {
    // Finn utvalg
    const selBox = sel ?? (active ? { r1: active.r, c1: active.c, r2: active.r, c2: active.c } : null);
    const r1 = selBox ? Math.min(selBox.r1, selBox.r2) : -1;
    const r2 = selBox ? Math.max(selBox.r1, selBox.r2) : -1;
    const c1 = selBox ? Math.min(selBox.c1, selBox.c2) : -1;
    const c2 = selBox ? Math.max(selBox.c1, selBox.c2) : -1;

    // 1) Copy (Ctrl/Cmd+C)
    if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
      if (selBox) {
        e.preventDefault();
        const lines: string[] = [];
        for (let r = r1; r <= r2; r++) {
          const row = rowsRef.current[r];
          const parts: string[] = [];
          for (let c = c1; c <= c2; c++) {
            const key = columns[c].key;
            const v = row?.[key] ?? "";
            // Escape tabs/newlines inside values
            parts.push(String(v).replace(/\t/g, " ").replace(/\r?\n/g, " "));
          }
          lines.push(parts.join("\t"));
        }
        const tsv = lines.join("\n");
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(tsv).catch(() => document.execCommand("copy"));
        } else {
          // fallback
          const ta = document.createElement("textarea");
          ta.value = tsv;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
      }
      return;
    }

    // 2) Delete/Backspace clears selection (cells only)
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selBox) {
        e.preventDefault();
        const next = rowsRef.current.slice();
        for (let r = r1; r <= r2; r++) {
          const row = { ...next[r] };
          for (let c = c1; c <= c2; c++) {
            const key = columns[c].key;
            row[key] = "";
          }
          next[r] = row;
        }
        onChange(next, { type: "edit", row: -1, colKey: "" });
      }
      return;
    }

    // 4) Ctrl+Enter: insert row below active
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (active) {
        e.preventDefault();
        const empty: Record<string, string> = {};
        for (const col of columns) empty[col.key] = "";
        const next = rowsRef.current.slice();
        const insertAt = active.r + 1;
        next.splice(insertAt, 0, empty);
        onChange(next, { type: "edit", row: insertAt, colKey: "" });
        // flytt fokus til første kolonne i ny rad
        requestAnimationFrame(() => {
          setActive({ r: insertAt, c: 0 });
          focusCell(insertAt, 0, true);
        });
      }
      return;
    }

    // 4b) Ctrl+Shift+Backspace: delete active row
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "backspace") {
      if (active && rowsRef.current.length > 0) {
        e.preventDefault();
        const next = rowsRef.current.slice();
        const delAt = clamp(active.r, 0, next.length - 1);
        next.splice(delAt, 1);
        onChange(next, { type: "edit", row: -1, colKey: "" });
        // sett fokus til raden som tok over samme posisjon
        const newR = clamp(delAt, 0, next.length - 1);
        requestAnimationFrame(() => {
          setActive({ r: newR, c: 0 });
          focusCell(newR, 0, true);
        });
      }
      return;
    }
  }, [active, sel, columns, focusCell, onChange]);

  /* ---- Render ---- */
  const cols = columns;
  const totalWidth = useMemo(() => widths.reduce((a, b) => a + b, 0), [widths]);

  const colgroup = (
    <colgroup>
      {widths.map((w, i) => (
        <col key={cols[i].key} style={{ width: w, minWidth: w, maxWidth: w }} />
      ))}
    </colgroup>
  );

  const header = (
    <thead>
      <tr>
        {cols.map((c, i) => (
          <th key={c.key} style={{ position: "sticky", top: 0, zIndex: 3 }}>
            {c.title}
            <span className="th-resizer" onMouseDown={(e) => onResizeDown(i, e)} />
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="table-wrap" onPaste={handlePaste} onKeyDown={handleKeyDownGlobal}>
      <table
        className="table"
        style={{ width: totalWidth }}
        role="grid"
        aria-rowcount={rows.length}
        aria-colcount={columns.length}
      >
        {colgroup}
        {header}
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className={overRow === r ? "tr-drag-over" : undefined}
              onDragOver={onRowDragOver(r)}
              onDrop={onRowDrop(r)}
              onDragEnd={onRowDragEnd}
              role="row"
              aria-rowindex={r + 1}
            >
              {cols.map((c, i) => {
                const k = keyFor(r, i);
                const isActive = active?.r === r && active?.c === i;
                const inSel = sel &&
                  r >= Math.min(sel.r1, sel.r2) && r <= Math.max(sel.r1, sel.r2) &&
                  i >= Math.min(sel.c1, sel.c2) && i <= Math.max(sel.c1, sel.c2);

                const isHandle = c.key === "nr";
                return (
                  <td key={c.key} role="gridcell" aria-colindex={i + 1} aria-selected={isActive || !!inSel || undefined}>
                    {isHandle ? (
                      <div className="row-handle" draggable
                        onDragStart={onRowDragStart(r)}
                        title="Dra for å flytte raden"
                      >
                        <span className="grip">⋮⋮</span>
                        <span>{row[c.key] ?? String(r + 1)}</span>
                      </div>
                    ) : (
                      <div
                        ref={(el) => { if (el) tdRefs.current.set(k, el); else tdRefs.current.delete(k); }}
                        className={`cell ${isActive ? "active" : ""} ${inSel ? "sel" : ""}`}
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={() => { setActive({ r, c: i }); onFocusCell(r, i, c.key); }}
                        onBlur={(e) => onBlurCell(e, r, c.key)}
                        onKeyDown={(e) => onKeyDownCell(e, r, i, c.key)}
                        onMouseDown={onMouseDown(r, i)}
                        onMouseEnter={() => onMouseEnter(r, i)}
                        spellCheck={false}
                      >
                        {row[c.key] ?? ""}
                      </div>
                    )}
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
