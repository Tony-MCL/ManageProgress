// src/components/SummaryBar.tsx
/**
 * Deprecated: Summary bar is now rendered inside GanttLite (as a slim header).
 * Keeping this file as a no-op so App.tsx doesn't need edits.
 */
import React from "react";

export type SummaryBarProps = {
  rows: Record<string, string>[];
};

export default function SummaryBar(_: SummaryBarProps) {
  return null;
}
