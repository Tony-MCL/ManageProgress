// src/components/Toolbar.tsx
import React, { useState, useRef, useEffect } from "react";
import "../styles/toolbar.css";

type FileAction = "new" | "open" | "save" | "print" | "export";
type TableAction = "addColumn";

export type ToolbarColumn = {
  key: string;
  title: string;
  isCustom?: boolean; // true for nye/egendefinerte kolonner
};

type ToolbarProps = {
  current: string;
  onSelect: (id: string) => void;
  onFileAction?: (action: FileAction) => void;

  // Tabell-kolonner (for menyen)
  tableColumns: ToolbarColumn[];
  visibleColumnKeys: string[];
  onToggleColumn: (key: string) => void;
  onTableAction?: (action: TableAction) => void;
  onRenameColumn?: (key: string, newTitle: string) => void;

  // Kalender
  onOpenCalendar?: () => void;
  showWeekends?: boolean;
  onToggleWeekends?: () => void;
};

type MenuId = "file" | "table" | "gantt" | "calendar" | "project" | null;

type Refs = {
  fileBtn: HTMLButtonElement | null;
  tableBtn: HTMLButtonElement | null;
  ganttBtn: HTMLButtonElement | null;
  calendarBtn: HTMLButtonElement | null;
  projectBtn: HTMLButtonElement | null;
  fileMenu: HTMLDivElement | null;
  tableMenu: HTMLDivElement | null;
  ganttMenu: HTMLDivElement | null;
  calendarMenu: HTMLDivElement | null;
  projectMenu: HTMLDivElement | null;
};

