"use client";

import { RESORT_BACKGROUNDS } from "@/lib/backgrounds";
import { useBackground } from "@/components/background-provider";
import { cn } from "@/lib/utils";

export function RotatingBackground({ className }: { className?: string }) {
  const { enabled, index } = useBackground();

  if (!enabled) {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 bg-background", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {RESORT_BACKGROUNDS.map((src, i) => (
        <div
          key={src}
          className={cn(
            "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/25 to-white/40" />
      <div className="absolute inset-0 bg-white/5" />
    </div>
  );
}
