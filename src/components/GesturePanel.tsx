import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Check, Copy, Hand, Trash2, Volume2, VolumeX } from "lucide-react";
import type { GestureEvent } from "@/lib/useHandTracking";
import { GESTURE_LABELS, type Gesture } from "@/lib/handGestureDetector";

const GESTURE_ORDER: Gesture[] = [
  "hi",
  "bye",
  "thumbs_up",
  "thumbs_down",
  "open_palm",
  "fist",
  "peace",
  "ok",
  "pointing",
  "call_me",
  "love_you",
];

interface GesturePanelProps {
  lastGesture: GestureEvent | null;
  history: GestureEvent[];
  muted: boolean;
  onToggleMute: () => void;
  onClearHistory: () => void;
}

export function GesturePanel({ lastGesture, history, muted, onToggleMute, onClearHistory }: GesturePanelProps) {
  const [copied, setCopied] = useState(false);

  const transcript = history
    .slice()
    .reverse()
    .map((event) => `${new Date(event.at).toLocaleTimeString()}  ${event.label}`)
    .join("\n");

  const handleCopy = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions can be denied; fail quietly, the text is
      // still visible and selectable in the tab.
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
            Detected sign
          </span>
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--paper)]"
            aria-pressed={muted}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {muted ? "Muted" : "Speaking"}
          </button>
        </div>

        {lastGesture ? (
          <div key={lastGesture.id} className="animate-[pulse-in_0.3s_ease-out]">
            <p className="text-4xl font-semibold leading-tight text-[color:var(--paper)]">{lastGesture.label}</p>
            <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
              {new Date(lastGesture.at).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2 text-[color:var(--muted)]">
            <Hand size={28} />
            <p className="text-sm">Show a hand to the camera to begin.</p>
          </div>
        )}
      </div>

      <Tabs.Root defaultValue="signs" className="flex min-h-0 flex-1 flex-col gap-3">
        <Tabs.List className="flex gap-1 rounded-full border border-[color:var(--line)] bg-[color:var(--panel)] p-1">
          <Tabs.Trigger
            value="signs"
            className="flex-1 rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-[color:var(--muted)] transition data-[state=active]:bg-[color:var(--signal)] data-[state=active]:text-[color:var(--ink)]"
          >
            Signs
          </Tabs.Trigger>
          <Tabs.Trigger
            value="output"
            className="flex-1 rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-[color:var(--muted)] transition data-[state=active]:bg-[color:var(--signal)] data-[state=active]:text-[color:var(--ink)]"
          >
            Output
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content
          value="signs"
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
            Recognized signs
          </span>
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {GESTURE_ORDER.map((g) => (
              <li
                key={g}
                className="flex items-center justify-between rounded-lg border border-[color:var(--line)] bg-[color:var(--panel-raised)] px-3 py-2 text-sm text-[color:var(--paper)]"
              >
                <span>{GESTURE_LABELS[g]}</span>
              </li>
            ))}
          </ul>
        </Tabs.Content>

        <Tabs.Content
          value="output"
          className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--muted)]">
              Output transcript
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!transcript}
                className="flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--paper)] disabled:opacity-40"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={onClearHistory}
                disabled={!transcript}
                className="flex items-center gap-1 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--danger)] disabled:opacity-40"
              >
                <Trash2 size={13} />
                Clear
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Recognized signs will appear here as spoken text.</p>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-[color:var(--paper)]">
                {transcript}
              </pre>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
