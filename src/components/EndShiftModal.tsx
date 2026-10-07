"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { SynthesisMetrics } from "@/types/telemetry";

interface EndShiftModalProps {
  metrics: SynthesisMetrics;
  formatDuration: (ms: number) => string;
  onClose: () => void;
  onReset: () => void;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-line bg-slate-raised/70 px-3 py-3">
      <p className="font-mono text-[10px] tracking-[0.18em] text-slate-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-muted">{hint}</p>
    </div>
  );
}

export function EndShiftModal({
  metrics,
  formatDuration,
  onClose,
  onReset,
}: EndShiftModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-obsidian/70 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-shift-title"
        className="w-full max-w-md rounded-2xl border border-slate-line bg-slate-panel p-5 shadow-[0_0_40px_rgba(0,0,0,0.45)]"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
              SHIFT SUMMARY
            </p>
            <h2 id="end-shift-title" className="mt-1 text-lg font-medium">
              End Shift
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-line p-1.5 text-slate-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <MetricCard
            label="Extra work time"
            value={formatDuration(metrics.totalShadowTimeMs)}
            hint="Time spent on work that is not standard"
          />
          <MetricCard
            label="Hardest job"
            value={`${metrics.peakCognitiveLoad}`}
            hint="Highest difficulty this shift"
          />
          <MetricCard
            label="Not standard work"
            value={`${Math.round(metrics.sopDivergenceRatio)}%`}
            hint="Share of time that was not standard work"
          />
        </div>

        <p className="mt-3 font-mono text-[11px] text-slate-muted">
          {metrics.eventCount} job{metrics.eventCount === 1 ? "" : "s"} · shift time{" "}
          {formatDuration(metrics.elapsedMs)}
        </p>

        <button
          type="button"
          onClick={onReset}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border border-accent-crimson/50 bg-accent-crimson/15 font-mono text-xs tracking-[0.16em] uppercase text-accent-crimson"
        >
          Clear shift
        </button>
      </motion.div>
    </motion.div>
  );
}
