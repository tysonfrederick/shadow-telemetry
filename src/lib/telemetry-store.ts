import type { TelemetryEvent } from "@/types/telemetry";

const EVENTS_KEY = "shadow-telemetry:events";
const SESSION_KEY = "shadow-telemetry:session-start";

export interface TelemetrySession {
  events: TelemetryEvent[];
  sessionStartMs: number;
}

const EMPTY_SESSION: TelemetrySession = {
  events: [],
  sessionStartMs: 0,
};

const listeners = new Set<() => void>();
let clientSession: TelemetrySession | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    typeof event.timestamp === "number" &&
    (event.tier === 1 ||
      event.tier === 2 ||
      event.tier === 3 ||
      event.tier === 4) &&
    typeof event.divergenceScore === "number" &&
    (event.frictionLevel === "low" ||
      event.frictionLevel === "moderate" ||
      event.frictionLevel === "elevated" ||
      event.frictionLevel === "critical") &&
    typeof event.sessionDurationMs === "number"
  );
}

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(session: TelemetrySession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(session.events));
  window.localStorage.setItem(SESSION_KEY, String(session.sessionStartMs));
}

export function loadSession(): TelemetrySession {
  if (!isBrowser()) return EMPTY_SESSION;

  let sessionStartMs = Date.now();
  const rawStart = window.localStorage.getItem(SESSION_KEY);
  if (rawStart) {
    const parsed = Number(rawStart);
    if (Number.isFinite(parsed) && parsed > 0) {
      sessionStartMs = parsed;
    }
  } else {
    window.localStorage.setItem(SESSION_KEY, String(sessionStartMs));
  }

  const rawEvents = window.localStorage.getItem(EVENTS_KEY);
  if (!rawEvents) {
    return { events: [], sessionStartMs };
  }

  try {
    const parsed: unknown = JSON.parse(rawEvents);
    const events = Array.isArray(parsed)
      ? parsed.filter(isTelemetryEvent)
      : [];
    return { events, sessionStartMs };
  } catch {
    return { events: [], sessionStartMs };
  }
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

export function appendEvent(event: TelemetryEvent): void {
  const current = readClientSession();
  clientSession = {
    ...current,
    events: [event, ...current.events],
  };
  persist(clientSession);
  emit();
}

export function resetSession(): TelemetrySession {
  const sessionStartMs = Date.now();
  clientSession = { events: [], sessionStartMs };
  persist(clientSession);
  emit();
  return clientSession;
}
