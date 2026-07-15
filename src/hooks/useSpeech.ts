import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from './useAppStore';

// TypeScript interfaces for Web Speech API fallback
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export function useSpeech() {
  const voiceSettings = useAppStore((state) => state.voiceSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Speak method
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Stop speaking any current speech
    window.speechSynthesis.cancel();

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    const selected = voices.find(v => v.name === voiceSettings.selectedVoice);
    if (selected) {
      utterance.voice = selected;
    }
    
    utterance.rate = voiceSettings.playbackSpeed;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume / 100;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices, voiceSettings]);

  // Cancel speech
  const cancelSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Speech Recognition (Speech to Text)
  const startListening = useCallback((
    onResult: (text: string) => void,
    onEndCallback?: () => void
  ) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Can be customized later

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onEndCallback) onEndCallback();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    voices,
    speak,
    cancelSpeech,
    isSpeaking,
    isListening,
    startListening,
    stopListening,
  };
}
