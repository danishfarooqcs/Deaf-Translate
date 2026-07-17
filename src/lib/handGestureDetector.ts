// Geometric classification of MediaPipe hand landmarks into a small,
// fixed vocabulary of gestures. This is deliberately rule-based (no
// training data) so it runs entirely client-side and is easy to reason
// about / extend. It works best when the palm is roughly facing the
// camera and the hand is upright-ish, which is the common case for a
// front-facing laptop/phone camera.

export type StaticGesture =
  | "open_palm"
  | "fist"
  | "thumbs_up"
  | "thumbs_down"
  | "peace"
  | "ok"
  | "pointing"
  | "call_me"
  | "love_you"
  | "none";

export type Gesture =
  | "hi"
  | "bye"
  | "thumbs_up"
  | "thumbs_down"
  | "open_palm"
  | "fist"
  | "peace"
  | "ok"
  | "pointing"
  | "call_me"
  | "love_you";

export interface GestureResult {
  gesture: Gesture;
  label: string;
}

export const GESTURE_LABELS: Record<Gesture, string> = {
  hi: "Hi \u{1F44B}",
  bye: "Bye \u{1F44B}",
  thumbs_up: "Thumbs up \u{1F44D}",
  thumbs_down: "Thumbs down \u{1F44E}",
  open_palm: "Stop / Open palm \u270B",
  fist: "Fist \u270A",
  peace: "Peace \u270C\uFE0F",
  ok: "OK \u{1F44C}",
  pointing: "Pointing \u261D\uFE0F",
  call_me: "Call me \u{1F919}",
  love_you: "Love you \u{1F91F}",
};

// The phrase spoken aloud for each gesture -- kept short and natural.
export const SPOKEN_PHRASE: Record<Gesture, string> = {
  hi: "Hi",
  bye: "Bye",
  thumbs_up: "Thumbs up",
  thumbs_down: "Thumbs down",
  open_palm: "Stop",
  fist: "Fist",
  peace: "Peace",
  ok: "OK",
  pointing: "Pointing",
  call_me: "Call me",
  love_you: "Love you",
};

// A single hand landmark as returned by @mediapipe/tasks-vision
// (normalized image coordinates, x/y in [0, 1]).
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

const WRIST = 0;
const THUMB_MCP = 2;
const THUMB_TIP = 4;
const FINGERS: Array<{ mcp: number; pip: number; tip: number }> = [
  { mcp: 5, pip: 6, tip: 8 }, // index
  { mcp: 9, pip: 10, tip: 12 }, // middle
  { mcp: 13, pip: 14, tip: 16 }, // ring
  { mcp: 17, pip: 18, tip: 20 }, // pinky
];

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Rough scale of the hand in frame, used to normalize thresholds. */
function handScale(lm: Landmark[]): number {
  return dist(lm[WRIST], lm[FINGERS[1].mcp]) || 0.001;
}

/** True if a finger's tip is farther from the wrist than its pip joint. */
function isFingerExtended(lm: Landmark[], mcp: number, pip: number, tip: number): boolean {
  const scale = handScale(lm);
  const tipDist = dist(lm[WRIST], lm[tip]);
  const pipDist = dist(lm[WRIST], lm[pip]);
  const mcpDist = dist(lm[WRIST], lm[mcp]);
  return tipDist > pipDist + scale * 0.08 && tipDist > mcpDist;
}

function isThumbExtended(lm: Landmark[]): boolean {
  const scale = handScale(lm);
  const tipDist = dist(lm[WRIST], lm[THUMB_TIP]);
  const mcpDist = dist(lm[WRIST], lm[THUMB_MCP]);
  return tipDist > mcpDist + scale * 0.35;
}

/** Classifies the *current frame's* static hand shape (no motion). */
export function classifyStaticGesture(lm: Landmark[]): StaticGesture {
  if (!lm || lm.length < 21) return "none";

  const scale = handScale(lm);
  const [indexExt, middleExt, ringExt, pinkyExt] = FINGERS.map((f) =>
    isFingerExtended(lm, f.mcp, f.pip, f.tip),
  );
  const thumbExtended = isThumbExtended(lm);
  const thumbAboveWrist = lm[THUMB_TIP].y < lm[WRIST].y - scale * 0.3;
  const thumbBelowWrist = lm[THUMB_TIP].y > lm[WRIST].y + scale * 0.3;
  const pinchDist = dist(lm[THUMB_TIP], lm[FINGERS[0].tip]);

  // OK: thumb and index pinched together, other three fingers extended.
  if (pinchDist < scale * 0.4 && middleExt && ringExt && pinkyExt) {
    return "ok";
  }

  // Thumbs up / down: only the thumb extended, pointed clearly up or down.
  if (thumbExtended && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (thumbAboveWrist) return "thumbs_up";
    if (thumbBelowWrist) return "thumbs_down";
  }

  // Love you (ASL "ILY"): thumb, index, and pinky extended.
  if (thumbExtended && indexExt && pinkyExt && !middleExt && !ringExt) {
    return "love_you";
  }

  // Call me / shaka: thumb and pinky extended, others curled.
  if (thumbExtended && pinkyExt && !indexExt && !middleExt && !ringExt) {
    return "call_me";
  }

  // Peace / victory: index and middle extended, ring and pinky curled.
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return "peace";
  }

  // Pointing: only the index finger extended.
  if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExtended) {
    return "pointing";
  }

  // Open palm: all four fingers extended.
  if (indexExt && middleExt && ringExt && pinkyExt) {
    return "open_palm";
  }

  // Fist: nothing extended.
  if (!indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExtended) {
    return "fist";
  }

  return "none";
}

