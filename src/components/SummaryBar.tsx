// src/components/SummaryBar.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo } from "react";
/* ==== [BLOCK: Imports] END ==== */

export type SummaryBarProps = {
  rows: Record<string, string>[];
};

const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const dayMs = 86400000;

const toUTC = (y: number, m: number, d: number) =>
  Date.UTC(y, m, d); // ren UTC-timestamp (ms)

const toMidnightUTC = (iso: string) => {
  const [Y, M, D] = iso.split("-").map(Number);
  return toUTC(Y, (M ?? 1) - 1, D ?? 1);
};

const fmtISO = (ts: number | null) =>
  ts === null ? "—" : new Date(ts).toISOString().slice(0, 10);

/** Norsk: "fr 31.10.25" (kort ukedag + dd.MM.yy) */
function fmtNoShort(ts: number | null) {
  if (ts === null) return "—";
  const d = new Date(ts);
  const weekday = new Intl.DateTimeFormat("no-NO", { weekday: "short" }).format(d).replace(".", "");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${weekday} ${dd}.${mm}.${yy}`;
}

/** "apr 23", "nov 24" … */
function fmtMonthNo(ts: number) {
  const d = new Date(ts);
  const month = new Intl.DateTimeFormat("no-NO", { month: "short" }).format(d).replace(".", "");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${month} ${yy}`;
}

/** Første dag i måneden for gitt ts (UTC) */
function firstOfMonth(ts: number) {
  const d = new Date(ts);
  return toUTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}
/** Siste dag i måneden for gitt ts (UTC) */
function lastOfMonth(ts: number) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  // dag 0 i neste mnd = siste dag i denne mnd
  return toUTC(y, m + 1, 0);
}

/** Alle månedsskift mellom a..b (inkluder start og slutt-måned) */
function monthTicksBetween(a: number, b: number) {
  const ticks: number[] = [];
  let t = firstOfMonth(a);
  const end = lastOfMonth(b);
  while (t <= end) {
    ticks.push(t);
    const d = new Date(t);
    t = toUTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  if (ticks.length === 0 || ticks[ticks.length - 1] !== firstOfMonth(end)) {
    ticks.push(firstOfMonth(end));
  }
  return ticks;
}

export default function SummaryBar({ rows }: SummaryBarProps) {
  const model = useMemo(() => {
    const withDates = rows.filter(r => isIso(r.start ?? "") && isIso(r.slutt ?? ""));
    if (!withDates.length) {
      return {
        hasRange: false,
        startTs: null as number | null,
        endTs: null as number | null,
        spanDays: 0,
        months: [] as number[],
        count: rows.length,
      };
    }
    const startTs = Math.min(...withDates.map(r => toMidnightUTC(r.start!)));
    const endTs   = Math.max(...withDates.map(r => toMidnightUTC(r.slutt!)));
    const spanDays = Math.max(1, Math.round((endTs - startTs) / dayMs) + 1);
    const months = monthTicksBetween(startTs, endTs);
    return {
      hasRange: true,
      startTs, endTs, spanDays, months,
      count: rows.length,
    };
  }, [rows]);

  const { hasRange, startTs, endTs, months } = model;

  // pos i % for timeline
  const toPct = (ts: number) =>
    startTs === null || endTs === null || endTs === startTs
      ? 0
      : ((ts - startTs) / (endTs - startTs)) * 100;

  return (
    <div className="summarybar" aria-label="Prosjektsammendrag">
      <div className="ps-row">
        <div className="ps-side ps-left">
          <div className="ps-side-title">Start</div>
          <div className="ps-side-date">{fmtNoShort(startTs)}</div>
        </div>

        <div className="ps-timeline" role="img" aria-label="Prosjekttidslinje">
          {/* Topp-akse: månedsetiketter */}
          <div className="ps-months">
            {hasRange && months.map((t) => (
              <div
                key={t}
                className="ps-mtick"
                style={{ left: `${toPct(t)}%` }}
              >
                {fmtMonthNo(t)}
              </div>
            ))}
          </div>

          {/* Selve sporet + bar (hele prosjektspennet) */}
          <div className="ps-track">
            {hasRange ? (
              <div
                className="ps-bar ps-bar--summary"
                style={{ left: `0%`, width: `100%` }}
                title={`${fmtISO(startTs)} → ${fmtISO(endTs)}`}
                aria-label={`Prosjektsammendrag ${fmtISO(startTs)} til ${fmtISO(endTs)}`}
              >
                <span className="ps-bar-label">Prosjektsammendrag</span>
              </div>
            ) : (
              <div className="ps-empty">Legg til aktiviteter med dato i tidslinjen</div>
            )}
          </div>
        </div>

        <div className="ps-side ps-right">
          <div className="ps-side-title">Slutt</div>
          <div className="ps-side-date">{fmtNoShort(endTs)}</div>
        </div>
      </div>
    </div>
  );
}
