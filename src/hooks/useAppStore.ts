import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ChatMessage, 
  Gesture, 
  Badge, 
  UsageLog, 
  CameraSettings, 
  AiSettings, 
  VoiceSettings, 
  AccessibilitySettings,
  PerformanceMetrics
} from '../types';

interface AppState {
  // Navigation & Page
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // System Stats
  performance: PerformanceMetrics;
  setPerformance: (metrics: Partial<PerformanceMetrics>) => void;

  // Settings
  cameraSettings: CameraSettings;
  setCameraSettings: (settings: Partial<CameraSettings>) => void;
  aiSettings: AiSettings;
  setAiSettings: (settings: Partial<AiSettings>) => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  accessibility: AccessibilitySettings;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;

  // Chat/Conversation
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  deleteMessage: (id: string) => void;
  clearHistory: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Sign Sentence Builder
  currentSentence: string;
  setCurrentSentence: (sentence: string) => void;
  appendWordToSentence: (word: string) => void;
  undoSentence: () => void;
  redoSentence: () => void;
  clearSentence: () => void;

  // History stack for undo/redo
  sentenceHistory: string[];
  sentenceRedoStack: string[];

  // Practice & Training
  badges: Badge[];
  unlockBadge: (id: string) => void;
  practiceTarget: Gesture | null;
  setPracticeTarget: (gesture: Gesture | null) => void;
  practiceScore: number;
  setPracticeScore: (score: number) => void;
  practiceStars: number;
  addPracticeStars: (count: number) => void;
  userLevel: number;
  userXp: number;
  addXp: (amount: number) => void;

  // Analytics Logs
  usageLogs: UsageLog[];
  addUsageLog: (log: Omit<UsageLog, 'id'>) => void;

  // Notifications
  notifications: Array<{ id: string; title: string; message: string; read: boolean; timestamp: number }>;
  addNotification: (title: string, message: string) => void;
  clearNotifications: () => void;
}

const initialBadges: Badge[] = [
  { id: 'first_sign', title: 'First Contact', description: 'Translate your first ASL gesture.', unlocked: false, iconName: 'Hand' },
  { id: 'perfect_match', title: 'Flawless Form', description: 'Achieve 95%+ confidence on a practice gesture.', unlocked: false, iconName: 'Award' },
  { id: 'word_smith', title: 'Wordsmith', description: 'Assemble a sentence containing 5 or more words.', unlocked: false, iconName: 'BookOpen' },
  { id: 'chat_pro', title: 'Conversationalist', description: 'Hold a WebRTC or simulated dialog.', unlocked: false, iconName: 'MessageSquareText' },
  { id: 'analytics_guru', title: 'Data Analyst', description: 'Review your tracking dashboard for 3 consecutive days.', unlocked: false, iconName: 'BarChart' },
  { id: 'level_5', title: 'Rising Star', description: 'Reach Level 5 in practice training.', unlocked: false, iconName: 'Zap' },
];

const mockUsageLogs: UsageLog[] = [
  { id: '1', date: '2026-07-09', durationMinutes: 12, gesturesCount: 45, averageConfidence: 86 },
  { id: '2', date: '2026-07-10', durationMinutes: 24, gesturesCount: 92, averageConfidence: 89 },
  { id: '3', date: '2026-07-11', durationMinutes: 18, gesturesCount: 68, averageConfidence: 88 },
  { id: '4', date: '2026-07-12', durationMinutes: 35, gesturesCount: 154, averageConfidence: 91 },
  { id: '5', date: '2026-07-13', durationMinutes: 40, gesturesCount: 198, averageConfidence: 92 },
  { id: '6', date: '2026-07-14', durationMinutes: 15, gesturesCount: 52, averageConfidence: 89 },
  { id: '7', date: '2026-07-15', durationMinutes: 28, gesturesCount: 110, averageConfidence: 93 },
];

const mockNotifications = [
  { id: 'n1', title: 'Model Ready', message: 'ASL MediaPipe model version 2.4 loaded successfully.', read: false, timestamp: Date.now() - 3600000 },
  { id: 'n2', title: 'Webcam Ready', message: 'High-definition video input resolved at 60 FPS.', read: false, timestamp: Date.now() - 7200000 }
];

