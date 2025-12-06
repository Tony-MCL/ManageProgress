// src/components/GanttPanel.tsx
import React, { useMemo } from "react";
import type { ColumnDef, RowData } from "../core/TableTypes";

/**
 * Gantt-visning med 3 nivåer i header:
 * - Øverst: måneder (mar 2025, apr 2025, ...)
 * - Midten: uker (Uke 09, Uke 10, ...)
 * - Nederst: dager (01–31) med helgedagsmarkering
 *
 * I dag-linje og helgestriper fungerer som før.
 * Dagbredden kan justeres via prop dayWidth (brukes til zoom).
 */

export type ZoomMode = "day" | "week" | "month";

type GanttPanelProps = {
  rows: RowData[];
  columns: ColumnDef[];
  startKey: string;
  endKey: string;
  showWeekends?: boolean;
  dayWidth?: number; // ← zoom-kontroll
  zoomMode?: ZoomMode; // ← tids-oppløsning (dag/uke/måned)
};

type DayCell = {
  date: Date;
  label: string; // "01", "02", ...
};

type Bar = {
  id: string;
  startIndex: number;
  endIndex: number;
};

type MonthSegment = {
  key: string;
  label: string;
  startIndex: number;
  span: number;
};

type WeekSegment = {
  key: string;
  label: string;
  startIndex: number;
  span: number;
};

type GanttCalc = {
  days: DayCell[];
  bars: Bar[];
  todayIndex: number | null;
  monthSegments: MonthSegment[];
  weekSegments: WeekSegment[];
};

const DAY_WIDTH_DEFAULT = 32;

// Norsk månedsnavn i liten, kompakt form
const MONTH_NAMES_NO = [
  "jan",
  "feb",
  "mar",
  "apr",
  "mai",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "des",
];

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

function formatMonthLabel(year: number, monthIndex: number): string {
  const name =
    MONTH_NAMES_NO[monthIndex] ?? String(monthIndex + 1).padStart(2, "0");
  return `${name} ${year}`;
}

// ISO-uke (brukes til "Uke 09", "Uke 10" osv.)
function getIsoWeek(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7; // 1–7 (man–søn)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // til torsdag i samme uke
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

const GanttPanel: React.FC<GanttPanelProps> = ({
  rows,
  columns,
  startKey,
  endKey,
  showWeekends = true,
  dayWidth,
  zoomMode = "day",
}) => {
  const effectiveDayWidth = dayWidth ?? DAY_WIDTH_DEFAULT;

  // Steg 2: zoomMode er tilgjengelig, men vi bruker fortsatt dagbasert skala.
  // I Steg 3 vil vi bruke zoomMode til å bytte mellom dag/uke/måned-logikk.

  const startCol = columns.find((c) => c.key === startKey);
  const endCol = columns.find((c) => c.key === endKey);

  const { days, bars, todayIndex, monthSegments, weekSegments } =
    useMemo<GanttCalc>(() => {
      if (!startCol || !endCol) {
        return {
          days: [],
          bars: [],
          todayIndex: null,
          monthSegments: [],
          weekSegments: [],
        };
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
        return {
          days: [],
          bars: [],
          todayIndex: null,
          monthSegments: [],
          weekSegments: [],
        };
      }

      // Litt padding på hver side (1 dag)
      minDate = addDays(minDate, -1);
      maxDate = addDays(maxDate, 1);

      const days: DayCell[] = [];
      for (let d = minDate; d <= maxDate; d = addDays(d, 1)) {
        days.push({
          date: d,
          label: String(d.getDate()).padStart(2, "0"),
        });
      }

      // Måned-segmenter
      const monthSegments: MonthSegment[] = [];
      if (days.length > 0) {
        let curYear = days[0].date.getFullYear();
        let curMonth = days[0].date.getMonth();
        let startIndex = 0;

        for (let i = 0; i < days.length; i++) {
          const d = days[i].date;
          const y = d.getFullYear();
          const m = d.getMonth();
          if (y !== curYear || m !== curMonth) {
            const span = i - startIndex;
            monthSegments.push({
              key: `${curYear}-${curMonth}`,
              label: formatMonthLabel(curYear, curMonth),
              startIndex,
              span,
            });
            curYear = y;
            curMonth = m;
            startIndex = i;
          }
        }

        const lastSpan = days.length - startIndex;
        monthSegments.push({
          key: `${curYear}-${curMonth}`,
          label: formatMonthLabel(curYear, curMonth),
          startIndex,
          span: lastSpan,
        });
      }

      // Uke-segmenter
      const weekSegments: WeekSegment[] = [];
      if (days.length > 0) {
        let { year: curYear, week: curWeek } = getIsoWeek(days[0].date);
        let startIndex = 0;

        for (let i = 0; i < days.length; i++) {
          const { year, week } = getIsoWeek(days[i].date);
          if (year !== curYear || week !== curWeek) {
            const span = i - startIndex;
            weekSegments.push({
              key: `${curYear}-W${curWeek}`,
              label: `Uke ${String(curWeek).padStart(2, "0")}`,
              startIndex,
              span,
            });
            curYear = year;
            curWeek = week;
            startIndex = i;
          }
        }

        const span = days.length - startIndex;
        weekSegments.push({
          key: `${curYear}-W${curWeek}`,
          label: `Uke ${String(curWeek).padStart(2, "0")}`,
          startIndex,
          span,
        });
      }

      // Bars
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

      return { days, bars, todayIndex, monthSegments, weekSegments };
    }, [rows, columns, startKey, endKey, startCol, endCol]);

  const timelineWidth = days.length * effectiveDayWidth;
  const todayLeft =
    todayIndex != null
      ? todayIndex * effectiveDayWidth + effectiveDayWidth / 2
      : null;

  return (
    <div
      className="gantt-root"
      style={
        { "--gantt-day-w": `${effectiveDayWidth}px` } as React.CSSProperties
      }
    >
      {/* HEADER */}
      <div className="gantt-header">
        <div
          className="gantt-header-track"
          style={{ width: timelineWidth || "100%" }}
        >
          {/* Rad 1: måneder */}
          <div className="gantt-header-month-row">
            {monthSegments.map((seg) => (
              <div
                key={seg.key}
                className="gantt-header-month-cell"
                style={{ width: seg.span * effectiveDayWidth }}
              >
                {seg.label}
              </div>
            ))}
          </div>

          {/* Rad 2: uker */}
          <div className="gantt-header-week-row">
            {weekSegments.map((seg) => (
              <div
                key={seg.key}
                className="gantt-header-week-cell"
                style={{ width: seg.span * effectiveDayWidth }}
              >
                {seg.label}
              </div>
            ))}
          </div>

          {/* Rad 3: dager */}
          <div className="gantt-header-day-row">
            {days.map((d) => {
              const dow = d.date.getDay(); // 0 = søndag, 6 = lørdag
              const isWeekend = dow === 0 || dow === 6;

              return (
                <div
                  key={d.date.toISOString()}
                  className={
                    "gantt-header-cell" +
                    (showWeekends && isWeekend
                      ? " gantt-header-cell--weekend"
                      : "")
                  }
                >
                  <span className="gantt-header-day">{d.label}</span>
                </div>
              );
            })}
          </div>

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
                const left = idx * effectiveDayWidth;
                return (
                  <div
                    key={d.date.toISOString()}
                    className="gantt-weekend-stripe"
                    style={{ left, width: effectiveDayWidth }}
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
            const left = hasBar ? bar!.startIndex * effectiveDayWidth : 0;
            const right = hasBar
              ? (bar!.endIndex + 1) * effectiveDayWidth
              : 0;
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
