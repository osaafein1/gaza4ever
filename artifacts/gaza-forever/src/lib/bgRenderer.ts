import type { BgData } from "./gameTypes";
import { CANVAS_W, CANVAS_H, FLOOR_Y } from "./gameConstants";

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// ── Palestinian flag on a pole ────────────────────────────────────────────────
// px/py = top-left of flag, fw/fh = flag size, alpha = opacity
function drawPalestineFlag(ctx: CanvasRenderingContext2D, px: number, py: number, fw: number, fh: number, alpha = 0.72) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const fh3 = fh / 3;
  const tri = fw * 0.38;   // width of red triangle

  // Three horizontal stripes clipped to flag rect
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, fw, fh);
  ctx.clip();
  ctx.fillStyle = "#111";   ctx.fillRect(px, py,           fw, fh3);           // black
  ctx.fillStyle = "#fff";   ctx.fillRect(px, py + fh3,     fw, fh3);           // white
  ctx.fillStyle = "#15803d"; ctx.fillRect(px, py + fh3 * 2, fw, fh3);          // green
  // Red triangle
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(px,       py);
  ctx.lineTo(px + tri, py + fh / 2);
  ctx.lineTo(px,       py + fh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Flag outline
  ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 0.6;
  ctx.strokeRect(px, py, fw, fh);

  // Pole
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px - 1, py);
  ctx.lineTo(px - 1, py + fh + 44);
  ctx.stroke();

  ctx.restore();
}