export default function Toolbar({
  current,
  onSelect,
  onFileAction,
  tableColumns,
  visibleColumnKeys,
  onToggleColumn,
  onTableAction,
  onRenameColumn,
  onOpenCalendar,
  showWeekends = true,
  onToggleWeekends,
}: ToolbarProps) {
  // === Meny-states ===
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [ganttMenuOpen, setGanttMenuOpen] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const [activeMenu, setActiveMenu] = useState<MenuId>(null);

  const refs = useRef<Refs>({
    fileBtn: null,
    tableBtn: null,
    ganttBtn: null,
    calendarBtn: null,
    projectBtn: null,
    fileMenu: null,
    tableMenu: null,
    ganttMenu: null,
    calendarMenu: null,
    projectMenu: null,
  });

  const setRef =
    <K extends keyof Refs>(key: K) =>
    (el: Refs[K]) => {
      refs.current[key] = el;
    };

  const closeAll = () => {
    setFileMenuOpen(false);
    setTableMenuOpen(false);
    setGanttMenuOpen(false);
    setCalendarMenuOpen(false);
    setProjectMenuOpen(false);
    setActiveMenu(null);
  };

  const toggle = (id: MenuId) => {
    if (activeMenu === id) {
      closeAll();
      return;
    }

    closeAll();
    setActiveMenu(id);

    if (id === "file") setFileMenuOpen(true);
    if (id === "table") setTableMenuOpen(true);
    if (id === "gantt") setGanttMenuOpen(true);
    if (id === "calendar") setCalendarMenuOpen(true);
    if (id === "project") setProjectMenuOpen(true);
  };

  // Lukk menyer ved klikk utenfor både knapper OG menyer
  useEffect(() => {
    const handler = (evt: MouseEvent) => {
      const target = evt.target as Node;

      const {
        fileBtn,
        tableBtn,
        ganttBtn,
        calendarBtn,
        projectBtn,
        fileMenu,
        tableMenu,
        ganttMenu,
        calendarMenu,
        projectMenu,
      } = refs.current;

      const isInside = (el: HTMLElement | null) =>
        !!el && el.contains(target);

      const clickedInsideSomething =
        isInside(fileBtn) ||
        isInside(tableBtn) ||
        isInside(ganttBtn) ||
        isInside(calendarBtn) ||
        isInside(projectBtn) ||
        isInside(fileMenu) ||
        isInside(tableMenu) ||
        isInside(ganttMenu) ||
        isInside(calendarMenu) ||
        isInside(projectMenu);

      if (!clickedInsideSomething) {
        closeAll();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isVisible = (key: string) => visibleColumnKeys.includes(key);

  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (col: ToolbarColumn) => {
    setRenamingKey(col.key);
    setRenameValue(col.title);
  };

  const commitRename = () => {
    if (renamingKey && onRenameColumn) {
      const trimmed = renameValue.trim();
      if (trimmed) {
        onRenameColumn(renamingKey, trimmed);
      }
    }
    setRenamingKey(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingKey(null);
    setRenameValue("");
  };

  return (
    <nav className="mcl-toolbar">
      <div className="mcl-toolbar-inner">
        {/* ================================================================================= */}
        {/*  FIL-MENY  */}
        {/* ================================================================================= */}
        <div className="toolbar-item">
          <button
            ref={setRef("fileBtn")}
            className={
              current === "file"
                ? "mcl-toolbar-btn mcl-toolbar-btn--active"
                : "mcl-toolbar-btn"
            }
            onClick={() => {
              onSelect("file");
              toggle("file");
            }}
          >
            Fil
          </button>

          {fileMenuOpen && (
            <div className="file-menu" ref={setRef("fileMenu")}>
              <div
                className="file-menu-item"
                onClick={() => onFileAction && onFileAction("new")}
              >
                Ny plan
              </div>
              <div
                className="file-menu-item"
                onClick={() => onFileAction && onFileAction("open")}
              >
                Åpne plan…
              </div>
              <div
                className="file-menu-item"
                onClick={() => onFileAction && onFileAction("save")}
              >
                Lagre plan
              </div>
              <div
                className="file-menu-item"
                onClick={() => onFileAction && onFileAction("print")}
              >
                Skriv ut…
              </div>
              <div
                className="file-menu-item"
                onClick={() => onFileAction && onFileAction("export")}
              >
                Eksporter til JSON…
              </div>
            </div>
          )}
        </div>

        {/* ================================================================================= */}
        {/*  TABELL-MENY  */}
        {/* ================================================================================= */}
        <div className="toolbar-item">
          <button
            ref={setRef("tableBtn")}
            className={
              current === "table"
                ? "mcl-toolbar-btn mcl-toolbar-btn--active"
                : "mcl-toolbar-btn"
            }
            onClick={() => {
              onSelect("table");
              toggle("table");
            }}
          >
            Tabell
          </button>

          {tableMenuOpen && (
            <div className="file-menu" ref={setRef("tableMenu")}>
              <div className="file-menu-header">Kolonner</div>

              {tableColumns.map((col) => {
                const checked = isVisible(col.key);
                const editing = renamingKey === col.key;

                if (editing) {
                  return (
                    <div
                      key={col.key}
                      className="file-menu-item file-menu-item--rename"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitRename();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelRename();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={col.key}
                    className="file-menu-item"
                    onClick={() => onToggleColumn(col.key)}
                  >
                    <span className="file-menu-check">
                      {checked ? "✓" : " "}
                    </span>
                    <span className="file-menu-label">{col.title}</span>
                    {col.isCustom && (
                      <button
                        className="file-menu-rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(col);
                        }}
                      >
                        Endre navn
                      </button>
                    )}
                  </div>
                );
              })}

              <div className="file-menu-divider" />

              <div
                className="file-menu-item"
                onClick={() => onTableAction && onTableAction("addColumn")}
              >
                + Legg til ny kolonne
              </div>
            </div>
          )}
        </div>

        {/* ================================================================================= */}
        {/*  GANTT-MENY  */}
        {/* ================================================================================= */}
        <div className="toolbar-item">
          <button
            ref={setRef("ganttBtn")}
            className={
              current === "gantt"
                ? "mcl-toolbar-btn mcl-toolbar-btn--active"
                : "mcl-toolbar-btn"
            }
            onClick={() => {
              onSelect("gantt");
              toggle("gantt");
            }}
          >
            Gantt
          </button>

          {ganttMenuOpen && (
            <div className="file-menu" ref={setRef("ganttMenu")}>
              <div className="file-menu-item">Visningsvalg (kommer)</div>
            </div>
          )}
        </div>

        {/* ================================================================================= */}
        {/*  KALENDER-MENY  */}
        {/* ================================================================================= */}
        <div className="toolbar-item">
          <button
            ref={setRef("calendarBtn")}
            className={
              current === "calendar"
                ? "mcl-toolbar-btn mcl-toolbar-btn--active"
                : "mcl-toolbar-btn"
            }
            onClick={() => {
              onSelect("calendar");
              toggle("calendar");
            }}
          >
            Kalender
          </button>

          {calendarMenuOpen && (
            <div className="file-menu" ref={setRef("calendarMenu")}>
              <div
                className="file-menu-item"
                onClick={() => {
                  onOpenCalendar?.();
                  closeAll();
                }}
              >
                Legg til fridager og ferier…
              </div>
              <div
                className="file-menu-item"
                onClick={() => {
                  onToggleWeekends?.();
                }}
              >
                {showWeekends ? "✓ Marker helgedager" : "Marker helgedager"}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================================= */}
        {/*  PROSJEKT-MENY  */}
        {/* ================================================================================= */}
        <div className="toolbar-item">
          <button
            ref={setRef("projectBtn")}
            className={
              current === "project"
                ? "mcl-toolbar-btn mcl-toolbar-btn--active"
                : "mcl-toolbar-btn"
            }
            onClick={() => {
              onSelect("project");
              toggle("project");
            }}
          >
            Prosjekt
          </button>

          {projectMenuOpen && (
            <div className="file-menu" ref={setRef("projectMenu")}>
              <div className="file-menu-item">
                Prosjektinnstillinger (kommer senere)
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
