import type { PanelState, TelemetryEvent, TelemetrySession } from "@/types/telemetry";
import { shiftElapsedMs } from "@/lib/metrics";

const SESSION_BLOB_KEY = "shadow-telemetry:session";
const LEGACY_EVENTS_KEY = "shadow-telemetry:events";
const LEGACY_SESSION_KEY = "shadow-telemetry:session-start";

export const EMPTY_SESSION: TelemetrySession = {
  events: [],
  sessionStartMs: 0,
  appState: "IDLE",
  currentTaskStartMs: null,
  lockedTaskDurationMs: null,
  isPaused: false,
  accumulatedPausedMs: 0,
  pauseStartedMs: null,
};

const listeners = new Set<() => void>();
let clientSession: TelemetrySession | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    isFiniteNumber(event.timestamp) &&
    (event.tier === 1 ||
      event.tier === 2 ||
      event.tier === 3 ||
      event.tier === 4) &&
    isFiniteNumber(event.divergenceScore) &&
    (event.frictionLevel === "low" ||
      event.frictionLevel === "moderate" ||
      event.frictionLevel === "elevated" ||
      event.frictionLevel === "critical") &&
    isFiniteNumber(event.sessionDurationMs)
  );
}

function normalizeEvent(value: unknown): TelemetryEvent | null {
  if (!isTelemetryEvent(value)) return null;
  const raw = value as TelemetryEvent & { taskDurationMs?: unknown };
  const taskDurationMs = isFiniteNumber(raw.taskDurationMs)
    ? Math.max(0, raw.taskDurationMs)
    : 0;
  return { ...raw, taskDurationMs };
}

function idleMachine(): Pick<
  TelemetrySession,
  | "appState"
  | "currentTaskStartMs"
  | "lockedTaskDurationMs"
> {
  return {
    appState: "IDLE",
    currentTaskStartMs: null,
    lockedTaskDurationMs: null,
  };
}

export function createFreshSession(nowMs: number): TelemetrySession {
  return {
    events: [],
    sessionStartMs: nowMs,
    isPaused: false,
    accumulatedPausedMs: 0,
    pauseStartedMs: null,
    ...idleMachine(),
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(session: TelemetrySession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_BLOB_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_EVENTS_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
}

function commit(next: TelemetrySession): TelemetrySession {
  clientSession = next;
  persist(next);
  emit();
  return next;
}

function parseSessionBlob(raw: string): TelemetrySession | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const blob = parsed as Record<string, unknown>;
    const events = Array.isArray(blob.events)
      ? blob.events.map(normalizeEvent).filter((event): event is TelemetryEvent => event !== null)
      : [];
    const sessionStartMs = isFiniteNumber(blob.sessionStartMs) ? blob.sessionStartMs : 0;
    if (sessionStartMs <= 0) return null;

    const appState =
      blob.appState === "ACTIVE_NODE" || blob.appState === "RECEIPT" || blob.appState === "IDLE"
        ? blob.appState
        : "IDLE";

    return {
      events,
      sessionStartMs,
      appState,
      currentTaskStartMs: isFiniteNumber(blob.currentTaskStartMs)
        ? blob.currentTaskStartMs
        : null,
      lockedTaskDurationMs: isFiniteNumber(blob.lockedTaskDurationMs)
        ? blob.lockedTaskDurationMs
        : null,
      isPaused: blob.isPaused === true,
      accumulatedPausedMs: isFiniteNumber(blob.accumulatedPausedMs)
        ? Math.max(0, blob.accumulatedPausedMs)
        : 0,
      pauseStartedMs: isFiniteNumber(blob.pauseStartedMs) ? blob.pauseStartedMs : null,
    };
  } catch {
    return null;
  }
}

function loadLegacySession(): TelemetrySession | null {
  if (!isBrowser()) return null;
  const rawStart = window.localStorage.getItem(LEGACY_SESSION_KEY);
  const sessionStartMs = rawStart ? Number(rawStart) : NaN;
  if (!Number.isFinite(sessionStartMs) || sessionStartMs <= 0) return null;

  const rawEvents = window.localStorage.getItem(LEGACY_EVENTS_KEY);
  let events: TelemetryEvent[] = [];
  if (rawEvents) {
    try {
      const parsed: unknown = JSON.parse(rawEvents);
      events = Array.isArray(parsed)
        ? parsed.map(normalizeEvent).filter((event): event is TelemetryEvent => event !== null)
        : [];
    } catch {
      events = [];
    }
  }

  return {
    ...createFreshSession(sessionStartMs),
    events,
  };
}

export function loadSession(): TelemetrySession {
  if (!isBrowser()) return EMPTY_SESSION;

  const rawBlob = window.localStorage.getItem(SESSION_BLOB_KEY);
  if (rawBlob) {
    const parsed = parseSessionBlob(rawBlob);
    if (parsed) return parsed;
  }

  const legacy = loadLegacySession();
  if (legacy) {
    persist(legacy);
    return legacy;
  }

  const fresh = createFreshSession(Date.now());
  persist(fresh);
  return fresh;
}

function readClientSession(): TelemetrySession {
  if (!clientSession) {
    clientSession = loadSession();
  }
  return clientSession;
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionSnapshot(): TelemetrySession {
  return readClientSession();
}

export function getServerSessionSnapshot(): TelemetrySession {
  return EMPTY_SESSION;
}

export function startNode(nowMs: number = Date.now()): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "IDLE" || current.isPaused) return current;
  return commit({
    ...current,
    appState: "ACTIVE_NODE",
    currentTaskStartMs: nowMs,
    lockedTaskDurationMs: null,
  });
}

export function endNode(nowMs: number = Date.now()): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "ACTIVE_NODE" || current.currentTaskStartMs === null) {
    return current;
  }
  return commit({
    ...current,
    appState: "RECEIPT",
    lockedTaskDurationMs: Math.max(0, nowMs - current.currentTaskStartMs),
  });
}

export function discardNode(): TelemetrySession {
  const current = readClientSession();
  if (current.appState === "IDLE") return current;
  return commit({
    ...current,
    ...idleMachine(),
  });
}

export function logEvent(
  panel: PanelState,
  nowMs: number = Date.now(),
): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "RECEIPT" || current.lockedTaskDurationMs === null) {
    return current;
  }

  const event: TelemetryEvent = {
    id: crypto.randomUUID(),
    timestamp: nowMs,
    tier: panel.tier,
    divergenceScore: panel.divergenceScore,
    frictionLevel: panel.frictionLevel,
    sessionDurationMs: shiftElapsedMs(current, nowMs),
    taskDurationMs: current.lockedTaskDurationMs,
  };

  return commit({
    ...current,
    events: [event, ...current.events],
    ...idleMachine(),
  });
}

export function setPaused(
  paused: boolean,
  nowMs: number = Date.now(),
): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "IDLE") return current;
  if (paused === current.isPaused) return current;

  if (paused) {
    return commit({
      ...current,
      isPaused: true,
      pauseStartedMs: nowMs,
    });
  }

  const livePause =
    current.pauseStartedMs !== null
      ? Math.max(0, nowMs - current.pauseStartedMs)
      : 0;

  return commit({
    ...current,
    isPaused: false,
    accumulatedPausedMs: current.accumulatedPausedMs + livePause,
    pauseStartedMs: null,
  });
}

export function resetSession(nowMs: number = Date.now()): TelemetrySession {
  return commit(createFreshSession(nowMs));
}