// ── War damage overlay for a rectangular building ─────────────────────────
// Call after drawing the base building rect.  bx/by = top-left, bw/bh = size
// seed = any integer that stays constant for this building (e.g. index)
function drawWarDamageOverlay(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, bw: number, bh: number,
  seed: number, frame: number
) {
  const rng = (s: number) => {
    const x = Math.sin(seed * 127.1 + s * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  ctx.save();

  // Scorch marks / explosion holes
  const numHoles = 2 + Math.floor(rng(0) * 3);
  for (let h = 0; h < numHoles; h++) {
    const hx = bx + 8 + rng(h + 10) * (bw - 16);
    const hy = by + 10 + rng(h + 20) * (bh - 20);
    const hr = 8 + rng(h + 30) * 18;
    const scorch = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
    scorch.addColorStop(0, "rgba(0,0,0,0.85)");
    scorch.addColorStop(0.55, "rgba(60,20,0,0.55)");
    scorch.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = scorch;
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
  }

  // Jagged missing top-corner
  if (rng(1) > 0.4) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    const cw = 12 + rng(2) * 28;
    const ch = 10 + rng(3) * 30;
    const fromLeft = rng(4) > 0.5;
    const cx = fromLeft ? bx : bx + bw - cw;
    ctx.beginPath();
    ctx.moveTo(cx, by);
    ctx.lineTo(cx + (fromLeft ? cw * 0.4 : cw * 0.6), by + ch * 0.4);
    ctx.lineTo(cx + (fromLeft ? cw * 0.7 : cw * 0.3), by);
    ctx.lineTo(cx + cw, by);
    ctx.lineTo(cx + cw, by + ch);
    ctx.lineTo(cx, by + ch * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  // Crack lines
  const numCracks = 2 + Math.floor(rng(5) * 3);
  ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 1.2;
  for (let c = 0; c < numCracks; c++) {
    const csx = bx + rng(c + 40) * bw;
    const csy = by + rng(c + 50) * bh;
    const cex = csx + (rng(c + 60) - 0.5) * 30;
    const cey = csy + rng(c + 70) * 40;
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(csx, csy); ctx.lineTo(cex, cey); ctx.stroke();
  }

  // Broken window: some windows replaced with dark holes
  const wHoles = Math.floor(rng(6) * 4);
  ctx.fillStyle = "#050302";
  for (let w = 0; w < wHoles; w++) {
    const wx = bx + 4 + rng(w + 80) * (bw - 20);
    const wy = by + 8 + rng(w + 90) * (bh - 16);
    ctx.globalAlpha = 0.9;
    ctx.fillRect(wx, wy, 14 + rng(w + 95) * 10, 10 + rng(w + 96) * 8);
  }

  // Small ember glow (animated)
  if (rng(7) > 0.5) {
    const ex2 = bx + 6 + rng(8) * (bw - 12);
    const ey2 = by + bh - 20;
    const pulse = Math.sin(frame * 0.06 + seed) * 0.07 + 0.12;
    ctx.globalAlpha = pulse;
    const ember = ctx.createRadialGradient(ex2, ey2, 0, ex2, ey2, 22);
    ember.addColorStop(0, "#f97316");
    ember.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ember;
    ctx.beginPath(); ctx.arc(ex2, ey2, 22, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function createBgData(type: string): BgData {
  return {
    offset: 0,
    type,
    blackHoleAngle: 0,
    stars: Array.from({ length: 60 }, () => ({
      x: rnd(0, CANVAS_W), y: rnd(0, 200), r: rnd(0.5, 2), twinkle: rnd(0, Math.PI * 2),
    })),
    clouds: Array.from({ length: 8 }, () => ({
      x: rnd(0, CANVAS_W), y: rnd(40, 200), w: rnd(100, 280), h: rnd(30, 70), speed: rnd(0.15, 0.45),
    })),
    mountains: Array.from({ length: 16 }, () => ({
      x: rnd(0, CANVAS_W), h: rnd(60, 180), w: rnd(80, 200),
    })),
    vines: [],
    ruins: Array.from({ length: 12 }, () => ({
      x: rnd(0, CANVAS_W), h: rnd(80, 320), w: rnd(30, 90), dmg: Math.random(),
    })),
    eyePairs: [],
    spores: [],
    lightning: { timer: 180, x: rnd(100, 1100), y2: 300, active: false },
    smoke: Array.from({ length: 14 }, () => ({
      x: rnd(0, CANVAS_W), y: rnd(FLOOR_Y - 300, FLOOR_Y - 60), r: rnd(20, 70), phase: rnd(0, Math.PI * 2), speed: rnd(0.3, 0.9),
    })),
    debris: Array.from({ length: 30 }, () => ({
      x: rnd(0, CANVAS_W), y: rnd(FLOOR_Y - 80, FLOOR_Y), angle: rnd(0, Math.PI * 2), size: rnd(4, 18),
    })),
    tents: Array.from({ length: 8 }, () => ({
      x: rnd(0, CANVAS_W), w: rnd(60, 120), h: rnd(40, 70),
    })),
  };
}

export function drawBackground(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  switch (bg.type) {
    case "jabalia":     drawJabalia(ctx, bg, frame);    break;
    case "gaza-city":   drawGazaCity(ctx, bg, frame);   break;
    case "nuseirat":    drawNuseirat(ctx, bg, frame);   break;
    case "khan-younis": drawKhanYounis(ctx, bg, frame); break;
    case "rafah":       drawRafah(ctx, bg, frame);      break;
    default:            drawJabalia(ctx, bg, frame);    break;
  }

  const gGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_H);
  gGrad.addColorStop(0, "#44403c");
  gGrad.addColorStop(1, "#1c1917");
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

  ctx.strokeStyle = "#292524";
  ctx.lineWidth = 1.5;
  bg.debris.forEach((d) => {
    const px = ((d.x - bg.offset * 0.6) % (CANVAS_W + 30));
    ctx.save();
    ctx.translate(px, d.y);
    ctx.rotate(d.angle);
    ctx.strokeRect(-d.size / 2, -d.size / 4, d.size, d.size / 2);
    ctx.restore();
  });

  ctx.strokeStyle = "#57534e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(CANVAS_W, FLOOR_Y);
  ctx.stroke();
}

// ─────────────────────────────────────────────────────────────────────────────
//  LANDMARK: Al-Fakhoura UNRWA School (Jabalia)
//  Struck Oct 19 2023 — families sheltering inside
// ─────────────────────────────────────────────────────────────────────────────
function drawLandmark_School(ctx: CanvasRenderingContext2D, bg: BgData) {
  const scroll = (bg.offset * 0.09) % (CANVAS_W + 500);
  const x = 820 - scroll;
  const base = FLOOR_Y;
  ctx.save();

  // Main 3-story body
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#1a0f06";
  ctx.fillRect(x, base - 250, 210, 250);

  // Left wing (lower, partially intact)
  ctx.fillRect(x - 120, base - 170, 120, 170);

  // Jagged collapsed roof — main block
  ctx.fillStyle = "#110a04";
  ctx.beginPath();
  ctx.moveTo(x, base - 250);
  ctx.lineTo(x + 40, base - 272);
  ctx.lineTo(x + 80, base - 252);
  ctx.lineTo(x + 130, base - 268);
  ctx.lineTo(x + 180, base - 248);
  ctx.lineTo(x + 210, base - 258);
  ctx.lineTo(x + 210, base - 240);
  ctx.lineTo(x, base - 240);
  ctx.fill();

  // Jagged collapsed roof — left wing
  ctx.beginPath();
  ctx.moveTo(x - 120, base - 170);
  ctx.lineTo(x - 90, base - 186);
  ctx.lineTo(x - 50, base - 172);
  ctx.lineTo(x - 20, base - 182);
  ctx.lineTo(x, base - 170);
  ctx.lineTo(x, base - 158);
  ctx.lineTo(x - 120, base - 158);
  ctx.fill();

  // UNRWA blue horizontal stripe
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#1e40af";
  ctx.fillRect(x, base - 190, 210, 18);
  ctx.fillRect(x, base - 100, 210, 18);

  // Windows — dark hollow
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#0a0604";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      ctx.fillRect(x + 12 + col * 39, base - 238 + row * 74, 22, 34);
    }
  }
  // Left wing windows
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      ctx.fillRect(x - 108 + col * 45, base - 155 + row * 62, 22, 30);
    }
  }

  // Rubble mound at base
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "#2c1a0a";
  ctx.beginPath();
  ctx.moveTo(x - 120, base);
  ctx.lineTo(x - 85, base - 40);
  ctx.lineTo(x - 30, base - 22);
  ctx.lineTo(x + 60, base - 45);
  ctx.lineTo(x + 140, base - 18);
  ctx.lineTo(x + 220, base - 35);
  ctx.lineTo(x + 260, base);
  ctx.fill();

  // Label text
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#93c5fd";
  ctx.font = "bold 11px monospace";
  ctx.fillText("AL-FAKHOURA SCHOOL", x + 4, base - 262);

  // Palestinian flag above rubble
  drawPalestineFlag(ctx, x + 168, base - 296, 26, 16);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  LANDMARK: Al-Shifa Hospital (Gaza City)
//  Raided Nov 2023 & Mar 2024 — patients died without power
// ─────────────────────────────────────────────────────────────────────────────
function drawLandmark_Shifa(ctx: CanvasRenderingContext2D, bg: BgData) {
  const scroll = (bg.offset * 0.08) % (CANVAS_W + 600);
  const x = 740 - scroll;
  const base = FLOOR_Y;
  ctx.save();

  // Main large central block
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#0d0a14";
  ctx.fillRect(x, base - 290, 260, 290);

  // Left wing
  ctx.fillRect(x - 130, base - 200, 130, 200);

  // Right wing (more damaged)
  ctx.fillRect(x + 260, base - 160, 100, 160);

  // Connecting skybridge
  ctx.fillStyle = "#0a0810";
  ctx.fillRect(x - 130, base - 210, 490, 18);

  // Jagged roofline — central
  ctx.fillStyle = "#07050e";
  ctx.beginPath();
  ctx.moveTo(x, base - 290);
  ctx.lineTo(x + 50, base - 308);
  ctx.lineTo(x + 100, base - 290);
  ctx.lineTo(x + 150, base - 315);
  ctx.lineTo(x + 210, base - 292);
  ctx.lineTo(x + 260, base - 300);
  ctx.lineTo(x + 260, base - 278);
  ctx.lineTo(x, base - 278);
  ctx.fill();

  // Red medical cross (darkened, fire-lit)
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(x + 110, base - 260, 14, 46);
  ctx.fillRect(x + 96, base - 247, 42, 14);

  // Windows — dark shattered
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#07050e";
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      if (Math.random() > 0.2) ctx.fillRect(x + 12 + col * 40, base - 278 + row * 52, 26, 32);
    }
  }

  // Left wing windows
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillRect(x - 122 + col * 38, base - 185 + row * 56, 22, 30);
    }
  }

  // Rubble
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#1a1228";
  ctx.beginPath();
  ctx.moveTo(x - 130, base);
  ctx.lineTo(x - 100, base - 50);
  ctx.lineTo(x - 40, base - 28);
  ctx.lineTo(x + 80, base - 55);
  ctx.lineTo(x + 200, base - 30);
  ctx.lineTo(x + 370, base - 48);
  ctx.lineTo(x + 370, base);
  ctx.fill();

  // Label
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#fca5a5";
  ctx.font = "bold 11px monospace";
  ctx.fillText("AL-SHIFA HOSPITAL", x + 4, base - 322);

  // Palestinian flag above main block
  drawPalestineFlag(ctx, x + 228, base - 340, 28, 17);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  LANDMARK: Al-Huda Mosque — Nuseirat Camp
