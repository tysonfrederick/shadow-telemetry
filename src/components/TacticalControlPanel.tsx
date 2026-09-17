"use client";

import { ComplexityTierSelector } from "@/components/ComplexityTierSelector";
import { DivergenceSlider } from "@/components/DivergenceSlider";
import { FrictionSelector } from "@/components/FrictionSelector";
import { LogEventButton } from "@/components/LogEventButton";
import type {
  AppState,
  ComplexityTier,
  FrictionLevel,
  PanelState,
  SomaticState,
} from "@/types/telemetry";

interface TacticalControlPanelProps {
  appState: AppState;
  isPaused: boolean;
  panel: PanelState;
  somatic: SomaticState;
  onChange: (next: PanelState) => void;
  onStartNode: () => void;
  onEndNode: () => void;
  onDiscard: () => void;
  onLog: () => void;
  onTogglePause: () => void;
}

function DiscardButton({ onDiscard }: { onDiscard: () => void }) {
  return (
    <button
      type="button"
      onClick={onDiscard}
      className="flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-line bg-transparent font-mono text-xs tracking-[0.16em] uppercase text-slate-muted"
    >
      Discard
    </button>
  );
}

export function TacticalControlPanel({
  appState,
  isPaused,
  panel,
  somatic,
  onChange,
  onStartNode,
  onEndNode,
  onDiscard,
  onLog,
  onTogglePause,
}: TacticalControlPanelProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-line bg-slate-panel/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="font-mono text-[10px] tracking-[0.24em] text-slate-muted">
        TACTICAL CONTROL
      </p>

      {appState === "IDLE" ? (
        <>
          <button
            type="button"
            onClick={onStartNode}
            disabled={isPaused}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-accent-teal bg-accent-teal text-[15px] font-semibold tracking-[0.18em] uppercase text-obsidian shadow-[0_0_28px_rgba(46,230,214,0.35)] transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:border-slate-line disabled:bg-slate-raised disabled:text-slate-muted disabled:shadow-none"
          >
            Start Node
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            aria-pressed={isPaused}
            className={`flex min-h-12 w-full items-center justify-center rounded-xl border font-mono text-xs tracking-[0.16em] uppercase ${
              isPaused
                ? "border-accent-teal/60 bg-accent-teal/10 text-accent-teal"
                : "border-slate-line bg-slate-raised/70 text-slate-muted"
            }`}
          >
            {isPaused ? "Resume Shift" : "Pause Shift"}
          </button>
        </>
      ) : null}

      {appState === "ACTIVE_NODE" ? (
        <>
          <p className="text-center text-sm text-slate-muted">
            Node is live. Score the exception after you end it.
          </p>
          <button
            type="button"
            onClick={onEndNode}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-accent-amber bg-accent-amber text-[15px] font-semibold tracking-[0.18em] uppercase text-obsidian shadow-[0_0_28px_rgba(245,165,36,0.35)] transition-transform active:scale-[0.96]"
          >
            End Node
          </button>
          <DiscardButton onDiscard={onDiscard} />
        </>
      ) : null}

      {appState === "RECEIPT" ? (
        <>
          <ComplexityTierSelector
            value={panel.tier}
            onChange={(tier: ComplexityTier) => onChange({ ...panel, tier })}
          />
          <DivergenceSlider
            value={panel.divergenceScore}
            onChange={(divergenceScore) => onChange({ ...panel, divergenceScore })}
          />
          <FrictionSelector
            value={panel.frictionLevel}
            onChange={(frictionLevel: FrictionLevel) =>
              onChange({ ...panel, frictionLevel })
            }
          />
          <LogEventButton somatic={somatic} onLog={onLog} />
          <DiscardButton onDiscard={onDiscard} />
        </>
      ) : null}
    </div>
  );
}
