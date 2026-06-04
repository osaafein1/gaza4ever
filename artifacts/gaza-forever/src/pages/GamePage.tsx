import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import GazaMap from "../components/GazaMap";
import {
  CANVAS_W, CANVAS_H, FLOOR_Y,
  CHARACTERS, STAGE_DEFS, STAGE_COLLECTIBLES, getStageStories, STAGE_ARABIC, STAGE_HISTORY, STAGE_LANDMARKS, COLLECTIBLE_DEFS, SHOP_WEAPONS,
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
import { startMusic } from "../lib/music";

type Phase = "story" | "playing" | "stage-clear" | "win" | "dead" | "hind-story" | "khalid-story" | "nasser-story";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 580, width: "100%" }}>
      {/* Area history */}
      <div style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${stageColor}44`, borderRadius: 6, padding: "12px 18px" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: stageColor, marginBottom: 10 }}>{h.title}</div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10.5, color: "#d4d4d4", lineHeight: 2.2, margin: 0, marginBottom: 10 }}>{h.text}</p>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#6b7280", borderTop: `1px solid ${stageColor}30`, paddingTop: 8 }}>{h.fact}</div>
      </div>
      {/* Destroyed landmark */}
      {lm && (
        <div style={{ background: "rgba(0,0,0,0.55)", border: "1px solid #7f1d1d88", borderRadius: 6, padding: "12px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ef4444" }}>▶ DESTROYED</span>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fca5a5" }}>{lm.name}</span>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9.5, color: "#f87171", marginBottom: 8, opacity: 0.85 }}>{lm.when}</div>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10.5, color: "#c4b5b5", lineHeight: 2.2, margin: 0, marginBottom: lm.impact?.length ? 10 : 0 }}>{lm.desc}</p>
          {lm.impact && lm.impact.length > 0 && (
            <div style={{ borderTop: "1px solid #7f1d1d55", paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {lm.impact.map((fact, i) => (
                <div key={i} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9.5, color: "#fbbf24", lineHeight: 1.9 }}>
                  ◆ {fact}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Nasser Hospital / Khan Younis story ─────────────────────────────────────

function getNasserPages(charName: string) {
  return [
  {
    heading: "They needed help.",
    body: `${charName} had been walking for days through the rubble of Khan Younis. They were bleeding. Someone told them: there is still a hospital — Nasser Medical Complex. It is the largest in the south. Go there.`,
    scene: false,
    hospital: true,
  },
  {
    heading: "Nasser Medical Complex",
    body: "For months it stood as the last refuge. Thousands of wounded arrived — children with no limbs, parents carrying dead sons. Doctors worked without electricity, without anaesthetic, operating by the light of mobile phones.",
    scene: false,
    hospital: false,
  },
  {
    heading: "February 2024",
    body: "Israeli forces surrounded the hospital. Armoured vehicles sealed every road. Soldiers entered the wards. Patients on ventilators were left to die when the generators were cut. Dozens of medical staff were dragged out, blindfolded, and detained.",
    scene: false,
    hospital: false,
  },
  {
    heading: "The snipers were still there.",
    body: "After the raid, Israeli snipers positioned on the hospital rooftops and surrounding buildings shot anyone who came close. A nurse. A father carrying his child. An ambulance driver. The road to the hospital became a killing ground.",
    scene: false,
    hospital: false,
  },
  {
    heading: null,
    body: `${charName} reached the gate. They saw what remained. They sat down in the dust, holding a bleeding wound. The crescent had been shelled. There was nowhere left to go.`,
    scene: true,
    hospital: false,
  },
  ];
}

function NasserIntroPanel() {
  return (
    <svg viewBox="0 0 120 170" width={196} height={277} style={{ display: "block", filter: "drop-shadow(0 0 22px rgba(239,68,68,0.22))" }}>
      <defs>
        <radialGradient id="nhalo" cx="50%" cy="55%" r="56%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="90" r="64" fill="url(#nhalo)" />
      {/* Hospital building silhouette */}
      <rect x="10" y="70" width="100" height="80" rx="2" fill="#141008" />
      <rect x="18" y="58" width="84" height="16" rx="2" fill="#181408" />
      <rect x="30" y="46" width="60" height="16" rx="2" fill="#1a1608" />
      {/* Broken windows */}
      {[[18,78],[40,78],[62,78],[84,78],[18,100],[40,100],[62,100],[84,100],[18,122],[40,122],[62,122],[84,122]].map(([wx,wy],i) => (
        <rect key={i} x={wx} y={wy} width="14" height="14" rx="1" fill={i%3===1?"#0a0806":"#0d0a06"} opacity={0.9} />
      ))}
      {/* Cracked/broken window overlays */}
      <line x1="18" y1="78" x2="32" y2="92" stroke="#050402" strokeWidth="0.8" opacity="0.7" />
      <line x1="62" y1="100" x2="76" y2="114" stroke="#050402" strokeWidth="0.8" opacity="0.7" />
      {/* Red Crescent symbol — damaged */}
      <text x="60" y="68" textAnchor="middle" fill="#dc2626" fontSize="18" fontFamily="serif" opacity="0.75">☽</text>
      <line x1="48" y1="54" x2="74" y2="80" stroke="#dc2626" strokeWidth="1.5" opacity="0.55" />
      {/* Sniper on rooftop */}
      <circle cx="92" cy="44" r="5" fill="#1a1408" />
      <rect x="88" y="49" width="8" height="10" rx="2" fill="#161208" />
      <line x1="88" y1="52" x2="78" y2="58" stroke="#1a1408" strokeWidth="3" strokeLinecap="round" />
      {/* Gun barrel */}
      <line x1="86" y1="53" x2="68" y2="60" stroke="#0f0c08" strokeWidth="1.8" strokeLinecap="round" />
      {/* Sniper crosshair glow */}
      <circle cx="68" cy="61" r="4" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.45" />
      <line x1="64" y1="61" x2="72" y2="61" stroke="#ef4444" strokeWidth="0.5" opacity="0.45" />
      <line x1="68" y1="57" x2="68" y2="65" stroke="#ef4444" strokeWidth="0.5" opacity="0.45" />
      {/* Rubble at base */}
      <path d="M 10 150 Q 30 144 50 150 Q 70 144 90 150 Q 110 144 110 150 L 110 170 L 10 170 Z" fill="#0f0c08" />
      {/* Handala small silhouette, stopped at gate */}
      <ellipse cx="40" cy="153" rx="6" ry="2" fill="#000" opacity="0.4" />
      <circle cx="40" cy="140" r="5.5" fill="#1a1610" />
      <rect x="36" y="145" width="8" height="10" rx="2" fill="#151210" />
      {/* Arm reaching toward hospital */}
      <line x1="44" y1="148" x2="54" y2="146" stroke="#151210" strokeWidth="3" strokeLinecap="round" />
      {/* STOP / barbed wire barrier */}
      <rect x="52" y="148" width="30" height="3" rx="1" fill="#1e1810" />
      {[54,60,66,72,78].map((bx, i) => (
        <line key={i} x1={bx} y1={148} x2={bx+2} y2={151} stroke="#ef4444" strokeWidth="0.9" opacity={0.7} />
      ))}
      {/* Warning sign */}
      <rect x="54" y="130" width="20" height="14" rx="1" fill="#1a1208" />
      <text x="64" y="141" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.85">!</text>
      <line x1="64" y1="144" x2="64" y2="148" stroke="#1a1208" strokeWidth="1.5" />
    </svg>
  );
}

function NasserHospitalScene() {
  const brokenWins: [number,number][] = [[62,52],[92,52],[122,52],[62,82],[92,82],[122,82],[62,112],[92,112],[122,112],[152,52],[152,82],[152,112]];
  const rubblePts: [number,number,number,number][] = [[30,208,28,9],[70,204,18,7],[440,206,24,8],[490,202,16,6],[540,208,20,7],[580,204,14,5]];
  return (
    <svg viewBox="0 0 640 240" width={620} height={233} style={{ display: "block", borderRadius: 6, maxWidth: "100%" }}>
      <defs>
        <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0404" />
          <stop offset="45%" stopColor="#180808" />
          <stop offset="100%" stopColor="#0a0404" />
        </linearGradient>
        <radialGradient id="namb" cx="38%" cy="88%" r="55%">
          <stop offset="0%" stopColor="#7c1d1d" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7c1d1d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sniperglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="nbl"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="nbl2"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      {/* Sky */}
      <rect width="640" height="240" fill="url(#nsky)" />
      <rect width="640" height="240" fill="url(#namb)" />
      {/* Stars */}
      {[[40,14],[90,8],[170,20],[280,6],[390,16],[480,10],[560,22],[75,34],[340,28],[530,38]].map(([sx,sy],i) => (
        <circle key={i} cx={sx} cy={sy} r={1.1} fill="#fff" opacity={0.3+i*0.04} />
      ))}
      {/* Smoke plumes (burning hospital) */}
      <ellipse cx="200" cy="50" rx="80" ry="30" fill="#0c0606" opacity="0.7" filter="url(#nbl)" />
      <ellipse cx="260" cy="34" rx="60" ry="22" fill="#150808" opacity="0.55" filter="url(#nbl)" />
      <ellipse cx="140" cy="62" rx="50" ry="20" fill="#0a0404" opacity="0.45" filter="url(#nbl)" />
      {/* ── NASSER HOSPITAL BUILDING ── */}
      {/* Main body */}
      <rect x="42" y="80" width="360" height="130" rx="3" fill="#110e08" />
      {/* Upper floor */}
      <rect x="72" y="54" width="300" height="32" rx="2" fill="#131008" />
      {/* Roof parapet */}
      <rect x="62" y="46" width="320" height="12" rx="2" fill="#151208" />
      {/* Cracks in facade */}
      <path d="M 120 80 L 108 110 L 115 140" fill="none" stroke="#0a0806" strokeWidth="2" opacity="0.7" />
      <path d="M 280 54 L 270 80 L 285 110" fill="none" stroke="#0a0806" strokeWidth="2" opacity="0.6" />
      <path d="M 360 80 L 375 120 L 368 150" fill="none" stroke="#0a0806" strokeWidth="1.5" opacity="0.5" />
      {/* Shell hole */}
      <ellipse cx="220" cy="108" rx="28" ry="22" fill="#0a0806" />
      <ellipse cx="220" cy="108" rx="20" ry="15" fill="#080604" />
      {/* Broken windows */}
      {brokenWins.map(([wx,wy],i) => (
        <g key={i}>
          <rect x={wx} y={wy} width="22" height="22" rx="1" fill={i%4===2?"#060403":"#080604"} />
          <line x1={wx} y1={wy} x2={wx+22} y2={wy+22} stroke="#0d0a06" strokeWidth="0.7" opacity="0.6" />
          <line x1={wx+22} y1={wy} x2={wx} y2={wy+22} stroke="#0d0a06" strokeWidth="0.7" opacity="0.6" />
        </g>
      ))}
      {/* Collapsed left wing */}
      <path d="M 42 140 Q 20 148 10 160 L 10 210 L 80 210 L 80 170 L 60 155 L 42 140 Z" fill="#0d0a06" />
      {/* Red Crescent symbol — cracked */}
      <text x="218" y="44" textAnchor="middle" fill="#dc2626" fontSize="26" fontFamily="serif" opacity="0.55">☽</text>
      <text x="236" y="44" textAnchor="middle" fill="#dc2626" fontSize="14" fontFamily="serif" opacity="0.45">✚</text>
      <line x1="195" y1="22" x2="252" y2="52" stroke="#dc2626" strokeWidth="2.5" opacity="0.35" />
      {/* ── SNIPERS on rooftop ── */}
      {/* Sniper 1 */}
      <circle cx="110" cy="42" r="6" fill="#1a1610" />
      <rect x="106" y="48" width="9" height="12" rx="2" fill="#161410" />
      <line x1="106" y1="52" x2="92" y2="56" stroke="#1a1610" strokeWidth="4" strokeLinecap="round" />
      <line x1="104" y1="53" x2="82" y2="60" stroke="#0f0c08" strokeWidth="2" strokeLinecap="round" />
      {/* Gun flash */}
      <ellipse cx="81" cy="60" rx="5" ry="3" fill="#fbbf24" opacity="0.35" filter="url(#nbl2)" />
      {/* Sniper 2 */}
      <circle cx="310" cy="42" r="6" fill="#1a1610" />
      <rect x="306" y="48" width="9" height="12" rx="2" fill="#161410" />
      <line x1="306" y1="52" x2="292" y2="56" stroke="#1a1610" strokeWidth="4" strokeLinecap="round" />
      <line x1="304" y1="53" x2="558" y2="148" stroke="#ef4444" strokeWidth="0.6" opacity="0.18" strokeDasharray="4 6" />
      {/* Sniper 3 on adjacent building */}
      <rect x="420" y="90" width="80" height="100" rx="2" fill="#0e0b08" />
      <rect x="410" y="80" width="100" height="16" rx="2" fill="#121008" />
      <circle cx="468" cy="74" r="6" fill="#1a1610" />
      <rect x="464" y="80" width="9" height="12" rx="2" fill="#161410" />
      <line x1="464" y1="84" x2="450" y2="88" stroke="#1a1610" strokeWidth="4" strokeLinecap="round" />
      <line x1="462" y1="85" x2="240" y2="160" stroke="#ef4444" strokeWidth="0.5" opacity="0.15" strokeDasharray="4 6" />
      {/* Laser dot */}
      <circle cx="240" cy="161" r="3" fill="#ef4444" opacity="0.5" filter="url(#nbl2)" />
      {/* ── BARRICADE / road block ── */}
      <rect x="190" y="196" width="180" height="8" rx="2" fill="#1a1610" />
      {[196,212,228,244,260,276,292,308,324,340,356].map((bx,i) => (
        <line key={i} x1={bx} y1={196} x2={bx-6} y2={204} stroke="#ef4444" strokeWidth="1.2" opacity={0.65} />
      ))}
      {/* WARNING sign */}
      <rect x="232" y="178" width="36" height="18" rx="2" fill="#1a1008" />
      <text x="250" y="191" textAnchor="middle" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold" opacity="0.88">✕</text>
      <line x1="250" y1="196" x2="250" y2="204" stroke="#1a1008" strokeWidth="2" />
      {/* ── Ground / rubble ── */}
      <rect x="0" y="208" width="640" height="32" fill="#0a0806" />
      {rubblePts.map(([rx,ry,rw,rh],i) => (
        <ellipse key={i} cx={rx} cy={ry} rx={rw} ry={rh} fill="#0f0c08" opacity={0.85} />
      ))}
      {/* ── HANDALA — sitting in the dust at the gate ── */}
      <ellipse cx="530" cy="212" rx="20" ry="5" fill="#000" opacity="0.4" />
      {/* Sitting pose legs */}
      <path d="M 520 208 Q 516 218 526 220 Q 534 218 534 208 Z" fill="#161410" />
      {/* Body hunched */}
      <rect x="520" y="192" width="20" height="18" rx="4" fill="#141210" />
      {/* Head bowed down */}
      <circle cx="530" cy="184" r="12" fill="#1a1810" />
      <path d="M 518 180 Q 518 174 530 174 Q 542 174 542 180 L 538 183 L 522 183 Z" fill="#222018" opacity="0.9" />
      {/* Arm holding leg (wounded) */}
      <path d="M 520 202 Q 512 214 516 222" fill="none" stroke="#141210" strokeWidth="7" strokeLinecap="round" />
      {/* Bloodstain */}
      <ellipse cx="516" cy="221" rx="5" ry="3" fill="#7c1d1d" opacity="0.55" filter="url(#nbl2)" />
      {/* Caption */}
      <text x="320" y="18" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.58">NASSER MEDICAL COMPLEX · KHAN YOUNIS · FEB 2024</text>
    </svg>
  );
}

// ─── Khalid & Reem Nabhan memorial story ─────────────────────────────────────

function getKhalidPages(charName: string) {
  return [
  {
    heading: "His name was Khalid Nabhan.",
    body: "He was a grandfather from Jabalia, northern Gaza. He called his granddaughter Reem روح الروح — the soul of his soul.",
    portrait: true,
    grave: false,
  },
  {
    heading: "October 2023 — Jabalia",
    body: "When Israeli bombs fell on Jabalia refugee camp, Reem Nabhan was killed. She was a small child — the light of her grandfather's world. Khalid appeared on camera, searching for words that could hold the weight of her loss.",
    portrait: false,
    grave: false,
  },
  {
    heading: '"She was everything to me."',
    body: '"I loved her so much. She used to play beside me every morning. Now I sit and she does not come." His words reached the world. They became a symbol of what Gaza had lost — not a statistic, but a name, a laugh, a presence.',
    portrait: false,
    grave: false,
  },
  {
    heading: "Then Khalid too was gone.",
    body: "Months later, Khalid Nabhan was also killed in the bombardment of Gaza. The grandfather who mourned his granddaughter now rested beside her. Two souls — reunited in the rubble of Jabalia.",
    portrait: false,
    grave: false,
  },
  {
    heading: null,
    body: `${charName} found their graves among the ruins. They knelt. They placed a red rose for Reem — and one for Khalid. They stayed in silence. Then they kept walking south.`,
    portrait: false,
    grave: true,
  },
  ];
}

// ─── Hind Rajab memorial story ────────────────────────────────────────────────

function getHindPages(charName: string) {
  return [
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
    body: `Her body was found. She was still inside the car. She was six years old. The same age as ${charName}.`,
    portrait: false,
    car: false,
  },
  {
    heading: null,
    body: `${charName} stopped here. They placed a small wildflower against the door. They stood in silence. Then they walked on.`,
    portrait: false,
    car: true,
  },
  ];
}

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

function KhalidPortrait() {
  return (
    <svg viewBox="0 0 120 170" width={196} height={277} style={{ display: "block", filter: "drop-shadow(0 0 22px rgba(34,197,94,0.25))" }}>
      <defs>
        <radialGradient id="khalo" cx="50%" cy="44%" r="56%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="80" r="62" fill="url(#khalo)" />
      {/* BODY — white Palestinian thobe */}
      <path d="M 12 170 L 6 108 Q 60 130 114 108 L 108 170 Z" fill="#e8e3d6" />
      <path d="M 46 112 L 60 120 L 74 112 L 74 109 L 60 117 L 46 109 Z" fill="#ccc8b8" />
      {/* NECK */}
      <rect x="52" y="98" width="16" height="16" rx="4" fill="#8a6a50" />
      {/* HEAD */}
      <circle cx="60" cy="72" r="36" fill="#8a6a50" />
      {/* Cheeks (aged) */}
      <ellipse cx="36" cy="78" rx="9" ry="7" fill="#7a5840" opacity="0.25" />
      <ellipse cx="84" cy="78" rx="9" ry="7" fill="#7a5840" opacity="0.25" />
      {/* KEFFIYEH dome (white, top of head only) */}
      <path d="M 24 62 Q 24 34 60 30 Q 96 34 96 62 Q 80 56 60 56 Q 40 56 24 62 Z" fill="#f5f0e6" />
      {/* Folded forehead band */}
      <path d="M 24 62 Q 60 58 96 62 Q 60 64 24 62 Z" fill="#e0d8c4" />
      {/* Check grid on dome */}
      <path d="M 28 50 Q 60 48 92 50" stroke="#2a1a0a" strokeWidth="0.7" fill="none" opacity="0.12" />
      <path d="M 26 42 Q 60 40 94 42" stroke="#2a1a0a" strokeWidth="0.7" fill="none" opacity="0.10" />
      <path d="M 60 56 L 60 30" stroke="#2a1a0a" strokeWidth="0.6" opacity="0.09" />
      <path d="M 43 54 L 45 32" stroke="#2a1a0a" strokeWidth="0.6" opacity="0.08" />
      <path d="M 77 54 L 75 32" stroke="#2a1a0a" strokeWidth="0.6" opacity="0.08" />
      {/* Left drape */}
      <path d="M 24 64 Q 14 80 12 102 L 20 100 Q 20 82 26 68 Z" fill="#f0ebe0" opacity="0.9" />
      {/* EARS */}
      <ellipse cx="24" cy="74" rx="5" ry="6" fill="#7a5840" />
      <ellipse cx="96" cy="74" rx="5" ry="6" fill="#7a5840" />
      {/* EYES — aged, deep-set, sorrowful */}
      <path d="M 54 65 Q 44 61 32 66" fill="none" stroke="#6a4828" strokeWidth="0.9" opacity="0.32" />
      <path d="M 66 65 Q 76 61 88 66" fill="none" stroke="#6a4828" strokeWidth="0.9" opacity="0.32" />
      <path d="M 33 75 Q 44 79 55 75" fill="none" stroke="#7a5838" strokeWidth="0.9" opacity="0.28" />
      <path d="M 65 75 Q 76 79 87 75" fill="none" stroke="#7a5838" strokeWidth="0.9" opacity="0.28" />
      {/* Left eye */}
      <ellipse cx="44" cy="70" rx="10" ry="10" fill="white" />
      <ellipse cx="44" cy="71" rx="7.5" ry="8" fill="#3d2010" />
      <circle cx="44" cy="71" r="4.8" fill="#080300" />
      <circle cx="46.5" cy="68" r="2.5" fill="white" />
      {/* Right eye */}
      <ellipse cx="76" cy="70" rx="10" ry="10" fill="white" />
      <ellipse cx="76" cy="71" rx="7.5" ry="8" fill="#3d2010" />
      <circle cx="76" cy="71" r="4.8" fill="#080300" />
      <circle cx="78.5" cy="68" r="2.5" fill="white" />
      {/* EYEBROWS — bushy, grey-white, elderly */}
      <path d="M 32 60 Q 44 54 56 60" fill="none" stroke="#b8b0a0" strokeWidth="4" strokeLinecap="round" />
      <path d="M 88 60 Q 76 54 64 60" fill="none" stroke="#b8b0a0" strokeWidth="4" strokeLinecap="round" />
      {/* NOSE */}
      <path d="M 56 78 Q 56 85 60 87 Q 64 85 64 78" fill="none" stroke="#7a5838" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="57" cy="86" r="2" fill="#7a5838" opacity="0.55" />
      <circle cx="63" cy="86" r="2" fill="#7a5838" opacity="0.55" />
      {/* MOUTH — downturned with grief */}
      <path d="M 46 94 Q 60 91 74 94" fill="none" stroke="#6a4020" strokeWidth="2" strokeLinecap="round" />
      <path d="M 46 94 Q 50 98 54 97" fill="none" stroke="#6a4020" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
      <path d="M 74 94 Q 70 98 66 97" fill="none" stroke="#6a4020" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
      {/* FULL WHITE BEARD — dignified Palestinian elder */}
      <path d="M 24 84 Q 20 104 24 120 Q 38 132 60 134 Q 82 132 96 120 Q 100 104 96 84 Q 80 94 60 94 Q 40 94 24 84 Z" fill="#f0ece4" />
      <path d="M 30 90 Q 28 110 30 122" fill="none" stroke="#ddd8cc" strokeWidth="1" opacity="0.6" />
      <path d="M 44 95 Q 44 116 46 128" fill="none" stroke="#ddd8cc" strokeWidth="1" opacity="0.5" />
      <path d="M 60 96 L 60 132" fill="none" stroke="#ddd8cc" strokeWidth="1" opacity="0.5" />
      <path d="M 76 95 Q 76 116 74 128" fill="none" stroke="#ddd8cc" strokeWidth="1" opacity="0.5" />
      <path d="M 90 90 Q 92 110 90 122" fill="none" stroke="#ddd8cc" strokeWidth="1" opacity="0.6" />
      <path d="M 46 93 Q 60 90 74 93" fill="none" stroke="#e4e0d8" strokeWidth="3.5" strokeLinecap="round" />
      {/* Small photo frame — Reem */}
      <rect x="72" y="20" width="38" height="46" rx="3" fill="#1e1206" />
      <rect x="74" y="22" width="34" height="42" rx="2" fill="#120a04" />
      {/* Child face */}
      <circle cx="91" cy="36" r="10" fill="#c8916a" opacity="0.75" />
      <path d="M 81 32 Q 81 23 91 23 Q 101 23 101 32 L 98 27 Q 91 21 84 27 Z" fill="#1a0a04" opacity="0.82" />
      <path d="M 86 40 Q 91 44 96 40" fill="none" stroke="#8a5030" strokeWidth="1.5" strokeLinecap="round" opacity="0.82" />
      <circle cx="87" cy="35" r="2.4" fill="#060200" opacity="0.8" />
      <circle cx="95" cy="35" r="2.4" fill="#060200" opacity="0.8" />
      <rect x="72" y="20" width="38" height="46" rx="3" fill="none" stroke="#8a6840" strokeWidth="1.2" />
      <text x="91" y="73" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="'Noto Sans Arabic', Arial, sans-serif" opacity="0.88">ريم</text>
    </svg>
  );
}

function KhalidGraveScene() {
  const stars: [number, number][] = [[55,18],[110,10],[195,26],[295,8],[415,16],[498,22],[572,12],[78,38],[444,34],[530,48]];
  const rubble: [number,number,number,number][] = [[170,203,22,8],[205,199,14,6],[558,204,18,7],[585,200,12,5],[348,203,16,6],[430,201,20,7]];
  return (
    <svg viewBox="0 0 640 240" width={620} height={233} style={{ display: "block", borderRadius: 6, maxWidth: "100%" }}>
      <defs>
        <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#040c04" />
          <stop offset="55%" stopColor="#0a1a0a" />
          <stop offset="100%" stopColor="#050a05" />
        </linearGradient>
        <radialGradient id="gamb" cx="50%" cy="92%" r="52%">
          <stop offset="0%" stopColor="#14532d" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
        </radialGradient>
        <filter id="gbl"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="gbl2"><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>
      {/* Sky */}
      <rect width="640" height="240" fill="url(#gsky)" />
      <rect width="640" height="240" fill="url(#gamb)" />
      {/* Stars */}
      {stars.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={1.2} fill="#fff" opacity={0.35 + i * 0.04} />
      ))}
      {/* Crescent moon */}
      <circle cx="580" cy="30" r="13" fill="#0a1a0a" />
      <circle cx="574" cy="28" r="10" fill="#1a2d1a" />
      {/* Ruined buildings silhouette */}
      <path d="M 0 162 L 48 162 L 48 112 L 68 90 L 88 112 L 88 132 L 118 132 L 118 102 L 138 80 L 158 102 L 158 162 L 198 162 L 198 122 L 218 100 L 238 122 L 238 162 L 640 162 L 640 200 L 0 200 Z" fill="#0a0e08" />
      {[[64,106],[128,108],[212,114]].map(([wx, wy], i) => (
        <rect key={i} x={wx} y={wy} width="12" height="14" rx="1" fill="#141a10" opacity="0.8" />
      ))}
      {/* Ground */}
      <rect x="0" y="200" width="640" height="40" fill="#0a0e08" />
      <path d="M 0 200 Q 80 196 160 200 Q 240 204 320 200 Q 400 196 480 200 Q 560 204 640 200" fill="none" stroke="#141a10" strokeWidth="2" />
      {/* Rubble */}
      {rubble.map(([rx, ry, rw, rh], i) => (
        <ellipse key={i} cx={rx} cy={ry} rx={rw} ry={rh} fill="#101408" opacity={0.8} />
      ))}
      {/* ── Reem's grave (left, smaller — a child) ── */}
      <ellipse cx="248" cy="204" rx="50" ry="9" fill="#0a0e08" opacity="0.7" filter="url(#gbl2)" />
      <ellipse cx="248" cy="200" rx="44" ry="14" fill="#161a10" />
      <ellipse cx="248" cy="195" rx="40" ry="10" fill="#1a1e12" />
      {/* Stone marker — Reem */}
      <path d="M 238 194 L 238 172 Q 248 163 258 172 L 258 194 Z" fill="#20261a" />
      <path d="M 236 172 Q 248 161 260 172" fill="none" stroke="#2a3020" strokeWidth="1.5" />
      <text x="248" y="186" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="'Noto Sans Arabic', Arial, sans-serif" opacity="0.72">ريم</text>
      {/* ── Khalid's grave (right, larger — adult) ── */}
      <ellipse cx="392" cy="204" rx="62" ry="10" fill="#0a0e08" opacity="0.7" filter="url(#gbl2)" />
      <ellipse cx="392" cy="200" rx="56" ry="16" fill="#161a10" />
      <ellipse cx="392" cy="194" rx="52" ry="11" fill="#1a1e12" />
      {/* Stone marker — Khalid */}
      <path d="M 380 193 L 380 168 Q 392 157 404 168 L 404 193 Z" fill="#20261a" />
      <path d="M 378 168 Q 392 155 406 168" fill="none" stroke="#2a3020" strokeWidth="1.5" />
      <text x="392" y="179" textAnchor="middle" fill="#bbf7d0" fontSize="8" fontFamily="'Noto Sans Arabic', Arial, sans-serif" opacity="0.72">خالد</text>
      <text x="392" y="190" textAnchor="middle" fill="#86efac" fontSize="6" fontFamily="'Noto Sans Arabic', Arial, sans-serif" opacity="0.55">روح الروح</text>
      {/* ── Red rose on Reem's grave ── */}
      <path d="M 250 197 Q 251 182 250 170" fill="none" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 250 182 Q 257 177 259 182 Q 255 187 250 182 Z" fill="#4d7c0f" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return <ellipse key={i} cx={250 + Math.cos(rad) * 6.5} cy={170 + Math.sin(rad) * 6.5} rx="4" ry="2.5" fill="#dc2626" opacity="0.92" transform={`rotate(${deg},${250 + Math.cos(rad) * 6.5},${170 + Math.sin(rad) * 6.5})`} />;
      })}
      <circle cx="250" cy="170" r="3.8" fill="#b91010" />
      {/* ── Red rose on Khalid's grave ── */}
      <path d="M 394 195 Q 395 179 394 166" fill="none" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 394 179 Q 401 174 403 179 Q 399 184 394 179 Z" fill="#4d7c0f" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return <ellipse key={i} cx={394 + Math.cos(rad) * 6.5} cy={166 + Math.sin(rad) * 6.5} rx="4" ry="2.5" fill="#dc2626" opacity="0.92" transform={`rotate(${deg},${394 + Math.cos(rad) * 6.5},${166 + Math.sin(rad) * 6.5})`} />;
      })}
      <circle cx="394" cy="166" r="3.8" fill="#b91010" />
      {/* ── HANDALA — kneeling silhouette between the graves ── */}
      <ellipse cx="318" cy="204" rx="18" ry="4" fill="#000" opacity="0.4" />
      {/* Knees/lower legs */}
      <rect x="308" y="192" width="8" height="12" rx="3" fill="#161a10" />
      <rect x="320" y="192" width="8" height="12" rx="3" fill="#161a10" />
      {/* Body */}
      <rect x="304" y="174" width="24" height="20" rx="4" fill="#141810" />
      {/* Arms extended to place roses */}
      <path d="M 304 180 Q 278 177 260 184" fill="none" stroke="#141810" strokeWidth="8" strokeLinecap="round" />
      <path d="M 328 180 Q 354 177 370 182" fill="none" stroke="#141810" strokeWidth="8" strokeLinecap="round" />
      {/* Head bowed in grief */}
      <circle cx="316" cy="165" r="13" fill="#1a1e14" />
      <path d="M 304 160 Q 304 152 316 152 Q 328 152 328 160 L 324 164 L 308 164 Z" fill="#262c1e" opacity="0.9" />
      {/* Caption */}
      <text x="320" y="18" textAnchor="middle" fill="#86efac" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.55">JABALIA, NORTHERN GAZA · 2023</text>
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
    coins: 0,
  };
}

function spawnWave(gs: GameState, stageIndex: number, waveIndex: number, isBoss: boolean): number {
  const stageDef = STAGE_DEFS[stageIndex];
  if (isBoss) {
    const bossEnemy = spawnEnemy(stageDef.bossType);
    bossEnemy.isBoss = true;
    gs.enemies.push(bossEnemy);
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

  const charName = CHARACTERS[charIndex].name.charAt(0).toUpperCase() + CHARACTERS[charIndex].name.slice(1).toLowerCase();
  const companions = CHARACTERS.filter((_, i) => i !== charIndex).map(c => c.name.charAt(0).toUpperCase() + c.name.slice(1).toLowerCase());
  const STORIES = getStageStories(charName, companions);
  const HIND_PAGES = getHindPages(charName);
  const KHALID_PAGES = getKhalidPages(charName);
  const NASSER_PAGES = getNasserPages(charName);

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
  const storyLines = STORIES[stageIndex] || [];

  // ─── Start / advance stage ───────────────────────────────────────────────

  const startStageGame = useCallback((sIdx: number) => {
    const gs = buildInitialState(charIndex, sIdx);
    applyCollectibleBuffs(gs.player, inventoryRef.current, (p) => particlesRef.current.push(p));
    spawnStageCollectibles(gs, sIdx);
    // Apply document multiplier
    if (inventoryRef.current.includes("documents")) gs.scoreMultiplier = 2;
    // Carry coins and weapons across stages
    gs.coins = coinsRef.current;
    gs.player.activeWeapon = activeWeaponRef.current;
    gs.player.weaponAmmo = { ...weaponInventoryRef.current };
    gsRef.current = gs;
    enemiesRef.current = gs.enemies;
    particlesRef.current = gs.particles;
    waveInStageRef.current = 0;
    checkpointActiveRef.current = false;
    setCheckpointActive(false);
    // Spawn first wave
    const target = spawnWave(gs, sIdx, 0, false);
    gs.waveTarget = target;
    waveInStageRef.current = 0;
    lastWaveKillsRef.current = -1;
    setWaveKills(0);
    setWaveTarget(target);
    setWaveNum(0);
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

    if (nextWave === stageDef.waves) {
      // Spawn boss wave
      const target = spawnWave(gs, sIdx, nextWave, true);
      gs.waveTarget = target;
      setWaveKills(0);
      setWaveTarget(target);
      setWaveNum(nextWave);
    } else if (nextWave > stageDef.waves) {
      // All waves cleared — activate exit checkpoint
      checkpointActiveRef.current = true;
      setCheckpointActive(true);
    } else {
      const target = spawnWave(gs, sIdx, nextWave, false);
      gs.waveTarget = target;
      setWaveKills(0);
      setWaveTarget(target);
      setWaveNum(nextWave);
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

  const onEnemyDie = useCallback((e: Enemy, killedBy?: string) => {
    const gs = gsRef.current;
    if (!gs) return;
    spawnDeathParticles(gs, e, (p) => particlesRef.current.push(p));
    // Award coins based on enemy type
    const COIN_MAP: Record<string, number> = {
      patrol: 1, soldier: 1, armored: 1, sniper: 1, marksman: 1, apc: 1,
      drone: 3, tank: 5, bulldozer: 5, apache: 20, warplane: 20,
      bomb_plane_mini: 10, bomb_plane_large: 20, d9: 50,
    };
    const earned = COIN_MAP[e.type] ?? 1;
    coinsRef.current += earned;
    gs.coins = coinsRef.current;
    setCoins(coinsRef.current);
    particlesRef.current.push({
      x: e.x + e.width / 2, y: e.y - e.height - 30, vx: 0.4, vy: -2.5,
      life: 52, maxLife: 52, color: "#fbbf24", text: `+${earned}c`, size: 12,
    });

    // Pistol / M16 / Sniper kills only: +2 ammo to each owned gun
    const gunKill = killedBy === "pistol" || killedBy === "m16" || killedBy === "sniper";
    if (gunKill) {
      const inv = weaponInventoryRef.current;
      const nonRocketIds = ["pistol", "m16", "grenade", "machinegun", "shotgun"];
      const ownedWeapons = nonRocketIds.filter(id => (inv[id] ?? 0) > 0);
      if (ownedWeapons.length > 0) {
        const updated = { ...inv };
        ownedWeapons.forEach(id => { updated[id] = (updated[id] ?? 0) + 2; });
        weaponInventoryRef.current = updated;
        setWeaponInventory({ ...updated });
        gs.player.weaponAmmo = { ...updated };
        particlesRef.current.push({
          x: e.x + e.width / 2, y: e.y - e.height - 52, vx: 0, vy: -1.6,
          life: 55, maxLife: 55, color: "#22c55e", text: "+2 AMMO", size: 10,
        });
      }
    }

    // Tank/bulldozer kills: +1 rocket ammo (accumulates even without launcher)
    if (e.type === "tank" || e.type === "bulldozer") {
      const updated = { ...weaponInventoryRef.current };
      updated["rocket"] = (updated["rocket"] ?? 0) + 1;
      weaponInventoryRef.current = updated;
      setWeaponInventory({ ...updated });
      gs.player.weaponAmmo = { ...updated };
      particlesRef.current.push({
        x: e.x + e.width / 2, y: e.y - e.height - 55, vx: 0, vy: -1.8,
        life: 58, maxLife: 58, color: "#f97316", text: "+ROCKET", size: 11,
      });
    }
  }, []);

  const onCollectItem = useCallback((type: string) => {
    inventoryRef.current = [...inventoryRef.current, type];
    setInventory([...inventoryRef.current]);
  }, []);

  // ─── Coins + weapon shop state ───────────────────────────────────────────
  const [coins, setCoins] = useState(0);
  const coinsRef = useRef(0);
  const [weaponInventory, setWeaponInventory] = useState<Record<string, number>>({});
  const weaponInventoryRef = useRef<Record<string, number>>({});
  const [activeWeapon, setActiveWeapon] = useState<string>("");
  const activeWeaponRef = useRef<string>("");
  const [shopOpen, setShopOpen] = useState(false);
  const shopOpenRef = useRef(false);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [allyCD, setAllyCD] = useState<[number, number, number]>([0, 0, 0]);
  const [hindPage, setHindPage] = useState(0);
  const showHindRef = useRef(startStage === 1);
  const [khalidPage, setKhalidPage] = useState(0);
  const showKhalidRef = useRef(startStage === 2);
  const [nasserPage, setNasserPage] = useState(0);
  const showNasserRef = useRef(startStage === 3);
  const [waveKills, setWaveKills] = useState(0);
  const [waveTarget, setWaveTarget] = useState(0);
  const [waveNum, setWaveNum] = useState(0);
  const lastWaveKillsRef = useRef(-1);
  const checkpointActiveRef = useRef(false);
  const [checkpointActive, setCheckpointActive] = useState(false);

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
      startMusic();
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
            const lines = STORIES[stageIndexRef.current] || [];
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
      if (phaseRef.current === "khalid-story") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setKhalidPage((prev) => {
            if (prev < KHALID_PAGES.length - 1) return prev + 1;
            setPhase("story");
            phaseRef.current = "story";
            return 0;
          });
        }
        return;
      }
      if (phaseRef.current === "nasser-story") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setNasserPage((prev) => {
            if (prev < NASSER_PAGES.length - 1) return prev + 1;
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
            if (next === 2) showKhalidRef.current = true;
            if (next === 3) showNasserRef.current = true;
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

      // Jump / double-jump
      if (e.code === "Space" || e.code === "KeyW") {
        if (!p.isJumping) {
          // Normal jump
          p.vy = -18;
          p.isJumping = true;
          p.canDoubleJump = true;
        } else if (p.canDoubleJump) {
          // Double-tap Space in the air → super jump to clear tanks
          p.vy = -28;
          p.canDoubleJump = false;
        }
      }
      if (e.code === "ArrowUp" && !p.isJumping) {
        p.vy = -18;
        p.isJumping = true;
        p.canDoubleJump = true;
      }

      // Attack / melee
      if ((e.code === "KeyZ" || e.code === "KeyJ") && !p.isAttacking) {
        p.isAttacking = true;
        p.attackTimer = 22;
      }

      // Rock throw (X / K)
      if ((e.code === "KeyX" || e.code === "KeyK") && p.rockCooldown <= 0) {
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
      }

      // Fire equipped weapon (F key)
      if (e.code === "KeyF" && p.weaponCooldown <= 0 && p.activeWeapon) {
        const wDef = SHOP_WEAPONS.find(w => w.id === p.activeWeapon);
        if (wDef) {
          const curAmmo = p.weaponAmmo[p.activeWeapon] ?? 0;
          if (curAmmo > 0) {
            p.weaponAmmo[p.activeWeapon]--;
            weaponInventoryRef.current = { ...p.weaponAmmo };
            setWeaponInventory({ ...p.weaponAmmo });
            p.weaponCooldown = wDef.firerate;
            const launchX = p.x + p.width / 2;
            const launchY = p.y - p.height / 2;
            const dir = p.facingRight ? 1 : -1;
            // Hold ↑ or W while pressing F to shoot upward
            const aimUp = gs.keys["ArrowUp"] || gs.keys["KeyW"];
            if (p.activeWeapon === "pistol" || p.activeWeapon === "m16" || p.activeWeapon === "machinegun") {
              // Upward: 45° diagonally up-forward; horizontal: straight
              const bvx = aimUp ? dir * 14.14 : dir * 20;
              const bvy = aimUp ? -14.14 : 0;
              gs.projectiles.push({
                id: String(Math.random()), type: "bullet",
                x: launchX, y: launchY,
                vx: bvx, vy: bvy,
                targetX: 0, targetY: 0,
                damage: wDef.damage, trail: [], life: 90, maxLife: 90,
                warned: true, warnTimer: 0, warnMaxTimer: 0,
                exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
                sourceWeapon: p.activeWeapon,
              });
            } else if (p.activeWeapon === "sniper") {
              const svx = aimUp ? dir * 21.2 : dir * 30;
              const svy = aimUp ? -21.2 : 0;
              gs.projectiles.push({
                id: String(Math.random()), type: "sniper_shot",
                x: launchX, y: launchY,
                vx: svx, vy: svy,
                targetX: launchX, targetY: 0,
                damage: wDef.damage, trail: [], life: 70, maxLife: 70,
                warned: true, warnTimer: 0, warnMaxTimer: 0,
                exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
                sourceWeapon: "sniper",
              });
            } else if (p.activeWeapon === "shotgun") {
              for (let sp = 0; sp < 6; sp++) {
                let sgvx: number, sgvy: number;
                if (aimUp) {
                  // Fan pointing straight up: angles from -60° to +60° around straight-up
                  const angle = -Math.PI / 2 + (sp - 2.5) * (Math.PI / 7.5);
                  sgvx = Math.cos(angle) * 18;
                  sgvy = Math.sin(angle) * 18;
                } else {
                  sgvx = dir * 18;
                  sgvy = (sp - 2.5) * 1.8;
                }
                gs.projectiles.push({
                  id: String(Math.random()), type: "bullet",
                  x: launchX, y: launchY,
                  vx: sgvx, vy: sgvy,
                  targetX: 0, targetY: 0,
                  damage: wDef.damage, trail: [], life: 55, maxLife: 55,
                  warned: true, warnTimer: 0, warnMaxTimer: 0,
                  exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
                  sourceWeapon: "shotgun",
                });
              }
            } else if (p.activeWeapon === "missile") {
              // Missile drops from center-top of screen straight down — kills all non-boss enemies on impact
              gs.projectiles.push({
                id: String(Math.random()), type: "missile",
                x: 640, y: -80,
                vx: 0, vy: 16,
                targetX: 0, targetY: 0,
                damage: wDef.damage, trail: [], life: 500, maxLife: 500,
                warned: true, warnTimer: 0, warnMaxTimer: 0,
                exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
                sourceWeapon: "missile",
              });
            } else if (p.activeWeapon === "grenade") {
              const gvx = aimUp ? dir * 4 : dir * 10;
              const gvy = aimUp ? -18 : -12;
              gs.projectiles.push({
                id: String(Math.random()), type: "grenade_player",
                x: launchX, y: launchY,
                vx: gvx, vy: gvy,
                targetX: 0, targetY: 0,
                damage: wDef.damage, trail: [], life: 220, maxLife: 220,
                warned: true, warnTimer: 0, warnMaxTimer: 0,
                exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
                sourceWeapon: "grenade",
              });
            } else if (p.activeWeapon === "rocket") {
              const AERIAL = ["drone", "apache", "warplane", "bomb_plane_mini", "bomb_plane_large"];
              const aerials = gs.enemies.filter(en => AERIAL.includes(en.type) && en.state !== "dead");
              const liveEnemies = gs.enemies.filter(en => en.state !== "dead");
              const targets = aerials.length > 0 ? aerials : liveEnemies;
              let aimVx = aimUp ? 0 : dir * 10;
              let aimVy = -16;
              if (targets.length > 0) {
                const nearest = targets.reduce((best, en) => {
                  const d = Math.hypot(en.x + en.width / 2 - launchX, en.y - en.height / 2 - launchY);
                  const bd = Math.hypot(best.x + best.width / 2 - launchX, best.y - best.height / 2 - launchY);
                  return d < bd ? en : best;
                });
                const dx = nearest.x + nearest.width / 2 - launchX;
                const dy = nearest.y - nearest.height / 2 - launchY;
                const dist = Math.hypot(dx, dy) || 1;
                aimVx = (dx / dist) * 16; aimVy = (dy / dist) * 16;
              }
              gs.projectiles.push({
                id: String(Math.random()), type: "rocket",
                x: launchX, y: launchY,
                vx: aimVx, vy: aimVy,
                targetX: 0, targetY: 0,
                damage: wDef.damage, trail: [], life: 280, maxLife: 280,
                warned: true, warnTimer: 0, warnMaxTimer: 0,
                exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
                sourceWeapon: "rocket",
              });
            }
            if ((p.weaponAmmo[p.activeWeapon] ?? 0) <= 0) {
              delete p.weaponAmmo[p.activeWeapon];
              delete weaponInventoryRef.current[p.activeWeapon];
              p.activeWeapon = "";
              activeWeaponRef.current = "";
              setActiveWeapon("");
              setWeaponInventory({ ...weaponInventoryRef.current });
            }
          }
        }
      }

      // Shop toggle (B)
      if (e.code === "KeyB") {
        e.preventDefault();
        const nowOpen = !shopOpenRef.current;
        shopOpenRef.current = nowOpen;
        setShopOpen(nowOpen);
        pausedRef.current = nowOpen;
        setPaused(nowOpen);
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

      // (Ally abilities removed — use shop weapons instead)
      const allyKeys: Record<string, number> = {};
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

      // Sync wave kill progress to React state (only when changed)
      if (gs.waveKills !== lastWaveKillsRef.current) {
        lastWaveKillsRef.current = gs.waveKills;
        setWaveKills(gs.waveKills);
        setWaveTarget(gs.waveTarget);
      }

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

      // ── Exit checkpoint ────────────────────────────────────────────────
      if (checkpointActiveRef.current && gs) {
        const flagX = CANVAS_W - 90;
        const flagBase = FLOOR_Y;
        const glow = 0.5 + Math.sin(frame * 0.07) * 0.3;

        ctx.save();
        // Halo glow
        ctx.globalAlpha = glow * 0.22;
        const haloGrd = ctx.createRadialGradient(flagX, flagBase - 90, 0, flagX, flagBase - 90, 150);
        haloGrd.addColorStop(0, "#22c55e");
        haloGrd.addColorStop(1, "transparent");
        ctx.fillStyle = haloGrd;
        ctx.fillRect(flagX - 150, flagBase - 240, 300, 240);
        ctx.globalAlpha = 1;

        // Pole
        ctx.fillStyle = "#a1a1aa";
        ctx.fillRect(flagX - 4, flagBase - 190, 7, 190);

        // Palestinian flag — 3 stripes + red triangle
        ctx.fillStyle = "#111";
        ctx.fillRect(flagX + 3, flagBase - 190, 78, 26);
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(flagX + 3, flagBase - 164, 78, 26);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(flagX + 3, flagBase - 138, 78, 26);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.moveTo(flagX + 3, flagBase - 190);
        ctx.lineTo(flagX + 3, flagBase - 112);
        ctx.lineTo(flagX + 49, flagBase - 151);
        ctx.closePath();
        ctx.fill();

        // Pulsing "EXIT →" label above flag
        ctx.globalAlpha = glow;
        ctx.fillStyle = "#22c55e";
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 14;
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("EXIT →", flagX + 15, flagBase - 204);
        ctx.textAlign = "left";
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();

        // Detect player reaching the checkpoint
        if (gs.player.x + gs.player.width > flagX - 50) {
          checkpointActiveRef.current = false;
          setCheckpointActive(false);
          setStageScore(gs.score);
          setPhase("stage-clear");
          phaseRef.current = "stage-clear";
        }
      }

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
    } else if (showKhalidRef.current) {
      showKhalidRef.current = false;
      setKhalidPage(0);
      setPhase("khalid-story");
      phaseRef.current = "khalid-story";
    } else if (showNasserRef.current) {
      showNasserRef.current = false;
      setNasserPage(0);
      setPhase("nasser-story");
      phaseRef.current = "nasser-story";
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
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", gap: 3 }}>
              <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 18, color: stageData2.color, textShadow: `0 0 14px ${stageData2.color}90`, direction: "rtl", lineHeight: 1.1 }}>
                {STAGE_ARABIC[stageIndex]}
              </div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: stageData2.color, letterSpacing: 2 }}>{stageData2.name}</div>

              {/* Wave pip indicators */}
              <div style={{ display: "flex", gap: 5, marginTop: 1 }}>
                {Array.from({ length: stageData2.waves + 1 }, (_, i) => {
                  const isBoss = i === stageData2.waves;
                  const done = i < waveNum || checkpointActive;
                  const current = i === waveNum && !checkpointActive;
                  return (
                    <div key={i} title={isBoss ? "BOSS" : `Wave ${i + 1}`} style={{
                      width: isBoss ? 18 : 13, height: 8, borderRadius: 3,
                      background: done ? stageData2.color : current ? `${stageData2.color}cc` : "rgba(255,255,255,0.1)",
                      border: `1px solid ${current ? stageData2.color : done ? stageData2.color : "rgba(255,255,255,0.18)"}`,
                      boxShadow: current ? `0 0 8px ${stageData2.color}` : "none",
                    }} />
                  );
                })}
                {checkpointActive && (
                  <div style={{ width: 18, height: 8, borderRadius: 3, background: "#22c55e", border: "1px solid #22c55e", boxShadow: "0 0 8px #22c55e", animation: "blink 0.8s step-end infinite" }} title="EXIT" />
                )}
              </div>

              {/* Kill / checkpoint progress */}
              {checkpointActive ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: 2, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "6px 14px", border: "1px solid #22c55e55" }}>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#22c55e", textShadow: "0 0 12px #22c55e", letterSpacing: 1, animation: "blink 1s step-end infinite" }}>
                    → REACH THE EXIT!
                  </div>
                </div>
              ) : waveTarget > 0 ? (() => {
                const isBossWave = waveNum === stageData2.waves;
                const pct = Math.min(waveKills / waveTarget, 1);
                const barColor = isBossWave ? "#ef4444" : stageData2.color;
                return (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 2, background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "6px 14px", border: `1px solid ${barColor}33` }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: isBossWave ? "#ef4444" : "#d4d4d4", letterSpacing: 1, textShadow: isBossWave ? "0 0 10px #ef4444" : "none" }}>
                      {isBossWave ? "★  BOSS  WAVE  ★" : `WAVE  ${waveNum + 1}  /  ${stageData2.waves + 1}`}
                    </div>
                    <div style={{ width: 180, height: 9, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", border: `1px solid ${barColor}44` }}>
                      <div style={{ width: `${pct * 100}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.18s", boxShadow: `0 0 6px ${barColor}` }} />
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>
                      {waveKills} / {waveTarget} KILLS
                    </div>
                  </div>
                );
              })() : null}
            </div>
            {/* HUD pause & exit buttons */}
            <div style={{ position: "absolute", top: 8, right: 10, display: "flex", gap: 6 }}>
              <button
                onClick={togglePause}
                title="Pause (Esc)"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid #44403c", borderRadius: 3, padding: "4px 9px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#9ca3af" }}
              >
                {paused ? "▶" : "⏸"}
              </button>
              <button
                onClick={() => { setPaused(true); pausedRef.current = true; setShowExitConfirm(true); }}
                title="Exit to menu"
                style={{ background: "rgba(0,0,0,0.65)", border: "1px solid #44403c", borderRadius: 3, padding: "4px 9px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>
          </>
        )}

        {/* ── SHOP OVERLAY ──────────────────────────────────────────────── */}
        {phase === "playing" && shopOpen && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, backdropFilter: "blur(3px)", zIndex: 20 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: "#fbbf24", textShadow: "0 0 20px #fbbf2470", letterSpacing: 3 }}>WEAPON SHOP</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fbbf24", letterSpacing: 2 }}>
              {"\uD83E\uDE99"} COINS: {coins}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 420, maxHeight: 380, overflowY: "auto" }}>
              {SHOP_WEAPONS.map((w) => {
                const owned = (weaponInventory[w.id] ?? 0) > 0;
                const equipped = activeWeapon === w.id;
                const canAfford = coins >= w.cost;
                return (
                  <div key={w.id} style={{
                    background: equipped ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.5)",
                    border: `1px solid ${equipped ? "#22c55e" : owned ? "#fbbf24" : "#44403c"}`,
                    borderRadius: 5, padding: "10px 14px",
                    display: "flex", flexDirection: "column", gap: 5,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: equipped ? "#22c55e" : "#fff" }}>
                          {equipped ? "► " : ""}{w.label}
                        </span>
                        {owned && (
                          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#fbbf24", marginLeft: 8 }}>
                            x{weaponInventory[w.id]}
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: canAfford ? "#fbbf24" : "#6b7280" }}>
                        {w.cost}{"\uD83E\uDE99"}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#9ca3af" }}>{w.desc}</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#6b7280" }}>
                      DMG:{w.damage}  RATE:{60 / w.firerate}ps
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => {
                          if (coins < w.cost) return;
                          const newCoins = coins - w.cost;
                          const newInv = { ...weaponInventoryRef.current, [w.id]: (weaponInventoryRef.current[w.id] ?? 0) + w.ammo };
                          coinsRef.current = newCoins;
                          setCoins(newCoins);
                          const gs = gsRef.current;
                          if (gs) gs.coins = newCoins;
                          weaponInventoryRef.current = newInv;
                          setWeaponInventory({ ...newInv });
                          if (gs) gs.player.weaponAmmo = { ...newInv };
                        }}
                        disabled={!canAfford}
                        style={{ background: canAfford ? "rgba(251,191,36,0.15)" : "rgba(0,0,0,0.3)", border: `1px solid ${canAfford ? "#fbbf24" : "#44403c"}`, borderRadius: 3, padding: "5px 10px", cursor: canAfford ? "pointer" : "not-allowed", fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: canAfford ? "#fbbf24" : "#6b7280" }}
                      >
                        BUY +{w.ammo}
                      </button>
                      {owned && (
                        <button
                          onClick={() => {
                            const newWeapon = equipped ? "" : w.id;
                            activeWeaponRef.current = newWeapon;
                            setActiveWeapon(newWeapon);
                            const gs = gsRef.current;
                            if (gs) gs.player.activeWeapon = newWeapon;
                          }}
                          style={{ background: equipped ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.08)", border: `1px solid ${equipped ? "#22c55e" : "#16a34a"}`, borderRadius: 3, padding: "5px 10px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: equipped ? "#22c55e" : "#86efac" }}
                        >
                          {equipped ? "UNEQUIP" : "EQUIP"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                shopOpenRef.current = false;
                setShopOpen(false);
                pausedRef.current = false;
                setPaused(false);
              }}
              style={{ background: "rgba(239,68,68,0.12)", border: "2px solid #ef4444", borderRadius: 4, padding: "10px 28px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ef4444", marginTop: 4 }}
            >
              CLOSE  [B]
            </button>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#44403c" }}>PRESS B TO CLOSE</div>
          </div>
        )}

        {/* ── PAUSE OVERLAY ─────────────────────────────────────────────── */}
        {phase === "playing" && paused && !shopOpen && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, backdropFilter: "blur(2px)" }}>
            {!showExitConfirm ? (
              <>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#fbbf24", textShadow: "0 0 20px #fbbf2470", letterSpacing: 3 }}>PAUSED</div>
                <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 28, color: "#f97316", direction: "rtl" }}>متوقف مؤقتاً</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 240 }}>
                  <button
                    onClick={togglePause}
                    style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e", borderRadius: 4, padding: "12px 0", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fff", letterSpacing: 1 }}
                  >
                    ▶  RESUME
                  </button>
                  <button
                    onClick={() => setShowExitConfirm(true)}
                    style={{ background: "rgba(239,68,68,0.1)", border: "2px solid #6b7280", borderRadius: 4, padding: "12px 0", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#9ca3af", letterSpacing: 1 }}
                  >
                    ✕  EXIT GAME
                  </button>
                </div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#44403c", marginTop: 4 }}>PRESS ESC TO RESUME</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 15, color: "#ef4444", textShadow: "0 0 16px #ef444450", letterSpacing: 2, textAlign: "center" }}>EXIT GAME?</div>
                <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid #44403c", borderRadius: 4, padding: "14px 24px", maxWidth: 340, textAlign: "center" }}>
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#d4d4d4", lineHeight: 2.2, margin: 0 }}>
                    Your progress in this stage will be lost. {charName} is still waiting for you.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => navigate("/")}
                    style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444", borderRadius: 4, padding: "11px 24px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ef4444" }}
                  >
                    YES, EXIT
                  </button>
                  <button
                    onClick={() => { setShowExitConfirm(false); togglePause(); }}
                    style={{ background: "rgba(34,197,94,0.12)", border: "2px solid #22c55e", borderRadius: 4, padding: "11px 24px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#22c55e" }}
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
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#fff", letterSpacing: 3, marginTop: 4 }}>{stageData2.name}</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#9ca3af", marginTop: 4, letterSpacing: 1 }}>{stageData2.subtitle}</div>
                </div>

                <HistoryCard stageIndex={stageIndex} stageColor={stageData2.color} />

                <div style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${stageData2.color}70`, borderRadius: 4, padding: "14px 24px", maxWidth: 560, width: "100%", textAlign: "center", minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#fff", lineHeight: 2.1, margin: 0 }}>
                    {storyLines[storyLine] || ""}
                  </p>
                </div>

                {inventory.length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>CARRYING INTO THIS AREA:</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                      {inventory.map((type, i) => {
                        const def = COLLECTIBLE_DEFS[type];
                        return (
                          <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${def?.color || "#44403c"}`, borderRadius: 3, padding: "4px 8px" }}>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: def?.color || "#fff" }}>{def?.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#fbbf24", animation: "blink 1.1s step-end infinite" }}>
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
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ef444488", letterSpacing: 3, textTransform: "uppercase" }}>IN MEMORY OF</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#ef4444", textShadow: "0 0 32px #ef444460", lineHeight: 1.7, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#fca5a5", lineHeight: 2.1, textAlign: "center" }}>
                      {pg.body}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#9ca3af", marginTop: 8, lineHeight: 2 }}>
                      January 29, 2024 · Gaza City, Palestine
                    </div>
                  </div>
                </div>
              ) : pg.car ? (
                /* ── Car scene (last page) ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "20px 24px" }}>
                  <HindCarScene />
                  <div style={{ maxWidth: 560, textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#d4d4d4", lineHeight: 2.2 }}>
                      {pg.body}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Text-only pages ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 60px", gap: 28 }}>
                  {pg.heading && (
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: "#ef4444", textShadow: "0 0 24px #ef444450", lineHeight: 1.8, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#fca5a5", lineHeight: 2.4, textAlign: "center", maxWidth: 680 }}>
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
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#ef444488", animation: "blink 1.1s step-end infinite" }}>
                  {isLast ? "SPACE / ENTER  ▶  BEGIN" : "SPACE / ENTER  ▶  CONTINUE"}
                </div>
              </div>
              <FlagBar />
            </div>
          );
        })()}

        {/* ── KHALID & REEM NABHAN MEMORIAL ───────────────────────── */}
        {phase === "khalid-story" && (() => {
          const pg = KHALID_PAGES[khalidPage] ?? KHALID_PAGES[0];
          const isLast = khalidPage === KHALID_PAGES.length - 1;
          const isFirst = khalidPage === 0;
          return (
            <div style={{ position: "absolute", inset: 0, background: "#030a03", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <FlagBar />

              {/* ── Portrait page ── */}
              {isFirst ? (
                <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
                  {/* Left — portrait */}
                  <div style={{ width: 270, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid #14532d", background: "rgba(20,83,45,0.08)", padding: "24px 16px", gap: 14 }}>
                    <KhalidPortrait />
                    <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 26, color: "#22c55e", direction: "rtl", opacity: 0.88 }}>خالد نبهان</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#86efac", textAlign: "center", lineHeight: 1.8 }}>& Reem Nabhan</div>
                  </div>
                  {/* Right — text */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 44px", gap: 22 }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#22c55e88", letterSpacing: 3, textTransform: "uppercase" }}>IN MEMORY OF</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#22c55e", textShadow: "0 0 32px #22c55e60", lineHeight: 1.7, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#bbf7d0", lineHeight: 2.1, textAlign: "center" }}>
                      {pg.body}
                    </div>
                    <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 32, color: "#dc2626", direction: "rtl", lineHeight: 1.6, textAlign: "center", opacity: 0.88, textShadow: "0 0 20px #dc262640" }}>
                      روح الروح
                    </div>
                  </div>
                </div>
              ) : pg.grave ? (
                /* ── Grave scene (last page) ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "18px 24px" }}>
                  <KhalidGraveScene />
                  <div style={{ maxWidth: 580, textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#d4d4d4", lineHeight: 2.2 }}>
                      {pg.body}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Text-only pages ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 60px", gap: 28 }}>
                  {pg.heading && (
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: "#22c55e", textShadow: "0 0 24px #22c55e50", lineHeight: 1.8, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#bbf7d0", lineHeight: 2.4, textAlign: "center", maxWidth: 700 }}>
                    {pg.body}
                  </div>
                </div>
              )}

              {/* Bottom bar */}
              <div style={{ borderTop: "1px solid #14532d", padding: "14px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 7 }}>
                  {KHALID_PAGES.map((_, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === khalidPage ? "#22c55e" : i < khalidPage ? "#14532d" : "#0a1f0a", border: `1px solid ${i === khalidPage ? "#22c55e" : "#14532d"}`, transition: "all 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#22c55e88", animation: "blink 1.1s step-end infinite" }}>
                  {isLast ? "SPACE / ENTER  ▶  BEGIN" : "SPACE / ENTER  ▶  CONTINUE"}
                </div>
              </div>
              <FlagBar />
            </div>
          );
        })()}

        {/* ── NASSER HOSPITAL / KHAN YOUNIS STORY ─────────────────── */}
        {phase === "nasser-story" && (() => {
          const pg = NASSER_PAGES[nasserPage] ?? NASSER_PAGES[0];
          const isLast = nasserPage === NASSER_PAGES.length - 1;
          const isFirst = nasserPage === 0;
          return (
            <div style={{ position: "absolute", inset: 0, background: "#080404", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <FlagBar />

              {/* ── Hospital intro page (illustration left, text right) ── */}
              {isFirst ? (
                <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
                  {/* Left — hospital illustration */}
                  <div style={{ width: 270, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid #3f1515", background: "rgba(120,20,20,0.07)", padding: "24px 16px", gap: 18 }}>
                    <NasserIntroPanel />
                    <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 20, color: "#ef4444", direction: "rtl", opacity: 0.82, textAlign: "center", lineHeight: 1.6 }}>
                      مجمع ناصر الطبي
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8.5, color: "#fca5a5", textAlign: "center", lineHeight: 1.9, opacity: 0.7 }}>
                      NASSER MEDICAL COMPLEX<br />KHAN YOUNIS
                    </div>
                  </div>
                  {/* Right — text */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 44px", gap: 24 }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#ef444488", letterSpacing: 3, textTransform: "uppercase" }}>A TRUE STORY</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#ef4444", textShadow: "0 0 32px #ef444460", lineHeight: 1.7, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 15, color: "#fca5a5", lineHeight: 2.2, textAlign: "center" }}>
                      {pg.body}
                    </div>
                  </div>
                </div>
              ) : pg.scene ? (
                /* ── Hospital ruin scene (last page) ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "18px 24px" }}>
                  <NasserHospitalScene />
                  <div style={{ maxWidth: 600, textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#d4d4d4", lineHeight: 2.2 }}>
                      {pg.body}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Text-only pages ── */
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 60px", gap: 28 }}>
                  {pg.heading && (
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: "#ef4444", textShadow: "0 0 24px #ef444450", lineHeight: 1.8, textAlign: "center" }}>
                      {pg.heading}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: "#fca5a5", lineHeight: 2.4, textAlign: "center", maxWidth: 700 }}>
                    {pg.body}
                  </div>
                </div>
              )}

              {/* Bottom bar */}
              <div style={{ borderTop: "1px solid #3f1515", padding: "14px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 7 }}>
                  {NASSER_PAGES.map((_, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === nasserPage ? "#ef4444" : i < nasserPage ? "#7f1d1d" : "#2d1010", border: `1px solid ${i === nasserPage ? "#ef4444" : "#3f1515"}`, transition: "all 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#ef444488", animation: "blink 1.1s step-end infinite" }}>
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
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: stageData2.color, letterSpacing: 2 }}>
                    {stageData2.name} — SURVIVED
                  </div>
                </div>

                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#fbbf24" }}>SCORE: {stageScore.toLocaleString()}</div>

                {stageIndex < STAGE_DEFS.length - 1 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>HEADING TO:</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 15, color: STAGE_DEFS[stageIndex + 1]?.color || "#fff" }}>
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
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#9ca3af", marginBottom: 6 }}>ITEMS COLLECTED:</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {collected.map((type, i) => {
                          const def = COLLECTIBLE_DEFS[type];
                          return (
                            <div key={i} style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${def?.color || "#44403c"}`, borderRadius: 3, padding: "4px 10px" }}>
                              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: def?.color || "#fff" }}>{def?.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fbbf24", animation: "blink 1.1s step-end infinite" }}>
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
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#22c55e", marginBottom: 10 }}>HANDALA FINDS NOUR</div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#d4d4d4", lineHeight: 2.2, margin: 0 }}>
                He ran through the crowd at the Rafah crossing, calling her name. Then he heard her voice. <span style={{ color: "#22c55e" }}>Nour was there.</span>
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#d4d4d4", lineHeight: 2.2, margin: "10px 0 0" }}>
                She held him and said: <span style={{ color: "#fbbf24" }}>"You came. I knew you would."</span>
              </p>
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#9ca3af", textAlign: "center", maxWidth: 480, lineHeight: 2 }}>
              The struggle for Gaza never ends — but today, two children found each other. And that matters.
            </div>
            <div style={{ fontFamily: "'Noto Sans Arabic', 'Arial', sans-serif", fontSize: 28, color: "#f97316", direction: "rtl" }}>فلسطين ستبقى حرة</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: "#fbbf24" }}>FINAL SCORE: {score.toLocaleString()}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fbbf24", animation: "blink 1.1s step-end infinite" }}>SPACE / ENTER  ▶  MAIN MENU</div>
            <FlagBar />
          </div>
        )}

        {/* Dead screen */}
        {phase === "dead" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: "#ef4444", textShadow: "0 0 30px #ef4444" }}>YOU FELL</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#9ca3af", textAlign: "center", maxWidth: 420, lineHeight: 2 }}>
              Gaza remembers. The fight goes on.
            </div>
            {/* Fallen child — no face, rubble scene */}
            <svg width="260" height="200" viewBox="0 0 260 200" style={{ filter: "drop-shadow(0 0 22px rgba(200,0,0,0.4))" }}>
              {/* Night sky */}
              <rect x="0" y="0" width="260" height="200" fill="#0a0a0a"/>
              {/* Smoke / dust haze */}
              <ellipse cx="130" cy="80" rx="120" ry="55" fill="#1c1917" opacity="0.7"/>
              <ellipse cx="80" cy="60" rx="70" ry="35" fill="#292524" opacity="0.5"/>
              <ellipse cx="190" cy="70" rx="60" ry="30" fill="#292524" opacity="0.4"/>
              {/* Destroyed building silhouette — left */}
              <polygon points="0,160 0,60 18,60 18,45 30,45 30,30 42,30 42,55 55,55 55,70 65,70 65,160" fill="#111"/>
              {/* Destroyed building silhouette — right */}
              <polygon points="260,160 260,50 245,50 245,38 232,38 232,25 220,25 220,52 208,52 208,68 195,68 195,160" fill="#111"/>
              {/* Rubble mound — center */}
              <polygon points="30,160 55,130 75,138 95,120 115,132 140,118 160,130 182,122 200,135 220,125 240,160" fill="#292524"/>
              <polygon points="60,160 80,140 100,148 120,135 145,145 170,138 190,150 220,160" fill="#1c1917"/>
              {/* Concrete slabs */}
              <rect x="48" y="148" width="55" height="8" fill="#374151" transform="rotate(-8 48 148)"/>
              <rect x="130" y="145" width="60" height="7" fill="#374151" transform="rotate(5 130 145)"/>
              <rect x="90" y="155" width="40" height="6" fill="#3f3f46" transform="rotate(-3 90 155)"/>
              {/* Rebar sticking up */}
              <line x1="70" y1="148" x2="66" y2="118" stroke="#6b7280" strokeWidth="2"/>
              <line x1="165" y1="145" x2="162" y2="112" stroke="#6b7280" strokeWidth="2"/>
              <line x1="112" y1="152" x2="116" y2="124" stroke="#6b7280" strokeWidth="1.5"/>
              {/* Small body under rubble — only outline, no face */}
              <ellipse cx="118" cy="153" rx="30" ry="9" fill="#e7c8a0" opacity="0.55"/>
              {/* Arm/hand reaching out from under slab */}
              <path d="M80 152 Q72 148 68 154 Q65 158 70 160 Q76 162 82 157 Z" fill="#d4a574"/>
              {/* Fingers barely visible */}
              <line x1="68" y1="155" x2="63" y2="153" stroke="#c4956a" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="68" y1="157" x2="63" y2="157" stroke="#c4956a" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="69" y1="159" x2="64" y2="160" stroke="#c4956a" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Blood pooling on the ground */}
              <ellipse cx="75" cy="163" rx="22" ry="5" fill="#7f1d1d" opacity="0.7"/>
              <ellipse cx="62" cy="161" rx="10" ry="3" fill="#991b1b" opacity="0.6"/>
              {/* Torn Palestinian flag — draped over rubble */}
              <path d="M130 148 Q150 140 170 143 Q185 145 190 150 Q170 152 150 150 Q138 150 130 148 Z" fill="#149954" opacity="0.65"/>
              <path d="M130 148 Q135 142 142 144 Q138 150 130 148 Z" fill="#ef4444" opacity="0.8"/>
              <path d="M142 144 Q150 140 162 142 Q150 148 142 148 Q142 146 142 144 Z" fill="#fff" opacity="0.45"/>
              {/* Torn flag end */}
              <path d="M188 148 Q200 144 205 150 Q198 154 188 152 Z" fill="#149954" opacity="0.4"/>
              {/* Kite string drifting — no one holding it */}
              <path d="M155 90 Q148 110 152 130 Q154 140 150 150" stroke="#22c55e" strokeWidth="1" fill="none" strokeDasharray="4,3" opacity="0.45"/>
              {/* Kite high up — abandoned */}
              <polygon points="155,90 163,75 155,60 147,75" fill="none" stroke="#22c55e" strokeWidth="1.2" opacity="0.4"/>
              <line x1="155" y1="90" x2="158" y2="82" stroke="#22c55e" strokeWidth="0.8" opacity="0.3"/>
              {/* Watermelon broken on ground */}
              <path d="M195 158 A12 12 0 0 1 219 158 Z" fill="#15803d" opacity="0.8"/>
              <path d="M198 158 A9 9 0 0 1 216 158 Z" fill="#ef4444" opacity="0.9"/>
              <circle cx="204" cy="155" r="1.2" fill="#1c1917"/>
              <circle cx="208" cy="154" r="1.2" fill="#1c1917"/>
              <circle cx="212" cy="155" r="1.2" fill="#1c1917"/>
              {/* Scattered juice from broken watermelon */}
              <ellipse cx="207" cy="160" rx="14" ry="3" fill="#dc2626" opacity="0.25"/>
              {/* Dim stars through smoke */}
              <circle cx="22" cy="15" r="1.2" fill="#fff" opacity="0.35"/>
              <circle cx="50" cy="8" r="0.9" fill="#fff" opacity="0.3"/>
              <circle cx="100" cy="12" r="0.8" fill="#fff" opacity="0.25"/>
              <circle cx="210" cy="10" r="1" fill="#fff" opacity="0.3"/>
              <circle cx="240" cy="22" r="0.8" fill="#fff" opacity="0.25"/>
              {/* Crescent moon barely visible through smoke */}
              <path d="M130 18 A10 10 0 1 1 130 38 A7 7 0 1 0 130 18 Z" fill="#fbbf24" opacity="0.2"/>
              {/* "17,000+" text — small, tragic counter */}
              <text x="130" y="105" textAnchor="middle" fontFamily="serif" fontSize="11" fill="#ef4444" opacity="0.6">17,000+ children</text>
              <text x="130" y="118" textAnchor="middle" fontFamily="serif" fontSize="9" fill="#9ca3af" opacity="0.5">killed since Oct 2023</text>
            </svg>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#fbbf24" }}>SCORE: {score.toLocaleString()}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={() => {
                  stageIndexRef.current = stageIndex;
                  setStageIndex(stageIndex);
                  inventoryRef.current = [];
                  setInventory([]);
                  setPhase("story");
                  phaseRef.current = "story";
                }}
                style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444", borderRadius: 4, padding: "12px 28px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fff" }}
              >
                TRY AGAIN
              </button>
              <button
                onClick={() => navigate("/")}
                style={{ background: "rgba(100,100,100,0.15)", border: "2px solid #6b7280", borderRadius: 4, padding: "12px 28px", cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#9ca3af" }}
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
