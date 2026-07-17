import { useState } from "react";
import { Send, MessageSquare, Camera } from "lucide-react";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";
import { useSpeech } from "../hooks/useSpeech";
import type { AppSettings, HistoryEntry } from "../types";

interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  timestamp: number;
}

interface ConversationModeProps {
  settings: AppSettings;
  onGesture: (entry: HistoryEntry) => void;
}

export default function ConversationMode({ settings, onGesture }: ConversationModeProps) {
  const { videoRef, ready, error } = useCamera({ deviceId: settings.cameraDeviceId });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "seed",
      from: "them",
      text: "Hi! Sign to me and I'll see your words appear here in real time.",
      timestamp: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const { speak } = useSpeech(settings.speech);

  const { currentGesture, modelStatus } = useGestureDetection({
    videoRef,
    active: ready,
    mirror: settings.mirrorCamera,
    sensitivity: settings.sensitivity,
    inferenceIntervalMs: settings.inferenceIntervalMs,
    onGesture: (g) => {
      const word = g.name.split(" / ")[0];
      speak(word);
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}`, from: "me", text: word, timestamp: Date.now() },
      ]);
      onGesture({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gesture: g.name,
        confidence: g.confidence,
        timestamp: Date.now(),
        handedness: g.handedness,
      });
    },
  });

  const sendDraft = () => {
    if (!draft.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}`, from: "them", text: draft.trim(), timestamp: Date.now() },
    ]);
    setDraft("");
  };

  return (
    <div className="realtime-grid">
      <div className="panel camera-panel">
        <div className="camera-video-wrap">
          {error && (
            <div className="camera-placeholder">
              <Camera />
              <div>{error}</div>
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
                <MessageSquare size={18} color="var(--cyan)" />
              </div>
              <div>
                <div className="gesture-label">Signing</div>
                <div className={`gesture-name${currentGesture ? "" : " analyzing"}`}>
                  {modelStatus === "loading" ? "Loading model…" : currentGesture?.name ?? "Analyzing…"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel chat-panel">
        <div className="panel-header">
          <div className="panel-header-title">
            <MessageSquare /> CONVERSATION
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((m) => (
            <div className={`chat-bubble ${m.from === "me" ? "me" : "them"}`} key={m.id}>
              {m.text}
              <div className="meta">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        <div className="sentence-footer">
          <input
            type="text"
            placeholder="Type the other person's reply…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendDraft()}
            style={{ flex: 1 }}
          />
          <button className="primary-btn" style={{ flex: "0 0 auto" }} onClick={sendDraft}>
            <Send /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
