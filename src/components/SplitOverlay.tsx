// src/components/SplitOverlay.tsx
import React, { useCallback, useRef, useState } from "react";

export type SplitOverlayProps = {
  /** 0–100. Hvor mye av høyre panel (Gantt) som vises. */
  percent: number;
  onPercentChange: (p: number) => void;
  height?: number | string; // f.eks 70vh
  left: React.ReactNode;    // Tabell (venstre)
  right: React.ReactNode;   // Gantt (høyre)
};

export default function SplitOverlay({
  percent,
  onPercentChange,
  height = "70vh",
  left,
  right,
}: SplitOverlayProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    e.preventDefault();
  }, []);

  // Nå beregner vi prosent fra HØYRE kant (Gantt trekkes inn fra høyre)
  const onMove = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relFromRight = clamp((rect.right - clientX) / rect.width, 0, 1);
    onPercentChange(Math.round(relFromRight * 100));
  }, [onPercentChange]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    onMove(e.clientX);
  }, [dragging, onMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    if (e.touches.length > 0) onMove(e.touches[0].clientX);
  }, [dragging, onMove]);

  const stopDrag = useCallback(() => setDragging(false), []);

  React.useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [onMouseMove, onTouchMove, stopDrag]);

 const handleStyle: React.CSSProperties = { right: `calc(${percent}% - 4px)` };
  const rightStyle: React.CSSProperties = { width: `${percent}%` };

  return (
    <div
      className={`split ${dragging ? "split-dragging" : ""}`}
      ref={wrapRef}
      style={{ height, /* NYTT: eksponer prosent som CSS-var */ ['--overlay-w' as any]: `${percent}%` }}
    >
      <div className="split-left">
        {left}
      </div>
      <div className="split-right" style={rightStyle} aria-label="Gantt overlay">
        {right}
      </div>
      <div
        className="split-handle"
        style={handleStyle}
        role="separator"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        title="Dra for å justere Gantt vs Tabell"
      >
        <span className="split-grip">⋮</span>
      </div>
    </div>
  );
}
