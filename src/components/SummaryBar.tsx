// src/components/SummaryBar.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo } from "react";
/* ==== [BLOCK: Imports] END ==== */

export type SummaryBarProps = {
  rows: Record<string, string>[];
};

const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const toMidnightUTC = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const dayMs = 86400000;
const fmt = (t: number | null) =>
  t === null ? "—" : new Date(t).toISOString().slice(0, 10);

export default function SummaryBar({ rows }: SummaryBarProps) {
  const model = useMemo(() => {
    // Finn tidligste start og seneste slutt
    const valid = rows.filter(r => isIso(r.start ?? "") && isIso(r.slutt ?? ""));
    if (!valid.length) {
      return {
        count: rows.length,
        withDates: 0,
        missingDates: rows.length,
        startTs: null as number | null,
        endTs: null as number | null,
        spanDays: 0,
        ticks: [] as number[],
      };
    }

    const startTs = Math.min(...valid.map(r => toMidnightUTC(r.start!)));
    const endTs   = Math.max(...valid.map(r => toMidnightUTC(r.slutt!)));
    const spanDays = Math.max(1, Math.round((endTs - startTs) / dayMs) + 1);

    // Velg tick-intervall
    let step = 1;
    if (spanDays > 14 && spanDays <= 35) step = 7;
    else if (spanDays > 35 && spanDays <= 120) step = 14;
    else if (spanDays > 120) step = 30;

    // Generer ticks
    const ticks: number[] = [];
    for (let t = startTs; t <= endTs; t += step * dayMs) ticks.push(t);
    if (ticks[ticks.length - 1] !== endTs) ticks.push(endTs);

    return {
      count: rows.length,
      withDates: valid.length,
      missingDates: rows.length - valid.length,
      startTs,
      endTs,
      spanDays,
      ticks,
    };
  }, [rows]);

  const { startTs, endTs, spanDays, ticks } = model;

  // Posisjonering i prosent for Gantt
  const toPct = (ts: number) =>
    startTs === null || endTs === null || endTs === startTs
      ? 0
      : ((ts - startTs) / (endTs - startTs)) * 100;

  const barLeft = startTs !== null ? toPct(startTs) : 0;
  const barW = startTs !== null && endTs !== null
    ? Math.max(0.5, toPct(endTs) - toPct(startTs))
    : 0;

  return (
    <div className="summarybar" aria-label="Prosjektsammendrag">
      {/* Tabell-del (meta) */}
      <div className="summary-meta" role="table" aria-label="Metadata for prosjektsammendrag">
        <div className="meta-row" role="row">
          <div className="meta-cell meta-label" role="cell">Aktivitet</div>
          <div className="meta-cell meta-value" role="cell">Prosjektsammendrag</div>
        </div>
        <div className="meta-row" role="row">
          <div className="meta-cell meta-label" role="cell">Start</div>
          <div className="meta-cell meta-value" role="cell">{fmt(startTs)}</div>
        </div>
        <div className="meta-row" role="row">
          <div className="meta-cell meta-label" role="cell">Slutt</div>
          <div className="meta-cell meta-value" role="cell">{fmt(endTs)}</div>
        </div>
        <div className="meta-row" role="row">
          <div className="meta-cell meta-label" role="cell">Total tidslinje</div>
          <div className="meta-cell meta-value" role="cell">
            {spanDays ? `${spanDays} dager` : "—"}
          </div>
        </div>
      </div>

      {/* Gantt-del (mini) */}
      <div className="summary-gantt" aria-hidden={startTs === null}>
        <div className="sg-header">
          {ticks.map((t, i) => (
            <div
              key={t}
              className="sg-tick"
              style={{ left: `${toPct(t)}%` }}
              title={new Date(t).toISOString().slice(0, 10)}
            >
              {labelForTick(t, i, ticks.length, spanDays)}
            </div>
          ))}
        </div>
        <div className="sg-track">
          {startTs !== null && endTs !== null && (
            <div
              className="sg-bar"
              style={{ left: `${barLeft}%`, width: `${barW}%` }}
              aria-label="Prosjektsammendrag bar"
            >
              {/* valgfri tekst inni baren – rolig og kort */}
              {/* <span>Prosjektsammendrag</span> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kort og ryddig label for ticks – viser kun passende granularitet */
function labelForTick(ts: number, index: number, total: number, spanDays: number) {
  const d = new Date(ts);
  const iso = d.toISOString().slice(0, 10);
  if (spanDays <= 14) return iso;                 // hver dag
  if (spanDays <= 35) return iso;                 // ca ukevis, men vi viser datoen
  if (spanDays <= 120) return iso.slice(0, 7);    // YYYY-MM
  // lange tidslinjer – vis bare start/midt/slutt tydelig
  if (index === 0) return iso;
  if (index === Math.floor(total / 2)) return iso.slice(0, 7);
  if (index === total - 1) return iso;
  return ""; // tynne markører uten tekst
}
