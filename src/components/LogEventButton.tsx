"use client";

import type { SomaticState } from "@/types/telemetry";

interface LogEventButtonProps {
  somatic: SomaticState;
  onLog: () => void;
}

export function LogEventButton({ somatic, onLog }: LogEventButtonProps) {
  return (
    <button
      type="button"
      onClick={onLog}
      className="relative mt-1 flex min-h-14 w-full items-center justify-center overflow-hidden rounded-2xl border text-[15px] font-semibold tracking-[0.18em] uppercase text-obsidian transition-transform active:scale-[0.96]"
      style={{
        background: somatic.accent,
        borderColor: somatic.accent,
        boxShadow: `0 0 28px ${somatic.glow}`,
      }}
    >
      Save
    </button>
  );
}
