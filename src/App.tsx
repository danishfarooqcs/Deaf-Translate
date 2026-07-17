import { useCallback, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { CameraView } from "@/components/CameraView";
import { GesturePanel } from "@/components/GesturePanel";
import { useHandTracking, type GestureEvent } from "@/lib/useHandTracking";
import { isMuted, setMuted, speak } from "@/lib/speech";
import { GESTURE_LABELS, SPOKEN_PHRASE } from "@/lib/handGestureDetector";

function App() {
  const [muted, setMutedState] = useState(isMuted());

  const handleGesture = useCallback((event: GestureEvent) => {
    speak(SPOKEN_PHRASE[event.gesture] ?? event.gesture);
  }, []);

  const { videoRef, status, errorMessage, landmarks, lastGesture, history, retry, clearHistory } =
    useHandTracking(handleGesture);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--signal)] text-[color:var(--ink)]">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Signal</h1>
            <p className="font-mono text-xs text-[color:var(--muted)]">hand gestures, spoken aloud</p>
          </div>
        </div>
        {(status === "permission-denied" || status === "no-camera" || status === "error") && (
          <button
            onClick={retry}
            className="flex items-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--paper)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
          >
            <RotateCcw size={14} /> Retry camera
          </button>
        )}
      </header>

      {errorMessage && (
        <p className="rounded-xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">
          {errorMessage}
        </p>
      )}

      <main className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <CameraView videoRef={videoRef} landmarks={landmarks} status={status} />
        <GesturePanel
          lastGesture={lastGesture}
          history={history}
          muted={muted}
          onToggleMute={toggleMute}
          onClearHistory={clearHistory}
        />
      </main>

      <footer className="font-mono text-xs text-[color:var(--muted)]">
        Recognizes: {Object.values(GESTURE_LABELS).join(" · ")}. Runs entirely in your browser — no video leaves
        your device.
      </footer>
    </div>
  );
}

export default App;
