export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Handedness = "Left" | "Right";

export interface DetectedGesture {
  name: string;
  confidence: number;
  handedness: Handedness;
}

export interface HistoryEntry {
  id: string;
  gesture: string;
  confidence: number;
  timestamp: number;
  handedness: Handedness;
}

export interface EngineStats {
  fps: number;
  latencyMs: number;
  inferenceMs: number;
  resolution: string;
  handsDetected: number;
  gpuActive: boolean;
}

export type ThemeMode = "dark" | "light";

export interface AppSettings {
  theme: ThemeMode;
  mirrorCamera: boolean;
  sensitivity: number; // 0-1, majority-vote smoothing window influence
  inferenceIntervalMs: number;
  fpsCap: number;
  cameraDeviceId: string | null;
  speech: {
    enabled: boolean;
    volume: number;
    rate: number;
    voiceURI: string | null;
    muted: boolean;
    language: string;
    repeatHeldGestures: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  mirrorCamera: true,
  sensitivity: 0.6,
  inferenceIntervalMs: 90,
  fpsCap: 30,
  cameraDeviceId: null,
  speech: {
    enabled: true,
    volume: 1,
    rate: 1,
    voiceURI: null,
    muted: false,
    language: "en-US",
    repeatHeldGestures: false,
  },
};

export interface VocabularyEntry {
  word: string;
  category: string;
  liveDetectable: boolean;
  description: string;
}

export type TabId =
  | "realtime"
  | "conversation"
  | "dictionary"
  | "training"
  | "analytics"
  | "settings"
  | "help";
