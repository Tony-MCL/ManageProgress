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
  const [fileOpen, setFileOpen]       = useState(false);
  const [tableOpen, setTableOpen]     = useState(false);
  const [viewOpen, setViewOpen]       = useState(false);
  const [ganttOpen, setGanttOpen]     = useState(false);
  const [dataOpen, setDataOpen]       = useState(false);

  const fileRef  = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const viewRef  = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<HTMLDivElement | null>(null);
  const dataRef  = useRef<HTMLDivElement | null>(null);

  // Klikk utenfor → lukk menyene
  useEffect(() => {
    if (!fileOpen && !tableOpen && !viewOpen && !ganttOpen && !dataOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fileRef.current  && fileRef.current.contains(t))  return;
      if (tableRef.current && tableRef.current.contains(t)) return;
      if (viewRef.current  && viewRef.current.contains(t))  return;
      if (ganttRef.current && ganttRef.current.contains(t)) return;
      if (dataRef.current  && dataRef.current.contains(t))  return;
      setFileOpen(false); setTableOpen(false); setViewOpen(false); setGanttOpen(false); setDataOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [fileOpen, tableOpen, viewOpen, ganttOpen, dataOpen]);

  // Hjelpere
  const zoomIn  = () => setPxPerDay(Math.min(80, Math.round(pxPerDay + 5)));
  const zoomOut = () => setPxPerDay(Math.max(8,  Math.round(pxPerDay - 5)));
  const zoomReset = () => setPxPerDay(20);

  const canPrint = useFeature("file.print");
  const canClear = useFeature("file.clear");

  const choosePrint = (mode: PrintMode) => {
    onPrintMode(mode);
    setFileOpen(false);
  };

  const presetSplit = (p: number) => () => {
    setGanttPercent(p);
    setViewOpen(false);
  };

  return (
    <div className="ribbon" role="toolbar" aria-label="Hovedverktøylinje">
      {/* FIL */}
      <div className="group">
        <div className="group-title">Fil</div>
        <div className="group-body">
          <div className="menu-anchor" ref={fileRef}>
            <button
              title="Skriv ut"
              onClick={() => setFileOpen(v => !v)}
              disabled={!canPrint}
              aria-haspopup="menu"
              aria-expanded={fileOpen}
            >
              Skriv ut ▾
            </button>
            {fileOpen && (
              <div className="menu" role="menu" aria-label="Utskriftsvalg">
                <button role="menuitem" onClick={() => choosePrint("table")}>Kun tabell</button>
                <button role="menuitem" onClick={() => choosePrint("gantt")}>Kun Gantt</button>
                <button role="menuitem" onClick={() => choosePrint("both")}>Tabell + Gantt</button>
                <div className="menu-sep" />
                <button role="menuitem" onClick={() => { onClearTable(); setFileOpen(false); }} disabled={!canClear}>
                  Tøm tabell
                </button>
              </div>
            )}
          </div>

          {/* FULL – vises kun i full edition (kommer senere) */}
          <FeatureGate feature="file.new"><button title="Ny" onClick={onNew}>Ny</button></FeatureGate>
          <FeatureGate feature="file.open"><button title="Åpne" onClick={onOpen}>Åpne</button></FeatureGate>
          <FeatureGate feature="file.save"><button title="Lagre" onClick={onSave}>Lagre</button></FeatureGate>
          <FeatureGate feature="file.export"><button title="Eksporter" onClick={onExport}>Eksporter</button></FeatureGate>
        </div>
      </div>

      {/* TABELL */}
      <div className="group">
        <div className="group-title">Tabell</div>
        <div className="group-body">
          {/* Tabell ▾ */}
          <div className="menu-anchor" ref={tableRef}>
            <button
              title="Tabell-handlinger"
              onClick={() => setTableOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={tableOpen}
            >
              Tabell ▾
            </button>
            {tableOpen && (
              <div className="menu" role="menu" aria-label="Tabellvalg">
                <button role="menuitem" onClick={() => { onAddRow(); setTableOpen(false); }}>Legg til rad</button>
                <button role="menuitem" onClick={() => { onDeleteLast(); setTableOpen(false); }}>Fjern siste rad</button>
                <div className="menu-sep" />
                <button role="menuitem" onClick={() => { onClearTable(); setTableOpen(false); }}>Tøm tabell</button>
              </div>
            )}
          </div>

          {/* Visning ▾ */}
          <div className="menu-anchor" ref={viewRef}>
            <button
              title="Visningsvalg"
              onClick={() => setViewOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={viewOpen}
            >
              Visning ▾
            </button>
            {viewOpen && (
              <div className="menu" role="menu" aria-label="Visningsvalg">
                <button role="menuitem" onClick={presetSplit(0)}>Bare tabell (0%)</button>
                <button role="menuitem" onClick={presetSplit(40)}>60% tabell / 40% Gantt</button>
                <button role="menuitem" onClick={presetSplit(60)}>40% tabell / 60% Gantt</button>
                <button role="menuitem" onClick={presetSplit(100)}>Bare Gantt (100%)</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GANTT */}
      <div className="group">
        <div className="group-title">Gantt</div>
        <div className="group-body">
          {/* Gantt ▾ */}
          <div className="menu-anchor" ref={ganttRef}>
            <button
              title="Gantt-alternativer"
              onClick={() => setGanttOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={ganttOpen}
            >
              Gantt ▾
            </button>
            {ganttOpen && (
              <div className="menu" role="menu" aria-label="Ganttvalg">
                <button role="menuitem" onClick={() => { zoomOut(); setGanttOpen(false); }}>Zoom ut</button>
                <button role="menuitem" onClick={() => { zoomIn(); setGanttOpen(false); }}>Zoom inn</button>
                <button role="menuitem" onClick={() => { zoomReset(); setGanttOpen(false); }}>Reset zoom</button>
                <div className="menu-sep" />
                <label className="menu-item" role="menuitemcheckbox" aria-checked={showToday} style={{ padding: "6px 8px", display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={showToday} onChange={(e) => setShowToday(e.target.checked)} />
                  I dag
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA */}
      <div className="group">
        <div className="group-title">Data</div>
        <div className="group-body">
          <div className="menu-anchor" ref={dataRef}>
            <button
              title="Data"
              onClick={() => setDataOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={dataOpen}
            >
              Data ▾
            </button>
            {dataOpen && (
              <div className="menu" role="menu" aria-label="Datavalg">
                <button role="menuitem" disabled>Sorter (kommer)</button>
                <button role="menuitem" disabled>Filter (kommer)</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
