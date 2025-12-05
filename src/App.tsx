// src/App.tsx
import React, { useState, useRef, useEffect } from "react";
import TableCore from "./core/TableCore";
import type { RowData, ColumnDef } from "./core/TableTypes";
import Header from "./components/Header";
import HelpPanel from "./components/HelpPanel";
import Toolbar, { ToolbarColumn } from "./components/Toolbar";
import CalendarModal, { HolidayPeriod } from "./components/CalendarModal";
import { useI18n } from "./i18n";
import GanttPanel from "./components/GanttPanel";

import "./styles/mcl-theme.css";
import "./styles/tablecore.css";
import "./styles/header.css";
import "./styles/toolbar.css";
import "./styles/gantt.css";

/* ==== [BLOCK: Kolonnedefinisjon – standard] =========================== */

const baseColumns: ColumnDef[] = [
  { key: "kode", title: "Kode" },
  { key: "tittel", title: "Aktivitet", isTitle: true },
  { key: "fra", title: "Start", type: "date", dateRole: "start" },
  { key: "til", title: "Slutt", type: "date", dateRole: "end" },
  {
    key: "varighet",
    title: "Varighet (dager)",
    type: "number",
    summarizable: true,
    durationOf: {
      startKey: "fra",
      endKey: "til",
    },
  },
  { key: "ansvarlig", title: "Ansvarlig" },
  { key: "avhengigheter", title: "Avhengighet" },
  { key: "farge", title: "Farge" },
  { key: "merknad", title: "Merknad" },
];

/* ==== [BLOCK: Dummy-data – Progress LITE] ============================== */

const initialRows: RowData[] = [
  {
    id: "r1",
    indent: 0,
    cells: {
      kode: "1",
      tittel: "Prosjektoppstart",
      fra: "2025-03-01",
      til: "2025-03-01",
      varighet: 1,
      ansvarlig: "PM",
      farge: "#b08968",
      merknad: "Formell oppstart av prosjektet",
    },
  },
  {
    id: "r2",
    indent: 1,
    cells: {
      kode: "1.1",
      tittel: "Kickoff-møte",
      fra: "2025-03-01",
      til: "2025-03-01",
      varighet: 1,
      ansvarlig: "PM",
      avhengigheter: "",
      merknad: "Internt + kunde",
    },
  },
  {
    id: "r3",
    indent: 1,
    cells: {
      kode: "1.2",
      tittel: "Etablere fremdriftsplan",
      fra: "2025-03-01",
      til: "2025-03-03",
      varighet: 3,
      ansvarlig: "Planlegger",
      avhengigheter: "1.1",
      merknad: "",
    },
  },
  {
    id: "r4",
    indent: 0,
    cells: {
      kode: "2",
      tittel: "Prosjektering",
      fra: "2025-03-04",
      til: "2025-03-15",
      varighet: 12,
      ansvarlig: "Teknisk leder",
      farge: "#8b5e34",
      merknad: "",
    },
  },
  {
    id: "r5",
    indent: 1,
    cells: {
      kode: "2.1",
      tittel: "Funksjonsbeskrivelse",
      fra: "2025-03-04",
      til: "2025-03-08",
      varighet: 5,
      ansvarlig: "Ingeniør A",
      avhengigheter: "1.2",
    },
  },
  {
    id: "r6",
    indent: 1,
    cells: {
      kode: "2.2",
      tittel: "Koblingsskjema",
      fra: "2025-03-09",
      til: "2025-03-15",
      varighet: 7,
      ansvarlig: "Ingeniør B",
      avhengigheter: "2.1",
    },
  },
  {
    id: "r7",
    indent: 0,
    cells: {
      kode: "3",
      tittel: "Montasje og idriftsettelse",
      fra: "2025-03-20",
      til: "2025-04-05",
      varighet: 17,
      ansvarlig: "Montasjeleder",
      merknad: "",
    },
  },
  {
    id: "r8",
    indent: 1,
    cells: {
      kode: "3.1",
      tittel: "Montasje på anlegg",
      fra: "2025-03-20",
      til: "2025-03-28",
      varighet: 9,
      ansvarlig: "Montasjeteam",
      avhengigheter: "2.2",
    },
  },
  {
    id: "r9",
    indent: 1,
    cells: {
      kode: "3.2",
      tittel: "Testing og idriftsettelse",
      fra: "2025-03-29",
      til: "2025-04-05",
      varighet: 8,
      ansvarlig: "Testing",
      avhengigheter: "3.1",
    },
  },
];

