// src/components/PrintModal.tsx
import React, { useState } from "react";

export type PrintMode = "table" | "gantt" | "both";

export default function PrintModal({
  open,
  onCancel,
  onConfirm,
  initial = "both",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (mode: PrintMode) => void;
  initial?: PrintMode;
}) {
  const [mode, setMode] = useState<PrintMode>(initial);
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ width: "min(520px, 92vw)" }}>
        <div className="modal-header">Skriv ut</div>
        <div className="modal-body">
          <div style={{ display: "grid", gap: 10 }}>
            <label><input type="radio" name="pmode" checked={mode === "table"} onChange={() => setMode("table")} /> Kun tabell</label>
            <label><input type="radio" name="pmode" checked={mode === "gantt"} onChange={() => setMode("gantt")} /> Kun Gantt</label>
            <label><input type="radio" name="pmode" checked={mode === "both"} onChange={() => setMode("both")} /> Tabell + Gantt</label>
            <small style={{ opacity: .7 }}>Sammendragslinjen skrives alltid ut.</small>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Avbryt</button>
          <button className="btn-primary" onClick={() => onConfirm(mode)}>Skriv ut</button>
        </div>
      </div>
    </div>
  );
}
