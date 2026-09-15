"use client";

import { FRICTION_LABELS, type FrictionLevel } from "@/types/telemetry";

interface FrictionSelectorProps {
  value: FrictionLevel;
  onChange: (level: FrictionLevel) => void;
}

const LEVELS: FrictionLevel[] = ["low", "moderate", "elevated", "critical"];

const ACCENT: Record<FrictionLevel, string> = {
  low: "border-accent-teal/70 bg-accent-teal/10 text-accent-teal shadow-[0_0_16px_rgba(46,230,214,0.16)]",
  moderate:
    "border-accent-amber/50 bg-accent-amber/10 text-accent-amber shadow-[0_0_16px_rgba(245,165,36,0.16)]",
  elevated:
    "border-accent-amber/80 bg-accent-amber/15 text-accent-amber shadow-[0_0_16px_rgba(245,165,36,0.22)]",
  critical:
    "border-accent-crimson/80 bg-accent-crimson/15 text-accent-crimson shadow-[0_0_16px_rgba(255,59,92,0.22)]",
};

export function FrictionSelector({ value, onChange }: FrictionSelectorProps) {
  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
        FRICTION / THREAT LEVEL
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {LEVELS.map((level) => {
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`min-h-12 rounded-xl border font-mono text-xs tracking-[0.12em] uppercase transition ${
                selected
                  ? ACCENT[level]
                  : "border-slate-line bg-slate-raised/70 text-slate-muted active:bg-slate-raised"
              }`}
            >
              {FRICTION_LABELS[level]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
