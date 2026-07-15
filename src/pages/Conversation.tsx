import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useSpeech } from '../hooks/useSpeech';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import { detectGesture, Landmark } from '../utils/gestureEngine';
import { Button, GlassCard, Switch, Slider } from '../components/ui';
import { 
  Mic, 
  MicOff, 
  Send, 
  Share2, 
  Volume2, 
  Trash2, 
  Copy, 
  Sparkles,
  Check, 
  Hand,
  VolumeX
} from 'lucide-react';

export const Conversation: React.FC = () => {
  const { 
    messages, 
    addMessage, 
    clearHistory, 
    cameraSettings, 
    aiSettings,
    unlockBadge,
    addXp
  } = useAppStore();

  const { speak, isSpeaking, isListening, startListening, stopListening } = useSpeech();
  const { isModelLoaded, detectFrame } = useHandLandmarker();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState('Analyzing...');
  
  // Registration and hold thresholds
  const [holdWord, setHoldWord] = useState<string | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup webcam stream for sign transcription
  const startCamera = async () => {
    setStreamError(null);
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setStreamError('Could not access camera for conversation translation.');
    }
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraActive]);

  // Inference loop for gesture parsing inside the Conversation
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isModelLoaded || !cameraActive) return;

    let animFrameId: number;

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

        const result = detectFrame(video, performance.now());
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result && result.landmarks && result.landmarks.length > 0) {
          const landmarks: Landmark[] = result.landmarks[0];
          const gesture = detectGesture(landmarks);

          if (gesture.confidence >= aiSettings.confidenceThreshold && gesture.sign !== 'Analyzing...') {
            setCurrentGesture(gesture.sign);

            // Frame debouncer
            if (holdWord === gesture.sign) {
              const elapsed = holdTimerRef.current ? (performance.now() - holdTimerRef.current) : 0;
              if (elapsed >= aiSettings.debounceMs) {
                // Post to chat automatically
                addMessage({
                  sender: 'user',
                  text: gesture.sign,
                  type: 'sign',
                  confidence: gesture.confidence,
                  reasoning: gesture.reasoning
                });
                
                unlockBadge('chat_pro');
                addXp(30);

                if (aiSettings.enableAutoSpeak) {
                  speak(gesture.sign);
                }

                // Reset hold state to avoid spamming the same sign
                setHoldWord(null);
                holdTimerRef.current = null;
              }
            } else {
              setHoldWord(gesture.sign);
              holdTimerRef.current = performance.now();
            }
          } else {
            setCurrentGesture('Analyzing...');
            setHoldWord(null);
            holdTimerRef.current = null;
          }

          // Draw minimalist tracking dot overlays
          if (ctx && aiSettings.showSkeleton && aiSettings.enableLandmarks) {
            landmarks.forEach((p) => {
              ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
              ctx.beginPath();
              ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        } else {
          setCurrentGesture('No hand detected');
          setHoldWord(null);
          holdTimerRef.current = null;
        }
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [cameraActive, isModelLoaded, detectFrame, holdWord, aiSettings, addMessage, speak, unlockBadge, addXp]);

  // STT Microphone Toggle
  const handleMicrophoneToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(
        (transcript) => {
          // Hearing person speech added
          addMessage({
            sender: 'partner',
            text: transcript,
            type: 'speech',
            confidence: 98,
            reasoning: 'Transcribed from voice microphone stream.'
          });
          unlockBadge('chat_pro');
          addXp(40);
        },
        () => {}
      );
    }
  };

  // Keyboard manual send
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage({
      sender: 'partner',
      text: inputText,
      type: 'speech',
      confidence: 100,
      reasoning: 'Typed manually by dialogue companion.'
    });
    
    if (aiSettings.enableAutoSpeak) {
      speak(inputText);
    }
    
    setInputText('');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatHistory = () => {
    const textData = messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.text} (${m.type})`)
      .join('\n');
    
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asl-chat-transcript-${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-0">
      
      {/* LEFT COLUMN: Local webcam feed (30% - 3 cols) */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <GlassCard className="flex flex-col gap-4 overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/70">Sign capture feed</span>
            <Switch checked={cameraActive} onChange={setCameraActive} />
          </div>

          <div className="relative aspect-video bg-black/50 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">
            {cameraActive && !streamError ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scaleX(-1)" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover transform scaleX(-1) pointer-events-none" />
              </>
            ) : (
              <div className="text-xs text-white/40">Camera is paused</div>
            )}

            <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm px-3 py-1.5 border border-white/10 rounded-xl flex items-center justify-between text-[10px]">
              <span className="font-bold text-white/40">SIGN:</span>
              <span className="font-extrabold text-secondary-cyan uppercase">{currentGesture}</span>
            </div>
          </div>

          <div className="text-xs text-white/50 leading-relaxed p-1 bg-white/5 border border-white/5 rounded-xl">
            <div className="font-bold text-white/70 mb-1 flex items-center gap-1.5">
              <Hand className="h-3.5 w-3.5 text-primary-purple" />
              How it works
            </div>
            Sign letters or phrases into your camera. The model translates your posture and pushes it automatically into the chat bubble stream.
          </div>
        </GlassCard>
      </div>

      {/* RIGHT COLUMN: Dialogue transcript chat area (70% - 7 cols) */}
      <div className="lg:col-span-7 flex flex-col bg-card-dark border border-white/5 rounded-3xl p-4 md:p-6 min-h-0">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold tracking-wide uppercase">Dialogue Transcription</h3>
            <p className="text-[10px] text-white/40 mt-0.5">Realtime speech transcribing and sign overlays.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={exportChatHistory}>
              <Share2 className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button size="sm" variant="outline" className="text-danger-red border-danger-red/20 hover:bg-danger-red/10" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear Log
            </Button>
          </div>
        </div>

        {/* Chat message space */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 mb-4 min-h-[300px]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSys = msg.sender === 'system';

            if (isSys) {
              return (
                <div key={msg.id} className="text-center">
                  <span className="px-3 py-1.5 bg-white/5 rounded-xl text-[9px] font-mono text-white/40 uppercase tracking-widest">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                {/* Avatar dot */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold border shadow-lg shrink-0 ${
                  isUser 
                    ? 'bg-primary-purple/10 border-primary-purple/40 text-primary-purple' 
                    : 'bg-secondary-cyan/10 border-secondary-cyan/40 text-secondary-cyan'
                }`}>
                  {isUser ? 'S' : 'H'}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                    isUser 
                      ? 'bg-gradient-to-br from-primary-purple to-indigo-950 border border-primary-purple/35 text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Bubble details */}
                  <div className={`flex items-center gap-2 px-1 text-[8px] font-mono text-white/35 ${isUser ? 'justify-end' : ''}`}>
                    <span className="capitalize">{msg.sender} ({msg.type})</span>
                    <span>•</span>
                    {msg.confidence && <span>Conf: {msg.confidence}%</span>}
                    <span>•</span>
                    <button 
                      onClick={() => handleCopyText(msg.id, msg.text)} 
                      className="hover:text-white cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="h-3 w-3 text-success-green" /> : <Copy className="h-3 w-3" />}
                    </button>
                    {msg.type === 'speech' && (
                      <button onClick={() => speak(msg.text)} className="hover:text-white cursor-pointer">
                        <Volume2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input box bottom */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-2xl">
          
          {/* Microphone Capture button */}
          <Button 
            variant={isListening ? 'danger' : 'secondary'} 
            onClick={handleMicrophoneToggle} 
            className="rounded-xl h-12 w-12 shrink-0 p-0"
            title={isListening ? 'Stop listening' : 'Start microphone listen'}
          >
            {isListening ? (
              <MicOff className="h-5 w-5 animate-pulse text-white" />
            ) : (
              <Mic className="h-5 w-5 text-secondary-cyan" />
            )}
          </Button>

          {/* Text entry field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? 'Microphone capturing speech...' : 'Type response to speak out loud...'}
            disabled={isListening}
            className="flex-1 bg-transparent border-0 px-3 text-sm text-white focus:outline-none focus:ring-0 placeholder-white/20 disabled:opacity-40"
          />

          {/* Send */}
          <Button 
            variant="primary" 
            onClick={handleSendMessage} 
            disabled={!inputText.trim() || isListening} 
            className="rounded-xl h-12 px-5 shrink-0"
          >
            <Send className="h-4.5 w-4.5 mr-1" />
            Send
          </Button>

        </div>

      </div>

    </div>
  );
};