//  Mosque of generations, destroyed 2023–24
// ─────────────────────────────────────────────────────────────────────────────
function drawLandmark_NuseiratMosque(ctx: CanvasRenderingContext2D, bg: BgData) {
  const scroll = (bg.offset * 0.09) % (CANVAS_W + 500);
  const x = 860 - scroll;
  const base = FLOOR_Y;
  ctx.save();

  // Main prayer hall body
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#180f0a";
  ctx.fillRect(x, base - 200, 220, 200);

  // Partially collapsed dome
  ctx.fillStyle = "#120c08";
  ctx.beginPath();
  ctx.arc(x + 110, base - 200, 80, Math.PI, 0);
  ctx.fill();
  // Dome crack / collapse on left side
  ctx.fillStyle = "#1a0f0a";
  ctx.beginPath();
  ctx.moveTo(x + 30, base - 200);
  ctx.lineTo(x + 30, base - 255);
  ctx.lineTo(x + 80, base - 275);
  ctx.lineTo(x + 110, base - 280);
  ctx.lineTo(x + 140, base - 275);
  ctx.lineTo(x + 190, base - 255);
  ctx.lineTo(x + 190, base - 200);
  ctx.fill();

  // Dome crumble on left side (lighter cutout to show damage)
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#2a1810";
  ctx.beginPath();
  ctx.moveTo(x + 30, base - 200);
  ctx.lineTo(x + 30, base - 248);
  ctx.lineTo(x + 60, base - 232);
  ctx.lineTo(x + 40, base - 205);
  ctx.fill();

  // Tall minaret — partially standing
  ctx.globalAlpha = 0.58;
  ctx.fillStyle = "#1c1008";
  ctx.fillRect(x + 180, base - 340, 28, 340);
  // Minaret top broken off
  ctx.fillStyle = "#120c08";
  ctx.beginPath();
  ctx.moveTo(x + 180, base - 340);
  ctx.lineTo(x + 194, base - 358);
  ctx.lineTo(x + 208, base - 340);
  ctx.fill();
  // Minaret broken mid-section
  ctx.fillStyle = "#3d2010";
  ctx.beginPath();
  ctx.moveTo(x + 190, base - 310);
  ctx.lineTo(x + 225, base - 295);
  ctx.lineTo(x + 230, base - 300);
  ctx.lineTo(x + 210, base - 310);
  ctx.fill();

  // Decorative arched windows
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#0a0605";
  for (let col = 0; col < 4; col++) {
    const wx = x + 16 + col * 48;
    const wy = base - 170;
    ctx.fillRect(wx, wy, 28, 44);
    ctx.beginPath();
    ctx.arc(wx + 14, wy, 14, Math.PI, 0);
    ctx.fill();
  }

  // Rubble
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "#2e1a0c";
  ctx.beginPath();
  ctx.moveTo(x - 10, base);
  ctx.lineTo(x + 10, base - 38);
  ctx.lineTo(x + 60, base - 22);
  ctx.lineTo(x + 130, base - 42);
  ctx.lineTo(x + 220, base - 18);
  ctx.lineTo(x + 250, base);
  ctx.fill();

  // Label
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "bold 11px monospace";
  ctx.fillText("AL-HUDA MOSQUE  ·  NUSEIRAT", x - 20, base - 372);

  // Palestinian flag on minaret top
  drawPalestineFlag(ctx, x + 212, base - 380, 26, 16);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  LANDMARK: Khan Younis Castle — Mamluk fortress, 14th century
//  Heavily damaged in 2023–24 operations
// ─────────────────────────────────────────────────────────────────────────────
function drawLandmark_KhanYouniscastle(ctx: CanvasRenderingContext2D, bg: BgData) {
  const scroll = (bg.offset * 0.08) % (CANVAS_W + 500);
  const x = 780 - scroll;
  const base = FLOOR_Y;
  ctx.save();

  // Main fortress wall
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#1a1208";
  ctx.fillRect(x, base - 220, 300, 220);

  // Crenellations along the top
  ctx.fillStyle = "#120d06";
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) ctx.fillRect(x + i * 25, base - 240, 22, 22);
  }
  // Some crenellations broken off
  ctx.fillStyle = "#2c1e0e";
  ctx.fillRect(x + 50, base - 240, 12, 12);
  ctx.fillRect(x + 150, base - 235, 18, 15);

  // Left tower
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#1e1409";
  ctx.fillRect(x - 55, base - 280, 65, 280);
  // Tower crenellations
  ctx.fillStyle = "#150f06";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x - 55 + i * 16, base - 296, 12, 18);
  }

  // Right tower (partially collapsed)
  ctx.fillRect(x + 290, base - 240, 60, 240);
  ctx.fillStyle = "#150f06";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 290 + i * 18, base - 255, 12, 18);
  }
  // Right tower damaged top
  ctx.fillStyle = "#3d2a12";
  ctx.beginPath();
  ctx.moveTo(x + 320, base - 240);
  ctx.lineTo(x + 360, base - 220);
  ctx.lineTo(x + 380, base - 240);
  ctx.lineTo(x + 380, base - 228);
  ctx.lineTo(x + 350, base - 245);
  ctx.fill();

  // Arched entrance gate
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#0a0704";
  ctx.fillRect(x + 115, base - 140, 70, 140);
  ctx.beginPath();
  ctx.arc(x + 150, base - 140, 35, Math.PI, 0);
  ctx.fill();

  // Mamluk decorative banding
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#8b6914";
  ctx.fillRect(x, base - 185, 300, 6);
  ctx.fillRect(x, base - 125, 300, 6);
  ctx.fillRect(x - 55, base - 215, 65, 5);

  // Stone texture lines
  ctx.strokeStyle = "#0f0b05";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.25;
  for (let row = 0; row < 6; row++) {
    ctx.beginPath();
    ctx.moveTo(x, base - 220 + row * 35);
    ctx.lineTo(x + 300, base - 220 + row * 35);
    ctx.stroke();
  }

  // Rubble at base
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "#2c1e0e";
  ctx.beginPath();
  ctx.moveTo(x - 55, base);
  ctx.lineTo(x - 30, base - 44);
  ctx.lineTo(x + 30, base - 25);
  ctx.lineTo(x + 110, base - 52);
  ctx.lineTo(x + 240, base - 30);
  ctx.lineTo(x + 355, base - 48);
  ctx.lineTo(x + 360, base);
  ctx.fill();

  // Label
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#fcd34d";
  ctx.font = "bold 11px monospace";
  ctx.fillText("KHAN YOUNIS CASTLE  (14th C.)", x - 30, base - 310);

  // Palestinian flag on left tower
  drawPalestineFlag(ctx, x - 24, base - 306, 26, 16);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  LANDMARK: Rafah Border Crossing Terminal
