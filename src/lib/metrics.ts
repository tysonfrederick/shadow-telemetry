import { cognitiveLoadScore } from "@/lib/somatic";
import type { SynthesisMetrics, TelemetryEvent } from "@/types/telemetry";

export function synthesizeMetrics(
  events: TelemetryEvent[],
  sessionStartMs: number,
  nowMs: number,
): SynthesisMetrics {
  const elapsedMs = Math.max(0, nowMs - sessionStartMs);
  const chronological = [...events].sort(
    (a, b) => a.sessionDurationMs - b.sessionDurationMs,
  );

  if (chronological.length === 0) {
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

  for (let i = 0; i < chronological.length; i += 1) {
    const current = chronological[i];
    const nextAt =
      i + 1 < chronological.length
        ? chronological[i + 1].sessionDurationMs
        : elapsedMs;
    const dt = Math.max(0, nextAt - current.sessionDurationMs);
    const weight = current.divergenceScore / 100;
    shadowMs += dt * weight;
    weightedDivergence += current.divergenceScore * dt;
    coveredMs += dt;
  }

  const peakCognitiveLoad = chronological.reduce((peak, event) => {
    return Math.max(
      peak,
      cognitiveLoadScore(event.tier, event.divergenceScore, event.frictionLevel),
    );
  }, 0);

  const sopDivergenceRatio =
    coveredMs > 0 ? weightedDivergence / coveredMs : 0;

  return {
    totalShadowTimeMs: Math.round(shadowMs),
    peakCognitiveLoad,
    sopDivergenceRatio,
    eventCount: chronological.length,
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
