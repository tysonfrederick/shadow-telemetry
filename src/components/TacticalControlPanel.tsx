"use client";

import { ComplexityTierSelector } from "@/components/ComplexityTierSelector";
import { DivergenceSlider } from "@/components/DivergenceSlider";
import { FrictionSelector } from "@/components/FrictionSelector";
import { LogEventButton } from "@/components/LogEventButton";
import type {
  ComplexityTier,
  FrictionLevel,
  PanelState,
  SomaticState,
} from "@/types/telemetry";

interface TacticalControlPanelProps {
  panel: PanelState;
  somatic: SomaticState;
  onChange: (next: PanelState) => void;
  onLog: () => void;
}

export function TacticalControlPanel({
  panel,
  somatic,
  onChange,
  onLog,
}: TacticalControlPanelProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-line bg-slate-panel/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="font-mono text-[10px] tracking-[0.24em] text-slate-muted">
        TACTICAL CONTROL
      </p>
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
    </div>
  );
}
