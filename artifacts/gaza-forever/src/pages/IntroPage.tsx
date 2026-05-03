import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface SlideProps {
  children: React.ReactNode;
  active: boolean;
}

function Slide({ children, active }: SlideProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 60px",
        opacity: active ? 1 : 0,
        transition: "opacity 0.8s ease",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

function HandalaSVG({ size = 120, mood = "neutral" }: { size?: number; mood?: "neutral" | "sad" | "determined" }) {
  const h = size * 1.6;
  const cx = size / 2;
  const eyeExpr = mood === "sad" ? 2 : mood === "determined" ? -1 : 0;
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} style={{ display: "block", filter: "drop-shadow(0 0 16px rgba(249,115,22,0.4))" }}>
      {/* Ground shadow */}
      <ellipse cx={cx} cy={h - 4} rx={size * 0.35} ry={5} fill="rgba(0,0,0,0.4)" />
      {/* Legs - short child legs */}
      <rect x={cx - 9} y={h - 34} width={7} height={26} fill="#c8a880" rx="2" />
      <rect x={cx + 2} y={h - 34} width={7} height={26} fill="#c8a880" rx="2" />
      {/* Shoes */}
      <rect x={cx - 11} y={h - 10} width={9} height={10} fill="#1a1a1a" rx="2" />
      <rect x={cx + 2} y={h - 10} width={9} height={10} fill="#1a1a1a" rx="2" />
      {/* Shorts / clothes */}
      <rect x={cx - 13} y={h - 50} width={26} height={18} fill="#2d4a6e" rx="2" />
      {/* Shirt - torn/dirty */}
      <rect x={cx - 14} y={h - 80} width={28} height={32} fill="#6b7280" rx="2" />
      {/* Dust/dirt on shirt */}
      <rect x={cx - 10} y={h - 68} width={6} height={3} fill="#44403c" rx="1" />
      <rect x={cx + 5} y={h - 75} width={5} height={2} fill="#44403c" rx="1" />
      {/* Small arms */}
      <rect x={cx - 20} y={h - 78} width={7} height={20} fill="#c8a880" rx="2" />
      <rect x={cx + 13} y={h - 78} width={7} height={20} fill="#c8a880" rx="2" />
      {/* Hands */}
      <ellipse cx={cx - 16} cy={h - 57} rx={4} ry={4} fill="#c8a880" />
      <ellipse cx={cx + 16} cy={h - 57} rx={4} ry={4} fill="#c8a880" />
      {/* Neck */}
      <rect x={cx - 5} y={h - 88} width={10} height={10} fill="#c8a880" />
      {/* Head - round child head */}
      <ellipse cx={cx} cy={h - 100} rx={16} ry={14} fill="#c8a880" />
      {/* Hair - keffiyeh style / bare head */}
      <ellipse cx={cx} cy={h - 110} rx={15} ry={9} fill="#1a1a1a" />
      {/* Face features */}
      {/* Eyes */}
      <ellipse cx={cx - 6} cy={h - 102 + eyeExpr} rx={2.5} ry={2.5} fill="#1a1a1a" />
      <ellipse cx={cx + 6} cy={h - 102 + eyeExpr} rx={2.5} ry={2.5} fill="#1a1a1a" />
      {/* Eye shine */}
      <circle cx={cx - 5} cy={h - 103 + eyeExpr} r={0.8} fill="#fff" />
      <circle cx={cx + 7} cy={h - 103 + eyeExpr} r={0.8} fill="#fff" />
      {/* Sad eyebrows */}
      {mood === "sad" && (
        <>
          <line x1={cx - 9} y1={h - 107} x2={cx - 3} y2={h - 105} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={cx + 9} y1={h - 107} x2={cx + 3} y2={h - 105} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {/* Determined eyebrows */}
      {mood === "determined" && (
        <>
          <line x1={cx - 9} y1={h - 106} x2={cx - 3} y2={h - 108} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={cx + 9} y1={h - 106} x2={cx + 3} y2={h - 108} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {/* Mouth */}
      {mood === "sad"
        ? <path d={`M ${cx - 5} ${h - 94} Q ${cx} ${h - 91} ${cx + 5} ${h - 94}`} fill="none" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" />
        : mood === "determined"
          ? <line x1={cx - 5} y1={h - 93} x2={cx + 5} y2={h - 93} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
          : <path d={`M ${cx - 4} ${h - 93} Q ${cx} ${h - 91} ${cx + 4} ${h - 93}`} fill="none" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" />
      }
      {/* Tears for sad mood */}
      {mood === "sad" && (
        <>
          <ellipse cx={cx - 8} cy={h - 97} rx={1.2} ry={2} fill="#38bdf8" />
          <ellipse cx={cx + 8} cy={h - 97} rx={1.2} ry={2} fill="#38bdf8" />
        </>
      )}
      {/* Small key in hand (holding something) */}
      {mood === "determined" && (
        <rect x={cx + 13} y={h - 52} width={12} height={4} fill="#fbbf24" rx="1" />
      )}
    </svg>
  );
}

const SLIDES = [
  {
    id: "title",
    bg: "radial-gradient(ellipse at center, #1c0a00 0%, #0c0a09 100%)",
    mood: "neutral" as const,
    charSize: 100,
    content: (
      <>
        <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 42, color: "#f97316", textShadow: "0 0 30px #f9731660", direction: "rtl", marginBottom: 4 }}>حنظلة</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: "#fff", letterSpacing: 3, marginBottom: 4 }}>HANDALA</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#9ca3af", letterSpacing: 1 }}>A BOY FROM JABALIA</div>
      </>
    ),
  },
  {
    id: "home",
    bg: "radial-gradient(ellipse at 30% 70%, #431407 0%, #0c0a09 80%)",
    mood: "neutral" as const,
    charSize: 90,
    content: (
      <>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#f97316", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>JABALIA REFUGEE CAMP, 2023</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600 }}>
          Handala was six years old. He lived with his mother, father, and two sisters in a small home in Jabalia refugee camp — the largest camp in Gaza.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          Every night his mother told him: <span style={{ color: "#f97316" }}>"Jabalia is our roots. One day we will return to our land."</span>
        </p>
      </>
    ),
  },
  {
    id: "bombs",
    bg: "radial-gradient(ellipse at 60% 80%, #7c2d12 0%, #0c0a09 70%)",
    mood: "sad" as const,
    charSize: 80,
    content: (
      <>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#ef4444", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>OCTOBER 2023 — NIGHT</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600 }}>
          He was woken by the sound of explosions. The sky turned orange. Then — silence.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ef4444", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          The occupation forces struck the entire neighborhood. Buildings became dust in seconds.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          Handala's home was gone. His family — gone.
        </p>
      </>
    ),
  },
  {
    id: "ruins",
    bg: "radial-gradient(ellipse at 50% 90%, #292524 0%, #0c0a09 80%)",
    mood: "sad" as const,
    charSize: 80,
    content: (
      <>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#78716c", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>THREE DAYS LATER</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600 }}>
          Handala hid alone in the rubble, surviving on scraps. No food. No water. No family.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          He repeated the words his father had once said: <span style={{ color: "#fbbf24" }}>"A Palestinian child never gives up."</span>
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#9ca3af", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          Then a neighbour found him. She had news.
        </p>
      </>
    ),
  },
  {
    id: "sister",
    bg: "radial-gradient(ellipse at 70% 30%, #0c4a6e 0%, #0c0a09 80%)",
    mood: "determined" as const,
    charSize: 90,
    content: (
      <>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#22c55e", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>A REASON TO GO ON</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600 }}>
          His older sister <span style={{ color: "#22c55e" }}>Nour</span> had escaped before the strike. She had made it south — all the way to <span style={{ color: "#22c55e" }}>Rafah</span>.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          She was waiting. She was alive.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#fbbf24", lineHeight: 2.4, textAlign: "center", maxWidth: 560, marginTop: 16 }}>
          Handala made a decision: <span style={{ color: "#f97316" }}>he would reach her.</span>
        </p>
      </>
    ),
  },
  {
    id: "journey",
    bg: "radial-gradient(ellipse at 40% 60%, #1e3a1e 0%, #0c0a09 80%)",
    mood: "determined" as const,
    charSize: 90,
    content: (
      <>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#22c55e", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>THE ROAD SOUTH</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600 }}>
          On the road out of Jabalia, Handala met four survivors — <span style={{ color: "#3b82f6" }}>Ahmed</span>, <span style={{ color: "#22c55e" }}>Kareem</span>, <span style={{ color: "#f97316" }}>Mariam</span>, and <span style={{ color: "#a78bfa" }}>Samir</span>.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 600, marginTop: 12 }}>
          They would protect him. Together, they would fight through Gaza City, Khan Younis — all the way to Rafah.
        </p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#f97316", lineHeight: 2.4, textAlign: "center", maxWidth: 560, marginTop: 16 }}>
          The path is dangerous. The occupation does not stop. But Handala carries one word in his heart:
        </p>
        <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 36, color: "#22c55e", textShadow: "0 0 20px #22c55e60", direction: "rtl", marginTop: 8 }}>نور</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#22c55e", letterSpacing: 2, marginTop: 4 }}>NOUR — HIS SISTER'S NAME. LIGHT.</div>
      </>
    ),
  },
  {
    id: "begin",
    bg: "radial-gradient(ellipse at center, #1c1917 0%, #0c0a09 100%)",
    mood: "determined" as const,
    charSize: 110,
    content: (
      <>
        <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 32, color: "#f97316", direction: "rtl", marginBottom: 8, textShadow: "0 0 20px #f9731660" }}>فلسطين ستبقى حرة</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#78716c", letterSpacing: 1, marginBottom: 24 }}>PALESTINE WILL BE FREE</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#d4d4d4", lineHeight: 2.4, textAlign: "center", maxWidth: 520 }}>
          Choose your fighter. Fight for Handala. Fight for Nour. Fight for Gaza.
        </p>
      </>
    ),
  },
];

