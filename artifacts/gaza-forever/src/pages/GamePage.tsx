import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import GazaMap from "../components/GazaMap";
import {
  CANVAS_W, CANVAS_H, FLOOR_Y,
  CHARACTERS, STAGE_DEFS, STAGE_COLLECTIBLES, STAGE_STORIES, STAGE_ARABIC, STAGE_HISTORY, STAGE_LANDMARKS, COLLECTIBLE_DEFS,
} from "../lib/gameConstants";
import {
  createPlayer, spawnEnemy, spawnDeathParticles, updateGame,
  spawnStageCollectibles, applyCollectibleBuffs,
} from "../lib/gameLogic";
import { createBgData, drawBackground } from "../lib/bgRenderer";
import {
  drawPlayer, drawEnemy, drawParticle, drawPowerUp, drawCollectible,
  drawProjectile, drawProjectileWarnings, drawHUD,
} from "../lib/gameRenderer";
import type { GameState, Enemy, Particle, Summon } from "../lib/gameTypes";

type Phase = "story" | "playing" | "stage-clear" | "win" | "dead" | "hind-story";

interface GamePageProps {
  onMusicStart?: () => void;
}

function FlagBar() {
  return (
    <div style={{ display: "flex", width: "100%", height: 12, flexShrink: 0 }}>
      <div style={{ flex: 1, background: "#000" }} />
      <div style={{ flex: 1, background: "#fff" }} />
      <div style={{ flex: 1, background: "#16a34a" }} />
      <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "11px solid #dc2626" }} />
    </div>
  );
}

