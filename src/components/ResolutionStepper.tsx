"use client";

interface ResolutionStepperProps {
  value: number;
  onChange: (value: number) => void;
}

export function ResolutionStepper({ value, onChange }: ResolutionStepperProps) {
  const steps = Math.max(1, value);

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
        STEPS TO FIX
      </h2>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Remove a step"
          onClick={() => onChange(Math.max(1, steps - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-line bg-slate-raised font-mono text-lg text-foreground active:scale-[0.96]"
        >
          −
        </button>
        <span className="flex-1 text-center font-mono text-2xl tabular-nums text-foreground">
          {steps}
        </span>
        <button
          type="button"
          aria-label="Add a step"
          onClick={() => onChange(Math.min(99, steps + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-line bg-slate-raised font-mono text-lg text-foreground active:scale-[0.96]"
        >
          +
        </button>
      </div>
    </section>
  );
}
