"use client";

import { CATEGORY_LABELS, type TaskCategory } from "@/types/telemetry";

interface CategorySelectorProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
}

const CATEGORIES: TaskCategory[] = [
  "physical",
  "communication",
  "software_exception",
];

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
        DOMAIN CATEGORY
      </h2>
      <div className="grid grid-cols-1 gap-2">
        {CATEGORIES.map((category) => {
          const selected = value === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={`min-h-12 rounded-xl border px-3 text-left font-mono text-xs tracking-[0.08em] uppercase ${
                selected
                  ? "border-accent-teal/70 bg-accent-teal/10 text-accent-teal shadow-[0_0_16px_rgba(46,230,214,0.16)]"
                  : "border-slate-line bg-slate-raised/70 text-slate-muted active:bg-slate-raised"
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
