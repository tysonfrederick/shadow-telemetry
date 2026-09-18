"use client";

import type { ActiveTask } from "@/types/telemetry";

interface ActiveTaskCardProps {
  task: ActiveTask;
  index: number;
  elapsedLabel: string;
  onResolve: (taskId: string) => void;
}

export function ActiveTaskCard({
  task,
  index,
  elapsedLabel,
  onResolve,
}: ActiveTaskCardProps) {
  return (
    <article className="rounded-xl border border-slate-line bg-slate-raised/70 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-slate-muted">
            NODE {index + 1}
          </p>
          <p className="mt-1 font-mono text-lg tabular-nums text-accent-amber">
            {elapsedLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onResolve(task.id)}
          className="min-h-11 rounded-xl border border-accent-amber bg-accent-amber px-4 font-mono text-[11px] tracking-[0.14em] uppercase text-obsidian active:scale-[0.96]"
        >
          Resolve
        </button>
      </div>
    </article>
  );
}
