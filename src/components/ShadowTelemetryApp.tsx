"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "framer-motion";
import { EndShiftModal } from "@/components/EndShiftModal";
import { SomaticHeader } from "@/components/SomaticHeader";
import { TacticalControlPanel } from "@/components/TacticalControlPanel";
import { TelemetryStream } from "@/components/TelemetryStream";
import {
  formatDuration,
  formatRelativeTime,
  shiftElapsedMs,
  synthesizeMetrics,
  taskElapsedMs,
} from "@/lib/metrics";
import { deriveSomaticState } from "@/lib/somatic";
import {
  discardNode,
  endNode,
  getServerSessionSnapshot,
  getSessionSnapshot,
  logEvent,
  resetSession,
  setPaused,
  startNode,
  subscribeSession,
} from "@/lib/telemetry-store";
import { DEFAULT_PANEL_STATE, type PanelState } from "@/types/telemetry";

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

export function ShadowTelemetryApp() {
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const [panel, setPanel] = useState<PanelState>(DEFAULT_PANEL_STATE);
  const [nowMs, setNowMs] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (session.isPaused) {
      if (session.pauseStartedMs !== null) {
        const pausedAt = session.pauseStartedMs;
        const frame = window.requestAnimationFrame(() => setNowMs(pausedAt));
        return () => window.cancelAnimationFrame(frame);
      }
      return;
    }

    const tick = () => setNowMs(Date.now());
    const frame = window.requestAnimationFrame(tick);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [session.isPaused, session.pauseStartedMs]);

  const somatic = useMemo(
    () => deriveSomaticState(session.appState, session.isPaused),
    [session.appState, session.isPaused],
  );
  const clockMs = nowMs > 0 ? nowMs : session.pauseStartedMs ?? 0;
  const elapsedMs = shiftElapsedMs(session, clockMs);
  const nodeElapsedMs = taskElapsedMs(session, clockMs);
  const metrics = useMemo(
    () => synthesizeMetrics(session, clockMs),
    [session, clockMs],
  );

  const handleStartNode = useCallback(() => {
    const timestamp = Date.now();
    startNode(timestamp);
    setNowMs(timestamp);
    setPanel(DEFAULT_PANEL_STATE);
  }, []);

  const handleEndNode = useCallback(() => {
    const timestamp = Date.now();
    endNode(timestamp);
    setNowMs(timestamp);
  }, []);

  const handleDiscard = useCallback(() => {
    discardNode();
    setPanel(DEFAULT_PANEL_STATE);
  }, []);

  const handleLog = useCallback(() => {
    const timestamp = Date.now();
    logEvent(panel, timestamp);
    setNowMs(timestamp);
    setPanel(DEFAULT_PANEL_STATE);

    if (panel.frictionLevel === "critical") {
      vibrate([18, 40, 18]);
    } else if (panel.frictionLevel === "elevated") {
      vibrate([12, 24, 12]);
    } else {
      vibrate(10);
    }
  }, [panel]);

  const handleTogglePause = useCallback(() => {
    const timestamp = Date.now();
    setPaused(!session.isPaused, timestamp);
    setNowMs(timestamp);
  }, [session.isPaused]);

  const handleReset = useCallback(() => {
    const next = resetSession();
    setPanel(DEFAULT_PANEL_STATE);
    setNowMs(next.sessionStartMs);
    setModalOpen(false);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <SomaticHeader
        somatic={somatic}
        appState={session.appState}
        elapsedMs={elapsedMs}
        taskElapsedMs={nodeElapsedMs}
        formatElapsed={formatDuration}
      />
      <TacticalControlPanel
        appState={session.appState}
        isPaused={session.isPaused}
        panel={panel}
        somatic={somatic}
        onChange={setPanel}
        onStartNode={handleStartNode}
        onEndNode={handleEndNode}
        onDiscard={handleDiscard}
        onLog={handleLog}
        onTogglePause={handleTogglePause}
      />
      <TelemetryStream
        events={session.events}
        nowMs={clockMs}
        formatRelative={formatRelativeTime}
      />
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-6 min-h-12 rounded-xl border border-slate-line bg-slate-panel font-mono text-xs tracking-[0.18em] uppercase text-slate-muted"
      >
        End Shift / Synthesize
      </button>
      <AnimatePresence>
        {modalOpen ? (
          <EndShiftModal
            metrics={metrics}
            formatDuration={formatDuration}
            onClose={() => setModalOpen(false)}
            onReset={handleReset}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