const STORAGE_KEY = "mcl-progress-plan-v3";
const PROJECT_INFO_STORAGE_KEY = "mcl-progress-project-info";

function loadProjectSummaryTitle(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(PROJECT_INFO_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      projectNumber?: string;
      projectName?: string;
    };

    const number = (parsed.projectNumber || "").trim();
    const name = (parsed.projectName || "").trim();

    if (!number && !name) return undefined;
    if (number && name) return `${number} – ${name}`;
    return number || name || undefined;
  } catch {
    return undefined;
  }
}

/* ==== [BLOCK: Hjelpere – kalender -> dato-liste] ======================= */

function expandHolidayDates(periods: HolidayPeriod[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const p of periods) {
    if (!p.start || !p.end) continue;

    const start = new Date(p.start + "T00:00:00");
    const end = new Date(p.end + "T00:00:00");
    if (isNaN(+start) || isNaN(+end)) continue;

    let d = start;
    while (d <= end) {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, "0");
      const day = `${d.getDate()}`.padStart(2, "0");
      const key = `${y}-${m}-${day}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
  }

  // stabil sortering – fint for debugging om vi logger
  return out.sort();
}

/* ==== [BLOCK: App-komponent] ============================================ */

export default function App() {
  const [rows, setRows] = useState<RowData[]>(initialRows);
const [summaryTitle, setSummaryTitle] = useState<string | undefined>(
    () => loadProjectSummaryTitle()
  );
  
  // Egendefinerte kolonner utover baseColumns (for "Legg til ny kolonne")
  const [extraColumns, setExtraColumns] = useState<ColumnDef[]>([]);

  const allColumnDefs: ColumnDef[] = [...baseColumns, ...extraColumns];
  const allKeys = allColumnDefs.map((c) => c.key);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(allKeys);
  const visibleColumns = allColumnDefs.filter((c) =>
    visibleColumnKeys.includes(c.key)
  );

  // Kalender: fridager/ferier
  const [holidays, setHolidays] = useState<HolidayPeriod[]>([]);
  const [useHolidays, setUseHolidays] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  // Flate datoer som TableCore kan bruke i varighetslogikken
  const nonWorkingDates: string[] =
    useHolidays && holidays.length > 0 ? expandHolidayDates(holidays) : [];

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>("table");
  const [splitRatio, setSplitRatio] = useState<number>(0.55);
  const splitRef = useRef<HTMLDivElement | null>(null);

  const [showWeekends, setShowWeekends] = useState<boolean>(true);

    const { t } = useI18n();

  // Lytt på oppdateringer fra ProjectInfoModal (prosjektinfo)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      setSummaryTitle(loadProjectSummaryTitle());
    };

    window.addEventListener("mcl-project-info-changed", handler);
    return () => window.removeEventListener("mcl-project-info-changed", handler);
  }, []);

  const handleSplitterMouseDown = (e: React.MouseEvent) => {

    e.preventDefault();
    const container = splitRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 1;
    const startX = e.clientX;
    const startRatio = splitRatio;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      let next = startRatio + dx / width;
      if (next < 0) next = 0;
      if (next > 1) next = 1;
      setSplitRatio(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const tableWidthPct = Math.round(splitRatio * 100);
  const ganttWidthPct = 100 - tableWidthPct;

  // ==== FIL-meny handling ====
  const handleFileAction = (
    action: "new" | "open" | "save" | "print" | "export"
  ) => {
    try {
      if (action === "new") {
        setRows(initialRows);
        setExtraColumns([]);
        const freshAllDefs = [...baseColumns];
        const freshKeys = freshAllDefs.map((c) => c.key);
        setVisibleColumnKeys(freshKeys);
        setHolidays([]);
        setUseHolidays(false);
        return;
      }

      if (action === "save") {
        const payload = {
          version: 3,
          savedAt: new Date().toISOString(),
          rows,
          extraColumns,
          visibleColumnKeys,
          holidays,
          useHolidays,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return;
      }

      if (action === "open") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);

        if (parsed && Array.isArray(parsed.rows)) {
          setRows(parsed.rows as RowData[]);
        }
        if (parsed && Array.isArray(parsed.extraColumns)) {
          setExtraColumns(parsed.extraColumns as ColumnDef[]);
        } else {
          setExtraColumns([]);
        }
        if (parsed && Array.isArray(parsed.visibleColumnKeys)) {
          setVisibleColumnKeys(parsed.visibleColumnKeys as string[]);
        } else {
          const merged = [
            ...baseColumns,
            ...((parsed.extraColumns as ColumnDef[]) || []),
          ];
          setVisibleColumnKeys(merged.map((c) => c.key));
        }
        if (parsed && Array.isArray(parsed.holidays)) {
          setHolidays(parsed.holidays as HolidayPeriod[]);
        } else {
          setHolidays([]);
        }
        if (parsed && typeof parsed.useHolidays === "boolean") {
          setUseHolidays(parsed.useHolidays as boolean);
        } else {
          setUseHolidays(false);
        }
        return;
      }

      if (action === "print") {
        window.print();
        return;
      }

      if (action === "export") {
        const payload = {
          version: 3,
          exportedAt: new Date().toISOString(),
          rows,
          extraColumns,
          visibleColumnKeys,
          holidays,
          useHolidays,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "manage-progress-plan.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
    } catch (err) {
      console.error("File action error:", err);
    }
  };

  // ==== TABELL: toggle av enkeltkolonner ====
  const handleToggleColumn = (key: string) => {
    setVisibleColumnKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // ==== TABELL: Legg til ny kolonne ====
  const handleTableAction = (action: "addColumn") => {
    if (action === "addColumn") {
      const existingKeys = new Set(
        [...baseColumns, ...extraColumns].map((c) => c.key)
      );
      let idx = 1;
      while (existingKeys.has(`kolonne${idx}`)) {
        idx++;
      }
      const newCol: ColumnDef = {
        key: `kolonne${idx}`,
        title: `Kolonne ${idx}`,
      };
      const nextExtra = [...extraColumns, newCol];
      setExtraColumns(nextExtra);
      setVisibleColumnKeys((prev) => [...prev, newCol.key]);
    }
  };

  // ==== TABELL: Gi nytt navn til egendefinert kolonne ====
  const handleRenameColumn = (key: string, newTitle: string) => {
    setExtraColumns((prev) =>
      prev.map((col) =>
        col.key === key
          ? {
              ...col,
              title: newTitle,
            }
          : col
      )
    );
  };

  // Data for Toolbar-kolonnemenyen
  const extraKeySet = new Set(extraColumns.map((c) => c.key));
  const toolbarColumns: ToolbarColumn[] = allColumnDefs.map((c) => ({
    key: c.key,
    title: c.title,
    isCustom: extraKeySet.has(c.key),
  }));

  return (
    <div className="app-shell">
      <Header onToggleHelp={() => setHelpOpen(true)} />

      {/* Sticky toolbar rett under header */}
      <Toolbar
        current={activeView}
        onSelect={setActiveView}
        onFileAction={handleFileAction}
        tableColumns={toolbarColumns}
        visibleColumnKeys={visibleColumnKeys}
        onToggleColumn={handleToggleColumn}
        onTableAction={handleTableAction}
        onRenameColumn={handleRenameColumn}
        onOpenCalendar={() => setCalendarOpen(true)}
        showWeekends={showWeekends}
        onToggleWeekends={() => setShowWeekends((prev) => !prev)}
      />

      <main className="app-main">
        <section className="app-section">
          <div className="app-split" ref={splitRef}>
            {/* Venstre: Tabell */}
            <div
              className="app-panel app-panel--table"
              style={{ flexBasis: `${tableWidthPct}%` }}
            >
              <div className="app-panel-inner app-panel-inner--table">
                <TableCore
                  columns={visibleColumns}
                  rows={rows}
                  onChange={setRows}
                  showSummary
                  summaryTitle={summaryTitle}
                  // Ny: fridager/ferier som skal trekkes fra varighet
                  nonWorkingDates={nonWorkingDates}
                />

              </div>
            </div>

            {/* Vertikal splitter */}
            <div
              className="app-splitter"
              onMouseDown={handleSplitterMouseDown}
              aria-label="Juster bredde mellom tabell og Gantt"
            >
              <div className="app-splitter-grip" />
            </div>

            {/* Høyre: Gantt */}
            <div
              className="app-panel app-panel--gantt"
              style={{ flexBasis: `${ganttWidthPct}%` }}
            >
              <div className="app-panel-inner app-panel-inner--gantt">
                <GanttPanel
                  rows={rows}
                  columns={visibleColumns}
                  startKey="fra"
                  endKey="til"
                  showWeekends={showWeekends}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">©2025 Morning Coffee Labs</div>
      </footer>

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      <CalendarModal
        open={calendarOpen}
        holidays={holidays}
        useHolidays={useHolidays}
        onChangeHolidays={setHolidays}
        onChangeUseHolidays={setUseHolidays}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
}
