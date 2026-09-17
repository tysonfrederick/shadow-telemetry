export type ComplexityTier = 1 | 2 | 3 | 4;

export type FrictionLevel = "low" | "moderate" | "elevated" | "critical";

export type AppState = "IDLE" | "ACTIVE_NODE" | "RECEIPT";

export type SomaticBand = "serene" | "tense" | "threat";

export interface PanelState {
  tier: ComplexityTier;
  divergenceScore: number;
  frictionLevel: FrictionLevel;
}

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  tier: ComplexityTier;
  divergenceScore: number;
  frictionLevel: FrictionLevel;
  sessionDurationMs: number;
  taskDurationMs: number;
}

export interface TelemetrySession {
  events: TelemetryEvent[];
  sessionStartMs: number;
  appState: AppState;
  currentTaskStartMs: number | null;
  lockedTaskDurationMs: number | null;
  isPaused: boolean;
  accumulatedPausedMs: number;
  pauseStartedMs: number | null;
}

export interface SomaticState {
  band: SomaticBand;
  label: "SOP ALIGNED" | "PAUSED" | "RECORDING" | "AWAITING INPUT";
  accent: string;
  glow: string;
  pulseMs: number;
  intensity: number;
}

export interface SynthesisMetrics {
  totalShadowTimeMs: number;
  peakCognitiveLoad: number;
  sopDivergenceRatio: number;
  eventCount: number;
  elapsedMs: number;
}

export const TIER_LABELS: Record<ComplexityTier, string> = {
  1: "Routine Triage",
  2: "Intermediate Exception",
  3: "Advanced Deviation",
  4: "Novel / Uncharted Exploratory",
};

export const FRICTION_LABELS: Record<FrictionLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  critical: "Critical",
};

export const DEFAULT_PANEL_STATE: PanelState = {
  tier: 1,
  divergenceScore: 12,
  frictionLevel: "low",
};
