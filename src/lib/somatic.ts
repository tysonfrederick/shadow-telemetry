import type { AppState, ComplexityTier, FrictionLevel, SomaticState } from "@/types/telemetry";

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

export function deriveSomaticState(
  appState: AppState,
  isPaused: boolean,
): SomaticState {
  if (appState === "ACTIVE_NODE") {
    return {
      band: "tense",
      label: "TIMING",
      accent: "#f5a524",
      glow: "rgba(245, 165, 36, 0.5)",
      pulseMs: 1400,
      intensity: 0.55,
    };
  }

  if (appState === "RECEIPT") {
    return {
      band: "tense",
      label: "LOG THIS JOB",
      accent: "#f5a524",
      glow: "rgba(245, 165, 36, 0.38)",
      pulseMs: 1800,
      intensity: 0.4,
    };
  }

  if (isPaused) {
    return {
      band: "serene",
      label: "ON BREAK",
      accent: "#8b9aab",
      glow: "rgba(139, 154, 171, 0.35)",
      pulseMs: 2800,
      intensity: 0,
    };
  }

  return {
    band: "serene",
    label: "ON STANDARD",
    accent: "#2ee6d6",
    glow: "rgba(46, 230, 214, 0.48)",
    pulseMs: 2800,
    intensity: 0,
  };
}
