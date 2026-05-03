import { useLocation } from "wouter";
import { useState } from "react";
import GazaMap from "../components/GazaMap";
import { CHARACTERS, STAGE_DEFS } from "../lib/gameConstants";

function CharSVG({ charIndex, size = 40 }: { charIndex: number; size?: number }) {
  const c = CHARACTERS[charIndex];
  const h = size * 1.5;
  const cx = size / 2;
  const colors = [c.color, "#c8a880", "#1a2a10", "#1a1a1a"];
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} style={{ display: "block" }}>
      {/* Shadow */}
      <ellipse cx={cx} cy={h - 4} rx={size * 0.4} ry={4} fill="rgba(0,0,0,0.3)" />
      {/* Legs */}
      <rect x={cx - 10} y={h - 32} width={8} height={24} fill={colors[0]} />
      <rect x={cx + 2} y={h - 32} width={8} height={24} fill={colors[0]} />
      {/* Boots */}
      <rect x={cx - 12} y={h - 12} width={10} height={12} fill="#1a1a1a" />
      <rect x={cx + 2} y={h - 12} width={10} height={12} fill="#1a1a1a" />
      {/* Torso */}
      <rect x={cx - 13} y={h - 62} width={26} height={32} fill={colors[0]} />
      {/* Arms */}
      <rect x={cx - 20} y={h - 60} width={8} height={20} fill={colors[0]} />
      <rect x={cx + 12} y={h - 60} width={8} height={20} fill={colors[0]} />
      {/* Head */}
      <rect x={cx - 11} y={h - 80} width={22} height={20} fill="#c8a880" />
      {/* Keffiyeh */}
      <rect x={cx - 13} y={h - 84} width={26} height={8} fill="#fff" />
      {/* Eyes */}
      <rect x={cx + 1} y={h - 76} width={6} height={5} fill="#1a1a1a" />
      {/* Color accent stripe */}
      <rect x={cx - 13} y={h - 55} width={26} height={4} fill={colors[0]} opacity="0.6" />
    </svg>
  );
}

function FlagBar() {
  return (
    <div style={{ display: "flex", width: "100%", height: 10, flexShrink: 0 }}>
      <div style={{ flex: 1, background: "#000" }} />
      <div style={{ flex: 1, background: "#fff" }} />
      <div style={{ flex: 1, background: "#16a34a" }} />
      <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "9px solid #dc2626" }} />
    </div>
  );
}

