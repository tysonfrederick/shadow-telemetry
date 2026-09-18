import type {
  ActiveTask,
  AppState,
  PanelState,
  TaskCategory,
  TelemetryEvent,
  TelemetrySession,
} from "@/types/telemetry";
import { shiftElapsedMs } from "@/lib/metrics";

const SESSION_BLOB_KEY = "shadow-telemetry:session";
const LEGACY_EVENTS_KEY = "shadow-telemetry:events";
const LEGACY_SESSION_KEY = "shadow-telemetry:session-start";

export const EMPTY_SESSION: TelemetrySession = {
  events: [],
  sessionStartMs: 0,
  appState: "IDLE",
  activeTasks: [],
  resolvingTaskId: null,
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

function isTaskCategory(value: unknown): value is TaskCategory {
  return (
    value === "physical" ||
    value === "communication" ||
    value === "software_exception"
  );
}

function deriveAppState(
  activeTasks: ActiveTask[],
  resolvingTaskId: string | null,
): AppState {
  if (resolvingTaskId) return "RECEIPT";
  if (activeTasks.length > 0) return "ACTIVE_NODE";
  return "IDLE";
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
  const raw = value as TelemetryEvent & {
    taskDurationMs?: unknown;
    category?: unknown;
    resolutionSteps?: unknown;
  };
  const taskDurationMs = isFiniteNumber(raw.taskDurationMs)
    ? Math.max(0, raw.taskDurationMs)
    : 0;
  const category: TaskCategory = isTaskCategory(raw.category)
    ? raw.category
    : "physical";
  const resolutionSteps = isFiniteNumber(raw.resolutionSteps)
    ? Math.max(0, Math.floor(raw.resolutionSteps))
    : 0;
  return { ...raw, taskDurationMs, category, resolutionSteps };
}

function normalizeActiveTask(value: unknown): ActiveTask | null {
  if (!value || typeof value !== "object") return null;
  const task = value as Record<string, unknown>;
  if (typeof task.id !== "string" || !isFiniteNumber(task.startMs)) return null;
  return {
    id: task.id,
    startMs: task.startMs,
    lockedDurationMs: isFiniteNumber(task.lockedDurationMs)
      ? Math.max(0, task.lockedDurationMs)
      : null,
  };
}

function migrateLegacyActiveTasks(blob: Record<string, unknown>): {
  activeTasks: ActiveTask[];
  resolvingTaskId: string | null;
} {
  if (Array.isArray(blob.activeTasks)) {
    const activeTasks = blob.activeTasks
      .map(normalizeActiveTask)
      .filter((task): task is ActiveTask => task !== null);
    const resolvingTaskId =
      typeof blob.resolvingTaskId === "string" &&
      activeTasks.some((task) => task.id === blob.resolvingTaskId)
        ? blob.resolvingTaskId
        : null;
    return { activeTasks, resolvingTaskId };
  }

  if (!isFiniteNumber(blob.currentTaskStartMs)) {
    return { activeTasks: [], resolvingTaskId: null };
  }

  const id = crypto.randomUUID();
  const lockedDurationMs = isFiniteNumber(blob.lockedTaskDurationMs)
    ? Math.max(0, blob.lockedTaskDurationMs)
    : null;
  const wasReceipt = blob.appState === "RECEIPT";
  return {
    activeTasks: [
      {
        id,
        startMs: blob.currentTaskStartMs,
        lockedDurationMs: wasReceipt ? lockedDurationMs : null,
      },
    ],
    resolvingTaskId: wasReceipt ? id : null,
  };
}

function idleStack(): Pick<
  TelemetrySession,
  "appState" | "activeTasks" | "resolvingTaskId"
> {
  return {
    appState: "IDLE",
    activeTasks: [],
    resolvingTaskId: null,
  };
}

export function createFreshSession(nowMs: number): TelemetrySession {
  return {
    events: [],
    sessionStartMs: nowMs,
    isPaused: false,
    accumulatedPausedMs: 0,
    pauseStartedMs: null,
    ...idleStack(),
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
  const session: TelemetrySession = {
    ...next,
    appState: deriveAppState(next.activeTasks, next.resolvingTaskId),
  };
  clientSession = session;
  persist(session);
  emit();
  return session;
}

function parseSessionBlob(raw: string): TelemetrySession | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const blob = parsed as Record<string, unknown>;
    const events = Array.isArray(blob.events)
      ? blob.events
          .map(normalizeEvent)
          .filter((event): event is TelemetryEvent => event !== null)
      : [];
    const sessionStartMs = isFiniteNumber(blob.sessionStartMs)
      ? blob.sessionStartMs
      : 0;
    if (sessionStartMs <= 0) return null;

    const { activeTasks, resolvingTaskId } = migrateLegacyActiveTasks(blob);

    return {
      events,
      sessionStartMs,
      appState: deriveAppState(activeTasks, resolvingTaskId),
      activeTasks,
      resolvingTaskId,
      isPaused: blob.isPaused === true,
      accumulatedPausedMs: isFiniteNumber(blob.accumulatedPausedMs)
        ? Math.max(0, blob.accumulatedPausedMs)
        : 0,
      pauseStartedMs: isFiniteNumber(blob.pauseStartedMs)
        ? blob.pauseStartedMs
        : null,
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
        ? parsed
            .map(normalizeEvent)
            .filter((event): event is TelemetryEvent => event !== null)
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

function pushTask(nowMs: number): TelemetrySession {
  const current = readClientSession();
  if (current.isPaused || current.appState === "RECEIPT") return current;
  const task: ActiveTask = {
    id: crypto.randomUUID(),
    startMs: nowMs,
    lockedDurationMs: null,
  };
  return commit({
    ...current,
    activeTasks: [...current.activeTasks, task],
    resolvingTaskId: null,
  });
}

export function startNode(nowMs: number = Date.now()): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "IDLE" || current.isPaused) return current;
  return pushTask(nowMs);
}

export function addConcurrentTask(nowMs: number = Date.now()): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "ACTIVE_NODE" || current.isPaused) return current;
  return pushTask(nowMs);
}

