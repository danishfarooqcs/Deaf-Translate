import { useEffect, useRef } from "react";
import type { Landmark } from "@/lib/handGestureDetector";
import type { CameraStatus } from "@/lib/useHandTracking";

const CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17],
];

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: Landmark[] | null;
  status: CameraStatus;
}

export function CameraView({ videoRef, landmarks, status }: CameraViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = video.videoWidth || canvas.clientWidth;
    const height = video.videoHeight || canvas.clientHeight;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    ctx.save();
    // Mirror to match the mirrored video preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.strokeStyle = "rgba(70, 224, 196, 0.85)";
    ctx.lineWidth = Math.max(2, canvas.width * 0.003);
    ctx.beginPath();
    for (const [a, b] of CONNECTIONS) {
      const p1 = landmarks[a];
      const p2 = landmarks[b];
      if (!p1 || !p2) continue;
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
    }
    ctx.stroke();

    ctx.fillStyle = "#ffb648";
    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, Math.max(2.5, canvas.width * 0.004), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, [landmarks, videoRef]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[color:var(--line)] bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {status !== "running" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--ink)]/70 backdrop-blur-sm">
          <StatusMessage status={status} />
        </div>
      )}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-[color:var(--muted)]">
        <span
          className={`h-2 w-2 rounded-full ${status === "running" ? "bg-[color:var(--live)]" : "bg-[color:var(--danger)]"}`}
        />
        {status === "running" ? "LIVE" : status.replace(/-/g, " ").toUpperCase()}
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: CameraStatus }) {
  switch (status) {
    case "loading-model":
      return <p className="font-mono text-sm text-[color:var(--muted)]">Loading hand-tracking model…</p>;
    case "requesting-camera":
      return <p className="font-mono text-sm text-[color:var(--muted)]">Requesting camera access…</p>;
    case "permission-denied":
      return (
        <p className="max-w-xs text-center text-sm text-[color:var(--paper)]">
          Camera access was denied. Allow camera permissions for this site in your browser settings, then retry.
        </p>
      );
    case "no-camera":
      return (
        <p className="max-w-xs text-center text-sm text-[color:var(--paper)]">
          No camera was found. Connect a webcam and retry.
        </p>
      );
    case "insecure-context":
      return (
        <p className="max-w-xs text-center text-sm text-[color:var(--paper)]">
          Camera access needs a secure context. Open this app over{" "}
          <span className="font-mono">https://</span> or <span className="font-mono">localhost</span>.
        </p>
      );
    case "unsupported":
      return (
        <p className="max-w-xs text-center text-sm text-[color:var(--paper)]">
          This browser doesn't support camera capture. Try a recent Chrome, Edge, Firefox, or Safari.
        </p>
      );
    case "error":
      return <p className="max-w-xs text-center text-sm text-[color:var(--danger)]">Camera error. See retry button.</p>;
    default:
      return <p className="font-mono text-sm text-[color:var(--muted)]">Starting…</p>;
  }
}
