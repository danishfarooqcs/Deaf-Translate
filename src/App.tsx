import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  MessageSquare,
  BookOpen,
  Award,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  Bell,
} from "lucide-react";
import "./DeafListener.css";
import type { AppSettings, HistoryEntry, TabId } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import DeafListener from "./DeafListener";
import ConversationMode from "./components/ConversationMode";
import DictionaryMode from "./components/DictionaryMode";
import TrainingMode from "./components/TrainingMode";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import SystemSettings from "./components/SystemSettings";
import HelpDocs from "./components/HelpDocs";

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: "realtime", label: "Realtime Detection", icon: Activity },
  { id: "conversation", label: "Conversation Mode", icon: MessageSquare },
  { id: "dictionary", label: "Dictionary Mode", icon: BookOpen },
  { id: "training", label: "Training Mode", icon: Award },
  { id: "analytics", label: "Analytics Dashboard", icon: BarChart3 },
  { id: "settings", label: "System Settings", icon: SettingsIcon },
  { id: "help", label: "Help & Docs", icon: HelpCircle },
];

const XP_PER_GESTURE = 6;
const XP_TO_LEVEL = 1500;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("realtime");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [sessionHistory, setSessionHistory] = useState<HistoryEntry[]>([]);
  const [xp, setXp] = useState(1070);
  const [notifications] = useState(2);
  const [gpuActive, setGpuActive] = useState(false);
  const [liveStats, setLiveStats] = useState({ fps: 0, latencyMs: 0 });

  const level = Math.floor(xp / XP_TO_LEVEL) + 1;
  const xpIntoLevel = xp % XP_TO_LEVEL;
  const progressPct = Math.min(100, (xpIntoLevel / XP_TO_LEVEL) * 100);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const registerGesture = (entry: HistoryEntry) => {
    setSessionHistory((h) => [entry, ...h].slice(0, 200));
    setXp((x) => x + XP_PER_GESTURE);
  };

  const activeLabel = useMemo(
    () => TABS.find((t) => t.id === activeTab)?.label ?? "",
    [activeTab]
  );

  useEffect(() => {
    document.title = activeLabel ? `${activeLabel} · Deaf Listener AI` : "Deaf Listener AI";
  }, [activeLabel]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            <Activity size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              DEAF
              <br />
              LISTENER <span className="accent">AI</span>
            </div>
            <div className="brand-live">
              <span className="live-dot" />
              LIVE TRANSLATION
            </div>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-tab${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="topbar-stats">
          <div className="stat-item active">
            GPU
            <strong>{gpuActive ? "ACTIVE" : "CPU"}</strong>
          </div>
          <div className="stat-item fps">
            FPS
            <strong>{liveStats.fps || "--"}</strong>
          </div>
          <div className="stat-item latency">
            LATENCY
            <strong>{liveStats.latencyMs ? `${liveStats.latencyMs}ms` : "--"}</strong>
          </div>
        </div>

        <div className="level-badge">
          <div className="level-badge-num">
            LEVEL
            <strong>{level}</strong>
          </div>
          <div>
            <div className="level-progress-track">
              <div className="level-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="level-xp">
              {xpIntoLevel}/{XP_TO_LEVEL}
            </div>
          </div>
        </div>

        <button className="icon-btn" aria-label="Notifications" title={`${notifications} notifications`}>
          <Bell />
          {notifications > 0 && <span className="notif-badge">{notifications}</span>}
        </button>
      </header>

      <main className="main-content">
        {activeTab === "realtime" && (
          <DeafListener
            settings={settings}
            onGesture={registerGesture}
            onStatsChange={(stats) => {
              setGpuActive(stats.gpuActive);
              setLiveStats({ fps: stats.fps, latencyMs: stats.latencyMs });
            }}
          />
        )}
        {activeTab === "conversation" && (
          <ConversationMode settings={settings} onGesture={registerGesture} />
        )}
        {activeTab === "dictionary" && <DictionaryMode />}
        {activeTab === "training" && <TrainingMode sessionHistory={sessionHistory} />}
        {activeTab === "analytics" && (
          <AnalyticsDashboard sessionHistory={sessionHistory} xp={xp} level={level} />
        )}
        {activeTab === "settings" && (
          <SystemSettings settings={settings} onChange={setSettings} />
        )}
        {activeTab === "help" && <HelpDocs />}
      </main>
    </div>
  );
}
