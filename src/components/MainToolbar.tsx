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

  // Fil-aksjoner
  onPrint: () => void;
  onClearTable: () => void;

  // (Full-versjon – valgfritt senere)
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
    onPrint, onClearTable, onOpen, onNew, onSave, onExport
  } = props;

  const zoomIn  = () => setPxPerDay(Math.min(80, Math.round(pxPerDay + 5)));
  const zoomOut = () => setPxPerDay(Math.max(8,  Math.round(pxPerDay - 5)));
  const zoomReset = () => setPxPerDay(20);
  const preset = (p: number) => () => setGanttPercent(p);

  // Kan brukes til å disable knapper (ikke bare skjule)
  const canPrint = useFeature("file.print");
  const canClear = useFeature("file.clear");

  return (
    <div className="ribbon" role="toolbar" aria-label="Hovedverktøylinje">
      {/* Fil */}
      <div className="group">
        <div className="group-title">Fil</div>
        <div className="group-body">
          {/* LITE */}
          <button title="Skriv ut (papir eller PDF)" onClick={onPrint} disabled={!canPrint}>Skriv ut</button>
          <button title="Tøm alle rader i tabellen" onClick={onClearTable} disabled={!canClear}>Tøm tabell</button>

          {/* FULL – vises bare når feature er aktiv */}
          <FeatureGate feature="file.open">
            <button title="Åpne" onClick={onOpen}>Åpne</button>
          </FeatureGate>
          <FeatureGate feature="file.new">
            <button title="Ny" onClick={onNew}>Ny</button>
          </FeatureGate>
          <FeatureGate feature="file.save">
            <button title="Lagre" onClick={onSave}>Lagre</button>
          </FeatureGate>
          <FeatureGate feature="file.export">
            <button title="Eksporter" onClick={onExport}>Eksporter</button>
          </FeatureGate>
        </div>
      </div>

      {/* Rediger */}
      <div className="group">
        <div className="group-title">Rediger</div>
        <div className="group-body">
          <button title="Legg til rad (Ctrl+Enter)" onClick={onAddRow}>+ Rad</button>
          <button title="Slett siste rad" onClick={onDeleteLast}>− Rad</button>
        </div>
      </div>

      {/* Visning */}
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

      {/* Gantt */}
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

      {/* Data (placeholder) */}
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
