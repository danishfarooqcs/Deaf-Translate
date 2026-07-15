import React, { useState } from 'react';
import { GlassCard, Button } from '../components/ui';
import { 
  HelpCircle, 
  BookOpen, 
  Keyboard, 
  HelpCircle as QuestionIcon, 
  ChevronDown, 
  Video,
  Info,
  Sparkles,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "How does the AI gesture translation engine work?",
    answer: "The application uses Google MediaPipe Tasks Vision loaded via WebAssembly to parse raw frames from your webcam. It tracks 21 coordinates on your hand. A custom mathematical engine translates the relative distances, angles, and shapes of these coordinates to recognize ASL signs instantly."
  },
  {
    question: "Is my webcam video sent to any server?",
    answer: "Absolutely not. Privacy is a core architectural pillar. All video capture, frame extraction, skeleton mapping, and gesture classifications run 100% locally in your web browser. No media stream or telemetry leaves your device."
  },
  {
    question: "Why is the hand tracking lagging or skipping?",
    answer: "This is usually caused by low lighting, camera motion blur, or CPU/GPU throttling. For optimal tracking: ensure your signing hand is well-lit, keep your camera steady, and close background tabs. You can lower the resolution in Settings to improve frame rates."
  },
  {
    question: "How do I practice signs in Training Mode?",
    answer: "Go to Training Mode, select a target sign, and shape your hand to match. Hold your hand steady within the camera view. When the AI detects the correct hand shape with high confidence, a progress ring will fill. Keep the pose for 1.5 seconds to complete the exercise."
  },
  {
    question: "Does the voice synthesis require an internet connection?",
    answer: "No. The Text-To-Speech (TTS) feature utilizes your browser's native Web Speech API, which triggers local text synthesis engines built into your operating system."
  }
];

export const Help: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const keyboardShortcuts = [
    { key: "Space", action: "Append space to sentence builder" },
    { key: "Ctrl + Z", action: "Undo last registered word" },
    { key: "Ctrl + Y", action: "Redo last registered word" },
    { key: "Enter", action: "Post current sentence to chat bubble" },
    { key: "Esc", action: "Clear entire sentence builder" },
    { key: "Alt + P", action: "Pause / Resume camera streaming feed" },
    { key: "Alt + M", action: "Toggle Speech-To-Text microphone recording" },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
      
      {/* Header */}
      <GlassCard className="p-4 md:p-6">
        <h3 className="text-base font-extrabold tracking-wide uppercase">Help & Documentation</h3>
        <p className="text-[10px] text-white/40 mt-0.5">Quick guides, keyboard hotkeys, and troubleshooting FAQs.</p>
      </GlassCard>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 pb-6">
        
        {/* Left: Interactive FAQ & Tutorials (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* FAQ Accordions */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-2">
              <QuestionIcon className="h-4.5 w-4.5 text-secondary-cyan" />
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">Frequently Asked Questions</h4>
            </div>

            <div className="flex flex-col gap-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border border-white/5 rounded-2xl overflow-hidden bg-white/5">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left p-4 flex items-center justify-between text-xs font-bold text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`h-4.5 w-4.5 text-white/40 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="p-4 pt-0 text-[11px] text-white/60 leading-relaxed font-normal border-t border-white/5 bg-black/10">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* SVG Calibration Guide */}
          <GlassCard className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Camera className="h-4.5 w-4.5 text-primary-purple" />
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">Visual Calibration Guide</h4>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Animated SVG Hand */}
              <div className="w-40 h-40 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-32 h-32 text-secondary-cyan opacity-80">
                  <path 
                    d="M 50,90 C 50,90 35,80 35,60 C 35,50 30,45 30,35 C 30,30 32,25 35,25 C 37,25 39,28 40,32 C 40,22 43,18 46,18 C 48,18 50,22 50,30 C 50,20 53,16 56,16 C 58,16 60,20 60,30 C 60,24 63,22 65,22 C 67,22 69,25 69,35 C 69,50 65,60 65,60 C 65,60 60,75 50,90 Z" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  {/* Bounding box guide */}
                  <rect x="15" y="10" width="70" height="80" rx="6" fill="none" stroke="rgba(124, 77, 255, 0.3)" strokeWidth="1.5" />
                  {/* Joint node guides */}
                  <circle cx="35" cy="25" r="2.5" fill="#7C4DFF" />
                  <circle cx="46" cy="18" r="2.5" fill="#7C4DFF" />
                  <circle cx="56" cy="16" r="2.5" fill="#7C4DFF" />
                  <circle cx="69" cy="22" r="2.5" fill="#7C4DFF" />
                  <circle cx="50" cy="90" r="3" fill="#00E5FF" />
                </svg>
              </div>

              <div className="flex flex-col gap-2">
                <h5 className="text-xs font-bold text-white">Ideal Camera Setup</h5>
                <ul className="list-disc list-inside text-[11px] text-white/60 space-y-1.5 font-normal leading-relaxed">
                  <li>Keep hand distance 2-4 feet from the lens.</li>
                  <li>Ensure palm faces the camera straight-on (avoid severe tilt).</li>
                  <li>Align within the center of video frame boundary.</li>
                  <li>Check that fingers do not overlap during gesture holds.</li>
                </ul>
              </div>

            </div>
          </GlassCard>

        </div>

        {/* Right: Keyboard shortcuts & System specs (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Keyboard Shortcuts table */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-2">
              <Keyboard className="h-4.5 w-4.5 text-primary-purple" />
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">Keyboard Shortcuts</h4>
            </div>

            <div className="flex flex-col gap-3">
              {keyboardShortcuts.map((sc, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2">
                  <span className="text-white/60 font-normal">{sc.action}</span>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/10 rounded-lg text-white font-bold font-mono text-[9px] select-none shadow-sm">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick diagnostic tips */}
          <GlassCard className="p-5 flex flex-col gap-3 bg-gradient-to-br from-primary-purple/5 to-card-dark border-primary-purple/20">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4.5 w-4.5 text-secondary-cyan" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">Quick Calibration Tip</h4>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed font-normal">
              If the model fails to detect signs properly, check the FPS diagnostics in the top header. If it drops below 15 FPS, open Settings and lower the camera capture resolution. This will immediately free up local GPU cycles and speed up classification processing.
            </p>
          </GlassCard>

        </div>

      </div>

    </div>
  );
};
