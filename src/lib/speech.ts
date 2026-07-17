// Thin wrapper around the browser's SpeechSynthesis API. Speaks short
// phrases for recognized gestures, with a mute toggle and basic support
// detection (SSR-safe / older-browser-safe).

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let muted = false;
let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => v.lang.startsWith("en") && /female|samantha|zira|jenny/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0]
  );
}

if (isSpeechSupported()) {
  voice = pickVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    voice = pickVoice();
  };
}

export function setMuted(value: boolean) {
  muted = value;
  if (muted && isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function isMuted(): boolean {
  return muted;
}

export function speak(text: string) {
  if (!isSpeechSupported() || muted) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}
