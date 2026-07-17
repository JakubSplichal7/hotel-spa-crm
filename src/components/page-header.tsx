import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const titleShadow =
  "[text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_12px_rgba(255,255,255,0.85),0_2px_8px_rgba(255,255,255,0.7)]";
const descShadow =
  "[text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "text-3xl font-bold tracking-tight text-slate-950",
            titleShadow
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-1 text-sm font-semibold text-slate-900",
              descShadow
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
