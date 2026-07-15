import React, { useEffect, useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useSpeech } from '../hooks/useSpeech';
import { Button, GlassCard, Switch, Slider, Select } from '../components/ui';
import { 
  Settings as SettingsIcon, 
  Camera, 
  Volume2, 
  Accessibility, 
  Languages, 
  Keyboard, 
  Cpu, 
  ShieldCheck, 
  RefreshCw,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const {
    cameraSettings,
    setCameraSettings,
    aiSettings,
    setAiSettings,
    voiceSettings,
    setVoiceSettings,
    accessibility,
    setAccessibility,
    addNotification
  } = useAppStore();

  const { voices } = useSpeech();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('default');

  // Enumerate devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        setCameras(devices.filter(d => d.kind === 'videoinput'));
        setMicrophones(devices.filter(d => d.kind === 'audioinput'));
      })
      .catch(err => console.error(err));
  }, []);

  const handleSaveSettings = () => {
    addNotification('Settings Updated', 'Your device configuration has been successfully updated.');
    toast.success('Settings saved successfully!');
  };

  const resolutions = [
    { value: '640x480', label: 'Standard Definition (480p)' },
    { value: '1280x720', label: 'High Definition (720p)' },
    { value: '1920x1080', label: 'Full HD (1080p)' }
  ];

  const languagesList = [
    { value: 'en', label: 'English' },
    { value: 'ur', label: 'Urdu (اردو)' },
    { value: 'hi', label: 'Hindi (हिंदी)' },
    { value: 'ar', label: 'Arabic (العربية)' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'fr', label: 'French (Français)' },
    { value: 'de', label: 'German (Deutsch)' },
    { value: 'zh', label: 'Chinese (中文)' },
    { value: 'ja', label: 'Japanese (日本語)' }
  ];

  const colorBlindOptions = [
    { value: 'none', label: 'None (Standard)' },
    { value: 'protanopia', label: 'Protanopia (Red-Blind)' },
    { value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
    { value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
      
      {/* Title */}
      <GlassCard className="p-4 md:p-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold tracking-wide uppercase">System Settings</h3>
          <p className="text-[10px] text-white/40 mt-0.5">Manage camera inputs, AI calibration parameters, voice engines, and accessibility options.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSaveSettings}>
          Save Configuration
        </Button>
      </GlassCard>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* CAMERA INPUTS */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Camera className="h-4.5 w-4.5 text-secondary-cyan" />
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Webcam Configuration</h4>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60">Active Camera Device</label>
              <Select 
                options={cameras.map(c => ({ value: c.deviceId, label: c.label || 'Webcam ' + c.deviceId.slice(0,5) }))}
                value={cameraSettings.deviceId}
                onChange={(val) => setCameraSettings({ deviceId: val })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60">Target Resolution</label>
              <Select 
                options={resolutions}
                value={cameraSettings.resolution}
                onChange={(val) => setCameraSettings({ resolution: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-white/60 mb-1">
                  <span>Exposure ({cameraSettings.exposure})</span>
                </div>
                <Slider min={0} max={100} value={cameraSettings.exposure} onChange={(v) => setCameraSettings({ exposure: v })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-white/60 mb-1">
                  <span>Brightness ({cameraSettings.brightness}%)</span>
                </div>
                <Slider min={50} max={150} value={cameraSettings.brightness} onChange={(v) => setCameraSettings({ brightness: v })} />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* AUDIO & TEXT TO SPEECH (TTS) */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Volume2 className="h-4.5 w-4.5 text-primary-purple" />
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Voice Synthesis (TTS)</h4>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60">Speech Synthesis Voice</label>
              <Select 
                options={voices.map(v => ({ value: v.name, label: `${v.name} (${v.lang})` }))}
                value={voiceSettings.selectedVoice}
                onChange={(val) => setVoiceSettings({ selectedVoice: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-white/60 mb-1">
                  <span>Volume ({voiceSettings.volume}%)</span>
                </div>
                <Slider min={0} max={100} value={voiceSettings.volume} onChange={(v) => setVoiceSettings({ volume: v })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-white/60 mb-1">
                  <span>Playback Pitch ({voiceSettings.pitch}x)</span>
                </div>
                <Slider min={50} max={150} step={10} value={voiceSettings.pitch * 100} onChange={(v) => setVoiceSettings({ pitch: v / 100 })} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-white/60 mb-1">
                <span>Reading Speed ({voiceSettings.playbackSpeed}x)</span>
              </div>
              <Slider min={50} max={200} step={10} value={voiceSettings.playbackSpeed * 100} onChange={(v) => setVoiceSettings({ playbackSpeed: v / 100 })} />
            </div>
          </div>
        </GlassCard>

        {/* TRANSLATION & LANGUAGE */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Languages className="h-4.5 w-4.5 text-secondary-cyan" />
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Language Translation</h4>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60">Target Translation Output</label>
              <Select 
                options={languagesList}
                value="en"
                onChange={(val) => toast.info(`Translation target language changed.`)}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Auto punctuation</span>
                <span className="text-[10px] text-white/40">Apply question marks and commas in transcription loops.</span>
              </div>
              <Switch checked={true} onChange={() => {}} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Continuous Translation</span>
                <span className="text-[10px] text-white/40">Translate signs dynamically without manual posts.</span>
              </div>
              <Switch checked={aiSettings.enableTranslation} onChange={(v) => setAiSettings({ enableTranslation: v })} />
            </div>
          </div>
        </GlassCard>

        {/* ACCESSIBILITY */}
        <GlassCard className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Accessibility className="h-4.5 w-4.5 text-primary-purple" />
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Accessibility Options</h4>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60">Color Blind Filter Overlay</label>
              <Select 
                options={colorBlindOptions}
                value={accessibility.colorBlindMode}
                onChange={(val) => setAccessibility({ colorBlindMode: val as any })}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">High Contrast Design</span>
                <span className="text-[10px] text-white/40">Enable stark borders and deep black backings.</span>
              </div>
              <Switch checked={accessibility.highContrast} onChange={(v) => setAccessibility({ highContrast: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Large Text Layout</span>
                <span className="text-[10px] text-white/40">Enlarge captions, headers, and description fonts.</span>
              </div>
              <Switch checked={accessibility.largeText} onChange={(v) => setAccessibility({ largeText: v })} />
            </div>
          </div>
        </GlassCard>

        {/* SYSTEM DETAILS & ABOUT */}
        <GlassCard className="lg:col-span-2 p-5 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl h-fit">
              <Cpu className="h-6 w-6 text-white/40" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">Deaf Listener Core Engine</h4>
              <p className="text-[10px] text-white/40 mt-1 max-w-xl leading-relaxed">
                Running MediaPipe HandLandmarker float16 model task via WebAssembly. Custom heuristic joint angle algorithms translate spatial coordinates locally at 60 FPS.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[10px] font-mono text-white/30">
                <span>VERSION: v1.0.0</span>
                <span>•</span>
                <span>DELEGATE: WEBGL/GPU</span>
                <span>•</span>
                <span>WASM BASE: v0.10.8</span>
                <span>•</span>
                <span>LOCAL CACHE: ENABLED</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-success-green font-bold text-[10px] bg-success-green/10 border border-success-green/20 px-3 py-1.5 rounded-xl h-fit justify-center">
              <ShieldCheck className="h-4 w-4" />
              SYSTEM SECURE
            </div>
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
