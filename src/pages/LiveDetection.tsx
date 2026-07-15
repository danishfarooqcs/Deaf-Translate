import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import { useSpeech } from '../hooks/useSpeech';
import { detectGesture, Landmark } from '../utils/gestureEngine';
import { Button, GlassCard, Slider, Switch, Select, Progress } from '../components/ui';
import { 
  Play, 
  Pause, 
  Maximize2, 
  Camera, 
  Video, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Undo2, 
  Redo2, 
  Plus, 
  Check, 
  Trash2, 
  Download, 
  Sparkles,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LiveDetection: React.FC = () => {
  const {
    cameraSettings,
    setCameraSettings,
    aiSettings,
    setAiSettings,
    messages,
    addMessage,
    currentSentence,
    appendWordToSentence,
    undoSentence,
    redoSentence,
    clearSentence,
    setPerformance,
    performance: perfMetrics,
    unlockBadge,
    addXp
  } = useAppStore();

  const { isLoading: isModelLoading, progress: modelProgress, error: modelError, detectFrame, retry, isModelLoaded } = useHandLandmarker();
  const { speak, isSpeaking } = useSpeech();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('Analyzing...');
  const [gestureConf, setGestureConf] = useState<number>(0);
  const [gestureReasoning, setGestureReasoning] = useState<string>('No hand in frame');
  
  // Registration and smoothing state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const currentHoldSignRef = useRef<string | null>(null);
  const lastRegisteredSignRef = useRef<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Load available cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && cameraSettings.deviceId === 'default') {
          setCameraSettings({ deviceId: videoDevices[0].deviceId });
        }
      })
      .catch(err => console.error('Failed to list video devices:', err));
  }, [cameraSettings.deviceId, setCameraSettings]);

  // Setup webcam stream
  const startCamera = useCallback(async () => {
    if (!isCameraActive) return;

    setStreamError(null);
    try {
      const [width, height] = cameraSettings.resolution.split('x').map(Number);
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: cameraSettings.deviceId !== 'default' ? { exact: cameraSettings.deviceId } : undefined,
          width: { ideal: width || 1280 },
          height: { ideal: height || 720 },
          frameRate: { ideal: aiSettings.detectionSpeed }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera stream access failed:', err);
      setStreamError('Permission denied or camera is in use by another app.');
      setIsCameraActive(false);
    }
  }, [isCameraActive, cameraSettings.deviceId, cameraSettings.resolution, aiSettings.detectionSpeed]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCameraStream();
    };
  }, [startCamera]);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Toggle Camera Active state
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCameraStream();
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
    }
  };

  // Inference Loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isModelLoaded || !isCameraActive) return;

    let localFps = 0;
    let lastFpsUpdateTime = performance.now();
    let frameCount = 0;

    const processFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Match canvas dims to video
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

        // Perform frame analysis
        const result = detectFrame(video, performance.now());
        
        // Performance profiling (FPS)
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdateTime >= 1000) {
          localFps = Math.round((frameCount * 1000) / (now - lastFpsUpdateTime));
          setPerformance({ fps: localFps });
          frameCount = 0;
          lastFpsUpdateTime = now;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result && result.landmarks && result.landmarks.length > 0) {
            const landmarks: Landmark[] = result.landmarks[0]; // analyze primary hand

            // Run gesture recognition
            const gesture = detectGesture(landmarks);
            
            // Check confidence threshold
            if (gesture.confidence >= aiSettings.confidenceThreshold && gesture.sign !== 'Analyzing...') {
              setLastGesture(gesture.sign);
              setGestureConf(gesture.confidence);
              setGestureReasoning(gesture.reasoning);

              // Handle sign registration hold timer
              if (currentHoldSignRef.current === gesture.sign) {
                const elapsed = holdTimerRef.current ? (performance.now() - holdTimerRef.current) : 0;
                const pct = Math.min((elapsed / aiSettings.debounceMs) * 100, 100);
                setHoldProgress(pct);

                if (pct >= 100 && lastRegisteredSignRef.current !== gesture.sign) {
                  // Register Word
                  appendWordToSentence(gesture.sign);
                  lastRegisteredSignRef.current = gesture.sign;
                  
                  // Unlock Badges/Achievements
                  unlockBadge('first_sign');
                  addXp(35);
                  if (gesture.confidence >= 95) {
                    unlockBadge('perfect_match');
                    addXp(50);
                  }

                  if (aiSettings.enableAutoSpeak) {
                    speak(gesture.sign);
                  }
                }
              } else {
                currentHoldSignRef.current = gesture.sign;
                holdTimerRef.current = performance.now();
                setHoldProgress(0);
              }
            } else {
              // Not meeting confidence threshold
              setLastGesture('Analyzing...');
              setGestureConf(0);
              setGestureReasoning('Hands moving or low confidence');
              currentHoldSignRef.current = null;
              holdTimerRef.current = null;
              setHoldProgress(0);
            }

            // Draw Skeleton Landmarks if allowed
            if (aiSettings.showSkeleton && aiSettings.enableLandmarks) {
              const connections = [
                [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
                [0, 5], [5, 6], [6, 7], [7, 8], // Index
                [0, 9], [9, 10], [10, 11], [11, 12], // Middle
                [0, 13], [13, 14], [14, 15], [15, 16], // Ring
                [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
                [5, 9], [9, 13], [13, 17] // Palm MCP base connection
              ];

              // Draw bones (lines)
              ctx.strokeStyle = '#00E5FF';
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              connections.forEach(([i1, i2]) => {
                const p1 = landmarks[i1];
                const p2 = landmarks[i2];
                ctx.beginPath();
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                ctx.stroke();
              });

              // Draw joints (dots)
              landmarks.forEach((p, idx) => {
                ctx.fillStyle = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20 ? '#7C4DFF' : '#00E5FF';
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, 2 * Math.PI);
                ctx.fill();

                // Small glow ring for tips
                if (idx === 8 || idx === 12 || idx === 16 || idx === 20) {
                  ctx.strokeStyle = 'rgba(124, 77, 255, 0.4)';
                  ctx.lineWidth = 4;
                  ctx.stroke();
                }
              });

              // Draw Bounding Box
              const xs = landmarks.map(l => l.x * canvas.width);
              const ys = landmarks.map(l => l.y * canvas.height);
              const minX = Math.min(...xs) - 20;
              const maxX = Math.max(...xs) + 20;
              const minY = Math.min(...ys) - 20;
              const maxY = Math.max(...ys) + 20;

              ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
              ctx.lineWidth = 1;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
              ctx.setLineDash([]);
            }
          } else {
            // No hand detected
            setLastGesture('No Hand');
            setGestureConf(0);
            setGestureReasoning('Align hand in video boundary');
            currentHoldSignRef.current = null;
            holdTimerRef.current = null;
            setHoldProgress(0);
            lastRegisteredSignRef.current = null;
          }
        }
      }

      if (isCameraActive) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isCameraActive, isModelLoaded, detectFrame, setPerformance, aiSettings, appendWordToSentence, unlockBadge, addXp, speak]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!cameraContainerRef.current) return;
    if (!document.fullscreenElement) {
      cameraContainerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error(err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Take screenshot
  const takeScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      // Draw frame
      ctx.drawImage(video, 0, 0);
      
      // Draw skeleton layer if showing
      if (canvasRef.current && aiSettings.showSkeleton) {
        ctx.drawImage(canvasRef.current, 0, 0);
      }

      const imgUrl = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = `asl-screenshot-${Date.now()}.png`;
      link.click();
    }
  };

  // Video recording
  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `asl-translation-session-${Date.now()}.webm`;
        link.click();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Text-To-Speech Playback
  const handleSpeakSentence = () => {
    if (currentSentence) {
      speak(currentSentence);
    }
  };

  // Add constructed sentence to chat
  const handleAddSentenceToChat = () => {
    if (!currentSentence.trim()) return;
    addMessage({
      sender: 'user',
      text: currentSentence,
      type: 'sign',
      confidence: gestureConf || 90,
      reasoning: `AI translation from manual sign stream.`
    });
    
    // Check if Wordsmith badge is earned
    const words = currentSentence.trim().split(/\s+/);
    if (words.length >= 5) {
      unlockBadge('word_smith');
      addXp(75);
    }

    clearSentence();
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-0">
      
      {/* LEFT COLUMN: Camera workspace (70% - 7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
        
        {/* Model Loading Screen */}
        <AnimatePresence>
          {isModelLoading && (
            <motion.div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/95 backdrop-blur-lg p-6"
              exit={{ opacity: 0 }}
            >
              <GlassCard className="w-full max-w-md p-8 border border-primary-purple/40 text-center relative overflow-hidden">
                <div className="absolute inset-[-100%] bg-gradient-to-r from-primary-purple/10 via-secondary-cyan/10 to-transparent animate-spin-slow pointer-events-none" />
                <Sparkles className="h-10 w-10 text-secondary-cyan mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-extrabold text-white tracking-wide">Downloading AI Engine</h3>
                <p className="text-xs text-white/50 mt-2 mb-6 leading-relaxed">
                  Initializing WebAssembly hand landmarking models. This download occurs once and is stored in browser cache.
                </p>
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-white/40 mb-1">
                    <span>LOADING CORE WEIGHTS</span>
                    <span>{modelProgress}%</span>
                  </div>
                  <Progress value={modelProgress} color="secondary" />
                </div>
                <div className="text-[10px] font-mono text-white/30 animate-pulse">
                  FILES: hand_landmarker.task (12.4 MB)
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Feed Card */}
        <div ref={cameraContainerRef} className="relative flex-1 bg-card-dark rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center group min-h-[350px]">
          
          {/* Webcam Element */}
          {isCameraActive && !streamError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ filter: `brightness(${cameraSettings.brightness}%) contrast(105%)`, transform: cameraSettings.mirror ? 'scaleX(-1)' : 'none' }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-8 z-10">
              <div className="bg-white/5 p-4 rounded-full border border-white/10">
                <Camera className="h-8 w-8 text-white/30" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Camera is Offline</h4>
                <p className="text-xs text-white/50 mt-1 max-w-xs">
                  {streamError || 'Click Start Camera below to enable gesture recognition tracking.'}
                </p>
              </div>
              <Button onClick={handleToggleCamera} size="sm" variant="secondary" className="mt-2">
                Start Camera Feed
              </Button>
            </div>
          )}

          {/* Skeletons Canvas Overlay */}
          <canvas
            ref={canvasRef}
            style={{ transform: cameraSettings.mirror ? 'scaleX(-1)' : 'none' }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          />

          {/* TOP INFO HUD */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
            {/* Predicted Sign Banner */}
            <div className="pointer-events-auto">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                {/* Confidence ring */}
                <div className="relative h-8 w-8 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="16" cy="16" r="14" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="16" cy="16" r="14" fill="transparent" stroke={lastGesture === 'Analyzing...' ? '#7C4DFF' : '#00E5FF'} strokeWidth="3" 
                      strokeDasharray={2 * Math.PI * 14} 
                      strokeDashoffset={2 * Math.PI * 14 * (1 - gestureConf / 100)} 
                      className="transition-all duration-300"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-mono font-bold text-white">{gestureConf}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/40 tracking-wider">CURRENT GESTURE</span>
                  <span className="text-base font-extrabold tracking-wide text-white uppercase">{lastGesture}</span>
                </div>
              </div>
            </div>

            {/* Debounce / Registration indicator */}
            {holdProgress > 0 && holdProgress < 100 && (
              <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-auto">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-purple" style={{ width: `${holdProgress}%` }} />
                </div>
                <span className="text-[8px] font-bold font-mono text-primary-purple">HOLDING SIGN...</span>
              </div>
            )}

            {/* Video Stats */}
            <div className="flex flex-col gap-1 items-end">
              <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-mono text-white/70">
                RESOLUTION: {cameraSettings.resolution}
              </div>
              <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-mono text-white/70">
                INFERENCE: {perfMetrics.inferenceTime}ms
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS HUD */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 rounded-2xl border border-white/5 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleToggleCamera} className="bg-black/40">
                {isCameraActive ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                {isCameraActive ? 'Pause' : 'Resume'}
              </Button>
              <Button size="sm" variant="secondary" onClick={takeScreenshot} className="bg-black/40">
                <Camera className="h-4 w-4 mr-1.5" />
                Snapshot
              </Button>
              <Button 
                size="sm" 
                variant={isRecording ? 'danger' : 'secondary'} 
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? '' : 'bg-black/40'}
              >
                <Video className="h-4 w-4 mr-1.5 animate-pulse" />
                {isRecording ? 'Recording...' : 'Record Session'}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="icon" variant="secondary" onClick={toggleFullscreen} className="bg-black/40">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* SLIDERS & CONFIG PANEL */}
        <GlassCard className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-white/70">
              <span>Confidence Threshold</span>
              <span className="text-secondary-cyan font-mono">{aiSettings.confidenceThreshold}%</span>
            </div>
            <Slider 
              min={50} 
              max={95} 
              value={aiSettings.confidenceThreshold} 
              onChange={(v) => setAiSettings({ confidenceThreshold: v })} 
            />
            <span className="text-[10px] text-white/40 leading-normal">Ignore predictions matching less than this confidence coefficient.</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-white/70">
              <span>Registration Debounce</span>
              <span className="text-primary-purple font-mono">{aiSettings.debounceMs}ms</span>
            </div>
            <Slider 
              min={300} 
              max={2000} 
              step={100}
              value={aiSettings.debounceMs} 
              onChange={(v) => setAiSettings({ debounceMs: v })} 
            />
            <span className="text-[10px] text-white/40 leading-normal">Hold time required for a sign to be registered into the builder.</span>
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <div className="flex items-center justify-between">
              <label htmlFor="mirror-toggle" className="text-xs font-bold text-white/70 cursor-pointer">Mirror Camera Stream</label>
              <Switch 
                id="mirror-toggle"
                checked={cameraSettings.mirror} 
                onChange={(v) => setCameraSettings({ mirror: v })} 
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="skeleton-toggle" className="text-xs font-bold text-white/70 cursor-pointer">Draw Skeleton Overlay</label>
              <Switch 
                id="skeleton-toggle"
                checked={aiSettings.showSkeleton} 
                onChange={(v) => setAiSettings({ showSkeleton: v })} 
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="voice-toggle" className="text-xs font-bold text-white/70 cursor-pointer">Auto Voicing (Speech Synthesis)</label>
              <Switch 
                id="voice-toggle"
                checked={aiSettings.enableAutoSpeak} 
                onChange={(v) => setAiSettings({ enableAutoSpeak: v })} 
              />
            </div>
          </div>
        </GlassCard>

      </div>

      {/* RIGHT COLUMN: Conversation Panel (30% - 3 cols) */}
      <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 bg-card-dark/45 border border-white/5 rounded-3xl p-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-secondary-cyan" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase">Sentence Builder</h3>
          </div>
          <div className="flex gap-1.5">
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={undoSentence} title="Undo">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={redoSentence} title="Redo">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-danger-red hover:bg-danger-red/10 rounded-lg" onClick={clearSentence} title="Clear">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Translation Builder Interface */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* Live Translation output */}
          <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[150px]">
            <div className="overflow-y-auto max-h-40 text-sm font-medium leading-relaxed text-white/90">
              {currentSentence ? (
                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{currentSentence}</span>
              ) : (
                <span className="text-white/20 italic font-normal">Signs will assemble here as you hold them...</span>
              )}
            </div>
            
            {/* Build Helpers */}
            <div className="flex gap-2 border-t border-white/5 pt-3 mt-3">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => appendWordToSentence(' ')}>
                Space
              </Button>
              <Button size="sm" variant="secondary" className="px-2" onClick={handleSpeakSentence} disabled={!currentSentence} title="Voice sentence">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="primary" className="flex-1" onClick={handleAddSentenceToChat} disabled={!currentSentence.trim()}>
                Post Chat
              </Button>
            </div>
          </div>

          {/* Quick Signs panel */}
          <div>
            <span className="text-[10px] font-bold text-white/40 tracking-wider block mb-2">QUICK CONTROLS</span>
            <div className="flex flex-wrap gap-1.5">
              {['Hello', 'Please', 'Thank You', 'Yes', 'No', 'I Love You'].map((word) => (
                <button
                  key={word}
                  onClick={() => appendWordToSentence(word)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  +{word}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Stream History list */}
          <div className="flex flex-col min-h-0 flex-1">
            <span className="text-[10px] font-bold text-white/40 tracking-wider block mb-2 uppercase">Chat History</span>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/30 font-medium">
                  Chat stream is empty
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSys = msg.sender === 'system';

                  if (isSys) {
                    return (
                      <div key={msg.id} className="text-center py-1">
                        <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[9px] text-white/40 font-mono uppercase tracking-wider">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div 
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isUser 
                            ? 'bg-gradient-to-br from-primary-purple to-indigo-900 border border-primary-purple/30 text-white rounded-br-none' 
                            : 'bg-white/5 border border-white/5 text-white/80 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      
                      {/* Telemetry info */}
                      {msg.confidence && (
                        <div className="flex items-center gap-1.5 text-[8px] font-mono text-white/30 px-1 select-none">
                          <span>Conf: {msg.confidence}%</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
