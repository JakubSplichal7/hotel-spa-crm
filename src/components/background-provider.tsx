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
  immersive: boolean;
  index: number;
};

type BackgroundContextValue = {
  enabled: boolean;
  locked: boolean;
  immersive: boolean;
  index: number;
  count: number;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setLocked: (locked: boolean) => void;
  toggleLocked: () => void;
  setImmersive: (immersive: boolean) => void;
  toggleImmersive: () => void;
  next: () => void;
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

function loadPrefs(): StoredPrefs {
  if (typeof window === "undefined") {
    return { enabled: true, locked: false, immersive: false, index: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { enabled: true, locked: false, immersive: false, index: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    const count = RESORT_BACKGROUNDS.length;
    return {
      enabled: parsed.enabled !== false,
      locked: Boolean(parsed.locked),
      immersive: Boolean(parsed.immersive),
      index:
        typeof parsed.index === "number" && count > 0
          ? ((parsed.index % count) + count) % count
          : 0,
    };
  } catch {
    return { enabled: true, locked: false, immersive: false, index: 0 };
  }
}

export function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = useState(true);
  const [locked, setLockedState] = useState(false);
  const [immersive, setImmersiveState] = useState(false);
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    setEnabledState(prefs.enabled);
    setLockedState(prefs.locked);
    setImmersiveState(prefs.immersive && prefs.enabled);
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
      JSON.stringify({
        enabled,
        locked,
        immersive,
        index,
      } satisfies StoredPrefs)
    );
  }, [enabled, locked, immersive, index, hydrated]);

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
    if (!value) setImmersiveState(false);
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabledState((v) => {
      if (v) setImmersiveState(false);
      return !v;
    });
  }, []);

  const setLocked = useCallback((value: boolean) => {
    setLockedState(value);
  }, []);

  const toggleLocked = useCallback(() => {
    setLockedState((v) => !v);
  }, []);

  const setImmersive = useCallback((value: boolean) => {
    if (value) {
      setEnabledState(true);
      setImmersiveState(true);
    } else {
      setImmersiveState(false);
    }
  }, []);

  const toggleImmersive = useCallback(() => {
    setImmersiveState((v) => {
      if (!v) {
        setEnabledState(true);
        return true;
      }
      return false;
    });
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % RESORT_BACKGROUNDS.length);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      locked,
      immersive,
      index,
      count: RESORT_BACKGROUNDS.length,
      setEnabled,
      toggleEnabled,
      setLocked,
      toggleLocked,
      setImmersive,
      toggleImmersive,
      next,
    }),
    [
      enabled,
      locked,
      immersive,
      index,
      setEnabled,
      toggleEnabled,
      setLocked,
      toggleLocked,
      setImmersive,
      toggleImmersive,
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
