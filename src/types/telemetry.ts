export type ComplexityTier = 1 | 2 | 3 | 4;

export type FrictionLevel = "low" | "moderate" | "elevated" | "critical";

export type AppState = "IDLE" | "ACTIVE_NODE" | "RECEIPT";

export type TaskCategory = "physical" | "communication" | "software_exception";

export type SomaticBand = "serene" | "tense" | "threat";

export interface PanelState {
  tier: ComplexityTier;
  category: TaskCategory;
  resolutionSteps: number;
  divergenceScore: number;
  frictionLevel: FrictionLevel;
}

export interface ActiveTask {
  id: string;
  startMs: number;
  lockedDurationMs: number | null;
}

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  tier: ComplexityTier;
  category: TaskCategory;
  resolutionSteps: number;
  divergenceScore: number;
  frictionLevel: FrictionLevel;
  sessionDurationMs: number;
  taskDurationMs: number;
}

export type TelemetryNode = TelemetryEvent;

export interface TelemetrySession {
  events: TelemetryEvent[];
  sessionStartMs: number;
  appState: AppState;
  activeTasks: ActiveTask[];
  resolvingTaskId: string | null;
  isPaused: boolean;
  accumulatedPausedMs: number;
  pauseStartedMs: number | null;
}

export interface SomaticState {
  band: SomaticBand;
  label: "ON STANDARD" | "ON BREAK" | "TIMING" | "LOG THIS JOB";
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
  1: "Everyday task",
  2: "A few extra steps",
  3: "Not standard work",
  4: "Brand-new problem",
};

export const FRICTION_LABELS: Record<FrictionLevel, string> = {
  low: "Easy",
  moderate: "Some hassle",
  elevated: "Hard",
  critical: "Blocked",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  physical: "Floor work",
  communication: "Radio / talk",
  software_exception: "Scanner / system",
};

export const DEFAULT_PANEL_STATE: PanelState = {
  tier: 1,
  category: "physical",
  resolutionSteps: 1,
  divergenceScore: 12,
  frictionLevel: "low",
};
