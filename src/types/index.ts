export interface ChatMessage {
  id: string;
  sender: 'user' | 'partner' | 'system';
  text: string;
  timestamp: number;
  confidence?: number;
  reasoning?: string;
  type: 'sign' | 'speech' | 'system';
}

export interface Gesture {
  id: string;
  name: string;
  meaning: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'alphabet' | 'words' | 'phrases';
  description: string;
  iconName?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  iconName: string;
}

export interface UsageLog {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  gesturesCount: number;
  averageConfidence: number;
}

export interface CameraSettings {
  deviceId: string;
  resolution: string; // '640x480' | '1280x720' | '1920x1080'
  mirror: boolean;
  brightness: number; // 0-200
  exposure: number; // 0-100
  zoom: number; // 1-3
}

export interface AiSettings {
  confidenceThreshold: number; // 0-100
  debounceMs: number;
  detectionSpeed: number; // 1-60 fps
  trackingSpeed: number; // 1-5
  enableLandmarks: boolean;
  showSkeleton: boolean;
  enableVoice: boolean;
  enableAutoSpeak: boolean;
  enableTranslation: boolean;
}

export interface VoiceSettings {
  selectedVoice: string;
  playbackSpeed: number; // 0.5 - 2
  pitch: number; // 0.5 - 2
  volume: number; // 0 - 100
  genderPreference: 'all' | 'male' | 'female';
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  keyboardShortcuts: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  inferenceTime: number; // ms
  latency: number; // ms
  gpuStatus: 'active' | 'inactive' | 'fallback';
}
