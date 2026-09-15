"use client";

import type { CSSProperties } from "react";
import type { SomaticState } from "@/types/telemetry";

interface SomaticHeaderProps {
  somatic: SomaticState;
  elapsedMs: number;
  formatElapsed: (ms: number) => string;
}

export function SomaticHeader({
  somatic,
  elapsedMs,
  formatElapsed,
}: SomaticHeaderProps) {
  return (
    <header className="flex flex-col items-center pt-2 pb-5">
      <p className="font-mono text-[10px] tracking-[0.32em] text-slate-muted">
        SHADOW TELEMETRY
      </p>
      <h1 className="mt-1 text-center text-[15px] font-medium tracking-wide text-foreground">
        Cognitive Workload &amp; Unscripted Exception Logger
      </h1>

      <div
        className="relative mt-6 flex h-28 w-28 items-center justify-center"
        style={
          {
            "--somatic-glow": somatic.glow,
            "--somatic-pulse": `${somatic.pulseMs}ms`,
          } as CSSProperties
        }
      >
        <div
          className="somatic-ring absolute inset-0 rounded-full border"
          style={{ borderColor: somatic.accent }}
        />
        <div className="somatic-ring-inner absolute inset-3 rounded-full border border-slate-line bg-slate-panel/80" />
        <svg
          viewBox="0 0 24 24"
          className="relative z-10 h-8 w-8"
          fill="none"
          stroke={somatic.accent}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
          <path d="M4 6h.01" />
          <path d="M2.29 9.62A10 10 0 1 0 21.31 8" />
          <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />
          <path d="M12 18h.01" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </div>

      <p
        className="mt-4 font-mono text-xs tracking-[0.28em]"
        style={{ color: somatic.accent }}
      >
        {somatic.label}
      </p>
      <p className="mt-1 font-mono text-[11px] text-slate-muted">
        SHIFT {formatElapsed(elapsedMs)}
      </p>
    </header>
  );
}
