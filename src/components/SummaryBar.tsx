// src/components/SummaryBar.tsx
/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useMemo } from "react";
/* ==== [BLOCK: Imports] END ==== */

export type SummaryBarProps = {
  rows: Record<string, string>[];
};

const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function SummaryBar({ rows }: SummaryBarProps) {
  const stats = useMemo(() => {
    const withDates = rows.filter(r => isIso(r.start ?? "") && isIso(r.slutt ?? ""));
    const missingDates = rows.length - withDates.length;

    const times = withDates.flatMap(r => {
      const a = new Date((r.start ?? "") + "T00:00:00Z").getTime();
      const b = new Date((r.slutt ?? "") + "T00:00:00Z").getTime();
      return isNaN(a) || isNaN(b) ? [] : [a, b];
    });

    const min = times.length ? Math.min(...times) : NaN;
    const max = times.length ? Math.max(...times) : NaN;
    const totalSpanDays = !isNaN(min) && !isNaN(max) ? Math.round((max - min) / 86400000) + 1 : 0;

    return {
      count: rows.length,
      withDates: withDates.length,
      missingDates,
      totalSpanDays
    };
  }, [rows]);

  return (
    <div className="summarybar">
      <div><strong>Aktiviteter:</strong> {stats.count}</div>
      <div><strong>Med dato:</strong> {stats.withDates}</div>
      <div><strong>Uten dato:</strong> {stats.missingDates}</div>
      <div><strong>Total tidslinje:</strong> {stats.totalSpanDays} dager</div>
    </div>
  );
}
