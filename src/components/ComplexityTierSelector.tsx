"use client";

import { TIER_LABELS, type ComplexityTier } from "@/types/telemetry";

interface ComplexityTierSelectorProps {
  value: ComplexityTier;
  onChange: (tier: ComplexityTier) => void;
}

const TIERS: ComplexityTier[] = [1, 2, 3, 4];

export function ComplexityTierSelector({
  value,
  onChange,
}: ComplexityTierSelectorProps) {
  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
        HOW COMPLEX
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {TIERS.map((tier) => {
          const selected = value === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => onChange(tier)}
              className={`min-h-16 rounded-xl border px-3 py-2.5 text-left transition ${
                selected
                  ? "border-accent-teal/70 bg-accent-teal/10 shadow-[0_0_18px_rgba(46,230,214,0.18)]"
                  : "border-slate-line bg-slate-raised/70 active:bg-slate-raised"
              }`}
            >
              <span className="font-mono text-[10px] text-slate-muted">
                LEVEL {tier}
              </span>
              <span className="mt-1 block text-[13px] leading-tight text-foreground">
                {TIER_LABELS[tier]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
