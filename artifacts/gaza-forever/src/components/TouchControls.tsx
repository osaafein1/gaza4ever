import type { RefObject } from "react";
import type { GameState } from "../lib/gameTypes";

interface TouchControlsProps {
  gsRef: RefObject<GameState | null>;
  onJump: () => void;
  onAttack: () => void;
  onBlast: () => void;
  onFire: () => void;
  onShop: () => void;
}

const BTN_BASE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: 68,
  borderRadius: 14,
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  cursor: "pointer",
};

export default function TouchControls({ gsRef, onJump, onAttack, onBlast, onFire, onShop }: TouchControlsProps) {
  const setKey = (code: string, val: boolean) => {
    const gs = gsRef.current;
    if (gs) gs.keys[code] = val;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* ── Left pad: movement + jump ── */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 20,
          display: "grid",
          gridTemplateColumns: "72px 72px 72px",
          gridTemplateRows: "56px 68px",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        {/* Jump — spans all 3 columns */}
        <div
          style={{
            ...BTN_BASE,
            gridColumn: "1 / 4",
            height: 56,
            border: "2px solid #60a5fa",
            background: "rgba(96,165,250,0.18)",
            color: "#60a5fa",
            flexDirection: "row",
            gap: 8,
          }}
          onTouchStart={(e) => { e.preventDefault(); onJump(); }}
          onTouchEnd={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 20 }}>▲</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>JUMP</span>
        </div>

        {/* Left */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #9ca3af",
            background: "rgba(156,163,175,0.18)",
            color: "#9ca3af",
            fontSize: 28,
          }}
          onTouchStart={(e) => { e.preventDefault(); setKey("ArrowLeft", true); }}
          onTouchEnd={(e) => { e.preventDefault(); setKey("ArrowLeft", false); }}
          onTouchCancel={(e) => { e.preventDefault(); setKey("ArrowLeft", false); }}
        >◄</div>

        {/* Aim up (hold while tapping FIRE to shoot upward) */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #6b7280",
            background: "rgba(107,114,128,0.12)",
            color: "#6b7280",
            fontSize: 11,
          }}
          onTouchStart={(e) => { e.preventDefault(); setKey("ArrowUp", true); }}
          onTouchEnd={(e) => { e.preventDefault(); setKey("ArrowUp", false); }}
          onTouchCancel={(e) => { e.preventDefault(); setKey("ArrowUp", false); }}
        >
          <span style={{ fontSize: 18 }}>↑</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, marginTop: 2 }}>AIM</span>
        </div>

        {/* Right */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #9ca3af",
            background: "rgba(156,163,175,0.18)",
            color: "#9ca3af",
            fontSize: 28,
          }}
          onTouchStart={(e) => { e.preventDefault(); setKey("ArrowRight", true); }}
          onTouchEnd={(e) => { e.preventDefault(); setKey("ArrowRight", false); }}
          onTouchCancel={(e) => { e.preventDefault(); setKey("ArrowRight", false); }}
        >►</div>
      </div>

      {/* ── Right pad: action buttons ── */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,
          display: "grid",
          gridTemplateColumns: "76px 76px",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        {/* Attack */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #ef4444",
            background: "rgba(239,68,68,0.18)",
            color: "#ef4444",
          }}
          onTouchStart={(e) => { e.preventDefault(); onAttack(); }}
          onTouchEnd={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 22 }}>⚔️</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, marginTop: 3 }}>ATK</span>
        </div>

        {/* Blast */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #f97316",
            background: "rgba(249,115,22,0.18)",
            color: "#f97316",
          }}
          onTouchStart={(e) => { e.preventDefault(); onBlast(); }}
          onTouchEnd={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 22 }}>💨</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, marginTop: 3 }}>BLAST</span>
        </div>

        {/* Fire weapon */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #fbbf24",
            background: "rgba(251,191,36,0.18)",
            color: "#fbbf24",
          }}
          onTouchStart={(e) => { e.preventDefault(); onFire(); }}
          onTouchEnd={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 22 }}>🔫</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, marginTop: 3 }}>FIRE</span>
        </div>

        {/* Shop */}
        <div
          style={{
            ...BTN_BASE,
            border: "2px solid #22c55e",
            background: "rgba(34,197,94,0.18)",
            color: "#22c55e",
          }}
          onTouchStart={(e) => { e.preventDefault(); onShop(); }}
          onTouchEnd={(e) => e.preventDefault()}
        >
          <span style={{ fontSize: 22 }}>🛒</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, marginTop: 3 }}>SHOP</span>
        </div>
      </div>
    </div>
  );
}
