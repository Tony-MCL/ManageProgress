// src/components/GanttLite.tsx
import React, { useMemo } from "react";

/* ==== [BLOCK: Types] BEGIN ==== */
export type GanttLiteProps = {
  rows: Record<string, string>[];
  pxPerDay: number;     // zoom
  showToday?: boolean;
};
/* ==== [BLOCK: Types] END ==== */

/* ==== [BLOCK: Helpers] BEGIN ==== */
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

/** Leser px-verdi fra CSS-variabel – med fallback */
function cssPxVar(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = Number(v.replace("px", ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
/* ==== [BLOCK: Helpers] END ==== */

export default function GanttLite({ rows, pxPerDay, showToday = true }: GanttLiteProps) {
  // Hent felles høyder fra CSS-variabler (må speile tabellen)
  const headerH = cssPxVar("--header-h", 34); // kalender-stripen
  const rowH    = cssPxVar("--row-h", 28);    // radhøyde
  const gap     = 6;

  /* ==== [BLOCK: Compute timeline] BEGIN ==== */
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
    if (minT === null || maxT === null) {
      return { items: valid, minT: null, maxT: null, days: 0 };
    }
    const days = Math.round((maxT - minT) / dayMs) + 1;
    return { items: valid, minT, maxT, days };
  }, [rows]);
  /* ==== [BLOCK: Compute timeline] END ==== */

  const contentH = rows.length * (rowH + 1) + 12; // +1 for subtil rad-separator
  const totalH   = headerH + contentH;

  // Bredden styres av antall dager × pxPerDay
  const width = Math.max(400, (model.days || 30) * pxPerDay + 120);

  const todayT = (() => {
    const now = new Date();
    const t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return t;
  })();

  const leftLabelW = 80;
  const dayX = (t: number) => {
    if (!model.minT) return leftLabelW;
    const d = Math.round((t - model.minT) / dayMs);
    return d * pxPerDay + leftLabelW;
  };

  const bars = model.items.map((it) => {
    const y = headerH + it.idx * (rowH + 1) + gap / 2;
    const x1 = dayX(it.s as number);
    const x2 = dayX(it.e as number) + pxPerDay; // inklusiv slutt-dag
    const w = Math.max(4, x2 - x1);
    return (
      <g key={it.idx} aria-label={it.label}>
        <rect x={x1} y={y} width={w} height={rowH - gap} rx={4} ry={4} fill={it.color} opacity={0.9} />
        <text x={x1 + 6} y={y + (rowH - gap)/2 + 4} fontSize={11} fill="#fff">{it.label}</text>
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
            <text x={x + 4} y={Math.round(headerH/2) + 4} fontSize={11} fill="#a6accd">{formatISO(t)}</text>
          </g>
        );
      } else {
        ticks.push(<line key={i} x1={x} y1={headerH} x2={x} y2={totalH} stroke="#2a3144" strokeWidth={1} />);
      }
    }
    return ticks;
  })();

  const todayLine = (showToday && model.minT && model.maxT)
    ? (() => {
        if (todayT < model.minT! || todayT > model.maxT!) return null;
        const x = dayX(todayT);
        return <line x1={x} y1={0} x2={x} y2={totalH} stroke="#ff6363" strokeWidth={2} strokeDasharray="4 3" />;
      })()
    : null;

  /* ==== [BLOCK: Render] BEGIN ==== */
  return (
    <div className="gantt-wrap" role="figure" aria-label="Gantt-oversikt">
      <div className="gantt-scroller">
        <svg width={width} height={totalH} role="img" aria-label="Gantt-diagram">
          {/* Header-bakgrunn (kalenderstripen) – HØYDE = --header-h */}
          <rect x={0} y={0} width={width} height={headerH} fill="var(--panel-2)" />
          {/* Y-etiketter bakgrunn */}
          <rect x={0} y={headerH} width={leftLabelW} height={contentH} fill="var(--panel-2)" />
          {/* Rutemønster og datoetiketter */}
          {headerTicks}
          {/* i dag-linje */}
          {todayLine}
          {/* Y-etiketter på venstre akse – samme radindeks og høyde som tabellrader */}
          {rows.map((r, i) => {
            const y = headerH + i * (rowH + 1) + Math.round(rowH / 2) + 4;
            const label = r.aktivitet?.trim() || `${i + 1}`;
            return <text key={i} x={6} y={y} fontSize={11} fill="#a6accd">{label}</text>;
          })}
          {/* Barer */}
          {bars}
        </svg>
      </div>
    </div>
  );
  /* ==== [BLOCK: Render] END ==== */
}
