import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

interface IntroPageProps {
  onMusicStart?: () => void;
}

/* ── Palestinian symbols ──────────────────────────────────────────────────── */

function OliveBranch({ flip = false, opacity = 0.85 }: { flip?: boolean; opacity?: number }) {
  return (
    <svg
      width="220"
      height="340"
      viewBox="0 0 220 340"
      style={{ display: "block", opacity, transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* Main stem */}
      <path
        d="M 110 330 C 100 280 80 240 70 200 C 60 160 50 120 55 80 C 58 55 70 30 90 20"
        fill="none"
        stroke="#4d7c0f"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Branch sub-stems and leaves */}
      {[
        { cx: 95, cy: 280, angle: -40, w: 38, h: 16 },
        { cx: 82, cy: 250, angle: 30,  w: 42, h: 18 },
        { cx: 78, cy: 218, angle: -50, w: 44, h: 18 },
        { cx: 70, cy: 188, angle: 25,  w: 40, h: 16 },
        { cx: 62, cy: 160, angle: -45, w: 46, h: 19 },
        { cx: 58, cy: 132, angle: 35,  w: 42, h: 17 },
        { cx: 57, cy: 106, angle: -38, w: 38, h: 15 },
        { cx: 62, cy: 82,  angle: 30,  w: 36, h: 14 },
        { cx: 72, cy: 58,  angle: -30, w: 34, h: 14 },
        { cx: 82, cy: 38,  angle: 20,  w: 30, h: 12 },
      ].map(({ cx, cy, angle, w, h }, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={w / 2}
          ry={h / 2}
          fill="#65a30d"
          transform={`rotate(${angle}, ${cx}, ${cy})`}
          opacity={0.85 + (i % 3) * 0.05}
        />
      ))}
      {/* Small olives on some branches */}
      {[
        { x: 76, y: 248 },
        { x: 55, y: 155 },
        { x: 54, y: 100 },
        { x: 67, y: 55 },
      ].map(({ x, y }, i) => (
        <ellipse key={i} cx={x} cy={y} rx={5} ry={7} fill="#78350f" opacity={0.7} />
      ))}
    </svg>
  );
}

function WatermelonSlice({ size = 90, rotation = 0 }: { size?: number; rotation?: number }) {
  const r = size / 2;
  return (
    <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} style={{ display: "block", transform: `rotate(${rotation}deg)` }}>
      {/* Green rind outer */}
      <path d={`M 0 ${size * 0.65} A ${r} ${r} 0 0 1 ${size} ${size * 0.65} Z`} fill="#16a34a" />
      {/* White layer */}
      <path d={`M ${size * 0.06} ${size * 0.65} A ${r * 0.88} ${r * 0.88} 0 0 1 ${size * 0.94} ${size * 0.65} Z`} fill="#dcfce7" />
      {/* Red flesh */}
      <path d={`M ${size * 0.12} ${size * 0.65} A ${r * 0.76} ${r * 0.76} 0 0 1 ${size * 0.88} ${size * 0.65} Z`} fill="#ef4444" />
      {/* Seeds */}
      {[0.30, 0.50, 0.70].map((xr, i) => (
        <ellipse key={i} cx={size * xr} cy={size * (0.45 + (i % 2) * 0.07)} rx={size * 0.025} ry={size * 0.04} fill="#1a1a1a" opacity={0.75} />
      ))}
    </svg>
  );
}

function WatermelonWhole({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.9} viewBox={`0 0 60 54`} style={{ display: "block" }}>
      {/* Body */}
      <ellipse cx="30" cy="30" rx="28" ry="22" fill="#16a34a" />
      {/* Stripes */}
      {[-12, -4, 4, 12].map((x, i) => (
        <path key={i} d={`M ${30 + x - 2} 8 Q ${30 + x} 30 ${30 + x - 1} 52`} fill="none" stroke="#15803d" strokeWidth="2.5" opacity="0.5" />
      ))}
      {/* Stem */}
      <path d="M 30 8 Q 34 2 38 0" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Shine */}
      <ellipse cx="18" cy="18" rx="6" ry="4" fill="#fff" opacity="0.12" transform="rotate(-30,18,18)" />
    </svg>
  );
}

/* ── Story text content ───────────────────────────────────────────────────── */

