// src/core/featureFlags.ts
import { getEdition, type Edition } from "../config/edition";

type FeatureKey =
  | "file.print"
  | "file.clear"
  | "file.open"
  | "file.new"
  | "file.save"
  | "file.export"
  | "file.printAdvanced" // f.eks. egen print-layout
  ;

type FeatureMatrix = Record<FeatureKey, boolean>;

const LITE: FeatureMatrix = {
  "file.print": true,
  "file.clear": true,
  "file.open": false,
  "file.new": false,
  "file.save": false,
  "file.export": false,
  "file.printAdvanced": false,
};

const FULL: FeatureMatrix = {
  "file.print": true,
  "file.clear": true,
  "file.open": true,
  "file.new": true,
  "file.save": true,
  "file.export": true,
  "file.printAdvanced": true,
};

function matrixFor(edition: Edition): FeatureMatrix {
  return edition === "full" ? FULL : LITE;
}

// Enkel “singleton” tilstand (kan byttes til Context senere)
let currentEdition: Edition = getEdition();
let currentMatrix: FeatureMatrix = matrixFor(currentEdition);

export function getEditionNow(): Edition {
  return currentEdition;
}

export function setEditionNow(edition: Edition) {
  currentEdition = edition;
  currentMatrix = matrixFor(edition);
}

export function hasFeature(key: FeatureKey): boolean {
  return !!currentMatrix[key];
}

// React-hjelpere
import { useSyncExternalStore } from "react";

// mini-bus for oppdateringer (om vi senere lar brukeren skifte edition i UI)
const subs = new Set<() => void>();
function subscribe(cb: () => void) { subs.add(cb); return () => subs.delete(cb); }
function notify() { subs.forEach(f => f()); }

/** (Valgfritt) kall denne hvis du endrer edition i runtime */
export function refreshFeatures() { currentMatrix = matrixFor(currentEdition); notify(); }

/** Hook: rerender når matrix/edition endres */
export function useFeature(key: FeatureKey): boolean {
  useSyncExternalStore(subscribe, () => hasFeature(key));
  return hasFeature(key);
}

/** Gate-komponent */
import React from "react";
export const FeatureGate: React.FC<{ feature: FeatureKey; children: React.ReactNode; fallback?: React.ReactNode }> =
  ({ feature, children, fallback = null }) => (hasFeature(feature) ? <>{children}</> : <>{fallback}</>);