const mockInitialMessages: ChatMessage[] = [
  { id: 'm1', sender: 'system', text: 'Welcome to Deaf Listener AI. Enable camera tracking to begin.', timestamp: Date.now() - 10000, type: 'system' },
  { id: 'm2', sender: 'partner', text: 'Hello! I am excited to practice sign language with you today.', timestamp: Date.now() - 5000, type: 'speech' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),

      performance: {
        fps: 60,
        inferenceTime: 8,
        latency: 12,
        gpuStatus: 'active',
      },
      setPerformance: (metrics) => 
        set((state) => ({ performance: { ...state.performance, ...metrics } })),

      cameraSettings: {
        deviceId: 'default',
        resolution: '1280x720',
        mirror: true,
        brightness: 100,
        exposure: 50,
        zoom: 1,
      },
      setCameraSettings: (settings) => 
        set((state) => ({ cameraSettings: { ...state.cameraSettings, ...settings } })),

      aiSettings: {
        confidenceThreshold: 75,
        debounceMs: 600,
        detectionSpeed: 30,
        trackingSpeed: 3,
        enableLandmarks: true,
        showSkeleton: true,
        enableVoice: true,
        enableAutoSpeak: false,
        enableTranslation: true,
      },
      setAiSettings: (settings) => 
        set((state) => ({ aiSettings: { ...state.aiSettings, ...settings } })),

      voiceSettings: {
        selectedVoice: '',
        playbackSpeed: 1,
        pitch: 1,
        volume: 80,
        genderPreference: 'all',
      },
      setVoiceSettings: (settings) => 
        set((state) => ({ voiceSettings: { ...state.voiceSettings, ...settings } })),

      accessibility: {
        highContrast: false,
        largeText: false,
        colorBlindMode: 'none',
        keyboardShortcuts: true,
      },
      setAccessibility: (settings) => 
        set((state) => ({ accessibility: { ...state.accessibility, ...settings } })),

      messages: mockInitialMessages,
      addMessage: (msg) => set((state) => {
        const newMessage: ChatMessage = {
          ...msg,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        };
        return { messages: [...state.messages, newMessage] };
      }),
      deleteMessage: (id) => set((state) => ({
        messages: state.messages.filter((m) => m.id !== id)
      })),
      clearHistory: () => set({ messages: [] }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      currentSentence: '',
      setCurrentSentence: (sentence) => {
        const current = get().currentSentence;
        set((state) => ({
          currentSentence: sentence,
          sentenceHistory: [...state.sentenceHistory, current],
          sentenceRedoStack: []
        }));
      },
      appendWordToSentence: (word) => {
        const current = get().currentSentence;
        const newSentence = current ? `${current} ${word}` : word;
        set((state) => ({
          currentSentence: newSentence,
          sentenceHistory: [...state.sentenceHistory, current],
          sentenceRedoStack: []
        }));
      },
      undoSentence: () => {
        const history = get().sentenceHistory;
        if (history.length === 0) return;
        const current = get().currentSentence;
        const prev = history[history.length - 1];
        set({
          currentSentence: prev,
          sentenceHistory: history.slice(0, history.length - 1),
          sentenceRedoStack: [current, ...get().sentenceRedoStack]
        });
      },
      redoSentence: () => {
        const redoStack = get().sentenceRedoStack;
        if (redoStack.length === 0) return;
        const current = get().currentSentence;
        const next = redoStack[0];
        set({
          currentSentence: next,
          sentenceHistory: [...get().sentenceHistory, current],
          sentenceRedoStack: redoStack.slice(1)
        });
      },
      clearSentence: () => {
        const current = get().currentSentence;
        set((state) => ({
          currentSentence: '',
          sentenceHistory: [...state.sentenceHistory, current],
          sentenceRedoStack: []
        }));
      },
      sentenceHistory: [],
      sentenceRedoStack: [],

      badges: initialBadges,
      unlockBadge: (id) => set((state) => {
        let unlockedName = '';
        const updatedBadges = state.badges.map((b) => {
          if (b.id === id && !b.unlocked) {
            unlockedName = b.title;
            return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
          }
          return b;
        });
        
        const newNotifications = [...state.notifications];
        if (unlockedName) {
          newNotifications.push({
            id: Math.random().toString(36).substring(7),
            title: 'Badge Unlocked!',
            message: `Congratulations! You unlocked the "${unlockedName}" achievement.`,
            read: false,
            timestamp: Date.now()
          });
        }

        return { 
          badges: updatedBadges,
          notifications: newNotifications
        };
      }),

      practiceTarget: null,
      setPracticeTarget: (gesture) => set({ practiceTarget: gesture }),
      practiceScore: 0,
      setPracticeScore: (score) => set({ practiceScore: score }),
      practiceStars: 15,
      addPracticeStars: (count) => set((state) => ({ practiceStars: state.practiceStars + count })),
      
      userLevel: 2,
      userXp: 450,
      addXp: (amount) => set((state) => {
        const newXp = state.userXp + amount;
        const xpNeeded = state.userLevel * 500;
        if (newXp >= xpNeeded) {
          const nextLevel = state.userLevel + 1;
          const excessXp = newXp - xpNeeded;
          
          const levelUpNotification = {
            id: Math.random().toString(36).substring(7),
            title: 'Level Up!',
            message: `Fantastic! You reached Level ${nextLevel}! Keep it up.`,
            read: false,
            timestamp: Date.now()
          };

          // Also check for Level 5 badge
          let badgesCopy = [...state.badges];
          if (nextLevel >= 5) {
            badgesCopy = badgesCopy.map(b => b.id === 'level_5' ? { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() } : b);
          }

          return {
            userLevel: nextLevel,
            userXp: excessXp,
            notifications: [...state.notifications, levelUpNotification],
            badges: badgesCopy
          };
        }
        return { userXp: newXp };
      }),

      usageLogs: mockUsageLogs,
      addUsageLog: (log) => set((state) => ({
        usageLogs: [
          ...state.usageLogs,
          { ...log, id: Math.random().toString(36).substring(7) }
        ]
      })),

      notifications: mockNotifications,
      addNotification: (title, message) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            id: Math.random().toString(36).substring(7),
            title,
            message,
            read: false,
            timestamp: Date.now()
          }
        ]
      })),
      clearNotifications: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }))
    }),
    {
      name: 'deaf-listener-ai-store',
      partialize: (state) => ({
        cameraSettings: state.cameraSettings,
        aiSettings: state.aiSettings,
        voiceSettings: state.voiceSettings,
        accessibility: state.accessibility,
        messages: state.messages,
        currentSentence: state.currentSentence,
        badges: state.badges,
        practiceStars: state.practiceStars,
        userLevel: state.userLevel,
        userXp: state.userXp,
        usageLogs: state.usageLogs,
      }),
    }
  )
);