function HistoryCard({ stageIndex, stageColor }: { stageIndex: number; stageColor: string }) {
  const h = STAGE_HISTORY[stageIndex];
  const lm = STAGE_LANDMARKS[stageIndex];
  if (!h) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560, width: "100%" }}>
      {/* Area history */}
      <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${stageColor}44`, borderRadius: 4, padding: "10px 16px" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6.5, color: stageColor, marginBottom: 8 }}>{h.title}</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#d4d4d4", lineHeight: 2, margin: 0, marginBottom: 8 }}>{h.text}</p>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b7280", borderTop: `1px solid ${stageColor}30`, paddingTop: 6 }}>{h.fact}</div>
      </div>
      {/* Destroyed landmark */}
      {lm && (
        <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #7f1d1d88", borderRadius: 4, padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#ef4444" }}>▶ DESTROYED</span>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#fca5a5" }}>{lm.name}</span>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#f87171", marginBottom: 6, opacity: 0.8 }}>{lm.when}</div>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#c4b5b5", lineHeight: 2, margin: 0 }}>{lm.desc}</p>
        </div>
      )}
    </div>
  );
}

// ─── Hind Rajab memorial story ────────────────────────────────────────────────

const HIND_PAGES = [
  {
    heading: "Her name was Hind Rajab.",
    body: "She was six years old.",
    portrait: true,
    car: false,
  },
  {
    heading: "29 January 2024 — Gaza City",
    body: "Hind was riding in a car with five relatives through the city. Israeli forces opened fire on the vehicle. Everyone inside was killed — except Hind. She was alone, alive, and trapped.",
    portrait: false,
    car: false,
  },
  {
    heading: "She called for help.",
    body: '"Come and take me. I am so scared," she told the Red Crescent. She stayed on the line for over three hours. Two paramedics — Yusuf Zeino and Ahmed al-Madhoun — drove out to reach her. They were killed before they arrived.',
    portrait: false,
    car: false,
  },
  {
    heading: "Twelve days later.",
    body: "Her body was found. She was still inside the car. She was six years old. The same age as Handala.",
    portrait: false,
    car: false,
  },
  {
    heading: null,
    body: "Handala stopped here. He placed a small wildflower against the door. He stood in silence. Then he walked on.",
    portrait: false,
    car: true,
  },
];

function HindPortrait() {
  return (
    <svg viewBox="0 0 120 170" width={196} height={277} style={{ display: "block", filter: "drop-shadow(0 0 22px rgba(251,191,36,0.28))" }}>
      <defs>
        <radialGradient id="halo" cx="50%" cy="44%" r="56%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="80" r="62" fill="url(#halo)" />
      {/* BODY — Palestinian embroidered dress */}
      <path d="M 16 170 L 10 116 Q 60 134 110 116 L 104 170 Z" fill="#1d4ed8" />
      <path d="M 20 124 Q 60 136 100 124" fill="none" stroke="#ef4444" strokeWidth="1.8" opacity="0.85" />
      <path d="M 22 131 Q 60 143 98 131" fill="none" stroke="#16a34a" strokeWidth="1.2" opacity="0.75" />
      {[28, 40, 52, 64, 76, 88, 100].map((bx, i) => (
        <circle key={i} cx={bx} cy={138} r={1.4} fill="#fbbf24" opacity={0.7} />
      ))}
      {/* NECK */}
      <rect x="50" y="100" width="20" height="18" rx="5" fill="#c8916a" />
      {/* HEAD */}
      <circle cx="60" cy="72" r="40" fill="#c8916a" />
      {/* Cheeks */}
      <ellipse cx="36" cy="80" rx="11" ry="8" fill="#e05050" opacity="0.2" />
      <ellipse cx="84" cy="80" rx="11" ry="8" fill="#e05050" opacity="0.2" />
      {/* HAIR cap */}
      <path d="M 20 72 Q 20 32 60 32 Q 100 32 100 72 L 96 58 Q 84 28 60 28 Q 36 28 24 58 Z" fill="#1a0a04" />
      <path d="M 21 66 Q 60 58 99 66" fill="none" stroke="#1a0a04" strokeWidth="10" />
      {/* LEFT BRAID */}
      <path d="M 22 70 C 6 88 8 118 14 128 C 16 133 22 131 20 124 C 16 110 18 88 24 72 Z" fill="#1a0a04" />
      {[88, 100, 112].map((y, i) => <ellipse key={i} cx={16} cy={y} rx={5} ry={4} fill="#2d1408" opacity={0.9} />)}
      <ellipse cx="16" cy="127" rx="7" ry="4" fill="#dc2626" />
      <ellipse cx="16" cy="127" rx="5" ry="2.5" fill="#f87171" />
      {/* RIGHT BRAID */}
      <path d="M 98 70 C 114 88 112 118 106 128 C 104 133 98 131 100 124 C 104 110 102 88 96 72 Z" fill="#1a0a04" />
      {[88, 100, 112].map((y, i) => <ellipse key={i} cx={104} cy={y} rx={5} ry={4} fill="#2d1408" opacity={0.9} />)}
      <ellipse cx="104" cy="127" rx="7" ry="4" fill="#dc2626" />
      <ellipse cx="104" cy="127" rx="5" ry="2.5" fill="#f87171" />
      {/* Flower in hair */}
      <circle cx="90" cy="43" r="5" fill="#fbbf24" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const px = 90 + Math.cos(rad) * 10;
        const py = 43 + Math.sin(rad) * 10;
        return <ellipse key={i} cx={px} cy={py} rx="5" ry="3" fill="#f97316" opacity="0.9" transform={`rotate(${deg},${px},${py})`} />;
      })}
      {/* EARS */}
      <ellipse cx="20" cy="74" rx="6" ry="7.5" fill="#c8916a" />
      <ellipse cx="100" cy="74" rx="6" ry="7.5" fill="#c8916a" />
      {/* LEFT EYE */}
      <ellipse cx="44" cy="68" rx="13" ry="14" fill="white" />
      <ellipse cx="44" cy="69" rx="9.5" ry="10.5" fill="#5c3010" />
      <circle cx="44" cy="69" r="6" fill="#120600" />
      <circle cx="47.5" cy="65" r="3" fill="white" />
      <circle cx="42" cy="67.5" r="1.4" fill="white" opacity="0.6" />
      <path d="M 31 68 Q 44 56 57 68" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      {/* RIGHT EYE */}
      <ellipse cx="76" cy="68" rx="13" ry="14" fill="white" />
      <ellipse cx="76" cy="69" rx="9.5" ry="10.5" fill="#5c3010" />
      <circle cx="76" cy="69" r="6" fill="#120600" />
      <circle cx="79.5" cy="65" r="3" fill="white" />
      <circle cx="74" cy="67.5" r="1.4" fill="white" opacity="0.6" />
      <path d="M 63 68 Q 76 56 89 68" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      {/* EYEBROWS */}
      <path d="M 32 56 Q 44 50 54 56" fill="none" stroke="#1a0a04" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M 88 56 Q 76 50 66 56" fill="none" stroke="#1a0a04" strokeWidth="2.8" strokeLinecap="round" />
      {/* NOSE */}
      <circle cx="60" cy="82" r="4" fill="#a87050" />
      <circle cx="56" cy="83.5" r="2" fill="#7a4828" opacity="0.7" />
      <circle cx="64" cy="83.5" r="2" fill="#7a4828" opacity="0.7" />
      {/* MOUTH — sweet smile */}
      <path d="M 48 94 Q 60 103 72 94" fill="none" stroke="#8a4020" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 50 94 Q 60 99 70 94 Q 60 102 50 94 Z" fill="#c07050" opacity="0.3" />
    </svg>
  );
}

function HindCarScene() {
  const holes: [number, number][] = [[72, 172], [86, 180], [94, 170], [82, 188], [100, 176]];
  return (
    <svg viewBox="0 0 640 220" width={620} height={213} style={{ display: "block", borderRadius: 6, maxWidth: "100%" }}>
      <defs>
        <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0404" />
          <stop offset="55%" stopColor="#2d0808" />
          <stop offset="100%" stopColor="#0f0505" />
        </linearGradient>
        <radialGradient id="camb" cx="43%" cy="88%" r="52%">
          <stop offset="0%" stopColor="#7c1d1d" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#7c1d1d" stopOpacity="0" />
        </radialGradient>
        <filter id="sfblur"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <rect width="640" height="220" fill="url(#csky)" />
      <rect width="640" height="220" fill="url(#camb)" />
      {/* Smoke plumes */}
      <ellipse cx="270" cy="68" rx="90" ry="36" fill="#0f0808" opacity="0.65" filter="url(#sfblur)" />
      <ellipse cx="330" cy="50" rx="66" ry="26" fill="#1a0808" opacity="0.5" filter="url(#sfblur)" />
      <ellipse cx="190" cy="80" rx="54" ry="22" fill="#0f0606" opacity="0.4" filter="url(#sfblur)" />
      {/* Road */}
      <rect x="0" y="184" width="640" height="36" fill="#1a1410" />
      <rect x="0" y="184" width="640" height="2" fill="#252018" />
      {/* Car shadow */}
      <ellipse cx="288" cy="186" rx="130" ry="7" fill="#000" opacity="0.55" />
      {/* WHEELS */}
      <ellipse cx="168" cy="182" rx="26" ry="10" fill="#0a0806" />
      <ellipse cx="168" cy="182" rx="16" ry="6" fill="#0f0c08" />
      <ellipse cx="400" cy="182" rx="26" ry="10" fill="#0a0806" />
      <ellipse cx="400" cy="182" rx="16" ry="6" fill="#0f0c08" />
      {/* CAR LOWER BODY */}
      <rect x="144" y="143" width="282" height="42" rx="5" fill="#0f0c08" />
      {/* CAR CABIN */}
      <path d="M 174 143 L 192 102 L 384 102 L 402 143 Z" fill="#0d0a07" />
      {/* HOOD */}
      <path d="M 384 102 L 426 135 L 426 143 L 402 143 Z" fill="#0b0906" />
      {/* TRUNK */}
      <path d="M 192 102 L 144 135 L 144 143 L 174 143 Z" fill="#0b0906" />
      {/* WINDSHIELD — shattered */}
      <path d="M 198 104 L 214 130 L 370 130 L 382 104 Z" fill="#060403" opacity="0.9" />
      <line x1="248" y1="104" x2="238" y2="130" stroke="#1a120a" strokeWidth="0.9" />
      <line x1="292" y1="104" x2="312" y2="130" stroke="#1a120a" strokeWidth="0.9" />
      <line x1="336" y1="106" x2="354" y2="130" stroke="#1a120a" strokeWidth="0.8" />
      {/* SIDE WINDOWS */}
      <rect x="180" y="130" width="78" height="13" rx="2" fill="#050302" opacity="0.9" />
      <rect x="278" y="130" width="78" height="13" rx="2" fill="#050302" opacity="0.9" />
      {/* DOOR DIVIDER */}
      <line x1="268" y1="143" x2="268" y2="185" stroke="#181410" strokeWidth="2" />
      {/* BULLET HOLES */}
      {holes.map(([bx, by], i) => (
        <g key={i}>
          <circle cx={bx} cy={by} r="4.5" fill="#060404" />
          <circle cx={bx} cy={by} r="2.8" fill="#0a0706" />
          {[0, 72, 144, 216, 288].map((deg, j) => {
            const rad = (deg * Math.PI) / 180;
            return <line key={j} x1={bx} y1={by} x2={bx + Math.cos(rad) * 8} y2={by + Math.sin(rad) * 8} stroke="#1a1208" strokeWidth="0.6" />;
          })}
        </g>
      ))}
      {/* Char marks */}
      <ellipse cx="260" cy="120" rx="68" ry="18" fill="#060403" opacity="0.7" />
      <ellipse cx="390" cy="132" rx="38" ry="14" fill="#060403" opacity="0.5" />
      {/* Ember glow */}
      <ellipse cx="288" cy="178" rx="100" ry="7" fill="#7c2d12" opacity="0.14" />
      {/* WILDFLOWER — Handala's tribute */}
      <path d="M 272 184 Q 275 171 273 159" fill="none" stroke="#4d7c0f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 273 169 Q 280 164 283 169 Q 279 173 273 169 Z" fill="#4d7c0f" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const px = 273 + Math.cos(rad) * 7;
        const py = 159 + Math.sin(rad) * 7;
        return <ellipse key={i} cx={px} cy={py} rx="4" ry="2.5" fill="#fbbf24" opacity="0.9" transform={`rotate(${deg},${px},${py})`} />;
      })}
      <circle cx="273" cy="159" r="4" fill="#f59e0b" />
      {/* HANDALA — silhouette, head bowed */}
      <ellipse cx="490" cy="183" rx="14" ry="4" fill="#000" opacity="0.4" />
      <ellipse cx="484" cy="182" rx="7" ry="3" fill="#181410" />
      <ellipse cx="497" cy="182" rx="7" ry="3" fill="#181410" />
      <rect x="483" y="162" width="8" height="20" rx="3" fill="#1e1810" />
      <rect x="491" y="162" width="8" height="20" rx="3" fill="#1e1810" />
      <rect x="480" y="140" width="22" height="24" rx="4" fill="#181410" />
      <rect x="472" y="144" width="8" height="18" rx="3" fill="#181410" />
      <rect x="502" y="144" width="8" height="18" rx="3" fill="#181410" />
      <circle cx="491" cy="130" r="13" fill="#1e1a14" />
      <path d="M 479 130 Q 479 118 491 118 Q 503 118 503 130 L 499 135 L 483 135 Z" fill="#2a2520" opacity="0.85" />
      {/* Date / location */}
      <text x="320" y="16" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.6">JANUARY 29, 2024 · GAZA CITY</text>
    </svg>
  );
}

function buildInitialState(charIndex: number, stageIndex: number): GameState {
  const stageDef = STAGE_DEFS[stageIndex];
  return {
    player: createPlayer(charIndex),
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    powerUps: [],
    collectibles: [],
    summons: [] as Summon[],
    projectiles: [],
    beam: { active: false, x: 0, y: 0, progress: 0, facingRight: true },
    keys: {},
    keysDown: {},
    shake: 0,
    waveKills: 0,
    waveTarget: 0,
    comboTimer: 0,
    score: 0,
    combo: 0,
    frameCount: 0,
    bgData: createBgData(stageDef.id),
    scoreMultiplier: 1,
    regenTimer: 0,
  };
}

function spawnWave(gs: GameState, stageIndex: number, waveIndex: number, isBoss: boolean): number {
  const stageDef = STAGE_DEFS[stageIndex];
  if (isBoss) {
    gs.enemies.push(spawnEnemy(stageDef.bossType));
    return 1;
  }
  const tier = stageDef.enemyTier;
  const count = 3 + waveIndex * 2;
  for (let i = 0; i < count; i++) {
    const type = tier[Math.floor(Math.random() * tier.length)];
    const e = spawnEnemy(type);
    e.x += i * 120;
    gs.enemies.push(e);
  }
  return count;
}

export default function GamePage({ onMusicStart }: GamePageProps) {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  const charIndex = Number(sessionStorage.getItem("gz_char") || "0");
  const startStage = Number(sessionStorage.getItem("gz_stage") || "0");

  const [phase, setPhase] = useState<Phase>("story");
  const [stageIndex, setStageIndex] = useState(startStage);
  const [stageScore, setStageScore] = useState(0);
  const [storyLine, setStoryLine] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);

  // ─── Pause / exit state ──────────────────────────────────────────────────
  const [paused, setPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const pausedRef = useRef(false);

  const stageIndexRef = useRef(stageIndex);
  const phaseRef = useRef<Phase>("story");
  const waveInStageRef = useRef(0);
  const inventoryRef = useRef<string[]>([]);

  const stageData = STAGE_DEFS[stageIndex];
  const storyLines = STAGE_STORIES[stageIndex] || [];

  // ─── Start / advance stage ───────────────────────────────────────────────

  const startStageGame = useCallback((sIdx: number) => {
    const gs = buildInitialState(charIndex, sIdx);
    applyCollectibleBuffs(gs.player, inventoryRef.current, (p) => particlesRef.current.push(p));
    spawnStageCollectibles(gs, sIdx);
    // Apply document multiplier
    if (inventoryRef.current.includes("documents")) gs.scoreMultiplier = 2;
    gsRef.current = gs;
    enemiesRef.current = gs.enemies;
    particlesRef.current = gs.particles;
    waveInStageRef.current = 0;
    // Spawn first wave
    const target = spawnWave(gs, sIdx, 0, false);
    gs.waveTarget = target;
    setPhase("playing");
    phaseRef.current = "playing";
  }, [charIndex]);

  const advanceWave = useCallback(() => {
    const gs = gsRef.current;
    if (!gs) return;
    const sIdx = stageIndexRef.current;
    const stageDef = STAGE_DEFS[sIdx];
    const nextWave = waveInStageRef.current + 1;
    waveInStageRef.current = nextWave;
    gs.waveKills = 0;

    if (nextWave >= stageDef.waves) {
      // Spawn boss
      const target = spawnWave(gs, sIdx, nextWave, true);
      gs.waveTarget = target;
    } else if (nextWave > stageDef.waves) {
      // Stage clear
      setStageScore(gs.score);
      setPhase("stage-clear");
      phaseRef.current = "stage-clear";
    } else {
      const target = spawnWave(gs, sIdx, nextWave, false);
      gs.waveTarget = target;
    }
  }, []);

  const onWaveComplete = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    advanceWave();
  }, [advanceWave]);

  const onPlayerDie = useCallback(() => {
    if (phaseRef.current === "dead") return;
    setPhase("dead");
    phaseRef.current = "dead";
  }, []);

  const onEnemyDie = useCallback((e: Enemy) => {
    const gs = gsRef.current;
    if (!gs) return;
    spawnDeathParticles(gs, e, (p) => particlesRef.current.push(p));
  }, []);

  const onCollectItem = useCallback((type: string) => {
    inventoryRef.current = [...inventoryRef.current, type];
    setInventory([...inventoryRef.current]);
  }, []);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [allyCD, setAllyCD] = useState<[number, number, number]>([0, 0, 0]);
  const [hindPage, setHindPage] = useState(0);
  const showHindRef = useRef(startStage === 1);

  // ─── Input ───────────────────────────────────────────────────────────────

  // ─── Pause toggle helper ─────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    setPaused((prev) => {
      pausedRef.current = !prev;
      return !prev;
    });
    setShowExitConfirm(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gs = gsRef.current;

      // Escape toggles pause during gameplay
      if (e.code === "Escape") {
        e.preventDefault();
        if (phaseRef.current === "playing") {
          togglePause();
        }
        return;
      }

      // While paused, ignore all game input
      if (pausedRef.current) return;

      if (phaseRef.current === "story") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setStoryLine((prev) => {
            const lines = STAGE_STORIES[stageIndexRef.current] || [];
            if (prev < lines.length - 1) return prev + 1;
            startStageGame(stageIndexRef.current);
            return 0;
          });
        }
        return;
      }
      if (phaseRef.current === "hind-story") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setHindPage((prev) => {
            if (prev < HIND_PAGES.length - 1) return prev + 1;
            setPhase("story");
            phaseRef.current = "story";
            return 0;
          });
        }
        return;
      }
      if (phaseRef.current === "stage-clear") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          const next = stageIndexRef.current + 1;
          if (next >= STAGE_DEFS.length) {
            setPhase("win");
            phaseRef.current = "win";
          } else {
            if (next === 1) showHindRef.current = true;
            stageIndexRef.current = next;
            setStageIndex(next);
            setStoryLine(0);
            setPhase("story");
            phaseRef.current = "story";
          }
        }
        return;
      }
      if (phaseRef.current === "dead" || phaseRef.current === "win") {
        if (e.code === "Space" || e.code === "Enter" || e.code === "KeyR") {
          e.preventDefault();
          navigate("/");
        }
        return;
      }
      if (!gs) return;
      gs.keys[e.code] = true;
      gs.keysDown[e.code] = true;
      const p = gs.player;

      // Jump
      if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !p.isJumping) {
        p.vy = -18;
        p.isJumping = true;
      }

      // Attack
      if ((e.code === "KeyZ" || e.code === "KeyJ") && !p.isAttacking) {
        // Rock throw if pressing up
        if (gs.keys["ArrowUp"] && p.rockCooldown <= 0) {
          p.rockCooldown = 120;
          const vx = p.facingRight ? 12 : -12;
          gs.projectiles.push({
            id: String(Math.random()), type: "rock",
            x: p.x + p.width / 2, y: p.y - p.height + 10,
            vx, vy: -10,
            targetX: p.x + vx * 20, targetY: FLOOR_Y,
            damage: 45, trail: [], life: 220, maxLife: 220,
            warned: true, warnTimer: 0, warnMaxTimer: 0,
            exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
          });
        } else {
          p.isAttacking = true;
          p.attackTimer = 22;
        }
      }

      // Spirit Blast
      if ((e.code === "KeyX" || e.code === "KeyK") && p.specialCooldown <= 0) {
        const charDef = CHARACTERS[p.activeChar];
        p.specialCooldown = charDef.blastCost;
        gs.beam = { active: true, x: p.x + p.width / 2, y: p.y - p.height / 2, progress: 0, facingRight: p.facingRight };
        for (let i = 0; i < 12; i++) {
          particlesRef.current.push({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 8 - 2, life: 24, maxLife: 24, color: charDef.color, size: 4 + Math.random() * 6 });
        }
      }

      // Rocket
      if (e.code === "KeyR" && p.rocketCooldown <= 0) {
        p.rocketCooldown = 240;
        const vx = p.facingRight ? 14 : -14;
        gs.projectiles.push({
          id: String(Math.random()), type: "rocket",
          x: p.x + (p.facingRight ? p.width : 0), y: p.y - p.height / 2,
          vx, vy: 0,
          targetX: 0, targetY: 0,
          damage: 90, trail: [], life: 280, maxLife: 280,
          warned: true, warnTimer: 0, warnMaxTimer: 0,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }

      // Summon
      if (e.code === "KeyV" && p.summonCooldown <= 0) {
        p.summonCooldown = 360;
        const dir = p.facingRight ? 1 : -1;
        gs.summons.push({
          id: String(Math.random()),
          x: p.x + p.width / 2, y: FLOOR_Y,
          vx: dir * 7,
          life: 180, maxLife: 180,
          dir,
        });
        particlesRef.current.push({ x: p.x + p.width / 2, y: p.y - p.height, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#a78bfa", text: "ALLY!", size: 14 });
      }

      // Switch character
      if (e.code === "KeyC") {
        const next = (p.activeChar + 1) % CHARACTERS.length;
        const nextDef = CHARACTERS[next];
        p.activeChar = next;
        p.color = nextDef.color;
        p.maxHp = nextDef.maxHp;
        p.hp = Math.min(p.hp, p.maxHp);
        p.charSwitchTimer = 80;
      }

      // Ally abilities (1/2/3)
      const allyKeys: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
      const allyIdx = allyKeys[e.code];
      if (allyIdx !== undefined && p.allyCD[allyIdx] <= 0) {
        p.allyCD[allyIdx] = 600;
        // Ally effect
        const effects = [
          () => { p.buffs.powerTimer = 250; particlesRef.current.push({ x: p.x + p.width / 2, y: p.y - p.height, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#22c55e", text: "KAREEM BOOST!", size: 12 }); },
          () => { p.buffs.speedTimer = 360; particlesRef.current.push({ x: p.x + p.width / 2, y: p.y - p.height, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#f97316", text: "MARIAM DASH!", size: 12 }); },
          () => { p.buffs.shielded = true; particlesRef.current.push({ x: p.x + p.width / 2, y: p.y - p.height, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#a78bfa", text: "SAMIR SHIELD!", size: 12 }); },
        ];
        effects[allyIdx]?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const gs = gsRef.current;
      if (!gs) return;
      gs.keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startStageGame, navigate]);

  // ─── Game loop ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const gs = gsRef.current;
      if (!gs) { rafRef.current = requestAnimationFrame(loop); return; }
      if (phaseRef.current !== "playing") { rafRef.current = requestAnimationFrame(loop); return; }

      // If paused, keep rendering the frozen frame but skip update
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      frameRef.current++;
      const frame = frameRef.current;

      // Scroll bg
      gs.bgData.offset += 0.6;

      updateGame(gs, enemiesRef.current, particlesRef.current, {
        onParticle: (p) => particlesRef.current.push(p),
        onEnemyDie,
        onPlayerDie,
        onWaveComplete,
        onComboChange: setCombo,
        onScoreChange: setScore,
        onAllyCD: setAllyCD,
        onCollectItem,
      });

      // ── Draw ──
      const shakeX = gs.shake > 0 ? (Math.random() - 0.5) * gs.shake : 0;
      const shakeY = gs.shake > 0 ? (Math.random() - 0.5) * gs.shake : 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawBackground(ctx, gs.bgData, frame);

      // Projectile warnings
      drawProjectileWarnings(ctx, gs.projectiles, gs.player, frame);

      // Collectibles
      for (const c of gs.collectibles) {
        if (!c.collected) drawCollectible(ctx, c as Parameters<typeof drawCollectible>[1], frame);
      }

      // Power-ups
      for (const pu of gs.powerUps) drawPowerUp(ctx, pu, frame);

      // Enemies
      for (const e of enemiesRef.current) {
        if (e.state !== "dead") drawEnemy(ctx, e, frame);
      }

      // Projectiles
      for (const pr of gs.projectiles) drawProjectile(ctx, pr, frame);

      // Player
      drawPlayer(ctx, gs, frame);

      // Particles
      for (const pt of particlesRef.current) drawParticle(ctx, pt);

      drawHUD(ctx, gs);

      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onEnemyDie, onPlayerDie, onWaveComplete, onCollectItem]);

  // ─── Init story on stage change ──────────────────────────────────────────
  useEffect(() => {
    stageIndexRef.current = stageIndex;
    setStoryLine(0);
    if (showHindRef.current) {
      showHindRef.current = false;
      setHindPage(0);
      setPhase("hind-story");
      phaseRef.current = "hind-story";
    } else {
      setPhase("story");
      phaseRef.current = "story";
    }
  }, [stageIndex]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const stageData2 = STAGE_DEFS[stageIndex];

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0c0a09", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Canvas container */}
      <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, maxWidth: "100vw", maxHeight: "100vh", flexShrink: 0, background: "#0c0a09" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated" }}
        />

        {/* Stage banner + pause/exit buttons */}
        {phase === "playing" && (
          <>
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 16, color: stageData2.color, textShadow: `0 0 12px ${stageData2.color}80`, direction: "rtl", lineHeight: 1.1 }}>
                {STAGE_ARABIC[stageIndex]}
              </div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: stageData2.color, letterSpacing: 1 }}>{stageData2.name}</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 4.5, color: "#6b7280", marginTop: 2 }}>
                WAVE {waveInStageRef.current + 1} / {stageData2.waves + 1}
              </div>
            </div>
            {/* HUD pause & exit buttons */}
            <div style={{ position: "absolute", top: 8, right: 10, display: "flex", gap: 6 }}>
              <button
                onClick={togglePause}
                title="Pause (Esc)"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid #44403c", borderRadius: 3, padding: "4px 9px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#9ca3af" }}
              >
                {paused ? "▶" : "⏸"}
              </button>
              <button
                onClick={() => { setPaused(true); pausedRef.current = true; setShowExitConfirm(true); }}
                title="Exit to menu"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid #44403c", borderRadius: 3, padding: "4px 9px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>
          </>
        )}

        {/* ── PAUSE OVERLAY ─────────────────────────────────────────────── */}
        {phase === "playing" && paused && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, backdropFilter: "blur(2px)" }}>
            {!showExitConfirm ? (
              <>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#fbbf24", textShadow: "0 0 20px #fbbf2470", letterSpacing: 3 }}>PAUSED</div>
                <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 28, color: "#f97316", direction: "rtl" }}>متوقف مؤقتاً</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 240 }}>
                  <button
                    onClick={togglePause}
                    style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", borderRadius: 4, padding: "12px 0", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#fff", letterSpacing: 1 }}
                  >
                    ▶  RESUME
                  </button>
                  <button
                    onClick={() => setShowExitConfirm(true)}
                    style={{ background: "rgba(239,68,68,0.1)", border: "2px solid #6b7280", borderRadius: 4, padding: "12px 0", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#9ca3af", letterSpacing: 1 }}
                  >
                    ✕  EXIT GAME
                  </button>
                </div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#44403c", marginTop: 4 }}>PRESS ESC TO RESUME</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#ef4444", textShadow: "0 0 16px #ef444450", letterSpacing: 2, textAlign: "center" }}>EXIT GAME?</div>
                <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid #44403c", borderRadius: 4, padding: "14px 24px", maxWidth: 340, textAlign: "center" }}>
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#d4d4d4", lineHeight: 2.2, margin: 0 }}>
                    Your progress in this stage will be lost. Handala is still waiting for you.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => navigate("/")}
                    style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444", borderRadius: 4, padding: "11px 24px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ef4444" }}
                  >
                    YES, EXIT
                  </button>
                  <button
                    onClick={() => { setShowExitConfirm(false); togglePause(); }}
                    style={{ background: "rgba(34,197,94,0.12)", border: "2px solid #22c55e", borderRadius: 4, padding: "11px 24px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#22c55e" }}
                  >
                    NO, CONTINUE
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Story screen */}
        {phase === "story" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <FlagBar />
            <div style={{ display: "flex", flex: 1, gap: 0 }}>
              {/* Map */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 16px", borderRight: "1px solid #292524", minWidth: 150 }}>
                <GazaMap currentStage={stageIndex} />
              </div>
              {/* Story content */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 28px", gap: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 48, color: stageData2.color, textShadow: `0 0 28px ${stageData2.color}70`, lineHeight: 1.2, direction: "rtl", letterSpacing: 2 }}>
                    {STAGE_ARABIC[stageIndex]}
                  </div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fff", letterSpacing: 3, marginTop: 4 }}>{stageData2.name}</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#9ca3af", marginTop: 4, letterSpacing: 1 }}>{stageData2.subtitle}</div>
                </div>

                <HistoryCard stageIndex={stageIndex} stageColor={stageData2.color} />

                <div style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${stageData2.color}70`, borderRadius: 4, padding: "14px 24px", maxWidth: 560, width: "100%", textAlign: "center", minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#fff", lineHeight: 2.1, margin: 0 }}>
                    {storyLines[storyLine] || ""}
                  </p>
                </div>

                {inventory.length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#9ca3af", marginBottom: 6 }}>CARRYING INTO THIS AREA:</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                      {inventory.map((type, i) => {
                        const def = COLLECTIBLE_DEFS[type];
                        return (
                          <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${def?.color || "#44403c"}`, borderRadius: 3, padding: "4px 8px" }}>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: def?.color || "#fff" }}>{def?.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#fbbf24", animation: "blink 1.1s step-end infinite" }}>
                  {storyLine < storyLines.length - 1 ? "SPACE / ENTER  ▶  NEXT" : "SPACE / ENTER  ▶  BEGIN"}
                </div>

                {/* Dot indicators */}
                <div style={{ display: "flex", gap: 6 }}>
                  {storyLines.map((_, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === storyLine ? stageData2.color : i < storyLine ? "#44403c" : "#292524", border: `1px solid ${i === storyLine ? stageData2.color : "#44403c"}`, transition: "all 0.2s" }} />
                  ))}
                </div>
              </div>
            </div>
            <FlagBar />
          </div>
        )}

        {/* ── HIND RAJAB MEMORIAL STORY ─────────────────────────────────── */}
        {phase === "hind-story" && (() => {
          const pg = HIND_PAGES[hindPage] ?? HIND_PAGES[0];
          const isLast = hindPage === HIND_PAGES.length - 1;
          const isFirst = hindPage === 0;
          return (
            <div style={{ position: "absolute", inset: 0, background: "#0a0505", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <FlagBar />

              {/* ── Portrait page ── */}
              {isFirst ? (
                <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
                  {/* Left — portrait */}
                  <div style={{ width: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid #3f1515", background: "rgba(120,20,20,0.08)", padding: "24px 16px", gap: 14 }}>
                    <HindPortrait />
                    <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 28, color: "#ef4444", direction: "rtl", opacity: 0.85 }}>هند رجب</div>
                  </div>
                  {/* Right — text */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 44px", gap: 22 }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6.5, color: "#ef444488", letterSpacing: 3, textTransform: "uppercase" }}>IN MEMORY OF</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#ef4444", textShadow: "0 0 32px #ef444460", lineHeight: 1.7, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#fca5a5", lineHeight: 2.1, textAlign: "center" }}>
                      {pg.body}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#9ca3af", marginTop: 8, lineHeight: 2 }}>
                      January 29, 2024 · Gaza City, Palestine
                    </div>
                  </div>
                </div>
              ) : pg.car ? (
                /* ── Car scene (last page) ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "20px 24px" }}>
                  <HindCarScene />
                  <div style={{ maxWidth: 560, textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#d4d4d4", lineHeight: 2.2 }}>
                      {pg.body}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Text-only pages ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 60px", gap: 28 }}>
                  {pg.heading && (
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: "#ef4444", textShadow: "0 0 24px #ef444450", lineHeight: 1.8, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fca5a5", lineHeight: 2.4, textAlign: "center", maxWidth: 680 }}>
                    {pg.body}
                  </div>
                </div>
              )}

              {/* Bottom bar */}
              <div style={{ borderTop: "1px solid #3f1515", padding: "14px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                {/* Progress dots */}
                <div style={{ display: "flex", gap: 7 }}>
                  {HIND_PAGES.map((_, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === hindPage ? "#ef4444" : i < hindPage ? "#7f1d1d" : "#2d1010", border: `1px solid ${i === hindPage ? "#ef4444" : "#3f1515"}`, transition: "all 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6.5, color: "#ef444488", animation: "blink 1.1s step-end infinite" }}>
                  {isLast ? "SPACE / ENTER  ▶  BEGIN" : "SPACE / ENTER  ▶  CONTINUE"}
                </div>
              </div>
              <FlagBar />
            </div>
          );
        })()}

        {/* Stage clear screen */}
        {phase === "stage-clear" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column" }}>
            <FlagBar />
            <div style={{ flex: 1, display: "flex" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 16px", borderRight: "1px solid #292524", minWidth: 150 }}>
                <GazaMap currentStage={Math.min(4, stageIndex + 1)} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 36px", gap: 14 }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: "#22c55e", textShadow: "0 0 20px #22c55e80", letterSpacing: 2 }}>AREA CLEARED!</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 36, color: stageData2.color, textShadow: `0 0 20px ${stageData2.color}60`, direction: "rtl" }}>
                    {STAGE_ARABIC[stageIndex]}
                  </div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: stageData2.color, letterSpacing: 2 }}>
                    {stageData2.name} — SURVIVED
                  </div>
                </div>

                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#fbbf24" }}>SCORE: {stageScore.toLocaleString()}</div>

                {stageIndex < STAGE_DEFS.length - 1 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#9ca3af", marginBottom: 6 }}>HEADING TO:</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: STAGE_DEFS[stageIndex + 1]?.color || "#fff" }}>
                      {STAGE_DEFS[stageIndex + 1]?.name}
                    </div>
                  </div>
                )}

                {/* Items collected this stage */}
                {(() => {
                  const stageItems = STAGE_COLLECTIBLES[stageIndex] || [];
                  const collected = stageItems.filter((t) => inventory.includes(t));
                  if (collected.length === 0) return null;
                  return (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#9ca3af", marginBottom: 6 }}>ITEMS COLLECTED:</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {collected.map((type, i) => {
                          const def = COLLECTIBLE_DEFS[type];
                          return (
                            <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${def?.color || "#44403c"}`, borderRadius: 3, padding: "4px 10px" }}>
                              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: def?.color || "#fff" }}>{def?.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#fbbf24", animation: "blink 1.1s step-end infinite" }}>
                  {stageIndex < STAGE_DEFS.length - 1 ? "SPACE / ENTER  ▶  CONTINUE" : "SPACE / ENTER  ▶  FINISH"}
                </div>
              </div>
            </div>
            <FlagBar />
          </div>
        )}

        {/* Win screen */}
        {phase === "win" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, overflowY: "auto" }}>
            <FlagBar />
            <GazaMap currentStage={4} />
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: "#22c55e", textShadow: "0 0 30px #22c55e", textAlign: "center", letterSpacing: 2 }}>YOU ESCAPED!</div>
            <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 36, color: "#22c55e", direction: "rtl" }}>رفح — حرية</div>
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid #22c55e44", borderRadius: 6, padding: "14px 24px", maxWidth: 520, textAlign: "center" }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7.5, color: "#22c55e", marginBottom: 10 }}>HANDALA FINDS NOUR</div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7.5, color: "#d4d4d4", lineHeight: 2.2, margin: 0 }}>
                He ran through the crowd at the Rafah crossing, calling her name. Then he heard her voice. <span style={{ color: "#22c55e" }}>Nour was there.</span>
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7.5, color: "#d4d4d4", lineHeight: 2.2, margin: "10px 0 0" }}>
                She held him and said: <span style={{ color: "#fbbf24" }}>"You came. I knew you would."</span>
              </p>
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7.5, color: "#9ca3af", textAlign: "center", maxWidth: 480, lineHeight: 2 }}>
              The struggle for Gaza never ends — but today, two children found each other. And that matters.
            </div>
            <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 28, color: "#f97316", direction: "rtl" }}>فلسطين ستبقى حرة</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#fbbf24" }}>FINAL SCORE: {score.toLocaleString()}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#fbbf24", animation: "blink 1.1s step-end infinite" }}>SPACE / ENTER  ▶  MAIN MENU</div>
            <FlagBar />
          </div>
        )}

        {/* Dead screen */}
        {phase === "dead" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: "#ef4444", textShadow: "0 0 30px #ef4444" }}>YOU FELL</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#9ca3af", textAlign: "center", maxWidth: 420, lineHeight: 2 }}>
              Gaza remembers. The fight goes on.
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#fbbf24" }}>SCORE: {score.toLocaleString()}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={() => {
                  stageIndexRef.current = startStage;
                  setStageIndex(startStage);
                  inventoryRef.current = [];
                  setInventory([]);
                  setPhase("story");
                  phaseRef.current = "story";
                }}
                style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444", borderRadius: 4, padding: "10px 24px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#fff" }}
              >
                TRY AGAIN
              </button>
              <button
                onClick={() => navigate("/")}
                style={{ background: "rgba(100,100,100,0.15)", border: "2px solid #6b7280", borderRadius: 4, padding: "10px 24px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#9ca3af" }}
              >
                MENU
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
