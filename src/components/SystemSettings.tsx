import { useEffect, useState } from "react";
import { Monitor, Camera, Sliders, Volume2 } from "lucide-react";
import type { AppSettings } from "../types";

interface SystemSettingsProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div className={`toggle${on ? " on" : ""}`} onClick={onClick} role="switch" aria-checked={on}>
      <div className="toggle-knob" />
    </div>
  );
}

export default function SystemSettings({ settings, onChange }: SystemSettingsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      const load = () => setVoices(window.speechSynthesis.getVoices());
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((list) => setDevices(list.filter((d) => d.kind === "videoinput")))
      .catch(() => {});
  }, []);

  const update = (patch: Partial<AppSettings>) => onChange({ ...settings, ...patch });
  const updateSpeech = (patch: Partial<AppSettings["speech"]>) =>
    onChange({ ...settings, speech: { ...settings.speech, ...patch } });

  return (
    <div className="section-wrap">
      <div className="section-title-row">
        <div>
          <div className="section-title">System Settings</div>
          <div className="section-subtitle">Tune detection, camera, and voice output.</div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>
            <Monitor /> Appearance
          </h3>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Dark theme</div>
              <div className="settings-row-sub">Switch between dark and light UI</div>
            </div>
            <Toggle
              on={settings.theme === "dark"}
              onClick={() => update({ theme: settings.theme === "dark" ? "light" : "dark" })}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Mirror camera feed</div>
              <div className="settings-row-sub">Flip preview horizontally, like a mirror</div>
            </div>
            <Toggle on={settings.mirrorCamera} onClick={() => update({ mirrorCamera: !settings.mirrorCamera })} />
          </div>
        </div>

        <div className="settings-card">
          <h3>
            <Camera /> Camera Source
          </h3>
          <div className="settings-row">
            <div className="settings-row-label">Active device</div>
            <select
              value={settings.cameraDeviceId ?? ""}
              onChange={(e) => update({ cameraDeviceId: e.target.value || null })}
            >
              <option value="">System default</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row-sub">
            Devices only show labels after camera permission has been granted at least once.
          </div>
        </div>

        <div className="settings-card">
          <h3>
            <Sliders /> Detection Tuning
          </h3>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Gesture stability sensitivity</div>
              <div className="settings-row-sub">Higher = locks onto a gesture faster, more flicker-prone</div>
            </div>
            <input
              className="slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sensitivity}
              onChange={(e) => update({ sensitivity: Number(e.target.value) })}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Inference interval</div>
              <div className="settings-row-sub">{settings.inferenceIntervalMs}ms between model passes</div>
            </div>
            <input
              className="slider"
              type="range"
              min={30}
              max={250}
              step={10}
              value={settings.inferenceIntervalMs}
              onChange={(e) => update({ inferenceIntervalMs: Number(e.target.value) })}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">FPS cap</div>
              <div className="settings-row-sub">Throttle rendering loop, saves battery</div>
            </div>
            <input
              className="slider"
              type="range"
              min={10}
              max={60}
              step={5}
              value={settings.fpsCap}
              onChange={(e) => update({ fpsCap: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3>
            <Volume2 /> Voice Output
          </h3>
          <div className="settings-row">
            <div className="settings-row-label">Speak recognized gestures</div>
            <Toggle on={settings.speech.enabled} onClick={() => updateSpeech({ enabled: !settings.speech.enabled })} />
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Voice</div>
            <select
              value={settings.speech.voiceURI ?? ""}
              onChange={(e) => updateSpeech({ voiceURI: e.target.value || null })}
            >
              <option value="">System default</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Volume</div>
            <input
              className="slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.speech.volume}
              onChange={(e) => updateSpeech({ volume: Number(e.target.value) })}
            />
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Speaking rate</div>
            <input
              className="slider"
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.speech.rate}
              onChange={(e) => updateSpeech({ rate: Number(e.target.value) })}
            />
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Re-announce held gestures</div>
            <Toggle
              on={settings.speech.repeatHeldGestures}
              onClick={() => updateSpeech({ repeatHeldGestures: !settings.speech.repeatHeldGestures })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
