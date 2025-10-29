// src/components/MainToolbar.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React from "react";
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Props] BEGIN ==== */
export type MainToolbarProps = {
  // Data/rader
  onAddRow: () => void;
  onDeleteLast: () => void;

  // Gantt
  pxPerDay: number;
  setPxPerDay: (v: number) => void;
  showToday: boolean;
  setShowToday: (v: boolean) => void;

  // Split (Tabell vs Gantt)
  ganttPercent: number;            // 0–100 (høyre overlay)
  setGanttPercent: (p: number) => void;

  // (plassholdere for senere funksjoner)
  onSave?: () => void;
  onExport?: () => void;
};
/* ==== [BLOCK: Props] END ==== */

export default function MainToolbar({
  onAddRow,
  onDeleteLast,
  pxPerDay,
  setPxPerDay,
  showToday,
  setShowToday,
  ganttPercent,
  setGanttPercent,
  onSave,
  onExport,
}: MainToolbarProps) {
  /* ==== [BLOCK: Handlers] BEGIN ==== */
  const zoomIn  = () => setPxPerDay(Math.min(80, Math.round(pxPerDay + 5)));
  const zoomOut = () => setPxPerDay(Math.max(8,  Math.round(pxPerDay - 5)));
  const zoomReset = () => setPxPerDay(20);

  const preset = (p: number) => () => setGanttPercent(p);
  /* ==== [BLOCK: Handlers] END ==== */

  return (
    <div className="ribbon" role="toolbar" aria-label="Hovedverktøylinje">
      {/* ==== [BLOCK: Group – Fil] BEGIN ==== */}
      <div className="group">
        <div className="group-title">Fil</div>
        <div className="group-body">
          <button title="Lagre (placeholder)" onClick={onSave}>Lagre</button>
          <button title="Eksporter (placeholder)" onClick={onExport}>Eksporter</button>
        </div>
      </div>
      {/* ==== [BLOCK: Group – Fil] END ==== */}

      {/* ==== [BLOCK: Group – Rediger] BEGIN ==== */}
      <div className="group">
        <div className="group-title">Rediger</div>
        <div className="group-body">
          <button title="Legg til rad (Ctrl+Enter)" onClick={onAddRow}>+ Rad</button>
          <button title="Slett siste rad" onClick={onDeleteLast}>− Rad</button>
        </div>
      </div>
      {/* ==== [BLOCK: Group – Rediger] END ==== */}

      {/* ==== [BLOCK: Group – Visning] BEGIN ==== */}
      <div className="group">
        <div className="group-title">Visning</div>
        <div className="group-body">
          <div className="seg">
            <button title="Bare tabell" onClick={preset(0)}>Tabell</button>
            <button title="60/40 (standard)" onClick={preset(40)}>60/40</button>
            <button title="40/60" onClick={preset(60)}>40/60</button>
            <button title="Bare Gantt" onClick={preset(100)}>Gantt</button>
          </div>
        </div>
      </div>
      {/* ==== [BLOCK: Group – Visning] END ==== */}

      {/* ==== [BLOCK: Group – Gantt] BEGIN ==== */}
      <div className="group">
        <div className="group-title">Gantt</div>
        <div className="group-body">
          <div className="seg">
            <button title="Zoom ut" onClick={zoomOut}>−</button>
            <button title="Zoom inn" onClick={zoomIn}>+</button>
            <button title="Reset zoom" onClick={zoomReset}>Reset</button>
          </div>
          <label className="chk" title="Vis vertikal i dag-linje">
            <input
              type="checkbox"
              checked={showToday}
              onChange={(e) => setShowToday(e.target.checked)}
            />
            I dag
          </label>
        </div>
      </div>
      {/* ==== [BLOCK: Group – Gantt] END ==== */}

      {/* ==== [BLOCK: Group – Data (plassholder)] BEGIN ==== */}
      <div className="group">
        <div className="group-title">Data</div>
        <div className="group-body">
          <button disabled title="Sortering (kommer)">Sorter</button>
          <button disabled title="Filter (kommer)">Filter</button>
        </div>
      </div>
      {/* ==== [BLOCK: Group – Data] END ==== */}
    </div>
  );
}