export function resolveTask(
  taskId: string,
  nowMs: number = Date.now(),
): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "ACTIVE_NODE") return current;
  const task = current.activeTasks.find((item) => item.id === taskId);
  if (!task || task.lockedDurationMs !== null) return current;

  return commit({
    ...current,
    resolvingTaskId: taskId,
    activeTasks: current.activeTasks.map((item) =>
      item.id === taskId
        ? {
            ...item,
            lockedDurationMs: Math.max(0, nowMs - item.startMs),
          }
        : item,
    ),
  });
}

function remainingAfterResolving(current: TelemetrySession): ActiveTask[] {
  if (!current.resolvingTaskId) return current.activeTasks;
  return current.activeTasks.filter((task) => task.id !== current.resolvingTaskId);
}

export function discardNode(): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "RECEIPT") return current;
  return commit({
    ...current,
    activeTasks: remainingAfterResolving(current),
    resolvingTaskId: null,
  });
}

export function logEvent(
  panel: PanelState,
  nowMs: number = Date.now(),
): TelemetrySession {
  const current = readClientSession();
  if (current.appState !== "RECEIPT" || !current.resolvingTaskId) {
    return current;
  }

  const resolving = current.activeTasks.find(
    (task) => task.id === current.resolvingTaskId,
  );
  if (!resolving || resolving.lockedDurationMs === null) return current;

  const event: TelemetryEvent = {
    id: crypto.randomUUID(),
    timestamp: nowMs,
    tier: panel.tier,
    category: panel.category,
    resolutionSteps: Math.max(1, Math.floor(panel.resolutionSteps)),
    divergenceScore: panel.divergenceScore,
    frictionLevel: panel.frictionLevel,
    sessionDurationMs: shiftElapsedMs(current, nowMs),
    taskDurationMs: resolving.lockedDurationMs,
  };

  return commit({
    ...current,
    events: [event, ...current.events],
    activeTasks: remainingAfterResolving(current),
    resolvingTaskId: null,
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

export function getResolvingTask(
  session: TelemetrySession,
): ActiveTask | undefined {
  if (!session.resolvingTaskId) return undefined;
  return session.activeTasks.find((task) => task.id === session.resolvingTaskId);
}
