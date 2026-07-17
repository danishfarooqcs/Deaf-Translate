import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  createWaveTracker,
  updateWaveTracker,
  type Gesture,
  type Landmark,
} from "./handGestureDetector";

// Loaded from a CDN because the wasm/model binaries are large and
// versioned separately from the npm package -- this is the pattern
// MediaPipe's own docs use. Everything still runs locally in the
// browser once fetched; no video frames leave the device.
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type CameraStatus =
  | "idle"
  | "loading-model"
  | "requesting-camera"
  | "running"
  | "no-camera"
  | "permission-denied"
  | "insecure-context"
  | "unsupported"
  | "error";

export interface GestureEvent {
  id: number;
  gesture: Gesture;
  label: string;
  at: number;
}

interface UseHandTrackingResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  landmarks: Landmark[] | null;
  lastGesture: GestureEvent | null;
  history: GestureEvent[];
  retry: () => void;
  clearHistory: () => void;
}

let sharedLandmarkerPromise: Promise<HandLandmarker> | null = null;
function getHandLandmarker(): Promise<HandLandmarker> {
  if (!sharedLandmarkerPromise) {
    sharedLandmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then((vision) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      }),
    );
  }
  return sharedLandmarkerPromise;
}

export function useHandTracking(onGesture?: (event: GestureEvent) => void): UseHandTrackingResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const trackerRef = useRef(createWaveTracker());
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const idCounter = useRef(0);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [history, setHistory] = useState<GestureEvent[]>([]);
  const [attempt, setAttempt] = useState(0);

  const stopStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastGesture(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function start() {
      setErrorMessage(null);

      if (!window.isSecureContext) {
        setStatus("insecure-context");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }

      try {
        setStatus("loading-model");
        landmarkerRef.current = await getHandLandmarker();
        if (!mountedRef.current) return;

        setStatus("requesting-camera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) return resolve();
          video.onloadedmetadata = () => resolve();
        });
        await video.play();

        if (!mountedRef.current) return;
        setStatus("running");
        loop();
      } catch (err) {
        if (!mountedRef.current) return;
        const domErr = err as DOMException;
        if (domErr?.name === "NotAllowedError" || domErr?.name === "SecurityError") {
          setStatus("permission-denied");
        } else if (domErr?.name === "NotFoundError" || domErr?.name === "OverconstrainedError") {
          setStatus("no-camera");
        } else {
          setStatus("error");
          setErrorMessage(domErr?.message ?? "Something went wrong starting the camera.");
        }
      }
    }

    function loop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      let result: HandLandmarkerResult | null = null;
      try {
        result = landmarker.detectForVideo(video, performance.now());
      } catch {
        // Skip a corrupt frame rather than crashing the loop.
      }

      const hand = result?.landmarks?.[0] ?? null;
      setLandmarks(hand as Landmark[] | null);

      const now = performance.now();
      const event = updateWaveTracker(trackerRef.current, hand as Landmark[] | null, now);
      if (event) {
        const gestureEvent: GestureEvent = {
          id: ++idCounter.current,
          gesture: event.gesture,
          label: event.label,
          at: Date.now(),
        };
        setLastGesture(gestureEvent);
        setHistory((prev) => [gestureEvent, ...prev].slice(0, 12));
        onGesture?.(gestureEvent);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    const videoEl = videoRef.current;

    return () => {
      mountedRef.current = false;
      stopStream();
      if (videoEl) videoEl.srcObject = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, stopStream]);

  return { videoRef, status, errorMessage, landmarks, lastGesture, history, retry, clearHistory };
}
