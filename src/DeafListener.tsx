import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Volume2,
  VolumeX,
  Copy,
  Download,
  RotateCcw,
} from "lucide-react";
import { useCamera } from "./hooks/useCamera";
import { useSpeech } from "./hooks/useSpeech";
import { useGestureDetection } from "./hooks/useGestureDetection";
import type { AppSettings, DetectedGesture, EngineStats, HistoryEntry } from "./types";

interface DeafListenerProps {
  settings: AppSettings;
  onGesture: (entry: HistoryEntry) => void;
  onStatsChange: (stats: EngineStats) => void;
}

export default function DeafListener({ settings, onGesture, onStatsChange }: DeafListenerProps) {
  const { videoRef, devices, ready, error, resolution, switchDevice } = useCamera({
    deviceId: settings.cameraDeviceId,
  });

  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);
  const [muted, setMuted] = useState(settings.speech.muted);

  const speechSettings = useMemo(
    () => ({ ...settings.speech, muted }),
    [settings.speech, muted]
  );
  const { speak } = useSpeech(speechSettings);

  const handleGestureLocked = (gesture: DetectedGesture) => {
    speak(gesture.name.split(" / ")[0]);
    setSentenceWords((prev) => {
      setUndoStack((u) => [...u, prev]);
      setRedoStack([]);
      return [...prev, gesture.name.split(" / ")[0]];
    });
  };

  const { currentGesture, history, stats, modelStatus, clearHistory } = useGestureDetection({
    videoRef,
    active: ready,
    mirror: settings.mirrorCamera,
    sensitivity: settings.sensitivity,
    inferenceIntervalMs: settings.inferenceIntervalMs,
    onGesture: (g) => {
      handleGestureLocked(g);
      onGesture({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gesture: g.name,
        confidence: g.confidence,
        timestamp: Date.now(),
        handedness: g.handedness,
      });
    },
  });

  useEffect(() => {
    onStatsChange({ ...stats, resolution });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, resolution]);

  const undo = () => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const prev = u[u.length - 1];
      setRedoStack((r) => [sentenceWords, ...r]);
      setSentenceWords(prev);
      return u.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[0];
      setUndoStack((u) => [...u, sentenceWords]);
      setSentenceWords(next);
      return r.slice(1);
    });
  };

  const clearSentence = () => {
    setUndoStack((u) => [...u, sentenceWords]);
    setRedoStack([]);
    setSentenceWords([]);
  };

  const speakSentence = () => {
    if (sentenceWords.length === 0) return;
    speak(sentenceWords.join(" "));
  };

  const copySentence = async () => {
    if (sentenceWords.length === 0) return;
    try {
      await navigator.clipboard.writeText(sentenceWords.join(" "));
    } catch {
      /* clipboard may be unavailable - ignore */
    }
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deaf-listener-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="realtime-grid">
      <div className="panel camera-panel">
        <div className="camera-video-wrap">
          {error && (
            <div className="camera-placeholder">
              <CameraOff />
              <div>{error}</div>
              <div style={{ fontSize: 12 }}>Check your browser's camera permission and try again.</div>
            </div>
          )}
          {!error && !ready && (
            <div className="camera-placeholder">
              <Camera />
              <div>Requesting camera access…</div>
            </div>
          )}
          <video
            ref={videoRef}
            className={`camera-video${settings.mirrorCamera ? " mirrored" : ""}`}
            autoPlay
            muted
            playsInline
          />

          <div className="camera-overlay-top-left">
            <div className="gesture-card">
              <div className="gesture-icon">
                <Sparkles size={18} color="var(--cyan)" />
              </div>
              <div>
                <div className="gesture-label">Current Gesture</div>
                <div className={`gesture-name${currentGesture ? "" : " analyzing"}`}>
                  {modelStatus === "loading"
                    ? "Loading model…"
                    : modelStatus === "error"
                    ? "Model failed to load"
                    : currentGesture
                    ? currentGesture.name
                    : "Analyzing…"}
                </div>
              </div>
            </div>
          </div>

          <div className="camera-overlay-top-right">
            <div className="tag-pill">
              RESOLUTION: <strong>{resolution}</strong>
            </div>
            <div className="tag-pill">
              INFERENCE: <strong>{stats.inferenceMs || 0}ms</strong>
            </div>
          </div>

          <div className="camera-bottom-bar">
            <button
              className="pill-button"
              onClick={() => {
                const next = devices.find((d) => d.deviceId !== settings.cameraDeviceId);
                if (next) switchDevice(next.deviceId);
              }}
              disabled={devices.length < 2}
            >
              <RotateCcw /> Switch Camera
            </button>
            <button className="pill-button" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX /> : <Volume2 />}
              {muted ? "Unmute Voice" : "Mute Voice"}
            </button>
            <button className="pill-button danger" onClick={clearHistory}>
              <Trash2 /> Clear Log
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-title">
            <Sparkles /> SENTENCE BUILDER
          </div>
          <div className="panel-header-actions">
            <button className="mini-icon-btn" onClick={undo} disabled={undoStack.length === 0} title="Undo">
              <Undo2 />
            </button>
            <button className="mini-icon-btn" onClick={redo} disabled={redoStack.length === 0} title="Redo">
              <Redo2 />
            </button>
            <button className="mini-icon-btn danger" onClick={clearSentence} title="Clear">
              <Trash2 />
            </button>
          </div>
        </div>

        <div className="sentence-area">
          {sentenceWords.length === 0 ? (
            <div className="sentence-placeholder">Signs will assemble here as you hold them…</div>
          ) : (
            <div className="sentence-words">
              {sentenceWords.map((w, i) => (
                <span className="sentence-word" key={`${w}-${i}`}>
                  {w}
                </span>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="history-list">
              {history.slice(0, 12).map((h) => (
                <div className="history-row" key={h.id}>
                  <span className="gesture-tag">{h.gesture}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="confidence-bar-track">
                      <div
                        className="confidence-bar-fill"
                        style={{ width: `${Math.round(h.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="meta">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sentence-footer">
          <button className="primary-btn" onClick={speakSentence} disabled={sentenceWords.length === 0}>
            <Volume2 /> Speak Sentence
          </button>
          <button className="secondary-btn" onClick={copySentence} disabled={sentenceWords.length === 0}>
            <Copy />
          </button>
          <button className="secondary-btn" onClick={exportHistory} disabled={history.length === 0}>
            <Download />
          </button>
        </div>
      </div>
    </div>
  );
}
