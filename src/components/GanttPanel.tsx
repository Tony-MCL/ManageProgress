// src/components/GanttPanel.tsx
import React, { useMemo } from "react";
import type { ColumnDef, RowData } from "../core/TableTypes";

/**
 * Enkel Gantt-visning:
 * - Leser start-/sluttdato fra angitte kolonnenøkler
 * - Lager en dag-linje fra tidligste til seneste dato
 * - Tegner én bar per rad
 * - Marker helgedager (lør/søn) i header + bakgrunn (styrt av showWeekends)
 * - Viser en vertikal linje for "i dag" hvis den ligger i intervallet
 */

type GanttPanelProps = {
  rows: RowData[];
  columns: ColumnDef[];
  startKey: string;
  endKey: string;
  showWeekends?: boolean;
};

type DayCell = {
  date: Date;
  label: string;
};

type Bar = {
  id: string;
  startIndex: number;
  endIndex: number;
};

type GanttCalc = {
  days: DayCell[];
  bars: Bar[];
  todayIndex: number | null;
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(+value)) return value;

  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(+d) ? null : d;
  }

  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    return isNaN(+d) ? null : d;
  }

  return null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const DAY_WIDTH = 32;

const GanttPanel: React.FC<GanttPanelProps> = ({
  rows,
  columns,
  startKey,
  endKey,
  showWeekends = true,
}) => {
  const startCol = columns.find((c) => c.key === startKey);
  const endCol = columns.find((c) => c.key === endKey);

  const { days, bars, todayIndex } = useMemo<GanttCalc>(() => {
    if (!startCol || !endCol) {
      return { days: [], bars: [], todayIndex: null };
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const rowDates: { rowId: string; start: Date | null; end: Date | null }[] =
      rows.map((row) => {
        const s = parseDate(row.cells[startCol.key]);
        const e = parseDate(row.cells[endCol.key]);
        let start = s;
        let end = e;

        if (start && !end) end = start;
        if (end && !start) start = end;

        if (start && end) {
          const sDay = startOfDay(start);
          const eDay = startOfDay(end);
          if (!minDate || sDay < minDate) minDate = sDay;
          if (!maxDate || eDay > maxDate) maxDate = eDay;
          return { rowId: row.id, start: sDay, end: eDay };
        }

        return { rowId: row.id, start: null, end: null };
      });

    if (!minDate || !maxDate) {
      return { days: [], bars: [], todayIndex: null };
    }

    const minDay: Date = minDate as Date;
    const maxDay: Date = maxDate as Date;

    const days: DayCell[] = [];
    for (let cur: Date = minDay; cur <= maxDay; cur = addDays(cur, 1)) {
      const day = cur.getDate().toString().padStart(2, "0");
      days.push({
        date: new Date(cur.getTime()),
        label: day,
      });
    }

    const bars: Bar[] = rowDates
      .map((rd) => {
        if (!rd.start || !rd.end) return null;
        const startIndex = days.findIndex(
          (d) => startOfDay(d.date).getTime() === rd.start!.getTime()
        );
        const endIndex = days.findIndex(
          (d) => startOfDay(d.date).getTime() === rd.end!.getTime()
        );
        if (startIndex === -1 || endIndex === -1) return null;
        return {
          id: rd.rowId,
          startIndex: Math.min(startIndex, endIndex),
          endIndex: Math.max(startIndex, endIndex),
        };
      })
      .filter((b): b is Bar => !!b);

    const today = startOfDay(new Date());
    let todayIndex: number | null = null;
    days.forEach((d, idx) => {
      if (startOfDay(d.date).getTime() === today.getTime()) {
        todayIndex = idx;
      }
    });

    return { days, bars, todayIndex };
  }, [rows, columns, startKey, endKey, startCol, endCol]);

  const timelineWidth = days.length * DAY_WIDTH;
  const todayLeft =
    todayIndex != null ? todayIndex * DAY_WIDTH + DAY_WIDTH / 2 : null;

  return (
    <div className="gantt-root">
      {/* HEADER */}
      <div className="gantt-header">
        <div
          className="gantt-header-track"
          style={{ width: timelineWidth || "100%" }}
        >
          {days.map((d) => {
            const dow = d.date.getDay(); // 0 = søndag, 6 = lørdag
            const isWeekend = dow === 0 || dow === 6;

            return (
              <div
                key={d.date.toISOString()}
                className={
                  "gantt-header-cell" +
                  (showWeekends && isWeekend ? " gantt-header-cell--weekend" : "")
                }
              >
                <span className="gantt-header-day">{d.label}</span>
              </div>
            );
          })}

          {todayLeft != null && (
            <div className="gantt-today-line" style={{ left: todayLeft }} />
          )}
        </div>
      </div>

      {/* SAMMENDRAGSRAD */}
      <div className="gantt-summary-row">
        <div
          className="gantt-summary-track"
          style={{ width: timelineWidth || "100%" }}
        >
          {timelineWidth > 0 && <div className="gantt-summary-bar" />}
          {todayLeft != null && (
            <div className="gantt-today-line" style={{ left: todayLeft }} />
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="gantt-body">
        <div className="gantt-rows" style={{ width: timelineWidth || "100%" }}>
          {/* Helgestriper i bakgrunnen */}
          {showWeekends && (
            <div className="gantt-weekend-stripes">
              {days.map((d, idx) => {
                const dow = d.date.getDay();
                if (dow !== 0 && dow !== 6) return null;
                const left = idx * DAY_WIDTH;
                return (
                  <div
                    key={d.date.toISOString()}
                    className="gantt-weekend-stripe"
                    style={{ left, width: DAY_WIDTH }}
                  />
                );
              })}
            </div>
          )}

          {/* I dag-linje i body */}
          {todayLeft != null && (
            <div className="gantt-today-line" style={{ left: todayLeft }} />
          )}

          {rows.map((row) => {
            const bar = bars.find((b) => b.id === row.id);
            const hasBar = !!bar;
            const left = hasBar ? bar!.startIndex * DAY_WIDTH : 0;
            const right = hasBar ? (bar!.endIndex + 1) * DAY_WIDTH : 0;
            const width = hasBar ? right - left : 0;

            return (
              <div key={row.id} className="gantt-row">
                <div className="gantt-row-track">
                  {hasBar && (
                    <div
                      className="gantt-bar"
                      style={{
                        left,
                        width,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttPanel;
