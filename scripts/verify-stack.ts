import { taskElapsedMs } from "../src/lib/metrics.ts";
import {
  addConcurrentTask,
  discardNode,
  getSessionSnapshot,
  logEvent,
  resetSession,
  resolveTask,
  setPaused,
  startNode,
} from "../src/lib/telemetry-store.ts";
import type { PanelState } from "../src/types/telemetry.ts";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  },
  configurable: true,
});

const panel: PanelState = {
  tier: 3,
  category: "software_exception",
  resolutionSteps: 4,
  divergenceScore: 70,
  frictionLevel: "elevated",
};

resetSession(1_000_000);
let session = startNode(1_010_000);
session = addConcurrentTask(1_012_000);
if (session.appState !== "ACTIVE_NODE" || session.activeTasks.length !== 2) {
  throw new Error("concurrent stack failed");
}

const firstId = session.activeTasks[0].id;
const secondId = session.activeTasks[1].id;
if (taskElapsedMs(session.activeTasks[0], 1_015_000) !== 5_000) {
  throw new Error("live task timer mismatch");
}

session = setPaused(true, 1_016_000);
if (session.isPaused) throw new Error("pause should be IDLE-only");

session = resolveTask(firstId, 1_020_000);
if (session.appState !== "RECEIPT" || session.resolvingTaskId !== firstId) {
  throw new Error("resolveTask failed");
}
if (session.activeTasks.find((t) => t.id === firstId)?.lockedDurationMs !== 10_000) {
  throw new Error("locked duration mismatch");
}
if (session.activeTasks.length !== 2) {
  throw new Error("other tasks should remain during receipt");
}

session = addConcurrentTask(1_021_000);
if (session.activeTasks.length !== 2) {
  throw new Error("addConcurrent should no-op in RECEIPT");
}

session = logEvent(panel, 1_022_000);
if (session.appState !== "ACTIVE_NODE" || session.activeTasks.length !== 1) {
  throw new Error("log should return to remaining stack");
}
if (session.events[0].category !== "software_exception" || session.events[0].resolutionSteps !== 4) {
  throw new Error("logged enrichment mismatch");
}
if (session.events[0].taskDurationMs !== 10_000) {
  throw new Error("logged taskDurationMs mismatch");
}
if (session.activeTasks[0].id !== secondId) {
  throw new Error("wrong remaining task");
}

session = resolveTask(secondId, 1_030_000);
session = discardNode();
if (session.appState !== "IDLE" || session.activeTasks.length !== 0) {
  throw new Error("discard last task should IDLE");
}
if (getSessionSnapshot().events.length !== 1) {
  throw new Error("discard should not write an event");
}

session = startNode(1_040_000);
session = resolveTask(session.activeTasks[0].id, 1_041_000);
session = discardNode();
if (session.appState !== "IDLE") throw new Error("discard single task failed");

console.log("active stack verification passed");
