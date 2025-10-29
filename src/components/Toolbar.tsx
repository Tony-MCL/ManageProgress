// src/components/Toolbar.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React from "react";
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Props] BEGIN ==== */
export type ToolbarProps = {
  pxPerDay: number;
  setPxPerDay: (v: number) => void;
  showToday: boolean;
  setShowToday: (v: boolean) => void;
};
/* ==== [BLOCK: Props] END ==== */

export default function Toolbar({ pxPerDay, setPxPerDay, showToday, setShowToday }: ToolbarProps) {
  const zoomIn = () => setPxPerDay(Math.min(80, Math.round(pxPerDay + 5)));
  const zoomOut = () => setPxPerDay(Math.max(8, Math.round(pxPerDay - 5)));
  const reset = () => setPxPerDay(20);

  return (
    <div className="toolbar">
      <button onClick={zoomOut} title="Zoom ut (Gantt)">−</button>
      <button onClick={zoomIn} title="Zoom inn (Gantt)">+</button>
      <button onClick={reset} title="Reset zoom">Reset</button>
      <label style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" checked={showToday} onChange={(e) => setShowToday(e.target.checked)} />
        Vis i dag-linje
      </label>
    </div>
  );
}
