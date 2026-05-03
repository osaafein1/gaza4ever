import type { BgData } from "./gameTypes";
import { CANVAS_W, CANVAS_H, FLOOR_Y } from "./gameConstants";

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

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
    case "jabalia":    drawJabalia(ctx, bg, frame); break;
    case "gaza-city":  drawGazaCity(ctx, bg, frame); break;
    case "khan-younis": drawKhanYounis(ctx, bg, frame); break;
    case "rafah":      drawRafah(ctx, bg, frame); break;
    default:           drawJabalia(ctx, bg, frame); break;
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

function drawJabalia(ctx: CanvasRenderingContext2D, bg: BgData, frame: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  skyGrad.addColorStop(0, "#1c1917");
  skyGrad.addColorStop(0.4, "#431407");
  skyGrad.addColorStop(0.75, "#9a3412");
  skyGrad.addColorStop(1, "#ea580c");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  // Moon
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

  // Ruins silhouettes
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

  // City skyline
  const heights = [240, 180, 280, 160, 220, 300, 190, 250, 170, 210];
  heights.forEach((h, i) => {
    const bx = (i * 140 - bg.offset * 0.5) % (CANVAS_W + 140) - 70;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(bx, FLOOR_Y - h, 100, h);
    ctx.strokeStyle = "#2d2d4e";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, FLOOR_Y - h, 100, h);
    // Windows
    for (let wy = 0; wy < h - 20; wy += 24) {
      for (let wx = 6; wx < 90; wx += 18) {
        const on = Math.sin(frame * 0.02 + i * 3 + wy + wx) > 0.3;
        ctx.fillStyle = on ? "rgba(251,191,36,0.45)" : "rgba(30,30,60,0.8)";
        ctx.fillRect(bx + wx, FLOOR_Y - h + wy + 6, 12, 14);
      }
    }
  });

  // Artillery fire glow
  const artGlow = ctx.createRadialGradient(CANVAS_W * 0.55, FLOOR_Y - 80, 0, CANVAS_W * 0.55, FLOOR_Y - 80, 380);
  artGlow.addColorStop(0, "rgba(239,68,68,0.08)");
  artGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = artGlow;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Fog
  const fGrad = ctx.createLinearGradient(0, FLOOR_Y - 120, 0, FLOOR_Y);
  fGrad.addColorStop(0, "rgba(0,0,0,0)");
  fGrad.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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

  bg.ruins.forEach((r) => {
    const h2 = r.h * 0.6;
    const px = (r.x - bg.offset * 0.4) % (CANVAS_W + r.w * 2) - r.w;
    ctx.fillStyle = "#78716c";
    ctx.fillRect(px, FLOOR_Y - h2, r.w, h2);
    ctx.strokeStyle = "#57534e";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, FLOOR_Y - h2, r.w, h2);
    ctx.fillStyle = "#292524";
    ctx.fillRect(px + 8, FLOOR_Y - h2 + 14, 14, 12);
  });

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
