// src/components/GanttLite.tsx
import React, { useMemo } from "react";

export type GanttLiteProps = {
  rows: Record<string, string>[];
  pxPerDay: number;
  showToday?: boolean;
};

const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const dayMs = 86400000;

function parseDate(s: string): number | null {
  if (!isIso(s)) return null;
  const t = new Date(s + "T00:00:00Z").getTime();
  return isNaN(t) ? null : t;
}

function formatISO(t: number): string {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function cssPxVar(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = Number(v.replace("px", ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function GanttLite({ rows, pxPerDay, showToday = true }: GanttLiteProps) {
  const headerH = cssPxVar("--header-h", 30);
  const rowH = cssPxVar("--row-h", 24);
  const gap = 6;

  const model = useMemo(() => {
    const items = rows.map((r, idx) => {
      const s = parseDate(r.start ?? "");
      const e = parseDate(r.slutt ?? "");
      return { idx, s, e, color: (r.farge ?? "").trim() || "#6aa9ff", label: r.aktivitet ?? (`Rad ${idx+1}`) };
    });
    const valid = items.filter(x => x.s !== null && x.e !== null && (x.e as number) >= (x.s as number));
    const allTimes = valid.flatMap(x => [x.s as number, x.e as number]);
    const minT = allTimes.length ? Math.min(...allTimes) : null;
    const maxT = allTimes.length ? Math.max(...allTimes) : null;
    if (minT === null || maxT === null) return { items: valid, minT: null, maxT: null, days: 0 };
    const days = Math.round((maxT - minT) / dayMs) + 1;
    return { items: valid, minT, maxT, days };
  }, [rows]);

  const contentH = rows.length * (rowH + 1) + 12;
  const totalH = headerH + contentH;
  const width = Math.max(400, (model.days || 30) * pxPerDay + 60);

  const todayT = (() => {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  })();

  const dayX = (t: number) => {
    if (!model.minT) return 0;
    const d = Math.round((t - model.minT) / dayMs);
    return d * pxPerDay;
  };

  const bars = model.items.map((it) => {
    const y = headerH + it.idx * (rowH + 1) + gap / 2;
    const x1 = dayX(it.s as number);
    const x2 = dayX(it.e as number) + pxPerDay;
    const w = Math.max(4, x2 - x1);
    return (
      <g key={it.idx} aria-label={it.label}>
        <rect x={x1} y={y} width={w} height={rowH - gap} rx={4} ry={4} fill={it.color} opacity={0.9} />
        <text x={x1 + 6} y={y + (rowH - gap) / 2 + 4} fontSize={11} fill="#fff">
          {it.label}
        </text>
      </g>
    );
  });

  const headerTicks = (() => {
    const ticks: JSX.Element[] = [];
    if (!model.minT || !model.days) return ticks;
    for (let i = 0; i < model.days; i++) {
      const t = model.minT + i * dayMs;
      const x = dayX(t);
      if (i % 5 === 0 || i === 0) {
        ticks.push(
          <g key={i}>
            <line x1={x} y1={0} x2={x} y2={totalH} stroke="#3a4259" strokeWidth={1} />
            <text x={x + 4} y={Math.round(headerH / 2) + 4} fontSize={11} fill="#a6accd">
              {formatISO(t)}
            </text>
          </g>
        );
      } else {
        ticks.push(<line key={i} x1={x} y1={headerH} x2={x} y2={totalH} stroke="#2a3144" strokeWidth={1} />);
      }
    }
    return ticks;
  })();

  const todayLine =
    showToday && model.minT && model.maxT
      ? (() => {
          if (todayT < model.minT! || todayT > model.maxT!) return null;
          const x = dayX(todayT);
          return <line x1={x} y1={0} x2={x} y2={totalH} stroke="#ff6363" strokeWidth={2} strokeDasharray="4 3" />;
        })()
      : null;

  return (
    <div className="gantt-wrap" role="figure" aria-label="Gantt-oversikt">
      <div className="gantt-scroller">
        <svg width={width} height={totalH} role="img" aria-label="Gantt-diagram">
          <rect x={0} y={0} width={width} height={headerH} fill="var(--panel-2)" />
          {headerTicks}
          {todayLine}
          {bars}
        </svg>
      </div>
    </div>
  );
}