//  Seized May 7 2024 — sole humanitarian lifeline closed
// ─────────────────────────────────────────────────────────────────────────────
function drawLandmark_RafahCrossing(ctx: CanvasRenderingContext2D, bg: BgData) {
  const scroll = (bg.offset * 0.07) % (CANVAS_W + 500);
  const x = 760 - scroll;
  const base = FLOOR_Y;
  ctx.save();

  // Terminal building left
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = "#0a1422";
  ctx.fillRect(x, base - 210, 160, 210);

  // Terminal building right
  ctx.fillRect(x + 240, base - 210, 160, 210);

  // Large gate arch spanning the gap
  ctx.fillStyle = "#081020";
  ctx.fillRect(x + 155, base - 230, 90, 30); // arch lintel
  ctx.beginPath(); // arch curve
  ctx.arc(x + 200, base - 230, 55, Math.PI, 0);
  ctx.fill();

  // Gate opening (darker)
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#030810";
  ctx.fillRect(x + 158, base - 228, 84, 228);

  // Barrier boom arm
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(x + 200, base - 100, 5, 18);
  ctx.fillStyle = "#b91c1c";
  ctx.fillRect(x + 204, base - 96, 90, 8);
  // Black/yellow stripes on boom
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#fbbf24" : "#b91c1c";
    ctx.fillRect(x + 205 + i * 15, base - 96, 14, 8);
  }

  // Control tower
  ctx.globalAlpha = 0.52;
  ctx.fillStyle = "#0d1a2e";
  ctx.fillRect(x - 50, base - 290, 52, 290);
  ctx.fillRect(x - 70, base - 310, 90, 26);

  // Windows — lit faintly with orange from fire
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#7c2d12";
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillRect(x + 14 + col * 48, base - 192 + row * 45, 32, 28);
    }
  }
  // Right building windows
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillRect(x + 254 + col * 48, base - 192 + row * 45, 32, 28);
    }
  }

  // Palestinian crescent (damaged)
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 80, base - 180, 24, 0, Math.PI * 1.6);
  ctx.stroke();

  // Concrete blast barriers at base
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#1e293b";
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(x - 80 + i * 44, base - 30, 30, 30);
  }

  // Label
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#6ee7b7";
  ctx.font = "bold 11px monospace";
  ctx.fillText("RAFAH CROSSING", x + 60, base - 325);

  // Palestinian flag on control tower
  drawPalestineFlag(ctx, x - 26, base - 338, 26, 16);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE BACKGROUNDS