interface IntroPageProps {
  onMusicStart?: () => void;
}

export default function IntroPage({ onMusicStart }: IntroPageProps) {
  const [, navigate] = useLocation();
  const [slide, setSlide] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    setTextVisible(false);
    const t = setTimeout(() => setTextVisible(true), 100);
    return () => clearTimeout(t);
  }, [slide]);

  function handleNext() {
    if (!musicStarted) {
      setMusicStarted(true);
      onMusicStart?.();
    }
    if (slide < SLIDES.length - 1) {
      setSlide((s) => s + 1);
    } else {
      navigate("/");
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleNext();
      }
      if (e.code === "Escape") {
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slide, musicStarted]);

  const current = SLIDES[slide];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0c0a09",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Palestinian flag top strip */}
      <div style={{ display: "flex", width: "100%", height: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, background: "#000" }} />
        <div style={{ flex: 1, background: "#fff" }} />
        <div style={{ flex: 1, background: "#16a34a" }} />
        <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "8px solid #dc2626" }} />
      </div>

      {/* Background that transitions */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: current.bg,
          transition: "background 1.2s ease",
        }}
      />

      {/* Particle-like stars */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 60}%`,
              width: i % 3 === 0 ? 2 : 1,
              height: i % 3 === 0 ? 2 : 1,
              background: "#fff",
              borderRadius: "50%",
              opacity: 0.3 + (i % 5) * 0.1,
              animation: `twinkle ${1.5 + (i % 3) * 0.7}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.2) % 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 60, maxWidth: 1000, width: "100%", padding: "0 60px" }}>
          {/* Character figure */}
          <div
            style={{
              flexShrink: 0,
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
              transition_delay: "0.2s",
            }}
          >
            <HandalaSVG size={current.charSize} mood={current.mood} />
          </div>

          {/* Text content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 8,
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "translateX(0)" : "translateX(20px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            {current.content}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ padding: "16px 40px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #292524" }}>
        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 6 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? 18 : 7,
                height: 7,
                borderRadius: 4,
                background: i === slide ? "#f97316" : i < slide ? "#44403c" : "#1c1917",
                border: `1px solid ${i === slide ? "#f97316" : "#44403c"}`,
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        {/* Skip */}
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#4b5563", padding: "4px 8px" }}
        >
          SKIP →
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          style={{
            background: "rgba(249,115,22,0.1)",
            border: "2px solid #f97316",
            borderRadius: 4,
            padding: "10px 28px",
            cursor: "pointer",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: "#fff",
            letterSpacing: 1,
            animation: "blink 1.4s step-end infinite",
          }}
        >
          {slide < SLIDES.length - 1 ? "NEXT  ▶" : "BEGIN  ▶"}
        </button>
      </div>

      {/* Flag bottom */}
      <div style={{ display: "flex", width: "100%", height: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, background: "#000" }} />
        <div style={{ flex: 1, background: "#fff" }} />
        <div style={{ flex: 1, background: "#16a34a" }} />
        <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "8px solid #dc2626" }} />
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.2; } to { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
