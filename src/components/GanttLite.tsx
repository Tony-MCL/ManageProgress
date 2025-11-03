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

/* ==== [BLOCK: Model] BEGIN ==== */
function buildModel(rows: Row[]) {
  const withDates = rows.filter(r => isISO(r.start) && isISO(r.slutt));
  if (!withDates.length) {
    const today = new Date();
    const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return {
      hasRange: false,
      min: a,
      max: a + 14 * dayMs,
      items: [] as {
        idx: number; name: string; start: number; end: number; color?: string;
      }[]
    };
  }

  const items = withDates.map((r, idx) => {
    const start = toUTC0(r.start!);
    const end   = toUTC0(r.slutt!);
    return {
      idx,
      name: r.aktivitet || r.navn || r.activity || `Aktivitet ${idx + 1}`,
      start,
      end,
      color: r.farge || r.color
    };
  });

  const min = Math.min(...items.map(i => i.start));
  const max = Math.max(...items.map(i => i.end));

  return { hasRange: true, min, max, items };
}
/* ==== [BLOCK: Model] END ==== */

/* ==== [BLOCK: Helpers] BEGIN ==== */
const monthEdges = (a: number, b: number) => {
  const out: number[] = [];
  let d = new Date(a);
  d.setUTCDate(1);
  d.setUTCHours(0,0,0,0);
  while (d.getTime() <= b) {
    out.push(d.getTime());
    d.setUTCMonth(d.getUTCMonth() + 1, 1);
  }
  if (!out.length || out[out.length - 1] < b) out.push(b);
  return out;
};
const fmtMonthShort = (ts: number) =>
  new Intl.DateTimeFormat("no-NO", { month: "short", year: "2-digit" })
    .format(new Date(ts)).replace(".", "");

const fmtISO = (ts: number) => new Date(ts).toISOString().slice(0,10);
/* ==== [BLOCK: Helpers] END ==== */

export default function GanttLite({ rows, pxPerDay, showToday }: GanttLiteProps) {
  const model = useMemo(() => buildModel(rows), [rows]);
  const { min, max, hasRange, items } = model;

  const totalDays = Math.max(1, Math.round((max - min) / dayMs) + 1);
  const widthPx   = totalDays * pxPerDay;

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Auto-center today when it exists & range is valid (only first mount)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !showToday) return;
    const today = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    );
    if (today < min || today > max) return;
    const x = ((today - min) / dayMs) * pxPerDay - el.clientWidth / 2;
    el.scrollLeft = clamp(x, 0, widthPx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scale helpers
  const xFor = (ts: number) => ((ts - min) / dayMs) * pxPerDay;

  // Month ticks for header(s)
  const months = monthEdges(min, max);

  return (
    <div className="gantt-wrap">
      {/* Slim project summary header (replaces old SummaryBar) */}
      <div className="g-mini">
        <div className="g-mini-months" style={{ width: widthPx }}>
          {months.map((t, i) => (
            <div
              key={t}
              className="g-mini-m"
              style={{ left: `${(xFor(t) / widthPx) * 100}%` }}
            >
              {fmtMonthShort(t)}
            </div>
          ))}
        </div>
        <div className="g-mini-track" style={{ width: widthPx }}>
          {hasRange ? (
            <div
              className="g-mini-bar"
              style={{ left: 0, width: widthPx }}
              title={`${fmtISO(min)} → ${fmtISO(max)}`}
            >
              <span>Prosjektsammendrag</span>
            </div>
          ) : (
            <div className="g-mini-empty">Legg til aktiviteter med dato</div>
          )}
        </div>
      </div>

      {/* Main calendar + bars */}
      <div className="gantt-scroller" ref={scrollerRef}>
        <div className="gantt" style={{ width: widthPx }}>
          {/* Top month header (same scale as mini) */}
          <div className="g-months">
            {months.map((t) => (
              <div key={t} className="g-month" style={{ left: xFor(t) }}>
                {fmtMonthShort(t)}
              </div>
            ))}
          </div>

          {/* Today line */}
          {showToday && (
            (() => {
              const now = Date.UTC(
                new Date().getUTCFullYear(),
                new Date().getUTCMonth(),
                new Date().getUTCDate()
              );
              if (now < min || now > max) return null;
              return <div className="g-today" style={{ left: xFor(now) }} />;
            })()
          )}

          {/* Day grid lines (weekly is enough to keep it light) */}
          {Array.from({ length: totalDays }, (_, i) => min + i * dayMs)
            .filter((ts) => new Date(ts).getUTCDay() === 1) // Mondays
            .map((ts) => (
              <div key={ts} className="g-week" style={{ left: xFor(ts) }} />
            ))}

          {/* Bars */}
          <div className="g-bars">
            {items.map((it, rowIdx) => {
              const left = xFor(it.start);
              const width = Math.max(pxPerDay, xFor(it.end) - xFor(it.start) + pxPerDay);
              return (
                <div
                  key={rowIdx}
                  className="g-bar"
                  style={{
                    left,
                    top: rowIdx * 26 + 64, // space under header
                    width
                  }}
                  title={`${it.name}: ${fmtISO(it.start)} → ${fmtISO(it.end)}`}
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
