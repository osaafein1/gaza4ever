import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import GazaMap from "../components/GazaMap";
import {
  CANVAS_W, CANVAS_H, FLOOR_Y,
  CHARACTERS, STAGE_DEFS, STAGE_COLLECTIBLES, STAGE_STORIES, STAGE_ARABIC, STAGE_HISTORY, COLLECTIBLE_DEFS,
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

type Phase = "story" | "playing" | "stage-clear" | "win" | "dead";

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
  if (!h) return null;
  return (
    <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${stageColor}44`, borderRadius: 4, padding: "10px 16px", maxWidth: 540, width: "100%" }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6.5, color: stageColor, marginBottom: 8 }}>{h.title}</div>
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5.5, color: "#d4d4d4", lineHeight: 2, margin: 0, marginBottom: 8 }}>{h.text}</p>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#6b7280", borderTop: `1px solid ${stageColor}30`, paddingTop: 6 }}>{h.fact}</div>
    </div>
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
      if (phaseRef.current === "stage-clear") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          const next = stageIndexRef.current + 1;
          if (next >= STAGE_DEFS.length) {
            setPhase("win");
            phaseRef.current = "win";
          } else {
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
    setPhase("story");
    phaseRef.current = "story";
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
