"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FRICTION_LABELS, TIER_LABELS, type TelemetryEvent } from "@/types/telemetry";

interface TelemetryStreamProps {
  events: TelemetryEvent[];
  nowMs: number;
  formatRelative: (timestamp: number, nowMs: number) => string;
}

const FRICTION_DOT: Record<TelemetryEvent["frictionLevel"], string> = {
  low: "bg-accent-teal",
  moderate: "bg-accent-amber",
  elevated: "bg-accent-amber",
  critical: "bg-accent-crimson",
};

export function TelemetryStream({
  events,
  nowMs,
  formatRelative,
}: TelemetryStreamProps) {
  return (
    <section className="mt-6 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-[10px] tracking-[0.22em] text-slate-muted">
          TELEMETRY STREAM
        </h2>
        <span className="font-mono text-[10px] text-slate-muted">
          {events.length} NODE{events.length === 1 ? "" : "S"}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-line px-4 py-6 text-center text-sm text-slate-muted">
          No triage nodes yet. Log an event to open the stream.
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-slate-line bg-slate-raised/60 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${FRICTION_DOT[event.frictionLevel]}`}
                    />
                    <span className="font-mono text-[11px] text-foreground">
                      T{event.tier}
                    </span>
                    <span className="truncate text-xs text-slate-muted">
                      {TIER_LABELS[event.tier]}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-slate-muted">
                    {formatRelative(event.timestamp, nowMs)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-obsidian">
                    <div
                      className="h-full rounded-full bg-accent-teal"
                      style={{ width: `${event.divergenceScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-slate-muted">
                    Δ {event.divergenceScore}
                  </span>
                  <span className="rounded-full border border-slate-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-muted">
                    {FRICTION_LABELS[event.frictionLevel]}
                  </span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
