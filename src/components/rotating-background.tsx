"use client";

import { useEffect, useState } from "react";
import { RESORT_BACKGROUNDS } from "@/lib/backgrounds";
import { useBackground } from "@/components/background-provider";
import { cn } from "@/lib/utils";

/** Matches Tailwind `md` (768px) — desktop backgrounds from this width up. */
const DESKTOP_MQ = "(min-width: 768px)";

export function RotatingBackground({ className }: { className?: string }) {
  const { enabled, immersive, index } = useBackground();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!enabled) {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-background",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      {RESORT_BACKGROUNDS.map((bg, i) => {
        const src = isDesktop ? bg.desktop : bg.mobile;
        return (
          <div
            key={bg.desktop}
            className={cn(
              "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundImage: `url(${src})` }}
          />
        );
      })}
      {!immersive && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/25 to-white/40" />
          <div className="absolute inset-0 bg-white/5" />
        </>
      )}
    </div>
  );
}
