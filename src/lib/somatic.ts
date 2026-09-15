import type {
  ComplexityTier,
  FrictionLevel,
  PanelState,
  SomaticState,
} from "@/types/telemetry";

const FRICTION_WEIGHT: Record<FrictionLevel, number> = {
  low: 0,
  moderate: 0.34,
  elevated: 0.7,
  critical: 1,
};

export function cognitiveLoadScore(
  tier: ComplexityTier,
  divergenceScore: number,
  frictionLevel: FrictionLevel,
): number {
  const tierScore = tier * 25;
  const frictionScore = FRICTION_WEIGHT[frictionLevel] * 75 + 25;
  return Math.round((tierScore + frictionScore + divergenceScore) / 3);
}

export function deriveSomaticState(panel: PanelState): SomaticState {
  const intensity = Math.min(
    1,
    ((panel.tier - 1) / 3) * 0.35 +
      (panel.divergenceScore / 100) * 0.35 +
      FRICTION_WEIGHT[panel.frictionLevel] * 0.3,
  );

  if (intensity >= 0.66 || panel.frictionLevel === "critical") {
    return {
      band: "threat",
      label: "SYSTEMIC",
      accent: "#ff3b5c",
      glow: "rgba(255, 59, 92, 0.55)",
      pulseMs: 720,
      intensity,
    };
  }

  if (
    intensity >= 0.33 ||
    panel.tier >= 3 ||
    panel.divergenceScore >= 50 ||
    panel.frictionLevel === "elevated"
  ) {
    return {
      band: "tense",
      label: "EXCEPTION",
      accent: "#f5a524",
      glow: "rgba(245, 165, 36, 0.5)",
      pulseMs: 1400,
      intensity,
    };
  }

  return {
    band: "serene",
    label: "SOP ALIGNED",
    accent: "#2ee6d6",
    glow: "rgba(46, 230, 214, 0.48)",
    pulseMs: 2800,
    intensity,
  };
}
