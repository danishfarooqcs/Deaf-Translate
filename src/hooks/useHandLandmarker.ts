import { useEffect, useState, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { useAppStore } from './useAppStore';

let globalHandLandmarker: HandLandmarker | null = null;
let modelLoadingPromise: Promise<HandLandmarker> | null = null;

export function useHandLandmarker() {
  const [isLoading, setIsLoading] = useState(!globalHandLandmarker);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const setPerformance = useAppStore((state) => state.setPerformance);
  const aiSettings = useAppStore((state) => state.aiSettings);
  
  const activeRequestRef = useRef<number | null>(null);

  const loadModel = useCallback(async (): Promise<HandLandmarker> => {
    if (globalHandLandmarker) {
      setIsLoading(false);
      setProgress(100);
      return globalHandLandmarker;
    }

    if (modelLoadingPromise) {
      return modelLoadingPromise;
    }

    setIsLoading(true);
    setError(null);
    setProgress(10);

    modelLoadingPromise = (async () => {
      try {
        setProgress(30);
        // Resolve Fileset WASM binaries from jsdelivr
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );
        
        setProgress(60);
        
        // Instantiate HandLandmarker with float16 tasks model asset path
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        globalHandLandmarker = landmarker;
        setProgress(100);
        setIsLoading(false);
        return landmarker;
      } catch (err: any) {
        console.error('Failed to load MediaPipe HandLandmarker:', err);
        setError(err.message || 'Failed to download MediaPipe models. Check your network connection.');
        setIsLoading(false);
        modelLoadingPromise = null;
        throw err;
      }
    })();

    return modelLoadingPromise;
  }, []);

  // Pre-load the model on mount
  useEffect(() => {
    loadModel().catch(() => {});
  }, [loadModel]);

  const detectFrame = useCallback((
    videoElement: HTMLVideoElement,
    timestamp: number
  ): HandLandmarkerResult | null => {
    if (!globalHandLandmarker) return null;

    try {
      const startTime = performance.now();
      
      // Run inference
      const result = globalHandLandmarker.detectForVideo(videoElement, timestamp);
      
      const endTime = performance.now();
      const inferenceTime = Math.round(endTime - startTime);
      
      // Update performance stats in Zustand
      setPerformance({
        inferenceTime,
        latency: inferenceTime + 4, // Estimate frame render overhead
        gpuStatus: 'active',
      });

      return result;
    } catch (err) {
      console.error('Frame inference error:', err);
      return null;
    }
  }, [setPerformance]);

  const retry = useCallback(() => {
    globalHandLandmarker = null;
    modelLoadingPromise = null;
    loadModel().catch(() => {});
  }, [loadModel]);

  return {
    isLoading,
    progress,
    error,
    detectFrame,
    retry,
    isModelLoaded: !!globalHandLandmarker,
  };
}