const STORY_PARAGRAPHS = [
  { text: "In the heart of the Jabalia refugee camp in northern Gaza Strip lived a six-year-old boy.", emphasis: false },
  { text: "His name was Handala.", emphasis: true, arabic: "حنظلة" },
  { text: "He had a mother who sang him to sleep, a father who lifted him on his shoulders, and two sisters who made the small house feel full.", emphasis: false },
  { text: "Every night his mother told him:", emphasis: false },
  { text: '"Jabalia is our roots. One day we will return to our land."', emphasis: true },
  { text: "Then one night, the bombs came.", emphasis: false },
  { text: "The occupation forces struck the whole neighbourhood. Buildings became dust. The camp became silence.", emphasis: false },
  { text: "Handala survived. His family did not.", emphasis: true },
  { text: "He hid alone in the rubble for days — no food, no water, no voice to call his name.", emphasis: false },
  { text: "Then a neighbour found him. She carried one piece of news:", emphasis: false },
  { text: "His older sister Nour had escaped before the strike.", emphasis: false },
  { text: "She had made it south — all the way to Rafah.", emphasis: true, arabic: "رفح" },
  { text: "She was alive. She was waiting.", emphasis: false },
  { text: "Handala made a decision.", emphasis: false },
  { text: "He would walk south through Gaza City, through Khan Younis, all the way to the Rafah crossing.", emphasis: false },
  { text: "On the road out of Jabalia, he met four survivors who would protect him:", emphasis: false },
  { text: "Ahmed. Kareem. Mariam. Samir.", emphasis: true },
  { text: "Together they would fight through every district. Every checkpoint. Every wave of soldiers.", emphasis: false },
  { text: "Because one word kept Handala moving:", emphasis: false },
  { text: "Nour.", emphasis: true, arabic: "نور — ضوء" },
  { text: "Light.", emphasis: true },
  { text: "Palestine will be free.", emphasis: true, arabic: "فلسطين ستبقى حرة" },
];

