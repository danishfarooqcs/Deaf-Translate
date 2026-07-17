import type { Point3D, Handedness } from "../types";

// Landmark indices as returned by MediaPipe HandLandmarker.
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

export interface HandFrame {
  landmarks: Point3D[];
  handedness: Handedness;
}

export interface ClassifiedGesture {
  name: string;
  confidence: number;
  handedness: Handedness;
}

function dist(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

function getFingerState(lm: Point3D[]): FingerState {
  const wrist = lm[WRIST];
  const extended = (tip: number, pip: number) =>
    dist(wrist, lm[tip]) > dist(wrist, lm[pip]) * 1.05;

  return {
    thumb: dist(wrist, lm[THUMB_TIP]) > dist(wrist, lm[THUMB_IP]) * 1.05,
    index: extended(INDEX_TIP, INDEX_PIP),
    middle: extended(MIDDLE_TIP, MIDDLE_PIP),
    ring: extended(RING_TIP, RING_PIP),
    pinky: extended(PINKY_TIP, PINKY_PIP),
  };
}

function patternKey(f: FingerState): string {
  return [f.thumb, f.index, f.middle, f.ring, f.pinky].map((b) => (b ? "1" : "0")).join("");
}

const STATIC_PATTERNS: Record<string, string> = {
  "00000": "Fist",
  "11111": "Open Palm / Five",
  "01100": "Peace / Two",
  "01110": "Three",
  "01111": "Four",
  "10001": "Call Me",
  "11001": "I Love You",
  "01001": "Rock",
};

/**
 * Classifies a single hand's landmarks into one of the engine's
 * ~24 live-detectable gestures. Returns null if no confident match.
 */
export function classifyHand(hand: HandFrame): ClassifiedGesture | null {
  const { landmarks: lm, handedness } = hand;
  const wrist = lm[WRIST];
  const handScale = dist(lm[WRIST], lm[MIDDLE_MCP]) || 0.0001;
  const f = getFingerState(lm);

  const thumbIndexDist = dist(lm[THUMB_TIP], lm[INDEX_TIP]) / handScale;
  const thumbPinkyDist = dist(lm[THUMB_TIP], lm[PINKY_TIP]) / handScale;
  const thumbRingDist = dist(lm[THUMB_TIP], lm[RING_TIP]) / handScale;
  const thumbMiddleDist = dist(lm[THUMB_TIP], lm[MIDDLE_TIP]) / handScale;

  const emit = (name: string, confidence: number): ClassifiedGesture => ({
    name,
    confidence: Math.min(0.99, confidence),
    handedness,
  });

  // Priority 1: OK sign - thumb+index touch, other three extended
  if (thumbIndexDist < 0.4 && f.middle && f.ring && f.pinky) {
    return emit("OK", 0.9);
  }

  // Priority 2: Pinch - thumb+index touch, other three curled
  if (thumbIndexDist < 0.4 && !f.middle && !f.ring && !f.pinky) {
    return emit("Pinch", 0.85);
  }

  // Priority 3: ASL number Six - thumb touches pinky tip
  if (thumbPinkyDist < 0.45 && f.index && f.middle && f.ring) {
    return emit("Six", 0.82);
  }

  // Priority 4: ASL number Seven - thumb touches ring tip
  if (thumbRingDist < 0.45 && f.index && f.middle && f.pinky) {
    return emit("Seven", 0.8);
  }

  // Priority 5: ASL number Eight - thumb touches middle tip
  if (thumbMiddleDist < 0.45 && f.index && f.ring && f.pinky) {
    return emit("Eight", 0.8);
  }

  // Priority 6: static pattern lookup table
  const key = patternKey(f);
  if (STATIC_PATTERNS[key]) {
    return emit(STATIC_PATTERNS[key], 0.88);
  }

  // Priority 7: only index extended -> point direction or "One"
  if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    const dx = lm[INDEX_TIP].x - lm[INDEX_MCP].x;
    const dy = lm[INDEX_TIP].y - lm[INDEX_MCP].y;
    if (Math.abs(dy) > Math.abs(dx) * 1.4) {
      return emit(dy < 0 ? "Point Up" : "Point Down", 0.78);
    }
    if (Math.abs(dx) > Math.abs(dy) * 1.4) {
      return emit(dx > 0 ? "Point Right" : "Point Left", 0.78);
    }
    return emit("One", 0.75);
  }

  // Also treat index-extended-with-thumb-out as "One" (common relaxed handshape)
  if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    return emit("One", 0.65);
  }

  // Priority 8: only thumb extended -> thumbs up / down
  if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    const upThreshold = handScale * 0.25;
    if (lm[THUMB_TIP].y < wrist.y - upThreshold) return emit("Thumbs Up", 0.85);
    if (lm[THUMB_TIP].y > wrist.y + upThreshold) return emit("Thumbs Down", 0.85);
    return emit("Thumbs Up", 0.55);
  }

  return null;
}

/**
 * Checks two simultaneous hands for the two-hand "Heart" gesture:
 * each hand's thumb tip is near the other hand's index tip.
 */
export function classifyTwoHandGesture(hands: HandFrame[]): ClassifiedGesture | null {
  if (hands.length !== 2) return null;
  const [a, b] = hands;
  const scale =
    (dist(a.landmarks[WRIST], a.landmarks[MIDDLE_MCP]) +
      dist(b.landmarks[WRIST], b.landmarks[MIDDLE_MCP])) /
    2 || 0.0001;

  const d1 = dist(a.landmarks[THUMB_TIP], b.landmarks[INDEX_TIP]) / scale;
  const d2 = dist(b.landmarks[THUMB_TIP], a.landmarks[INDEX_TIP]) / scale;

  if (d1 < 0.5 && d2 < 0.5) {
    return { name: "Heart", confidence: 0.9, handedness: a.handedness };
  }
  return null;
}

export const LIVE_GESTURE_LIST = [
  "Fist",
  "Open Palm",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Thumbs Up",
  "Thumbs Down",
  "Peace",
  "OK",
  "Pinch",
  "Point Up",
  "Point Down",
  "Point Left",
  "Point Right",
  "Rock",
  "Call Me",
  "I Love You",
  "Heart",
  "Wave / Hello",
  "Grab",
  "Release",
];
