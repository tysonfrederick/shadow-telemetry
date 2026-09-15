"use client";

interface DivergenceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function DivergenceSlider({ value, onChange }: DivergenceSliderProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
          SOP DIVERGENCE
        </h2>
        <span className="font-mono text-lg tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="SOP divergence"
        className="divergence-slider"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="flex justify-between gap-3 font-mono text-[10px] leading-tight text-slate-muted">
        <span className="max-w-[42%]">Strict Standard Work</span>
        <span className="max-w-[52%] text-right">
          Full Shadow Work / Unscripted
        </span>
      </div>
    </section>
  );
}
