// src/components/MainToolbar.tsx
import React from "react";
import { FeatureGate, useFeature } from "../core/featureFlags";

export type MainToolbarProps = {
  onAddRow: () => void;
  onDeleteLast: () => void;

  pxPerDay: number;
  setPxPerDay: (v: number) => void;
  showToday: boolean;
  setShowToday: (v: boolean) => void;

  ganttPercent: number;
  setGanttPercent: (p: number) => void;

  // LITE
  onPrint: () => void;        // Åpner Fil-panelet
  onClearTable: () => void;   // Brukes også inne i panelet

  // Panel toggles
  onToggleFilePanel: () => void;
  filePanelOpen: boolean;

  // FULL – fremtid
  onOpen?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  onExport?: () => void;
};

export default function MainToolbar(props: MainToolbarProps) {
  const {
    onAddRow, onDeleteLast,
    pxPerDay, setPxPerDay, showToday, setShowToday,
    ganttPercent, setGanttPercent,
    onClearTable,
    onToggleFilePanel, filePanelOpen,
    onOpen, onNew, onSave, onExport,
  } = props;

  const zoomIn  = () => setPxPerDay(Math.min(80, Math.round(pxPerDay + 5)));
  const zoomOut = () => setPxPerDay(Math.max(8,  Math.round(pxPerDay - 5)));
  const zoomReset = () => setPxPerDay(20);
  const preset = (p: number) => () => setGanttPercent(p);

  const canPrint = useFeature("file.print");
  const canClear = useFeature("file.clear");

  return (
    <div className="ribbon" role="toolbar" aria-label="Hovedverktøylinje">
      {/* FIL */}
      <div className={`group ${filePanelOpen ? "group-active" : ""}`}>
        <div className="group-title">Fil</div>
        <div className="group-body">
          {/* I LITE: denne knappen åpner panelet med printvalg */}
          <button title="Skriv ut" onClick={onToggleFilePanel} disabled={!canPrint}>
            Skriv ut
          </button>
          <button title="Tøm alle rader i tabellen" onClick={onClearTable} disabled={!canClear}>
            Tøm tabell
          </button>

          {/* FULL – vises kun i full edition (kommer senere) */}
          <FeatureGate feature="file.new">
            <button title="Ny" onClick={onNew}>Ny</button>
          </FeatureGate>
          <FeatureGate feature="file.open">
            <button title="Åpne" onClick={onOpen}>Åpne</button>
          </FeatureGate>
          <FeatureGate feature="file.save">
            <button title="Lagre" onClick={onSave}>Lagre</button>
          </FeatureGate>
          <FeatureGate feature="file.export">
            <button title="Eksporter" onClick={onExport}>Eksporter</button>
          </FeatureGate>
        </div>
      </div>

      {/* REDIGER */}
      <div className="group">
        <div className="group-title">Rediger</div>
        <div className="group-body">
          <button title="Legg til rad (Ctrl+Enter)" onClick={onAddRow}>+ Rad</button>
          <button title="Slett siste rad" onClick={onDeleteLast}>− Rad</button>
        </div>
      </div>

      {/* VISNING */}
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

      {/* GANTT */}
      <div className="group">
        <div className="group-title">Gantt</div>
        <div className="group-body">
          <div className="seg">
            <button title="Zoom ut" onClick={zoomOut}>−</button>
            <button title="Zoom inn" onClick={zoomIn}>+</button>
            <button title="Reset zoom" onClick={zoomReset}>Reset</button>
          </div>
          <label className="chk" title="Vis vertikal i dag-linje">
            <input type="checkbox" checked={showToday} onChange={(e) => setShowToday(e.target.checked)} />
            I dag
          </label>
        </div>
      </div>

      {/* DATA (placeholder) */}
      <div className="group">
        <div className="group-title">Data</div>
        <div className="group-body">
          <button disabled title="Sortering (kommer)">Sorter</button>
          <button disabled title="Filter (kommer)">Filter</button>
        </div>
      </div>
    </div>
  );
}
