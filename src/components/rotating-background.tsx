"use client";

import { useEffect, useState } from "react";
import {
  BACKGROUND_ROTATE_MS,
  RESORT_BACKGROUNDS,
} from "@/lib/backgrounds";
import { cn } from "@/lib/utils";

export function RotatingBackground({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Warm the browser cache for smoother swaps
    RESORT_BACKGROUNDS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (RESORT_BACKGROUNDS.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % RESORT_BACKGROUNDS.length);
    }, BACKGROUND_ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

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
      {/* Soft wash so tables and text stay readable — keep photos more visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/45 to-white/60" />
      <div className="absolute inset-0 bg-white/10" />
    </div>
  );
}
