import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings } from "../types";

interface UseSpeechResult {
  voices: SpeechSynthesisVoice[];
  speak: (text: string) => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
}

export function useSpeech(speechSettings: AppSettings["speech"]): UseSpeechResult {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !speechSettings.enabled || speechSettings.muted) return;
      if (!speechSettings.repeatHeldGestures && lastSpokenRef.current === text) return;
      lastSpokenRef.current = text;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = speechSettings.volume;
      utterance.rate = speechSettings.rate;
      utterance.lang = speechSettings.language;

      const voice = voices.find((v) => v.voiceURI === speechSettings.voiceURI);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [supported, speechSettings, voices]
  );

  return { voices, speak, cancel, speaking, supported };
}