export default function IntroPage({ onMusicStart }: IntroPageProps) {
  const [, navigate] = useLocation();
  const [started, setStarted] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const startedRef = useRef(false);

  function begin() {
    if (!startedRef.current) {
      startedRef.current = true;
      onMusicStart?.();
      setStarted(true);
      setScrolling(true);
    }
  }

  // Manual scroll animation
  useEffect(() => {
    if (!scrolling) return;
    const inner = containerRef.current;
    if (!inner) return;
    const totalHeight = inner.scrollHeight;
    const viewH = inner.parentElement?.clientHeight ?? 500;
    posRef.current = viewH; // start below the visible area

    const tick = () => {
      posRef.current -= 0.9;
      inner.style.transform = `translateY(${posRef.current}px)`;
      // When scroll has gone far enough above (text fully passed)
      if (posRef.current < -(totalHeight + 60)) {
        navigate("/");
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [scrolling, navigate]);

  // Key handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!startedRef.current && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        begin();
        return;
      }
      if (startedRef.current && e.code === "Escape") {
        cancelAnimationFrame(animRef.current);
        navigate("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const px = "'Press Start 2P', monospace";
  const ar = "'Noto Sans Arabic', 'Arial', sans-serif";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(ellipse at 50% 60%, #0f1a08 0%, #050a02 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Palestinian flag strip top */}
      <div style={{ display: "flex", width: "100%", height: 8, flexShrink: 0, zIndex: 10, position: "relative" }}>
        <div style={{ flex: 1, background: "#000" }} />
        <div style={{ flex: 1, background: "#fff" }} />
        <div style={{ flex: 1, background: "#16a34a" }} />
        <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "8px solid #dc2626" }} />
      </div>

      {/* ── Decorative: Olive branches left & right ── */}
      <div style={{ position: "absolute", left: -10, top: 60, zIndex: 2, pointerEvents: "none" }}>
        <OliveBranch opacity={0.7} />
      </div>
      <div style={{ position: "absolute", right: -10, top: 60, zIndex: 2, pointerEvents: "none" }}>
        <OliveBranch flip opacity={0.7} />
      </div>

      {/* ── Decorative: Olive branches bottom ── */}
      <div style={{ position: "absolute", left: 20, bottom: 30, zIndex: 2, pointerEvents: "none", transform: "rotate(30deg) scaleY(-0.6) scaleX(0.7)", opacity: 0.5 }}>
        <OliveBranch />
      </div>
      <div style={{ position: "absolute", right: 20, bottom: 30, zIndex: 2, pointerEvents: "none", transform: "rotate(-30deg) scaleY(-0.6) scaleX(0.7)", opacity: 0.5 }}>
        <OliveBranch flip />
      </div>

      {/* ── Decorative: Watermelon slices ── */}
      <div style={{ position: "absolute", left: 26, top: 90, zIndex: 3, pointerEvents: "none", opacity: 0.75 }}>
        <WatermelonSlice size={72} rotation={-15} />
      </div>
      <div style={{ position: "absolute", right: 22, top: 100, zIndex: 3, pointerEvents: "none", opacity: 0.75 }}>
        <WatermelonSlice size={64} rotation={15} />
      </div>
      <div style={{ position: "absolute", left: 50, bottom: 80, zIndex: 3, pointerEvents: "none", opacity: 0.6 }}>
        <WatermelonSlice size={56} rotation={20} />
      </div>
      <div style={{ position: "absolute", right: 44, bottom: 80, zIndex: 3, pointerEvents: "none", opacity: 0.6 }}>
        <WatermelonSlice size={56} rotation={-20} />
      </div>
      {/* Small whole watermelons in corners */}
      <div style={{ position: "absolute", left: 120, top: 14, zIndex: 3, pointerEvents: "none", opacity: 0.5 }}>
        <WatermelonWhole size={42} />
      </div>
      <div style={{ position: "absolute", right: 120, top: 14, zIndex: 3, pointerEvents: "none", opacity: 0.5 }}>
        <WatermelonWhole size={42} />
      </div>

      {/* ── Scrolling text area ── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          zIndex: 5,
          mask: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMask: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        {/* Scroll container */}
        <div
          ref={containerRef}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%) translateY(100vh)",
            width: "min(600px, 70vw)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            paddingBottom: 80,
          }}
        >
          {/* Top decorative separator */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <WatermelonSlice size={36} rotation={0} />
            <div style={{ fontFamily: ar, fontSize: 18, color: "#f97316", opacity: 0.8 }}>✦</div>
            <WatermelonSlice size={36} rotation={0} />
          </div>

          {/* Title */}
          <div style={{ fontFamily: ar, fontSize: 48, color: "#f97316", textShadow: "0 0 30px #f9731660", direction: "rtl", marginBottom: 4, letterSpacing: 2 }}>حنظلة</div>
          <div style={{ fontFamily: px, fontSize: 13, color: "#fff", letterSpacing: 4, marginBottom: 6 }}>HANDALA</div>
          <div style={{ fontFamily: px, fontSize: 6, color: "#78716c", letterSpacing: 2, marginBottom: 40 }}>A BOY FROM JABALIA REFUGEE CAMP</div>

          {/* Olive separator */}
          <div style={{ width: "80%", height: 1, background: "linear-gradient(to right, transparent, #65a30d60, transparent)", marginBottom: 40 }} />

          {/* Story paragraphs */}
          {STORY_PARAGRAPHS.map((para, i) => (
            <div key={i} style={{ marginBottom: para.emphasis ? 28 : 18, textAlign: "center", width: "100%" }}>
              {para.arabic && (
                <div style={{ fontFamily: ar, fontSize: para.emphasis ? 32 : 22, color: "#f97316", direction: "rtl", marginBottom: 6, textShadow: "0 0 16px #f9731640" }}>
                  {para.arabic}
                </div>
              )}
              <p style={{
                fontFamily: px,
                fontSize: para.emphasis ? 8.5 : 7,
                color: para.emphasis ? "#fff" : "#b5b0a8",
                lineHeight: 2.4,
                margin: 0,
                textShadow: para.emphasis ? "0 0 12px rgba(255,255,255,0.15)" : "none",
                letterSpacing: para.emphasis ? 0.5 : 0,
              }}>
                {para.text}
              </p>
            </div>
          ))}

          {/* Bottom separator + icons */}
          <div style={{ width: "80%", height: 1, background: "linear-gradient(to right, transparent, #65a30d60, transparent)", marginTop: 24, marginBottom: 32 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <WatermelonSlice size={44} rotation={0} />
            <div style={{ fontFamily: ar, fontSize: 14, color: "#65a30d", opacity: 0.9, letterSpacing: 1 }}>🫒🌿🫒</div>
            <WatermelonSlice size={44} rotation={0} />
          </div>
          <div style={{ fontFamily: px, fontSize: 7, color: "#65a30d", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>NOW THE JOURNEY BEGINS</div>
          <div style={{ fontFamily: ar, fontSize: 20, color: "#16a34a", direction: "rtl", opacity: 0.85 }}>الرحلة تبدأ الآن</div>
        </div>
      </div>

      {/* ── Bottom controls bar ── */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 24px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #1a2e0a",
          zIndex: 10,
          background: "rgba(5,10,2,0.9)",
        }}
      >
        <div style={{ fontFamily: px, fontSize: 5.5, color: "#2d4a1a" }}>
          {scrolling ? "ESC — SKIP" : "SPACE / ENTER — BEGIN"}
        </div>
        {!started ? (
          <button
            onClick={begin}
            style={{
              background: "rgba(22,163,74,0.12)",
              border: "2px solid #16a34a",
              borderRadius: 4,
              padding: "10px 28px",
              cursor: "pointer",
              fontFamily: px,
              fontSize: 8,
              color: "#fff",
              letterSpacing: 1,
              animation: "blink 1.4s step-end infinite",
            }}
          >
            ▶  BEGIN STORY
          </button>
        ) : (
          <button
            onClick={() => { cancelAnimationFrame(animRef.current); navigate("/"); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: px, fontSize: 6, color: "#44403c", padding: "4px 8px" }}
          >
            SKIP →
          </button>
        )}
        <div style={{ fontFamily: px, fontSize: 5.5, color: "#2d4a1a" }}>JABALIA</div>
      </div>

      {/* Flag bottom strip */}
      <div style={{ display: "flex", width: "100%", height: 8, flexShrink: 0, zIndex: 10 }}>
        <div style={{ flex: 1, background: "#000" }} />
        <div style={{ flex: 1, background: "#fff" }} />
        <div style={{ flex: 1, background: "#16a34a" }} />
        <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "8px solid #dc2626" }} />
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