// ─────────────────────────────────────────────────────────────────────────────

function drawJabalia(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, "#1c1917");
  skyGrad.addColorStop(0.4, "#431407");
  skyGrad.addColorStop(0.75, "#9a3412");
  skyGrad.addColorStop(1, "#ea580c");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  // Crescent moon
  ctx.fillStyle = "rgba(251,191,36,0.9)";
  ctx.beginPath();
  ctx.arc(120, 80, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#431407";
  ctx.beginPath();
  ctx.arc(136, 74, 34, 0, Math.PI * 2);
  ctx.fill();

  // Fire glow
  const glow = ctx.createRadialGradient(CANVAS_W * 0.7, FLOOR_Y, 0, CANVAS_W * 0.7, FLOOR_Y, 300);
  glow.addColorStop(0, "rgba(249,115,22,0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Tents
  bg.tents.forEach((t) => {
    const px = ((t.x - bg.offset * 0.3) % (CANVAS_W + t.w)) - t.w / 2;
    ctx.fillStyle = "#57534e";
    ctx.beginPath();
    ctx.moveTo(px, FLOOR_Y);
    ctx.lineTo(px + t.w / 2, FLOOR_Y - t.h);
    ctx.lineTo(px + t.w, FLOOR_Y);
    ctx.fill();
    ctx.strokeStyle = "#44403c";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Landmark: Al-Fakhoura UNRWA School
  drawLandmark_School(ctx, bg);

  // Ruins silhouettes over landmark
  drawRuinSilhouette(ctx, bg, frame, "#292524", 0.4, 0.65);
  drawRuinSilhouette(ctx, bg, frame, "#1c1917", 0.6, 0.8);

  // Smoke
  bg.smoke.slice(0, 5).forEach((s) => {
    const px = (s.x - bg.offset * 0.2) % (CANVAS_W + 80) - 40;
    const rise = (frame * s.speed * 0.3) % 200;
    ctx.globalAlpha = Math.max(0, 0.3 - rise / 600);
    ctx.fillStyle = "#292524";
    ctx.beginPath();
    ctx.arc(px, s.y - rise, s.r + rise * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Stars faint
  bg.stars.slice(0, 25).forEach((s) => {
    ctx.globalAlpha = Math.sin(frame * 0.04 + s.twinkle) * 0.1 + 0.12;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawGazaCity(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, "#0f0f1a");
  skyGrad.addColorStop(0.5, "#1e0a2e");
  skyGrad.addColorStop(1, "#3b1260");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  // Stars
  bg.stars.forEach((s) => {
    ctx.globalAlpha = Math.sin(frame * 0.04 + s.twinkle) * 0.3 + 0.5;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // City skyline (dark background buildings — war-torn)
  const heights = [240, 180, 280, 160, 220, 300, 190, 250, 170, 210];
  heights.forEach((h, i) => {
    const bx = (i * 140 - bg.offset * 0.5) % (CANVAS_W + 140) - 70;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(bx, FLOOR_Y - h, 100, h);
    ctx.strokeStyle = "#2d2d4e";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, FLOOR_Y - h, 100, h);
    for (let wy = 0; wy < h - 20; wy += 24) {
      for (let wx = 6; wx < 90; wx += 18) {
        const on = Math.sin(frame * 0.02 + i * 3 + wy + wx) > 0.3;
        ctx.fillStyle = on ? "rgba(251,191,36,0.45)" : "rgba(30,30,60,0.8)";
        ctx.fillRect(bx + wx, FLOOR_Y - h + wy + 6, 12, 14);
      }
    }
    drawWarDamageOverlay(ctx, bx, FLOOR_Y - h, 100, h, i + 100, frame);
  });

  // Landmark: Al-Shifa Hospital
  drawLandmark_Shifa(ctx, bg);

  // Hind Rajab's burned car — a permanent memorial in the background
  drawBurnedCar_HindRajab(ctx, bg, frame);

  // Artillery fire glow
  const artGlow = ctx.createRadialGradient(CANVAS_W * 0.55, FLOOR_Y - 80, 0, CANVAS_W * 0.55, FLOOR_Y - 80, 380);
  artGlow.addColorStop(0, "rgba(239,68,68,0.08)");
  artGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = artGlow;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Fog layer
  const fGrad = ctx.createLinearGradient(0, FLOOR_Y - 120, 0, FLOOR_Y);
  fGrad.addColorStop(0, "rgba(0,0,0,0)");
  fGrad.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

// ─────────────────────────────────────────────────────────────────────────────
//  HIND RAJAB'S CAR — Gaza City
//  Burned, bullet-riddled car where Hind (age 6) was found, Jan 29 2024
// ─────────────────────────────────────────────────────────────────────────────
function drawBurnedCar_HindRajab(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  const rawX = 560 - (bg.offset * 0.22) % (CANVAS_W + 500);
  const x = rawX;
  const base = FLOOR_Y;

  ctx.save();

  // Ground shadow
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(x + 98, base - 2, 112, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ember/fire glow from within (slow pulse)
  const pulse = 0.1 + Math.sin(frame * 0.038) * 0.05;
  ctx.globalAlpha = pulse;
  const grd = ctx.createRadialGradient(x + 98, base - 48, 8, x + 98, base - 48, 90);
  grd.addColorStop(0, "#7c2d12");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(x, base - 130, 196, 90);
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.75;

  // WHEELS (burned flat)
  ctx.fillStyle = "#080604";
  ctx.beginPath(); ctx.ellipse(x + 36, base - 4, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 160, base - 4, 22, 9, 0, 0, Math.PI * 2); ctx.fill();

  // CAR LOWER BODY
  ctx.fillStyle = "#0f0c08";
  ctx.fillRect(x + 14, base - 48, 170, 44);

  // CABIN
  ctx.fillStyle = "#0d0a06";
  ctx.beginPath();
  ctx.moveTo(x + 36, base - 48);
  ctx.lineTo(x + 52, base - 82);
  ctx.lineTo(x + 148, base - 82);
  ctx.lineTo(x + 164, base - 48);
  ctx.closePath();
  ctx.fill();

  // HOOD
  ctx.fillStyle = "#0b0906";
  ctx.beginPath();
  ctx.moveTo(x + 148, base - 82);
  ctx.lineTo(x + 190, base - 58);
  ctx.lineTo(x + 184, base - 48);
  ctx.lineTo(x + 164, base - 48);
  ctx.closePath();
  ctx.fill();

  // TRUNK
  ctx.beginPath();
  ctx.moveTo(x + 36, base - 48);
  ctx.lineTo(x + 14, base - 48);
  ctx.lineTo(x + 8, base - 58);
  ctx.lineTo(x + 52, base - 82);
  ctx.closePath();
  ctx.fill();

  // WINDSHIELD — shattered, dark
  ctx.fillStyle = "#060403";
  ctx.beginPath();
  ctx.moveTo(x + 56, base - 80);
  ctx.lineTo(x + 68, base - 62);
  ctx.lineTo(x + 136, base - 62);
  ctx.lineTo(x + 144, base - 80);
  ctx.closePath();
  ctx.fill();
  // Cracks
  ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(x + 80, base - 80); ctx.lineTo(x + 76, base - 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 110, base - 80); ctx.lineTo(x + 118, base - 62); ctx.stroke();

  // SIDE WINDOWS — blown out
  ctx.fillStyle = "#050302";
  ctx.fillRect(x + 40, base - 60, 38, 12);
  ctx.fillRect(x + 118, base - 60, 38, 12);

  // BULLET HOLES on door panel
  const holes: [number, number][] = [
    [x + 65, base - 30], [x + 76, base - 24], [x + 84, base - 33],
    [x + 72, base - 18], [x + 92, base - 28],
  ];
  for (const [hx, hy] of holes) {
    ctx.fillStyle = "#060404";
    ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 0.5;
    for (let r = 0; r < 5; r++) {
      const a = (r / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(a) * 5.5, hy + Math.sin(a) * 5.5); ctx.stroke();
    }
  }

  // Char marks
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#050403";
  ctx.beginPath(); ctx.ellipse(x + 98, base - 66, 55, 16, 0, 0, Math.PI * 2); ctx.fill();

  // WILDFLOWER — Handala's tribute, small and quiet
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = "#4d7c0f"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x + 95, base - 4); ctx.quadraticCurveTo(x + 93, base - 18, x + 94, base - 30); ctx.stroke();
  const fc: [number, number] = [x + 94, base - 31];
  [0, 60, 120, 180, 240, 300].forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath(); ctx.ellipse(fc[0] + Math.cos(rad) * 4.5, fc[1] + Math.sin(rad) * 4.5, 2.5, 1.5, rad, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.arc(fc[0], fc[1], 2.5, 0, Math.PI * 2); ctx.fill();

  // Label — small, faint, respectful
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#fca5a5";
  ctx.font = "bold 8px monospace";
  ctx.fillText("HIND RAJAB · 29.01.24", x + 12, base - 90);

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawNuseirat(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  // Sky: grey-ochre dust haze — midday bombardment
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, "#1a1208");
  skyGrad.addColorStop(0.35, "#3d2808");
  skyGrad.addColorStop(0.7, "#7c4d14");
  skyGrad.addColorStop(1, "#b5722a");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  // Dust haze overlay
  const dustGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  dustGrad.addColorStop(0, "rgba(120,80,20,0)");
  dustGrad.addColorStop(0.5, "rgba(160,100,30,0.15)");
  dustGrad.addColorStop(1, "rgba(180,120,40,0.3)");
  ctx.fillStyle = dustGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  // Dense low-rise camp buildings scrolling (war-torn)
  const campHeights = [120, 100, 140, 90, 130, 110, 150, 95, 125, 115, 138, 105, 145, 98];
  campHeights.forEach((h, i) => {
    const bx = (i * 95 - bg.offset * 0.45) % (CANVAS_W + 150) - 75;
    ctx.fillStyle = "#2a1a0a";
    ctx.fillRect(bx, FLOOR_Y - h, 75, h);
    ctx.strokeStyle = "#1c1006";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, FLOOR_Y - h, 75, h);
    for (let wy = 0; wy < h - 16; wy += 28) {
      for (let wx = 6; wx < 65; wx += 20) {
        const lit = Math.sin(frame * 0.015 + i * 7 + wy) > 0.6;
        ctx.fillStyle = lit ? "rgba(200,120,20,0.3)" : "#0f0802";
        ctx.fillRect(bx + wx, FLOOR_Y - h + wy + 8, 12, 16);
      }
    }
    drawWarDamageOverlay(ctx, bx, FLOOR_Y - h, 75, h, i + 200, frame);
  });

  // Landmark: Al-Huda Mosque
  drawLandmark_NuseiratMosque(ctx, bg);

  // Heavier dust particles
  bg.smoke.forEach((s) => {
    const px = (s.x - bg.offset * 0.22) % (CANVAS_W + 80) - 40;
    const rise = (frame * s.speed * 0.22) % 180;
    ctx.globalAlpha = Math.max(0, 0.28 - rise / 500);
    ctx.fillStyle = "#8b5e1a";
    ctx.beginPath();
    ctx.arc(px, s.y - rise, s.r * 1.2 + rise * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Fire glow from market area
  const mktGlow = ctx.createRadialGradient(CANVAS_W * 0.45, FLOOR_Y - 40, 0, CANVAS_W * 0.45, FLOOR_Y - 40, 260);
  mktGlow.addColorStop(0, "rgba(249,115,22,0.18)");
  mktGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = mktGlow;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars (barely visible through dust)
  bg.stars.slice(0, 18).forEach((s) => {
    ctx.globalAlpha = Math.sin(frame * 0.03 + s.twinkle) * 0.06 + 0.07;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawKhanYounis(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, "#1c1917");
  skyGrad.addColorStop(0.5, "#78350f");
  skyGrad.addColorStop(1, "#b45309");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  const dustGrad = ctx.createLinearGradient(0, FLOOR_Y - 200, 0, FLOOR_Y);
  dustGrad.addColorStop(0, "rgba(180,83,9,0)");
  dustGrad.addColorStop(1, "rgba(180,83,9,0.3)");
  ctx.fillStyle = dustGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  bg.ruins.forEach((r, i) => {
    const h2 = r.h * 0.6;
    const px = (r.x - bg.offset * 0.4) % (CANVAS_W + r.w * 2) - r.w;
    ctx.fillStyle = "#78716c";
    ctx.fillRect(px, FLOOR_Y - h2, r.w, h2);
    ctx.strokeStyle = "#57534e";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, FLOOR_Y - h2, r.w, h2);
    ctx.fillStyle = "#292524";
    ctx.fillRect(px + 8, FLOOR_Y - h2 + 14, 14, 12);
    drawWarDamageOverlay(ctx, px, FLOOR_Y - h2, r.w, h2, i + 300, frame);
  });

  // Landmark: Khan Younis Castle
  drawLandmark_KhanYouniscastle(ctx, bg);

  bg.mountains.forEach((m) => {
    const px = (m.x - bg.offset * 0.2) % (CANVAS_W + m.w) - m.w / 2;
    ctx.fillStyle = "#292524";
    ctx.beginPath();
    ctx.moveTo(px, FLOOR_Y - 60);
    ctx.lineTo(px + m.w / 2, FLOOR_Y - 60 - m.h * 0.5);
    ctx.lineTo(px + m.w, FLOOR_Y - 60);
    ctx.fill();
  });

  bg.smoke.slice(0, 6).forEach((s) => {
    const px = (s.x - bg.offset * 0.25) % (CANVAS_W + 80) - 40;
    const rise = frame * s.speed * 0.25 % 160;
    ctx.globalAlpha = Math.max(0, 0.25 - rise / 600);
    ctx.fillStyle = "#44403c";
    ctx.beginPath();
    ctx.arc(px, s.y - rise, s.r + rise * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawRafah(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, "#0c4a6e");
  skyGrad.addColorStop(0.45, "#075985");
  skyGrad.addColorStop(0.75, "#0ea5e9");
  skyGrad.addColorStop(1, "#38bdf8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  const dawnGrad = ctx.createRadialGradient(CANVAS_W - 80, FLOOR_Y + 20, 0, CANVAS_W - 80, FLOOR_Y + 20, 380);
  dawnGrad.addColorStop(0, "rgba(251,191,36,0.55)");
  dawnGrad.addColorStop(0.4, "rgba(249,115,22,0.2)");
  dawnGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dawnGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  bg.stars.forEach((s) => {
    ctx.globalAlpha = Math.sin(frame * 0.03 + s.twinkle) * 0.15 + 0.2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Landmark: Rafah Crossing Terminal
  drawLandmark_RafahCrossing(ctx, bg);

  // Border fence
  ctx.fillStyle = "#374151";
  ctx.fillRect(0, FLOOR_Y - 90, CANVAS_W, 8);
  for (let i = 0; i < 40; i++) {
    const px = (i * 34 - bg.offset * 0.1) % (CANVAS_W + 34);
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(px, FLOOR_Y - 140, 6, 50);
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 20, FLOOR_Y - 142);
    ctx.lineTo(px + 20, FLOOR_Y - 138);
    ctx.stroke();
  }

  bg.ruins.slice(0, 6).forEach((r) => {
    const h2 = r.h * 0.5;
    const px = (r.x - bg.offset * 0.5) % (CANVAS_W + r.w * 2) - r.w;
    ctx.fillStyle = "#374151";
    ctx.fillRect(px, FLOOR_Y - h2, r.w * 0.8, h2);
  });

  // Palestinian flag drifting
  const flagX = frame * 0.4 % (CANVAS_W + 80) - 80;
  ctx.fillStyle = "#000";
  ctx.fillRect(flagX, 60, 60, 15);
  ctx.fillStyle = "#fff";
  ctx.fillRect(flagX, 75, 60, 15);
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(flagX, 90, 60, 15);
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(flagX, 60);
  ctx.lineTo(flagX + 28, 82);
  ctx.lineTo(flagX, 105);
  ctx.closePath();
  ctx.fill();
}

function drawRuinSilhouette(ctx: CanvasRenderingContext2D, bg: BgData, _frame: number, color: string, parallax: number, scale: number) {
  ctx.fillStyle = color;
  bg.ruins.forEach((r) => {
    const px = (r.x - bg.offset * parallax) % (CANVAS_W + r.w * 2) - r.w;
    const h = r.h * scale;
    ctx.fillRect(px, FLOOR_Y - h, r.w, h);
    for (let j = 0; j < 3; j++) {
      ctx.fillRect(px + j * r.w / 3, FLOOR_Y - h - r.dmg * 20 - j * 8, r.w / 4, r.dmg * 20 + j * 8);
    }
  });
}
