"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BACKGROUND_ROTATE_MS,
  RESORT_BACKGROUNDS,
} from "@/lib/backgrounds";

const STORAGE_KEY = "hotel-spa-crm-background";

type StoredPrefs = {
  enabled: boolean;
  locked: boolean;
  index: number;
};

type BackgroundContextValue = {
  enabled: boolean;
  locked: boolean;
  index: number;
  count: number;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setLocked: (locked: boolean) => void;
  toggleLocked: () => void;
  next: () => void;
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

function loadPrefs(): StoredPrefs {
  if (typeof window === "undefined") {
    return { enabled: true, locked: false, index: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: true, locked: false, index: 0 };
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    const count = RESORT_BACKGROUNDS.length;
    return {
      enabled: parsed.enabled !== false,
      locked: Boolean(parsed.locked),
      index:
        typeof parsed.index === "number" && count > 0
          ? ((parsed.index % count) + count) % count
          : 0,
    };
  } catch {
    return { enabled: true, locked: false, index: 0 };
  }
}

export function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = useState(true);
  const [locked, setLockedState] = useState(false);
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    setEnabledState(prefs.enabled);
    setLockedState(prefs.locked);
    setIndex(prefs.index);
    setHydrated(true);

    RESORT_BACKGROUNDS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled, locked, index } satisfies StoredPrefs)
    );
  }, [enabled, locked, index, hydrated]);

  useEffect(() => {
    if (!hydrated || !enabled || locked || RESORT_BACKGROUNDS.length < 2) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % RESORT_BACKGROUNDS.length);
    }, BACKGROUND_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [enabled, locked, hydrated]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabledState((v) => !v);
  }, []);

  const setLocked = useCallback((value: boolean) => {
    setLockedState(value);
  }, []);

  const toggleLocked = useCallback(() => {
    setLockedState((v) => !v);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % RESORT_BACKGROUNDS.length);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      locked,
      index,
      count: RESORT_BACKGROUNDS.length,
      setEnabled,
      toggleEnabled,
      setLocked,
      toggleLocked,
      next,
    }),
    [
      enabled,
      locked,
      index,
      setEnabled,
      toggleEnabled,
      setLocked,
      toggleLocked,
      next,
    ]
  );

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) {
    throw new Error("useBackground must be used within BackgroundProvider");
  }
  return ctx;
}