interface WaveTrackerState {
  history: Array<{ t: number; x: number; palmOpen: boolean }>;
  lastEmit: number;
  handPresentSince: number;
  lastSeenAt: number;
  pendingWaveAt: number | null;
}

const WINDOW_MS = 900;
const MIN_DIRECTION_CHANGES = 2;
const EMIT_COOLDOWN_MS = 1800;
const BYE_GRACE_MS = 1400;

export function createWaveTracker(): WaveTrackerState {
  return {
    history: [],
    lastEmit: 0,
    handPresentSince: 0,
    lastSeenAt: 0,
    pendingWaveAt: null,
  };
}

/**
 * Feeds one frame of landmarks (or null if no hand detected) into the
 * tracker and returns a recognized gesture for this frame, if any.
 *
 * Static gestures (fist / open palm / thumbs up) fire as soon as the
 * shape is held. A "wave" -- an open palm oscillating side to side --
 * is reported as "hi" the first time it happens after the hand appears,
 * and as "bye" if the hand then leaves the frame shortly after waving
 * again. That's a heuristic, not a certainty: sign language has no
 * universal automatic way to tell a hello-wave from a goodbye-wave from
 * shape alone, so we lean on the surrounding context (hand arriving vs.
 * hand about to leave) instead.
 */
export function updateWaveTracker(
  state: WaveTrackerState,
  lm: Landmark[] | null,
  now: number,
): GestureResult | null {
  if (!lm) {
    // Hand just disappeared -- if we were mid/just-after a wave, call it "bye".
    if (state.pendingWaveAt && now - state.pendingWaveAt < BYE_GRACE_MS) {
      state.pendingWaveAt = null;
      state.handPresentSince = 0;
      state.history = [];
      state.lastEmit = now;
      return { gesture: "bye", label: GESTURE_LABELS.bye };
    }
    state.handPresentSince = 0;
    state.history = [];
    return null;
  }

  if (state.handPresentSince === 0) {
    state.handPresentSince = now;
  }
  state.lastSeenAt = now;

  const staticShape = classifyStaticGesture(lm);
  const palmOpen = staticShape === "open_palm";
  const wristX = lm[WRIST].x;

  state.history.push({ t: now, x: wristX, palmOpen });
  state.history = state.history.filter((p) => now - p.t <= WINDOW_MS);

  const canEmit = now - state.lastEmit > EMIT_COOLDOWN_MS;

  // Detect oscillation: count direction reversals of wrist.x over the window.
  if (state.history.length >= 4 && state.history.every((p) => p.palmOpen)) {
    let reversals = 0;
    let dir = 0;
    for (let i = 1; i < state.history.length; i++) {
      const delta = state.history[i].x - state.history[i - 1].x;
      if (Math.abs(delta) < 0.006) continue;
      const newDir = delta > 0 ? 1 : -1;
      if (dir !== 0 && newDir !== dir) reversals++;
      dir = newDir;
    }

    if (reversals >= MIN_DIRECTION_CHANGES && canEmit) {
      state.lastEmit = now;
      state.pendingWaveAt = now;
      const isFirstWave = now - state.handPresentSince < 2200;
      state.history = [];
      if (isFirstWave) {
        return { gesture: "hi", label: GESTURE_LABELS.hi };
      }
      // A later wave that isn't immediately followed by the hand leaving
      // still reads as a friendly wave -- treat it as "hi" too, and let
      // the disappearance check above upgrade it to "bye" if the hand
      // exits right after.
      return { gesture: "hi", label: GESTURE_LABELS.hi };
    }
  }

  if (canEmit && staticShape !== "none" && staticShape !== "open_palm") {
    state.lastEmit = now;
    const gesture = staticShape as Gesture;
    return { gesture, label: GESTURE_LABELS[gesture] };
  }

  // Hold a plain, non-waving open palm long enough -> "Stop".
  if (
    canEmit &&
    staticShape === "open_palm" &&
    state.history.length >= 6 &&
    state.history.every((p) => p.palmOpen) &&
    (() => {
      const xs = state.history.map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs) < 0.02;
    })()
  ) {
    state.lastEmit = now;
    return { gesture: "open_palm", label: GESTURE_LABELS.open_palm };
  }

  return null;
}
