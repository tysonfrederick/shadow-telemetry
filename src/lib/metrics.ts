import { cognitiveLoadScore } from "@/lib/somatic";
import type { SynthesisMetrics, TelemetrySession } from "@/types/telemetry";

export function pauseMs(session: TelemetrySession, nowMs: number): number {
  const live =
    session.isPaused && session.pauseStartedMs !== null
      ? Math.max(0, nowMs - session.pauseStartedMs)
      : 0;
  return session.accumulatedPausedMs + live;
}

export function shiftElapsedMs(session: TelemetrySession, nowMs: number): number {
  if (session.sessionStartMs <= 0 || nowMs <= 0) return 0;
  return Math.max(0, nowMs - session.sessionStartMs - pauseMs(session, nowMs));
}

export function taskElapsedMs(session: TelemetrySession, nowMs: number): number {
  if (session.lockedTaskDurationMs !== null) {
    return session.lockedTaskDurationMs;
  }
  if (session.currentTaskStartMs === null || nowMs <= 0) return 0;
  return Math.max(0, nowMs - session.currentTaskStartMs);
}

export function synthesizeMetrics(
  session: TelemetrySession,
  nowMs: number,
): SynthesisMetrics {
  const elapsedMs = shiftElapsedMs(session, nowMs);
  const events = session.events;

  if (events.length === 0) {
    return {
      totalShadowTimeMs: 0,
      peakCognitiveLoad: 0,
      sopDivergenceRatio: 0,
      eventCount: 0,
      elapsedMs,
    };
  }

  let shadowMs = 0;
  let weightedDivergence = 0;
  let coveredMs = 0;

  for (const event of events) {
    const taskMs = Math.max(0, event.taskDurationMs || 0);
    shadowMs += taskMs * (event.divergenceScore / 100);
    weightedDivergence += event.divergenceScore * taskMs;
    coveredMs += taskMs;
  }

  const peakCognitiveLoad = events.reduce((peak, event) => {
    return Math.max(
      peak,
      cognitiveLoadScore(event.tier, event.divergenceScore, event.frictionLevel),
    );
  }, 0);

  const sopDivergenceRatio = coveredMs > 0 ? weightedDivergence / coveredMs : 0;

  return {
    totalShadowTimeMs: Math.round(shadowMs),
    peakCognitiveLoad,
    sopDivergenceRatio,
    eventCount: events.length,
    elapsedMs,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatRelativeTime(timestamp: number, nowMs: number): string {
  const delta = Math.max(0, nowMs - timestamp);
  if (delta < 5_000) return "just now";
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return `${Math.floor(delta / 3_600_000)}h ago`;
}
