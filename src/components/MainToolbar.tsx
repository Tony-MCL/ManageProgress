// src/components/MainToolbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { FeatureGate, useFeature } from "../core/featureFlags";

export type PrintMode = "table" | "gantt" | "both";

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
  ganttPercent: number;
  setGanttPercent: (p: number) => void;

  // LITE
  onClearTable: () => void;
  onPrintMode: (mode: PrintMode) => void;

  // (bakoverkomp. – ignoreres nå)
  onPrint?: () => void;
  onToggleFilePanel?: () => void;
  filePanelOpen?: boolean;

  // FULL (senere)
  onOpen?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  onExport?: () => void;
};

export default function MainToolbar(props: MainToolbarProps) {
  const {
    onAddRow, onDeleteLast,
    pxPerDay, setPxPerDay,
    showToday, setShowToday,
    ganttPercent, setGanttPercent,
    onClearTable, onPrintMode,
    onOpen, onNew, onSave, onExport,
  } = props;

  // Dropdown-stater
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const fileBtnRef = useRef<HTMLDivElement | null>(null);
  const tableBtnRef = useRef<HTMLDivElement | null>(null);

  // Klikk utenfor → lukk menyer
  useEffect(() => {
    if (!fileMenuOpen && !tableMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fileBtnRef.current && fileBtnRef.current.contains(t)) return;
      if (tableBtnRef.current && tableBtnRef.current.contains(t)) return;
      setFileMenuOpen(false);
      setTableMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [fileMenuOpen, tableMenuOpen]);

  const zoomIn  = () => setPxPerDay(Math.min(80, Math.round(pxPerDay + 5)));
  const zoomOut = () => setPxPerDay(Math.max(8,  Math.round(pxPerDay - 5)));
  const zoomReset = () => setPxPerDay(20);

  const canPrint = useFeature("file.print");
  const canClear = useFeature("file.clear");

  const choosePrint = (mode: PrintMode) => {
    onPrintMode(mode);
    setFileMenuOpen(false);
  };

  // Visnings-presets
  const preset = (p: number) => () => {
    setGanttPercent(p);
    setTableMenuOpen(false);
  };

  return (
    <div className="ribbon" role="toolbar" aria-label="Hovedverktøylinje">
      {/* FIL */}
      <div className="group">
        <div className="group-title">Fil</div>
        <div className="group-body">

          {/* Print dropdown */}
          <div className="menu-anchor" ref={fileBtnRef}>
            <button
              title="Skriv ut"
              onClick={() => setFileMenuOpen(v => !v)}
              disabled={!canPrint}
              aria-haspopup="menu"
              aria-expanded={fileMenuOpen}
            >
              Skriv ut ▾
            </button>

            {fileMenuOpen && (
              <div className="menu" role="menu" aria-label="Utskriftsvalg">
                <button role="menuitem" onClick={() => choosePrint("table")}>Kun tabell</button>
                <button role="menuitem" onClick={() => choosePrint("gantt")}>Kun Gantt</button>
                <button role="menuitem" onClick={() => choosePrint("both")}>Tabell + Gantt</button>
                <div className="menu-sep" />
                <button role="menuitem" onClick={() => { onClearTable(); setFileMenuOpen(false); }} disabled={!canClear}>
                  Tøm tabell
                </button>
              </div>
            )}
          </div>

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

      {/* TABELL (inkluderer tidligere Rediger + Visning) */}
      <div className="group">
        <div className="group-title">Tabell</div>
        <div className="group-body">

          {/* Tabell-dropdown */}
          <div className="menu-anchor" ref={tableBtnRef}>
            <button
              title="Tabell-handlinger og visning"
              onClick={() => setTableMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={tableMenuOpen}
            >
              Tabell ▾
            </button>

            {tableMenuOpen && (
              <div className="menu" role="menu" aria-label="Tabellvalg">
                {/* Radhandlinger */}
                <button role="menuitem" onClick={() => { onAddRow(); setTableMenuOpen(false); }}>
                  Legg til rad
                </button>
                <button role="menuitem" onClick={() => { onDeleteLast(); setTableMenuOpen(false); }}>
                  Fjern siste rad
                </button>
                <div className="menu-sep" />
                <button role="menuitem" onClick={() => { onClearTable(); setTableMenuOpen(false); }}>
                  Tøm tabell
                </button>

                {/* Visning */}
                <div className="menu-sep" />
                <div style={{ padding: "4px 8px", fontSize: 12, opacity: .7 }}>Visning</div>
                <button role="menuitem" onClick={preset(0)}>Bare tabell (0%)</button>
                <button role="menuitem" onClick={preset(40)}>60% tabell / 40% Gantt</button>
                <button role="menuitem" onClick={preset(60)}>40% tabell / 60% Gantt</button>
                <button role="menuitem" onClick={preset(100)}>Bare Gantt (100%)</button>
              </div>
            )}
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
