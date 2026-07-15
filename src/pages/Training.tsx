import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import { detectGesture, Landmark } from '../utils/gestureEngine';
import { Button, GlassCard, Progress } from '../components/ui';
import { Gesture } from '../types';
import { 
  Award, 
  Star, 
  Trophy, 
  Sparkles, 
  RotateCcw, 
  ChevronRight,
  Hand,
  Volume2,
  Lock,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSpeech } from '../hooks/useSpeech';
import { motion, AnimatePresence } from 'framer-motion';

const trainingSigns: Gesture[] = [
  { id: 'a', name: 'A', meaning: 'Letter A', category: 'alphabet', difficulty: 'Beginner', description: 'Make a fist, placing your thumb straight up against the side of your index finger.' },
  { id: 'b', name: 'B', meaning: 'Letter B', category: 'alphabet', difficulty: 'Beginner', description: 'Open your palm, keeping all fingers straight and touching, with thumb tucked across your palm.' },
  { id: 'c', name: 'C', meaning: 'Letter C', category: 'alphabet', difficulty: 'Beginner', description: 'Curve all fingers and thumb to form a crescent shape, mimicking the shape of a C.' },
  { id: 'd', name: 'D', meaning: 'Letter D', category: 'alphabet', difficulty: 'Beginner', description: 'Point your index finger straight up. Touch your thumb to the tips of your middle, ring, and pinky fingers.' },
  { id: 'f', name: 'F', meaning: 'Letter F', category: 'alphabet', difficulty: 'Beginner', description: 'Touch your index finger tip to your thumb tip. Keep your middle, ring, and pinky fingers extended straight up.' },
  { id: 'l', name: 'L', meaning: 'Letter L', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your thumb and index finger straight out to form an L shape. Fold middle, ring, and pinky fingers.' },
  { id: 'u', name: 'U', meaning: 'Letter U', category: 'alphabet', difficulty: 'Intermediate', description: 'Extend your index and middle fingers straight up, touching each other. Fold other fingers.' },
  { id: 'v', name: 'V', meaning: 'Letter V', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your index and middle fingers straight up, separated in a V shape. Fold other fingers.' },
  { id: 'y', name: 'Y', meaning: 'Letter Y', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your thumb and pinky finger fully out. Fold your index, middle, and ring fingers down.' },
  { id: 'love_you', name: 'I Love You', meaning: 'Affection', category: 'phrases', difficulty: 'Beginner', description: 'Extend your thumb, index, and pinky fingers straight up. Keep your middle and ring fingers folded.' },
];

export const Training: React.FC = () => {
  const {
    practiceTarget,
    setPracticeTarget,
    addPracticeStars,
    practiceStars,
    userLevel,
    userXp,
    addXp,
    badges,
    unlockBadge
  } = useAppStore();

  const { isModelLoaded, detectFrame } = useHandLandmarker();
  const { speak } = useSpeech();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraActive, setCameraActive] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  // Scoring / Matching metrics
  const [similarityScore, setSimilarityScore] = useState(0);
  const [matchStatus, setMatchStatus] = useState<'searching' | 'holding' | 'success'>('searching');
  const [practiceProgress, setPracticeProgress] = useState(0);

  const holdTimerRef = useRef<number | null>(null);
  const holdDuration = 1500; // Require 1.5s hold to complete

  // Select target if not set
  useEffect(() => {
    if (!practiceTarget) {
      setPracticeTarget(trainingSigns[0]);
    }
  }, [practiceTarget, setPracticeTarget]);

  // Setup camera
  const startCamera = async () => {
    setStreamError(null);
    try {
      const constraints = {
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setStreamError('Permission denied or webcam already in use.');
    }
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Model analysis tick
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isModelLoaded || !cameraActive || !practiceTarget) return;

    let animId: number;

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

          // Draw skeleton overlays
          if (ctx) {
            // Draw joints
            landmarks.forEach((p) => {
              ctx.fillStyle = '#00E5FF';
              ctx.beginPath();
              ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fill();
            });
          }

          // Evaluate similarity
          if (gesture.sign.toLowerCase() === practiceTarget.name.toLowerCase()) {
            setSimilarityScore(gesture.confidence);
            
            if (gesture.confidence >= 75) {
              setMatchStatus('holding');
              
              if (!holdTimerRef.current) {
                holdTimerRef.current = performance.now();
              }
              
              const elapsed = performance.now() - holdTimerRef.current;
              const percent = Math.min((elapsed / holdDuration) * 100, 100);
              setPracticeProgress(percent);

              if (percent >= 100 && matchStatus !== 'success') {
                // Success trigger!
                setMatchStatus('success');
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#7C4DFF', '#00E5FF', '#00C853']
                });
                
                // Add points
                addPracticeStars(1);
                addXp(60);
                
                // Unlocks
                if (gesture.confidence >= 95) {
                  unlockBadge('perfect_match');
                }
              }
            } else {
              setSimilarityScore(40);
              setMatchStatus('searching');
              setPracticeProgress(0);
              holdTimerRef.current = null;
            }
          } else {
            setSimilarityScore(15);
            setMatchStatus('searching');
            setPracticeProgress(0);
            holdTimerRef.current = null;
          }
        } else {
          setSimilarityScore(0);
          setMatchStatus('searching');
          setPracticeProgress(0);
          holdTimerRef.current = null;
        }
      }

      if (matchStatus !== 'success') {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [cameraActive, isModelLoaded, detectFrame, practiceTarget, matchStatus, addPracticeStars, addXp, unlockBadge]);

  // Restart practice session
  const resetPracticeSession = () => {
    setMatchStatus('searching');
    setPracticeProgress(0);
    setSimilarityScore(0);
    holdTimerRef.current = null;
  };

  const handleNextTarget = () => {
    const currentIndex = trainingSigns.findIndex(s => s.id === practiceTarget?.id);
    const nextIndex = (currentIndex + 1) % trainingSigns.length;
    setPracticeTarget(trainingSigns[nextIndex]);
    resetPracticeSession();
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-0">
      
      {/* LEFT COLUMN: Camera workspace (70%) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Practice screen container */}
        <div className="relative flex-1 bg-card-dark rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center min-h-[350px]">
          {cameraActive && !streamError ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scaleX(-1)" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover transform scaleX(-1) pointer-events-none" />
            </>
          ) : (
            <div className="text-center p-8 z-10">
              <h4 className="text-sm font-bold text-white mb-2">Camera is Offline</h4>
              <Button size="sm" onClick={() => setCameraActive(true)}>Enable Camera</Button>
            </div>
          )}

          {/* Floating UI Target Card */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="bg-black/85 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3">
              <div className="bg-primary-purple/20 border border-primary-purple/40 h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-lg">
                {practiceTarget?.name}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white/40 tracking-wider">TARGET TO FORM:</span>
                <span className="text-sm font-extrabold text-white uppercase">{practiceTarget?.meaning}</span>
              </div>
            </div>
          </div>

          {/* Similarity score HUD */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none text-right">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl">
              <span className="text-[9px] font-bold text-white/40 tracking-wider block mb-0.5">MATCH SCORE</span>
              <span className={`text-2xl font-extrabold ${similarityScore >= 75 ? 'text-success-green' : similarityScore >= 40 ? 'text-secondary-cyan' : 'text-danger-red'}`}>
                {similarityScore}%
              </span>
            </div>
          </div>

          {/* Central Match Status Overlays */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <AnimatePresence>
              {matchStatus === 'holding' && (
                <motion.div 
                  className="bg-black/90 border border-primary-purple/40 px-6 py-4 rounded-2xl text-center shadow-2xl pointer-events-auto"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <Sparkles className="h-6 w-6 text-secondary-cyan mx-auto mb-2 animate-spin-slow" />
                  <h4 className="text-sm font-bold text-white tracking-wide">Holding pose similarity...</h4>
                  <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden mt-3 mx-auto">
                    <div className="h-full bg-secondary-cyan transition-all duration-100" style={{ width: `${practiceProgress}%` }} />
                  </div>
                </motion.div>
              )}

              {matchStatus === 'success' && (
                <motion.div 
                  className="bg-gradient-to-tr from-success-green/20 via-black/90 to-primary-purple/20 border border-success-green/40 px-8 py-6 rounded-3xl text-center shadow-2xl pointer-events-auto max-w-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Trophy className="h-10 w-10 text-success-green mx-auto mb-3 animate-bounce" />
                  <h3 className="text-lg font-extrabold text-white tracking-wide">Perfect Alignment!</h3>
                  <p className="text-xs text-white/60 mt-1 mb-4 leading-relaxed">
                    You signed the gesture "{practiceTarget?.name}" perfectly! +60 XP added.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="secondary" onClick={resetPracticeSession}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Try Again
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleNextTarget}>
                      Next Sign
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Practice tracker (30%) */}
      <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
        
        {/* Practice info card */}
        <GlassCard className="p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-white/40 tracking-wider">TARGET INSTRUCTIONS</span>
              <h3 className="text-base font-extrabold text-white mt-0.5">{practiceTarget?.name}</h3>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => speak(practiceTarget?.description || '')} title="Read instruction">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-normal">
            {practiceTarget?.description}
          </p>
          <div className="flex gap-4 border-t border-white/5 pt-3 mt-1 text-[10px]">
            <div>
              <span className="text-white/40 block">Level Level:</span>
              <span className="text-white font-bold">{practiceTarget?.difficulty}</span>
            </div>
            <div>
              <span className="text-white/40 block">Category:</span>
              <span className="text-white font-bold capitalize">{practiceTarget?.category}</span>
            </div>
          </div>
        </GlassCard>

        {/* Practice Progression levels & Stars */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2.5">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Training Stats</h4>
            <div className="flex items-center gap-1 text-secondary-cyan font-bold text-sm">
              <Star className="h-4 w-4 fill-secondary-cyan" />
              <span>{practiceStars} Stars</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>XP progression to next Level:</span>
                <span className="font-mono text-white">{userXp} / {userLevel * 500} XP</span>
              </div>
              <Progress value={(userXp / (userLevel * 500)) * 100} />
            </div>
            <div className="text-[10px] text-white/40 leading-relaxed bg-white/5 p-2 rounded-xl border border-white/5">
              Practice different gestures from the dictionary to gain bonus stars. Confetti triggers upon successfully holding high-accuracy coordinates.
            </div>
          </div>
        </GlassCard>

        {/* Achievements / Badges card list */}
        <GlassCard className="p-4 flex-1 flex flex-col min-h-[180px] overflow-hidden">
          <span className="text-[10px] font-bold text-white/40 tracking-wider block mb-3 uppercase border-b border-white/5 pb-2">Unlocked Badges</span>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`p-2.5 border rounded-2xl flex items-center gap-3 transition-colors ${
                  badge.unlocked 
                    ? 'bg-white/5 border-primary-purple/20' 
                    : 'bg-black/20 border-white/5 opacity-50'
                }`}
              >
                <div className={`p-2 rounded-xl border ${
                  badge.unlocked 
                    ? 'bg-primary-purple/10 border-primary-purple/35 text-primary-purple' 
                    : 'bg-white/5 border-white/10 text-white/30'
                }`}>
                  {badge.unlocked ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{badge.title}</span>
                  <span className="text-[10px] text-white/50 font-normal leading-tight mt-0.5">{badge.description}</span>
                  {badge.unlocked && badge.unlockedAt && (
                    <span className="text-[8px] font-mono text-white/30 mt-1 select-none">Unlocked: {badge.unlockedAt}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
