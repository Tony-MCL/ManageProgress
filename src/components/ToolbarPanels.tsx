// src/components/ToolbarPanels.tsx
import React from "react";

export type PrintMode = "table" | "gantt" | "both";

export function FilePanel({
  open,
  onClose,
  onPrint,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  onPrint: (mode: PrintMode) => void;
  onClear: () => void;
}) {
  if (!open) return null;
  return (
    <div className="ribbon-panel" role="region" aria-label="Filvalg">
      <div className="ribbon-panel-inner">
        <div className="rp-section">
          <div className="rp-title">Utskrift</div>
          <div className="rp-body">
            <button onClick={() => onPrint("table")}>Kun tabell</button>
            <button onClick={() => onPrint("gantt")}>Kun Gantt</button>
            <button onClick={() => onPrint("both")}>Tabell + Gantt</button>
          </div>
        </div>
        <div className="rp-divider" />
        <div className="rp-section">
          <div className="rp-title">Rydding</div>
          <div className="rp-body">
            <button onClick={onClear}>Tøm tabell</button>
          </div>
        </div>
        <div className="rp-spacer" />
        <button className="rp-close" onClick={onClose} aria-label="Lukk">Lukk ✕</button>
      </div>
    </div>
  );
}
