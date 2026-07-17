import { useMemo } from "react";
import { BarChart3, Zap, Target, Clock } from "lucide-react";
import type { HistoryEntry } from "../types";

interface AnalyticsDashboardProps {
  sessionHistory: HistoryEntry[];
  xp: number;
  level: number;
}

export default function AnalyticsDashboard({ sessionHistory, xp, level }: AnalyticsDashboardProps) {
  const frequency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of sessionHistory) {
      counts[h.gesture] = (counts[h.gesture] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [sessionHistory]);

  const avgConfidence = useMemo(() => {
    if (sessionHistory.length === 0) return 0;
    return Math.round(
      (sessionHistory.reduce((sum, h) => sum + h.confidence, 0) / sessionHistory.length) * 100
    );
  }, [sessionHistory]);

  const maxCount = frequency[0]?.[1] ?? 1;

  const sessionMinutes = useMemo(() => {
    if (sessionHistory.length < 2) return 0;
    const timestamps = sessionHistory.map((h) => h.timestamp);
    const span = Math.max(...timestamps) - Math.min(...timestamps);
    return Math.max(1, Math.round(span / 60000));
  }, [sessionHistory]);

  return (
    <div className="section-wrap">
      <div className="section-title-row">
        <div>
          <div className="section-title">Analytics Dashboard</div>
          <div className="section-subtitle">Live stats from your current session across all modes.</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total Gestures</div>
          <div className="big-num">{sessionHistory.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Confidence</div>
          <div className="big-num">{avgConfidence}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Session Length</div>
          <div className="big-num">{sessionMinutes}m</div>
        </div>
        <div className="stat-card">
          <div className="label">Current Level</div>
          <div className="big-num">{level}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <BarChart3 size={16} color="var(--cyan)" /> Most Used Gestures
        </h3>
        {frequency.length === 0 ? (
          <div className="empty-state">
            <BarChart3 />
            <div>No gestures logged yet. Head to Realtime Detection to get started.</div>
          </div>
        ) : (
          <div className="bar-chart" style={{ marginBottom: 24 }}>
            {frequency.map(([name, count]) => (
              <div
                key={name}
                className="bar"
                style={{ height: `${Math.max(6, (count / maxCount) * 140)}px` }}
                title={`${name}: ${count}`}
              >
                <span className="bar-label">{name.split(" / ")[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>
            <Zap /> XP Progress
          </h3>
          <div className="settings-row-sub" style={{ marginBottom: 10 }}>
            {xp} total XP · {sessionHistory.length} gestures earned 6 XP each this session
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(xp % 1500) / 15}%` }} />
          </div>
        </div>
        <div className="settings-card">
          <h3>
            <Target /> Recognition Quality
          </h3>
          <div className="settings-row-sub" style={{ marginBottom: 10 }}>
            Average confidence across all recognized gestures this session
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${avgConfidence}%` }} />
          </div>
        </div>
        <div className="settings-card">
          <h3>
            <Clock /> Recent Activity
          </h3>
          <div className="history-list">
            {sessionHistory.slice(0, 5).map((h) => (
              <div className="history-row" key={h.id}>
                <span className="gesture-tag">{h.gesture}</span>
                <span className="meta">{new Date(h.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {sessionHistory.length === 0 && (
              <div className="settings-row-sub">Nothing logged yet this session.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
