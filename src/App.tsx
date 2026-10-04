import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { api, run } from "./lib/api";
import { playChime } from "./lib/chime";
import { useAppState, useSettings } from "./lib/hooks";
import type { OverlayView, Transition, WindowMode } from "./lib/types";
import { BreakView } from "./views/BreakView";
import { ConfirmNewView } from "./views/ConfirmNewView";
import { HistoryView } from "./views/HistoryView";
import { OverlayView as Overlay, OverlayPreview } from "./views/OverlayView";
import { PickingView } from "./views/PickingView";
import { SettingsView } from "./views/SettingsView";
import { SetupView } from "./views/SetupView";
import { SummaryView } from "./views/SummaryView";
import { applyTheme } from "./theme/scheme";
import "./App.css";

const WINDOW_SIZE_RANK: Record<WindowMode, number> = { mini: 0, expanded: 1, center: 2 };

export default function App() {
  const state = useAppState();
  const [settings, setSettings] = useSettings();
  const [view, setView] = useState<OverlayView | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [shownMode, setShownMode] = useState<WindowMode>("center");
  const [previewing, setPreviewing] = useState(false);
  const endPreview = useCallback(() => setPreviewing(false), []);

  const phase = state?.phase;
  const overlayActive = phase === "work" && view === null;
  const desiredMode: WindowMode = previewing
    ? "mini"
    : overlayActive
      ? expanded
        ? "expanded"
        : "mini"
      : "center";

  // Latest values for event handlers registered once.
  const latest = useRef({ phase, settings });
  latest.current = { phase, settings };

  useEffect(() => {
    if (!overlayActive) setExpanded(false);
  }, [overlayActive]);

  // Resize before rendering when growing, after rendering when shrinking, so content never clips.
  useEffect(() => {
    if (desiredMode === shownMode) return;
    if (WINDOW_SIZE_RANK[desiredMode] > WINDOW_SIZE_RANK[shownMode]) {
      api.setMode(desiredMode).then(() => setShownMode(desiredMode), console.error);
    } else {
      setShownMode(desiredMode);
      requestAnimationFrame(() => run(api.setMode(desiredMode)));
    }
  }, [desiredMode, shownMode]);

  useEffect(() => {
    if (settings) {
      document.documentElement.style.setProperty("--overlay-opacity", String(settings.overlayOpacity));
      applyTheme(settings.theme);
    }
  }, [settings]);

  useEffect(() => {
    const unlistenPhase = listen<Transition>("phase-ended", (e) => {
      if (latest.current.settings?.soundEnabled) {
        playChime(e.payload.kind === "workEnded" ? "down" : "up");
      }
    });
    const unlistenNav = listen<string>("navigate", (e) => {
      if (e.payload === "history" || e.payload === "settings") {
        setView(e.payload);
        return;
      }
      // "setup": start over, confirming first if a session is running.
      const current = latest.current.phase;
      if (current === "picking" || current === "work" || current === "break") {
        setView("confirm-new");
      } else {
        setView(null);
        if (current === "summary") run(api.newSession());
      }
    });
    return () => {
      void unlistenPhase.then((fn) => fn());
      void unlistenNav.then((fn) => fn());
    };
  }, []);

  if (!state || !settings) return null;

  const close = () => setView(null);

  if (previewing) return shownMode === "mini" ? <OverlayPreview state={state} onDone={endPreview} /> : null;

  if (view === "history") return <HistoryView onBack={close} />;
  if (view === "settings") return (
      <SettingsView settings={settings} onChange={setSettings} onBack={close} onPreview={() => setPreviewing(true)} />
    );
  if (view === "confirm-new") return <ConfirmNewView onDone={close} />;

  switch (state.phase) {
    case "setup":
      return <SetupView settings={settings} onOpen={setView} onSettingsChange={setSettings} />;
    case "picking":
      return <PickingView session={state.session!} onOpen={setView} />;
    case "work":
      return (
        <Overlay
          state={state}
          expanded={shownMode === "expanded"}
          onExpandedChange={setExpanded}
          onOpenSettings={() => setView("settings")}
        />
      );
    case "break":
      return <BreakView state={state} onOpen={setView} />;
    case "summary":
      return <SummaryView session={state.session!} onOpen={setView} />;
  }
}
