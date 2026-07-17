import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { classifyHand, classifyTwoHandGesture } from "../utils/gestureEngine";
import type { HandFrame } from "../utils/gestureEngine";
import type { DetectedGesture, EngineStats, HistoryEntry, Point3D } from "../types";

interface UseGestureDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
  mirror: boolean;
  sensitivity: number;
  inferenceIntervalMs: number;
  onGesture?: (gesture: DetectedGesture) => void;
}

interface UseGestureDetectionResult {
  currentGesture: DetectedGesture | null;
  history: HistoryEntry[];
  stats: EngineStats;
  modelStatus: "loading" | "ready" | "error";
  clearHistory: () => void;
}

const WAVE_BUFFER_SIZE = 14;
const HOLD_STABILITY_FRAMES = 3;

export function useGestureDetection({
  videoRef,
  active,
  mirror,
  sensitivity,
  inferenceIntervalMs,
  onGesture,
}: UseGestureDetectionOptions): UseGestureDetectionResult {
  const [currentGesture, setCurrentGesture] = useState<DetectedGesture | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [stats, setStats] = useState<EngineStats>({
    fps: 0,
    latencyMs: 0,
    inferenceMs: 0,
    resolution: "--",
    handsDetected: 0,
    gpuActive: false,
  });

  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastVoteRef = useRef<string[]>([]);
  const lastStableRef = useRef<string | null>(null);
  const wristHistoryRef = useRef<number[]>([]);
  const frameTimesRef = useRef<number[]>([]);
  const lastInferenceTimeRef = useRef(0);
  const onGestureRef = useRef(onGesture);
  onGestureRef.current = onGesture;

  // Load the model once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setModelStatus("ready");
        setStats((s) => ({ ...s, gpuActive: true }));
      } catch (err) {
        try {
          // GPU delegate can fail on some devices/browsers - retry on CPU
          const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
          );
          const landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
          });
          if (cancelled) return;
          landmarkerRef.current = landmarker;
          setModelStatus("ready");
          setStats((s) => ({ ...s, gpuActive: false }));
        } catch {
          if (!cancelled) setModelStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
    };
  }, []);

  useEffect(() => {
    if (!active || modelStatus !== "ready") return;

    let stopped = false;

    const detectFingerPattern = (lm: Point3D[]) => {
      const dist = (a: Point3D, b: Point3D) => Math.hypot(a.x - b.x, a.y - b.y);
      const scale = dist(lm[0], lm[9]) || 0.0001;
      return {
        isOpen: [8, 12, 16, 20].every((tip) => dist(lm[0], lm[tip]) > dist(lm[0], lm[tip - 2]) * 1.05),
        isFist: [8, 12, 16, 20].every((tip) => dist(lm[0], lm[tip]) <= dist(lm[0], lm[tip - 2]) * 1.05),
        scale,
      };
    };

    const tick = (timestampMs: number) => {
      if (stopped) return;
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      if (now - lastInferenceTimeRef.current < inferenceIntervalMs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastInferenceTimeRef.current = now;

      const inferStart = performance.now();
      let result: any;
      try {
        result = landmarker.detectForVideo(video, timestampMs);
      } catch {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const inferenceMs = performance.now() - inferStart;

      // FPS tracking
      frameTimesRef.current.push(now);
      frameTimesRef.current = frameTimesRef.current.filter((t) => now - t < 1000);
      const fps = frameTimesRef.current.length;

      const rawLandmarks: Point3D[][] = result?.landmarks ?? [];
      const handednessInfo = result?.handedness ?? [];

      const hands: HandFrame[] = rawLandmarks.map((lm, i) => {
        const points = lm.map((p: any) => ({
          x: mirror ? 1 - p.x : p.x,
          y: p.y,
          z: p.z ?? 0,
        }));
        const label = handednessInfo?.[i]?.[0]?.categoryName === "Left" ? "Right" : "Left";
        // MediaPipe reports handedness from the camera's perspective; when we
        // mirror the preview for a natural "selfie" feel we flip the label too.
        return { landmarks: points, handedness: (mirror ? label : handednessInfo?.[i]?.[0]?.categoryName) as any };
      });

      let matched: DetectedGesture | null = null;

      if (hands.length === 2) {
        const heart = classifyTwoHandGesture(hands);
        if (heart) matched = heart;
      }

      if (!matched && hands.length > 0) {
        for (const hand of hands) {
          const c = classifyHand(hand);
          if (c) {
            matched = c;
            break;
          }
        }
      }

      // Temporal: wave / grab / release, using the primary hand's wrist + open/fist state
      if (hands.length > 0) {
        const primary = hands[0];
        const wristX = primary.landmarks[0].x;
        wristHistoryRef.current.push(wristX);
        if (wristHistoryRef.current.length > WAVE_BUFFER_SIZE) wristHistoryRef.current.shift();

        const { isOpen, isFist, scale } = detectFingerPattern(primary.landmarks);

        if (isOpen && wristHistoryRef.current.length >= WAVE_BUFFER_SIZE) {
          const xs = wristHistoryRef.current;
          const range = Math.max(...xs) - Math.min(...xs);
          let direction_changes = 0;
          for (let i = 2; i < xs.length; i++) {
            if ((xs[i] - xs[i - 1]) * (xs[i - 1] - xs[i - 2]) < 0) direction_changes++;
          }
          if (range > scale * 1.1 && direction_changes >= 2) {
            matched = { name: "Wave / Hello", confidence: 0.8, handedness: primary.handedness };
          }
        }

        if (lastStableRef.current === "Open Palm / Five" && isFist) {
          matched = { name: "Grab", confidence: 0.75, handedness: primary.handedness };
        } else if (lastStableRef.current === "Fist" && isOpen) {
          matched = { name: "Release", confidence: 0.75, handedness: primary.handedness };
        }
      } else {
        wristHistoryRef.current = [];
      }

      // Majority-vote smoothing over a short window sized by sensitivity
      const windowSize = Math.max(2, Math.round(6 - sensitivity * 4));
      lastVoteRef.current.push(matched?.name ?? "");
      if (lastVoteRef.current.length > windowSize) lastVoteRef.current.shift();

      const counts: Record<string, number> = {};
      for (const g of lastVoteRef.current) {
        if (!g) continue;
        counts[g] = (counts[g] ?? 0) + 1;
      }
      const [stableName, stableCount] =
        Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

      if (stableName && stableCount >= Math.ceil(windowSize * 0.5) && matched) {
        if (stableName !== lastStableRef.current) {
          lastStableRef.current = stableName;
          const detected: DetectedGesture = {
            name: stableName,
            confidence: matched.confidence,
            handedness: matched.handedness,
          };
          setCurrentGesture(detected);
          onGestureRef.current?.(detected);
          setHistory((h) => {
            const entry: HistoryEntry = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              gesture: stableName,
              confidence: matched!.confidence,
              timestamp: Date.now(),
              handedness: matched!.handedness,
            };
            return [entry, ...h].slice(0, 50);
          });
        }
      } else if (hands.length === 0) {
        lastStableRef.current = null;
        setCurrentGesture(null);
      }

      setStats((s) => ({
        ...s,
        fps,
        inferenceMs: Math.round(inferenceMs * 10) / 10,
        latencyMs: Math.round((performance.now() - now + inferenceMs) * 10) / 10,
        handsDetected: hands.length,
      }));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, modelStatus, mirror, sensitivity, inferenceIntervalMs, videoRef]);

  const clearHistory = () => setHistory([]);

  return { currentGesture, history, stats, modelStatus, clearHistory };
}
