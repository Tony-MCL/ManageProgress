// src/components/SummaryBar.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo } from "react";
/* ==== [BLOCK: Imports] END ==== */

export type SummaryBarProps = {
  rows: Record<string, string>[];
  /** px per day used in the main gantt; we mirror the same scale visually */
  pxPerDay?: number;
};

const dayMs = 86_400_000;
const isISO = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const toUTC0 = (iso: string) => {
  const [Y, M, D] = iso.split("-").map(Number);
  return Date.UTC(Y, (M ?? 1) - 1, D ?? 1);
};

function fmtNoShort(ts: number | null) {
  if (ts === null) return "—";
  const d = new Date(ts);
  const w = new Intl.DateTimeFormat("no-NO", { weekday: "short" })
    .format(d)
    .replace(".", "");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${w} ${dd}.${mm}.${yy}`;
}

const fmtMonthShort = (ts: number) =>
  new Intl.DateTimeFormat("no-NO", { month: "short", year: "2-digit" })
    .format(new Date(ts))
    .replace(".", "");

const monthEdges = (a: number, b: number) => {
  const out: number[] = [];
  const d = new Date(a);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  while (d.getTime() <= b) {
    out.push(d.getTime());
    d.setUTCMonth(d.getUTCMonth() + 1, 1);
  }
  if (!out.length || out[out.length - 1] < b) out.push(b);
  return out;
};

export default function SummaryBar({ rows, pxPerDay = 20 }: SummaryBarProps) {
  const model = useMemo(() => {
    const withDates = rows.filter((r) => isISO(r.start) && isISO(r.slutt));
    if (!withDates.length) {
      const today = new Date();
      const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      return {
        has: false,
        a,
        b: a + 14 * dayMs,
        activity: "Prosjektsammendrag",
        months: [] as number[],
      };
    }
    const a = Math.min(...withDates.map((r) => toUTC0(r.start!)));
    const b = Math.max(...withDates.map((r) => toUTC0(r.slutt!)));
    return {
      has: true,
      a,
      b,
      activity: "Prosjektsammendrag",
      months: monthEdges(a, b),
    };
  }, [rows]);

  const { has, a, b, activity, months } = model;
  const totalDays = Math.max(1, Math.round((b - a) / dayMs) + 1);
  const widthPx = totalDays * pxPerDay;
  const xFor = (ts: number) => ((ts - a) / dayMs) * pxPerDay;

  return (
    <div className="summaryband no-print" aria-label="Prosjektsammendrag">
      <div className="sb-grid">
        <div className="sb-cell sb-left">
          <div className="sb-title">Start</div>
          <div className="sb-date">{fmtNoShort(has ? a : null)}</div>
        </div>

        <div className="sb-mid">
          {/* top month ruler */}
          <div className="sb-months" style={{ width: widthPx }}>
            {has &&
              months.map((t) => (
                <div
                  key={t}
                  className="sb-mtick"
                  style={{ left: `${(xFor(t) / widthPx) * 100}%` }}
                >
                  {fmtMonthShort(t)}
                </div>
              ))}
          </div>
          {/* project span bar */}
          <div className="sb-track" style={{ width: widthPx }}>
            {has ? (
              <div className="sb-bar" title={activity}>
                <span>{activity}</span>
              </div>
            ) : (
              <div className="sb-empty">Legg til aktiviteter med dato</div>
            )}
          </div>
        </div>

        <div className="sb-cell sb-right">
          <div className="sb-title">Slutt</div>
          <div className="sb-date">{fmtNoShort(has ? b : null)}</div>
        </div>
      </div>
    </div>
  );
}
