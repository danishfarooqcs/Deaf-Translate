import { useEffect, useState } from "react";
import { Award, CheckCircle2, SkipForward, Camera } from "lucide-react";
import { useCamera } from "../hooks/useCamera";
import { useGestureDetection } from "../hooks/useGestureDetection";
import { VOCABULARY } from "../utils/vocabulary";
import type { HistoryEntry } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const LIVE_WORDS = VOCABULARY.filter((v) => v.liveDetectable);

function randomWord(exclude?: string) {
  const pool = LIVE_WORDS.filter((w) => w.word !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

interface TrainingModeProps {
  sessionHistory: HistoryEntry[];
}

export default function TrainingMode({ sessionHistory }: TrainingModeProps) {
  const { videoRef, ready, error } = useCamera({ deviceId: null });
  const [target, setTarget] = useState(randomWord());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | null>(null);

  const { currentGesture, modelStatus } = useGestureDetection({
    videoRef,
    active: ready,
    mirror: DEFAULT_SETTINGS.mirrorCamera,
    sensitivity: DEFAULT_SETTINGS.sensitivity,
    inferenceIntervalMs: DEFAULT_SETTINGS.inferenceIntervalMs,
    onGesture: (g) => {
      setAttempts((a) => a + 1);
      const spoken = g.name.split(" / ");
      if (spoken.includes(target.word)) {
        setScore((s) => s + 10);
        setStreak((s) => s + 1);
        setLastResult("correct");
        setTimeout(() => {
          setLastResult(null);
          setTarget((t) => randomWord(t.word));
        }, 900);
      } else {
        setStreak(0);
      }
    },
  });

  useEffect(() => {
    setStreak(0);
  }, [target]);

  const skip = () => setTarget((t) => randomWord(t.word));

  const accuracy = attempts > 0 ? Math.round((score / 10 / attempts) * 100) : 0;

  return (
    <div className="section-wrap">
      <div className="section-title-row">
        <div>
          <div className="section-title">Training Mode</div>
          <div className="section-subtitle">
            Perform the target sign in front of your camera to score points.
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Score</div>
          <div className="big-num">{score}</div>
        </div>
        <div className="stat-card">
          <div className="label">Streak</div>
          <div className="big-num">{streak}</div>
        </div>
        <div className="stat-card">
          <div className="label">Accuracy</div>
          <div className="big-num">{accuracy}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Session Gestures Logged</div>
          <div className="big-num">{sessionHistory.length}</div>
        </div>
      </div>

      <div className="realtime-grid" style={{ height: "auto" }}>
        <div className="panel camera-panel">
          <div className="camera-video-wrap" style={{ minHeight: 420 }}>
            {error && (
              <div className="camera-placeholder">
                <Camera />
                <div>{error}</div>
              </div>
            )}
            <video ref={videoRef} className="camera-video mirrored" autoPlay muted playsInline />
            <div className="camera-overlay-top-left">
              <div className="gesture-card">
                <div className="gesture-icon">
                  {lastResult === "correct" ? (
                    <CheckCircle2 size={18} color="var(--green)" />
                  ) : (
                    <Award size={18} color="var(--cyan)" />
                  )}
                </div>
                <div>
                  <div className="gesture-label">You're Showing</div>
                  <div className={`gesture-name${currentGesture ? "" : " analyzing"}`}>
                    {modelStatus === "loading" ? "Loading model…" : currentGesture?.name ?? "Analyzing…"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <Award /> TARGET SIGN
            </div>
          </div>
          <div className="sentence-area" style={{ alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                textAlign: "center",
                color: lastResult === "correct" ? "var(--green)" : "var(--text-primary)",
              }}
            >
              {target.word}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center" }}>
              {target.description}
            </div>
            {lastResult === "correct" && (
              <div style={{ color: "var(--green)", fontWeight: 700 }}>Correct! +10 points</div>
            )}
          </div>
          <div className="sentence-footer">
            <button className="secondary-btn" onClick={skip} style={{ width: "100%", justifyContent: "center" }}>
              <SkipForward /> Skip This Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
