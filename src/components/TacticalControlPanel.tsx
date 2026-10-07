"use client";

import { ActiveTaskCard } from "@/components/ActiveTaskCard";
import { CategorySelector } from "@/components/CategorySelector";
import { ComplexityTierSelector } from "@/components/ComplexityTierSelector";
import { DivergenceSlider } from "@/components/DivergenceSlider";
import { FrictionSelector } from "@/components/FrictionSelector";
import { LogEventButton } from "@/components/LogEventButton";
import { ResolutionStepper } from "@/components/ResolutionStepper";
import type {
  ActiveTask,
  AppState,
  ComplexityTier,
  FrictionLevel,
  PanelState,
  SomaticState,
  TaskCategory,
} from "@/types/telemetry";

interface TacticalControlPanelProps {
  appState: AppState;
  isPaused: boolean;
  activeTasks: ActiveTask[];
  resolvingElapsedLabel: string | null;
  nowMs: number;
  formatElapsed: (ms: number) => string;
  panel: PanelState;
  somatic: SomaticState;
  onChange: (next: PanelState) => void;
  onStartNode: () => void;
  onAddConcurrent: () => void;
  onResolve: (taskId: string) => void;
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
      Cancel
    </button>
  );
}

export function TacticalControlPanel({
  appState,
  isPaused,
  activeTasks,
  resolvingElapsedLabel,
  nowMs,
  formatElapsed,
  panel,
  somatic,
  onChange,
  onStartNode,
  onAddConcurrent,
  onResolve,
  onDiscard,
  onLog,
  onTogglePause,
}: TacticalControlPanelProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-line bg-slate-panel/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="font-mono text-[10px] tracking-[0.24em] text-slate-muted">
        CONTROLS
      </p>

      {appState === "IDLE" ? (
        <>
          <button
            type="button"
            onClick={onStartNode}
            disabled={isPaused}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-accent-teal bg-accent-teal text-[15px] font-semibold tracking-[0.18em] uppercase text-obsidian shadow-[0_0_28px_rgba(46,230,214,0.35)] transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:border-slate-line disabled:bg-slate-raised disabled:text-slate-muted disabled:shadow-none"
          >
            Start job
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
            {isPaused ? "Back to work" : "Take a break"}
          </button>
        </>
      ) : null}

      {appState === "ACTIVE_NODE" ? (
        <>
          <div className="space-y-2">
            {activeTasks.map((task, index) => (
              <ActiveTaskCard
                key={task.id}
                task={task}
                index={index}
                elapsedLabel={formatElapsed(
                  task.lockedDurationMs ?? Math.max(0, nowMs - task.startMs),
                )}
                onResolve={onResolve}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onAddConcurrent}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-accent-amber/50 bg-accent-amber/10 font-mono text-xs tracking-[0.14em] uppercase text-accent-amber active:scale-[0.96]"
          >
            + Start another job
          </button>
        </>
      ) : null}

      {appState === "RECEIPT" ? (
        <>
          {resolvingElapsedLabel ? (
            <p className="font-mono text-sm tabular-nums text-accent-amber">
              Time stopped: {resolvingElapsedLabel}
            </p>
          ) : null}
          <ComplexityTierSelector
            value={panel.tier}
            onChange={(tier: ComplexityTier) => onChange({ ...panel, tier })}
          />
          <CategorySelector
            value={panel.category}
            onChange={(category: TaskCategory) => onChange({ ...panel, category })}
          />
          <ResolutionStepper
            value={panel.resolutionSteps}
            onChange={(resolutionSteps) => onChange({ ...panel, resolutionSteps })}
          />
          <FrictionSelector
            value={panel.frictionLevel}
            onChange={(frictionLevel: FrictionLevel) =>
              onChange({ ...panel, frictionLevel })
            }
          />
          <DivergenceSlider
            value={panel.divergenceScore}
            onChange={(divergenceScore) => onChange({ ...panel, divergenceScore })}
          />
          <LogEventButton somatic={somatic} onLog={onLog} />
          <DiscardButton onDiscard={onDiscard} />
        </>
      ) : null}
    </div>
  );
}
