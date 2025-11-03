// src/core/GanttLite.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo, useRef, useEffect } from "react";
/* ==== [BLOCK: Imports] END ==== */

export type Row = Record<string, string>;
export type GanttLiteProps = {
  rows: Row[];
  pxPerDay: number;
  showToday: boolean;
};

const dayMs = 86_400_000;
const isISO = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const toUTC0 = (iso: string) => {
  const [Y, M, D] = iso.split("-").map(Number);
  return Date.UTC(Y, (M ?? 1) - 1, D ?? 1);
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function buildModel(rows: Row[]) {
  const withDates = rows.filter((r) => isISO(r.start) && isISO(r.slutt));
  if (!withDates.length) {
    const today = new Date();
    const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return {
      has: false,
      min: a,
      max: a + 21 * dayMs,
      items: [] as { name: string; start: number; end: number }[],
    };
  }
  const items = withDates.map((r, idx) => ({
    name: r.aktivitet || r.navn || `Aktivitet ${idx + 1}`,
    start: toUTC0(r.start!),
    end: toUTC0(r.slutt!),
  }));
  const min = Math.min(...items.map((i) => i.start));
  const max = Math.max(...items.map((i) => i.end));
  return { has: true, min, max, items };
}

const fmtMonthShort = (ts: number) =>
  new Intl.DateTimeFormat("no-NO", { month: "short", year: "2-digit" })
    .format(new Date(ts))
    .replace(".", "");

export default function GanttLite({ rows, pxPerDay, showToday }: GanttLiteProps) {
  const model = useMemo(() => buildModel(rows), [rows]);
  const { min, max, items } = model;

  const totalDays = Math.max(1, Math.round((max - min) / dayMs) + 1);
  const widthPx = totalDays * pxPerDay;
  const xFor = (ts: number) => ((ts - min) / dayMs) * pxPerDay;

  // month edges (simple)
  const months: number[] = [];
  const d = new Date(min);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  while (d.getTime() <= max) {
    months.push(d.getTime());
    d.setUTCMonth(d.getUTCMonth() + 1, 1);
  }
  if (!months.length || months[months.length - 1] < max) months.push(max);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !showToday) return;
    const now = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    );
    if (now < min || now > max) return;
    const x = xFor(now) - el.clientWidth / 2;
    el.scrollLeft = clamp(x, 0, widthPx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gantt-wrap">
      <div className="gantt-scroller" ref={scrollerRef}>
        <div className="gantt" style={{ width: widthPx }}>
          {/* months header */}
          <div className="g-months">
            {months.map((t) => (
              <div key={t} className="g-month" style={{ left: xFor(t) }}>
                {fmtMonthShort(t)}
              </div>
            ))}
          </div>

          {/* weekly grid */}
          {Array.from({ length: totalDays }, (_, i) => min + i * dayMs)
            .filter((ts) => new Date(ts).getUTCDay() === 1)
            .map((ts) => (
              <div key={ts} className="g-week" style={{ left: xFor(ts) }} />
            ))}

          {/* today line */}
          {showToday && (() => {
            const now = Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              new Date().getUTCDate()
            );
            if (now < min || now > max) return null;
            return <div className="g-today" style={{ left: xFor(now) }} />;
          })()}

          {/* bars */}
          <div className="g-bars">
            {items.map((it, i) => {
              const left = xFor(it.start);
              const width = Math.max(pxPerDay, xFor(it.end) - xFor(it.start) + pxPerDay);
              return (
                <div
                  key={i}
                  className="g-bar"
                  style={{ left, top: i * 26 + 48, width }} /* 48px header space */
                >
                  <span>{it.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
