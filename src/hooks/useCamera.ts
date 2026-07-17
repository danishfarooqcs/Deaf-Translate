import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface UseCameraOptions {
  deviceId: string | null;
}

interface UseCameraResult {
  videoRef: RefObject<HTMLVideoElement | null>;
  devices: MediaDeviceInfo[];
  ready: boolean;
  error: string | null;
  resolution: string;
  switchDevice: (deviceId: string) => void;
}

export function useCamera({ deviceId }: UseCameraOptions): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState("--");
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(deviceId);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async (preferredDeviceId: string | null) => {
    setError(null);
    try {
      stopStream();
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings();
      if (settings?.width && settings?.height) {
        setResolution(`${settings.width}x${settings.height}`);
      }
      setReady(true);

      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "videoinput"));
    } catch (err) {
      setReady(false);
      setError(
        err instanceof Error
          ? err.message
          : "Camera access was denied or is unavailable."
      );
    }
  }, [stopStream]);

  const switchDevice = useCallback(
    (id: string) => {
      setActiveDeviceId(id);
      startStream(id);
    },
    [startStream]
  );

  // Initial start
  useEffect(() => {
    startStream(activeDeviceId);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume on visibility change (tab switch / mobile sleep recovery)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const track = streamRef.current?.getVideoTracks()[0];
        if (!track || track.readyState !== "live") {
          startStream(activeDeviceId);
        } else if (videoRef.current?.paused) {
          videoRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
    };
  }, [activeDeviceId, startStream]);

  return { videoRef, devices, ready, error, resolution, switchDevice };
}
