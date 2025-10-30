// src/core/featureFlags.tsx
import React, { useSyncExternalStore } from "react";
import { getEdition, type Edition } from "../config/edition";

type FeatureKey =
  | "file.print"
  | "file.clear"
  | "file.open"
  | "file.new"
  | "file.save"
  | "file.export"
  | "file.printAdvanced";

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

// Intern tilstand for edition/feature-matrise
let currentEdition: Edition = getEdition();
let currentMatrix: FeatureMatrix = matrixFor(currentEdition);

// Abonnement (for React hook)
const subs = new Set<() => void>();
function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}
function notify() {
  subs.forEach((f) => f());
}

export function getEditionNow(): Edition {
  return currentEdition;
}
export function setEditionNow(edition: Edition) {
  currentEdition = edition;
  currentMatrix = matrixFor(edition);
  notify();
}
export function hasFeature(key: FeatureKey): boolean {
  return !!currentMatrix[key];
}
export function refreshFeatures() {
  currentMatrix = matrixFor(currentEdition);
  notify();
}

// Hook: les et flagg og rerender ved endring
export function useFeature(key: FeatureKey): boolean {
  // snapshot-funksjon må være stabil og ikke allokere nytt objekt
  const getSnapshot = () => hasFeature(key);
  // useSyncExternalStore krever samme subscribe for mount/unmount
  return useSyncExternalStore(subscribe, getSnapshot);
}

// Liten gate-komponent for å vise/skjule UI
export const FeatureGate: React.FC<{
  feature: FeatureKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ feature, fallback = null, children }) => {
  return hasFeature(feature) ? <>{children}</> : <>{fallback}</>;
};
