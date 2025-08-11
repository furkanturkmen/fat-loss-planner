"use client";

import { useEffect, useRef, useState } from "react";
import { getApp, type AppData, STORAGE_EVENT } from "@/lib/storage";

/**
 * SSR-safe store selector.
 * - Reads once on mount
 * - Re-reads on STORAGE_EVENT
 * - Stable dependencies (no loops)
 */
export function useAppData<T>(selector: (a: AppData) => T) {
  const selectorRef = useRef(selector); // avoid re-subscribing if parent recreates selector
  selectorRef.current = selector;

  const [state, setState] = useState<T | null>(null);

  useEffect(() => {
    // initial read after mount
    const read = () => {
      try {
        const snap = getApp();
        setState(selectorRef.current(snap));
      } catch {
        // ignore
      }
    };

    read(); // mount
    const handler = () => read();
    window.addEventListener(STORAGE_EVENT, handler);

    // Also listen to browser storage event (cross-tab updates)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === null || e.key === "appData.v1") read();
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener(STORAGE_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return state;
}

// Convenience hooks
export const useProfile = () => useAppData((a) => a.profile);
export const useRestrictions = () => useAppData((a) => a.restrictions);
export const useWeeklyPlan = () => useAppData((a) => a.weeklyPlan);
export const useRecipes = () => useAppData((a) => a.recipes);
export const useOnboardingComplete = () => useAppData((a) => a.onboardingComplete);
