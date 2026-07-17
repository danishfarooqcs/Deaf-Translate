import { useState } from "react";
import { ChevronDown, LifeBuoy } from "lucide-react";

const FAQ = [
  {
    q: "How does gesture recognition work?",
    a: "The camera feed is analyzed frame by frame with MediaPipe's hand landmarker model, which locates 21 points on each hand. Those points are converted into finger-extension patterns and distances, which a geometric classifier matches against known gestures.",
  },
  {
    q: "Why doesn't it recognize every word in the vocabulary list?",
    a: "Some signs rely on motion, facial expression, or contact with the face or body, which a single video frame of hand landmarks can't capture reliably. Those words are included in Dictionary Mode and Training Mode as reference material instead of live detection.",
  },
  {
    q: "The camera feed is frozen or black.",
    a: "Check that camera permission is granted in your browser's site settings, close any other app using the camera, and try Switch Camera if you have more than one device connected.",
  },
  {
    q: "Can I use two hands at once?",
    a: "Yes. Up to two hands are tracked simultaneously, including the two-handed Heart gesture.",
  },
  {
    q: "How is my level and XP calculated?",
    a: "Every recognized gesture across any mode earns 6 XP. Leveling up requires 1500 XP.",
  },
  {
    q: "Is any video sent to a server?",
    a: "No. Hand tracking and speech synthesis run entirely in your browser; the video stream never leaves your device.",
  },
];

export default function HelpDocs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="section-wrap">
      <div className="section-title-row">
        <div>
          <div className="section-title">Help & Docs</div>
          <div className="section-subtitle">Answers to common questions and a quick usage guide.</div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <strong>1. Grant camera access</strong>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            On first load, allow the browser's camera permission prompt so Realtime Detection can start.
          </p>
        </div>
        <div className="card">
          <strong>2. Hold a gesture steady</strong>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            Keep your hand in frame for a moment; the engine smooths several frames before locking a gesture in.
          </p>
        </div>
        <div className="card">
          <strong>3. Build and speak sentences</strong>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            Recognized words collect in the Sentence Builder. Tap Speak Sentence to hear it aloud.
          </p>
        </div>
      </div>

      <div className="section-wrap" style={{ gap: 12 }}>
        {FAQ.map((item, i) => (
          <div className="accordion-item" key={item.q}>
            <div
              className={`accordion-header${openIndex === i ? " open" : ""}`}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LifeBuoy size={15} color="var(--cyan)" />
                {item.q}
              </span>
              <ChevronDown />
            </div>
            {openIndex === i && <div className="accordion-body">{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