export default function MenuPage() {
  const [, navigate] = useLocation();
  const [selectedChar, setSelectedChar] = useState(0);
  const [selectedStage, setSelectedStage] = useState(0);

  const charDef = CHARACTERS[selectedChar];
  const stageDef = STAGE_DEFS[selectedStage];

  function startGame() {
    sessionStorage.setItem("gz_char", String(selectedChar));
    sessionStorage.setItem("gz_stage", String(selectedStage));
    navigate("/game");
  }

  return (
    <div
      style={{
        width: "100vw", height: "100vh",
        background: "#0c0a09",
        display: "flex", flexDirection: "column", alignItems: "center",
        overflow: "auto",
        position: "relative",
      }}
    >
      <FlagBar />

      <div style={{ display: "flex", width: "100%", maxWidth: 960, padding: "8px 12px", gap: 16, flex: 1 }}>
        {/* Left: Gaza Map */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
          <GazaMap currentStage={selectedStage} />
        </div>

        {/* Right: Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 10, marginTop: 4 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#dc2626", textShadow: "0 0 20px #dc262660", letterSpacing: 2, lineHeight: 1.6 }}>ESCAPE</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 24, color: "#fff", textShadow: "0 0 30px #ef444480", letterSpacing: 3, lineHeight: 1.2, marginBottom: 2 }}>GAZA</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#f97316", letterSpacing: 1 }}>Earth Defenders</div>
          </div>

          {/* Story */}
          <div style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #44403c", borderRadius: 4, padding: "10px 14px", maxWidth: 520, marginBottom: 10, textAlign: "center" }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#d4d4d4", lineHeight: 2, margin: 0 }}>
              Four survivors in Jabalia, Northern Gaza. Bombs fall. The camp burns. They must travel south — through Gaza City, Khan Younis — to reach the Rafah crossing. Collect supplies. Resist. Survive.
            </p>
          </div>

          {/* Character select */}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#9ca3af", marginBottom: 8, letterSpacing: 2 }}>CHOOSE YOUR CHARACTER</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {CHARACTERS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedChar(i)}
                style={{
                  background: selectedChar === i ? `${c.color}22` : "rgba(0,0,0,0.5)",
                  border: `2px solid ${selectedChar === i ? c.color : "#44403c"}`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transform: selectedChar === i ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.12s",
                  minWidth: 76,
                  boxShadow: selectedChar === i ? `0 0 14px ${c.color}50` : "none",
                }}
              >
                <CharSVG charIndex={i} size={38} />
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: selectedChar === i ? c.color : "#9ca3af", marginTop: 6, textAlign: "center" }}>{c.name}</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4.5, color: "#6b7280", marginTop: 3, textAlign: "center" }}>HP:{c.maxHp}</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4.5, color: "#6b7280", marginTop: 1, textAlign: "center" }}>SPD:{c.moveSpeed}</div>
              </button>
            ))}
          </div>

          {/* Selected character info */}
          <div style={{ background: `${charDef.color}11`, border: `1px solid ${charDef.color}44`, borderRadius: 4, padding: "8px 16px", marginBottom: 14, maxWidth: 460, width: "100%", textAlign: "center" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: charDef.color, marginBottom: 6 }}>{charDef.name}</div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {[["HP", charDef.maxHp, "#22c55e"], ["SPEED", charDef.moveSpeed, "#60a5fa"], ["ATK", charDef.attackDamage, "#f97316"]].map(([label, val, col]) => (
                <div key={label as string} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#9ca3af" }}>{label}</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: col as string }}>{val as number}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage select */}
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#9ca3af", marginBottom: 8, letterSpacing: 2 }}>STARTING AREA</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {STAGE_DEFS.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedStage(i)}
                style={{
                  background: selectedStage === i ? `${s.color}22` : "rgba(0,0,0,0.5)",
                  border: `2px solid ${selectedStage === i ? s.color : "#44403c"}`,
                  borderRadius: 4,
                  padding: "8px 12px",
                  cursor: "pointer",
                  transition: "all 0.12s",
                  boxShadow: selectedStage === i ? `0 0 12px ${s.color}50` : "none",
                  minWidth: 90,
                }}
              >
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6.5, color: selectedStage === i ? s.color : "#9ca3af", marginBottom: 3 }}>{s.name}</div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4.5, color: "#6b7280" }}>{s.subtitle}</div>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid #292524", borderRadius: 4, padding: "8px 14px", marginBottom: 14, maxWidth: 520, width: "100%" }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#9ca3af", marginBottom: 6, textAlign: "center" }}>CONTROLS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
              {[
                ["ARROWS/WASD", "MOVE"],
                ["SPACE", "JUMP"],
                ["Z / J", "ATTACK"],
                ["X / K", "SPIRIT BLAST"],
                ["R", "ROCKET"],
                ["UP+Z", "THROW ROCK"],
                ["V", "SUMMON ALLY"],
                ["C", "SWITCH CHAR"],
                ["1 / 2 / 3", "ALLY ABILITY"],
              ].map(([key, action]) => (
                <div key={key} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#fbbf24", whiteSpace: "nowrap" }}>{key}</span>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b7280", whiteSpace: "nowrap" }}>— {action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            style={{
              background: "rgba(220,38,38,0.15)",
              border: "2px solid #dc2626",
              borderRadius: 6,
              padding: "14px 40px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 12,
              color: "#fff",
              textShadow: "0 0 12px #ef4444",
              boxShadow: "0 0 20px #dc262640",
              letterSpacing: 2,
              animation: "blink 1.4s step-end infinite",
            }}
          >
            ▶  START GAME
          </button>

          <div style={{ marginTop: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#44403c", textAlign: "center" }}>
            Stage: {stageDef.name} — {STAGE_DEFS.length} areas total
          </div>
        </div>
      </div>

      <FlagBar />
    </div>
  );
}
