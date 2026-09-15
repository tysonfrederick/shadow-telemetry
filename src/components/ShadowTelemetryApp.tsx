"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "framer-motion";
import { EndShiftModal } from "@/components/EndShiftModal";
import { SomaticHeader } from "@/components/SomaticHeader";
import { TacticalControlPanel } from "@/components/TacticalControlPanel";
import { TelemetryStream } from "@/components/TelemetryStream";
import { formatDuration, formatRelativeTime, synthesizeMetrics } from "@/lib/metrics";
import { deriveSomaticState } from "@/lib/somatic";
import {
  appendEvent,
  getServerSessionSnapshot,
  getSessionSnapshot,
  resetSession,
  subscribeSession,
} from "@/lib/telemetry-store";
import {
  DEFAULT_PANEL_STATE,
  type PanelState,
  type TelemetryEvent,
} from "@/types/telemetry";

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
    const tick = () => setNowMs(Date.now());
    const frame = window.requestAnimationFrame(tick);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const somatic = useMemo(() => deriveSomaticState(panel), [panel]);
  const elapsedMs =
    nowMs > 0 && session.sessionStartMs > 0
      ? Math.max(0, nowMs - session.sessionStartMs)
      : 0;
  const metrics = useMemo(
    () =>
      synthesizeMetrics(
        session.events,
        session.sessionStartMs,
        nowMs > 0 ? nowMs : session.sessionStartMs,
      ),
    [session.events, session.sessionStartMs, nowMs],
  );

  const handleLog = useCallback(() => {
    const timestamp = Date.now();
    const event: TelemetryEvent = {
      id: crypto.randomUUID(),
      timestamp,
      tier: panel.tier,
      divergenceScore: panel.divergenceScore,
      frictionLevel: panel.frictionLevel,
      sessionDurationMs: Math.max(0, timestamp - session.sessionStartMs),
    };

    appendEvent(event);
    setNowMs(timestamp);

    if (panel.frictionLevel === "critical") {
      vibrate([18, 40, 18]);
    } else if (panel.frictionLevel === "elevated") {
      vibrate([12, 24, 12]);
    } else {
      vibrate(10);
    }
  }, [panel, session.sessionStartMs]);

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
        elapsedMs={elapsedMs}
        formatElapsed={formatDuration}
      />
      <TacticalControlPanel
        panel={panel}
        somatic={somatic}
        onChange={setPanel}
        onLog={handleLog}
      />
      <TelemetryStream
        events={session.events}
        nowMs={nowMs}
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
