import type { GameState, Enemy, Particle, PowerUp, Collectible, Projectile, Summon } from "./gameTypes";
import { CANVAS_W, CANVAS_H, FLOOR_Y, CHARACTERS, COLLECTIBLE_DEFS, SHOP_WEAPONS } from "./gameConstants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ─── Player ─────────────────────────────────────────────────────────────────

export function drawPlayer(ctx: CanvasRenderingContext2D, gs: GameState, frame: number) {
  const p = gs.player;
  const charDef = CHARACTERS[p.activeChar];
  const hurt = p.hurtTimer > 0 && Math.floor(p.hurtTimer / 3) % 2 === 0;
  const cx = p.x + p.width / 2;
  const groundY = p.y;

  // Colour palette
  const shirt  = hurt ? "#fbbf24" : charDef.color;
  const skin   = hurt ? "#fbbf24" : "#c8916a";
  const hair   = hurt ? "#fbbf24" : "#1e0f06";
  const pants  = hurt ? "#fbbf24" : "#4a3222";
  const shoe   = hurt ? "#fbbf24" : "#251408";
  const kCloth = hurt ? "#fbbf24" : "#f5f0e8";

  ctx.save();
  if (!p.facingRight) { ctx.scale(-1, 1); ctx.translate(-2 * cx, 0); }

  // Ground shadow
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 3, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const moving = Math.abs(p.vx) > 0.5;
  const walk   = Math.sin(frame * 0.32) * (moving ? 1 : 0);

  // ─── LEGS (two-segment, knee joint) ──────────────────────────────────────
  const hipY = groundY - 38;
  const thighLen = 18;
  const shinLen  = 16;
  const lAngle = walk * 0.38;   // left thigh angle
  const rAngle = -walk * 0.38;  // right thigh angle

  function drawLeg(thighAngle: number, side: number) {
    const hx = cx + side * 6;
    // Knee position
    const kx = hx + Math.sin(thighAngle) * thighLen;
    const ky = hipY + Math.cos(thighAngle) * thighLen;
    // Foot position (lower leg swings opposite)
    const shinAngle = thighAngle * 0.5;
    const fx = kx + Math.sin(shinAngle) * shinLen;
    const fy = ky + Math.cos(shinAngle) * shinLen;

    // Thigh
    ctx.strokeStyle = pants;
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hx, hipY);
    ctx.lineTo(kx, ky);
    ctx.stroke();
    // Shin
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    // Shoe
    ctx.fillStyle = shoe;
    ctx.beginPath();
    ctx.ellipse(fx + side * 2 + 2, fy + 3, 9, 5, shinAngle * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLeg(lAngle, -1);
  drawLeg(rAngle, +1);

  // ─── TORSO (shirt) ────────────────────────────────────────────────────────
  const torsoTop = groundY - 66;
  const torsoBot = groundY - 40;
  ctx.fillStyle = shirt;
  rRect(ctx, cx - 13, torsoTop, 26, torsoBot - torsoTop, 6);

  // Collar shadow
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  rRect(ctx, cx - 11, torsoTop, 22, 6, 3);

  // ── Palestinian flag badge on chest ──────────────────────────────────────
  if (!hurt) {
    const bx = cx + 1, by = torsoTop + 8, bw = 13, bh = 8;
    const bh3 = bh / 3;
    const bTri = bw * 0.36;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.fillStyle = "#111";    ctx.fillRect(bx, by,          bw, bh3);
    ctx.fillStyle = "#f0ede6"; ctx.fillRect(bx, by + bh3,    bw, bh3);
    ctx.fillStyle = "#15803d"; ctx.fillRect(bx, by + bh3 * 2, bw, bh3);
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + bTri, by + bh / 2); ctx.lineTo(bx, by + bh);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
  }

  // ─── ARMS ────────────────────────────────────────────────────────────────
  const armSwing = walk * 0.28;
  const shoulderY = groundY - 62;
  const armLen = 16;

  if (p.isAttacking) {
    // Punch arm extended forward
    ctx.strokeStyle = skin;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + 12, shoulderY);
    ctx.lineTo(cx + 36, shoulderY + 2);
    ctx.stroke();
    // Fist
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(cx + 38, shoulderY + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    // Impact burst
    ctx.globalAlpha = 0.55 + Math.sin(frame * 0.6) * 0.35;
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + frame * 0.3;
      const r1 = 6, r2 = 10;
      if (i === 0) ctx.moveTo(cx + 46 + Math.cos(a) * r2, shoulderY + 2 + Math.sin(a) * r2);
      else ctx.lineTo(cx + 46 + Math.cos(a - 0.3) * r1, shoulderY + 2 + Math.sin(a - 0.3) * r1);
      ctx.lineTo(cx + 46 + Math.cos(a) * r2, shoulderY + 2 + Math.sin(a) * r2);
    }
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    // Back arm hangs
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 12, shoulderY);
    ctx.lineTo(cx - 14, shoulderY + armLen + 2);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(cx - 14, shoulderY + armLen + 3, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    // Both arms swing naturally
    const lax = cx - 12 + Math.sin(-armSwing) * 8;
    const rax = cx + 12 + Math.sin(armSwing) * 8;
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    // Left
    ctx.beginPath();
    ctx.moveTo(cx - 12, shoulderY);
    ctx.lineTo(lax, shoulderY + armLen);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(lax, shoulderY + armLen + 1, 5, 0, Math.PI * 2); ctx.fill();
    // Right
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(cx + 12, shoulderY);
    ctx.lineTo(rax, shoulderY + armLen);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(rax, shoulderY + armLen + 1, 5, 0, Math.PI * 2); ctx.fill();
  }

  // ─── HEAD (large round — child proportions) ───────────────────────────────
  const hcy = groundY - 84;  // head centre y
  const hr  = 20;            // head radius — big relative to body

  // Neck
  ctx.fillStyle = skin;
  rRect(ctx, cx - 5, groundY - 68, 10, 8, 3);

  // Head base (skin)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx, hcy, hr, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks (soft blush — child)
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#e05050";
  ctx.beginPath(); ctx.ellipse(cx - 13, hcy + 5, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 13, hcy + 5, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // EARS
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(cx - hr + 1, hcy + 2, 4.5, 5.5, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + hr - 1, hcy + 2, 4.5, 5.5, -0.15, 0, Math.PI * 2); ctx.fill();
  // Inner ear
  ctx.fillStyle = "#b07860";
  ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.ellipse(cx - hr + 2, hcy + 2, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + hr - 2, hcy + 2, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // HAIR — dark, covers top 55% of head
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(cx, hcy, hr, Math.PI * 1.08, Math.PI * 1.92);
  ctx.lineTo(cx + hr * Math.cos(Math.PI * 1.92 - Math.PI), hcy + 3);
  ctx.lineTo(cx - hr * Math.cos(Math.PI * 1.08 - Math.PI), hcy + 3);
  ctx.closePath();
  ctx.fill();
  // Small hair tuft at top
  ctx.beginPath();
  ctx.arc(cx, hcy - hr + 4, 6, 0, Math.PI * 2);
  ctx.fill();

  // EYES — big, expressive (key child feature)
  const ey = hcy + 3;
  // Whites
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(cx - 7, ey, 5.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 7, ey, 5.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Iris (warm brown)
  ctx.fillStyle = "#5c3010";
  ctx.beginPath(); ctx.ellipse(cx - 7, ey + 0.5, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 7, ey + 0.5, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = "#0f0600";
  ctx.beginPath(); ctx.arc(cx - 7, ey + 0.5, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, ey + 0.5, 2.4, 0, Math.PI * 2); ctx.fill();
  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx - 5.5, ey - 1.2, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8.5, ey - 1.2, 1.4, 0, Math.PI * 2); ctx.fill();
  // Lower lid
  ctx.strokeStyle = "rgba(160,90,50,0.4)";
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(cx - 7, ey + 0.5, 5.5, 0.1, Math.PI - 0.1); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 7, ey + 0.5, 5.5, 0.1, Math.PI - 0.1); ctx.stroke();

  // EYEBROWS — slightly arched, childlike
  ctx.strokeStyle = hair;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 12, ey - 8);
  ctx.quadraticCurveTo(cx - 7, ey - 11, cx - 2, ey - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 12, ey - 8);
  ctx.quadraticCurveTo(cx + 7, ey - 11, cx + 2, ey - 8);
  ctx.stroke();

  // NOSE — small, button
  ctx.fillStyle = "#a86842";
  ctx.beginPath();
  ctx.arc(cx, ey + 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a5030";
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(cx - 2.8, ey + 8.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 2.8, ey + 8.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // MOUTH — small, slight upward curve
  ctx.strokeStyle = "#8a4020";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 4.5, ey + 13.5);
  ctx.quadraticCurveTo(cx, ey + 15.5, cx + 4.5, ey + 13.5);
  ctx.stroke();

  // ─── KEFFIYEH ─────────────────────────────────────────────────────────────
  // Worn properly: dome over top of head, face fully visible.
  // Folded band at hairline; one end drapes down the left side.
  const kR       = hr + 2;                           // fabric radius
  const kA1      = Math.PI * 1.18;                   // left start angle
  const kA2      = Math.PI * 1.82;                   // right end angle
  // Chord y: where the dome meets the forehead (above eyebrows)
  const kChordY  = hcy + kR * Math.sin(kA1);        // ≈ hcy - 11.8
  const kChordHW = Math.abs(kR * Math.cos(kA1));    // ≈ 18.6

  // --- White dome (top of head only, above hairline) ----
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = kCloth;
  ctx.beginPath();
  ctx.arc(cx, hcy, kR, kA1, kA2);
  ctx.closePath();  // straight chord across forehead
  ctx.fill();

  // --- Charcoal check grid on dome ----------------------
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = "#2a1a0a";
  ctx.lineWidth = 0.9;
  for (let dy = -kR + 2; dy < kChordY - hcy + 1; dy += 5) {
    const hw = Math.sqrt(Math.max(0, kR * kR - dy * dy));
    ctx.beginPath();
    ctx.moveTo(cx - hw, hcy + dy);
    ctx.lineTo(cx + hw, hcy + dy);
    ctx.stroke();
  }
  for (let dx = -kChordHW; dx <= kChordHW; dx += 5) {
    const topY = hcy - Math.sqrt(Math.max(0, kR * kR - dx * dx));
    ctx.beginPath();
    ctx.moveTo(cx + dx, kChordY);
    ctx.lineTo(cx + dx, topY);
    ctx.stroke();
  }

  // --- Colour pattern tint (character-coloured diamonds) ---
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = charDef.color;
  ctx.beginPath();
  ctx.arc(cx, hcy, kR, kA1, kA2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // --- Folded forehead band (hem of fabric) -------------
  ctx.fillStyle = "#d4ccb5";
  ctx.beginPath();
  ctx.moveTo(cx - kChordHW, kChordY);
  ctx.lineTo(cx + kChordHW, kChordY);
  ctx.lineTo(cx + kChordHW - 1, kChordY + 5);
  ctx.lineTo(cx - kChordHW + 1, kChordY + 5);
  ctx.closePath();
  ctx.fill();
  // Drop shadow under band
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(cx - kChordHW + 1, kChordY + 4, kChordHW * 2 - 2, 3);

  // --- Fringe tassels along bottom of band --------------
  ctx.strokeStyle = "#988860";
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.65;
  const nTassels = 8;
  for (let i = 0; i < nTassels; i++) {
    const tx = cx - kChordHW + 2 + i * ((kChordHW * 2 - 4) / (nTassels - 1));
    ctx.beginPath();
    ctx.moveTo(tx, kChordY + 5);
    ctx.lineTo(tx, kChordY + 9.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // --- Left-side drape (hangs from temple to shoulder) --
  ctx.fillStyle = kCloth;
  ctx.globalAlpha = 0.91;
  ctx.beginPath();
  ctx.moveTo(cx - kChordHW + 1, kChordY + 3);
  ctx.quadraticCurveTo(cx - hr - 5, hcy + 10, cx - 20, groundY - 62);
  ctx.lineTo(cx - 13, groundY - 58);
  ctx.quadraticCurveTo(cx - 9, hcy + 16, cx - hr + 2, hcy + 4);
  ctx.lineTo(cx - kChordHW + 4, kChordY + 1);
  ctx.closePath();
  ctx.fill();
  // Colour tint on drape
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = charDef.color;
  ctx.beginPath();
  ctx.moveTo(cx - kChordHW + 1, kChordY + 3);
  ctx.quadraticCurveTo(cx - hr - 5, hcy + 10, cx - 20, groundY - 62);
  ctx.lineTo(cx - 13, groundY - 58);
  ctx.quadraticCurveTo(cx - 9, hcy + 16, cx - hr + 2, hcy + 4);
  ctx.lineTo(cx - kChordHW + 4, kChordY + 1);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // --- Dome edge stitching ------------------------------
  ctx.strokeStyle = "rgba(155,145,125,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, hcy, kR + 0.5, kA1, kA2);
  ctx.stroke();

  // ─── BEAM / BLAST ─────────────────────────────────────────────────────────
  if (gs.beam && gs.beam.active) {
    const charCol = charDef.color;
    ctx.strokeStyle = charCol;
    ctx.shadowColor = charCol;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 6;
    const beamEnd = gs.beam.facingRight ? CANVAS_W : 0;
    ctx.beginPath();
    ctx.moveTo(cx + (p.facingRight ? 14 : -14), groundY - 60);
    ctx.lineTo(beamEnd, groundY - 60);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + (p.facingRight ? 14 : -14), groundY - 60);
    ctx.lineTo(beamEnd, groundY - 60);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ─── SHIELD BUBBLE ────────────────────────────────────────────────────────
  if (p.buffs.shielded) {
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.55 + Math.sin(frame * 0.15) * 0.2;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 48, 30, 54, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // ─── HP BAR ───────────────────────────────────────────────────────────────
  if (p.hp < p.maxHp) {
    const ratio = p.hp / p.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(p.x - 4, p.y - p.height - 12, p.width + 8, 7);
    ctx.fillStyle = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(p.x - 4, p.y - p.height - 12, (p.width + 8) * ratio, 7);
  }

  // ─── SUMMONS ──────────────────────────────────────────────────────────────
  if (gs.summons) {
    for (const s of gs.summons) {
      const alpha = s.life / s.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(s.x - 10, FLOOR_Y - 60, 20, 60);
      ctx.fillStyle = "#c4b5fd";
      ctx.fillRect(s.x - 8, FLOOR_Y - 80, 16, 22);
      ctx.globalAlpha = 1;
    }
  }
}

// ─── Enemies ─────────────────────────────────────────────────────────────────

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, frame: number) {
  const hurt = e.state === "hurt";
  switch (e.type) {
    case "patrol": case "soldier": drawSoldier(ctx, e, frame, hurt); break;
    case "armored":  drawArmored(ctx, e, frame, hurt); break;
    case "sniper":   drawSniper(ctx, e, frame, hurt); break;
    case "marksman": drawMarksman(ctx, e, frame, hurt); break;
    case "drone":    drawDrone(ctx, e, frame, hurt); break;
    case "tank":     drawTank(ctx, e, frame, hurt); break;
    case "bulldozer": drawBulldozer(ctx, e, frame, hurt); break;
    case "apc":      drawAPC(ctx, e, frame, hurt); break;
    case "apache":   drawApache(ctx, e, frame, hurt); break;
    case "warplane": drawWarplane(ctx, e, frame, hurt); break;
    default: drawSoldier(ctx, e, frame, hurt);
  }
  // Enemy HP bar
  if (e.hp < e.maxHp && e.state !== "dead") {
    const ratio = e.hp / e.maxHp;
    const bw = e.width;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(e.x, e.y - e.height - 10, bw, 5);
    ctx.fillStyle = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(e.x, e.y - e.height - 10, bw * ratio, 5);
  }
}

function drawSoldier(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  const facingRight = e.vx >= 0;
  ctx.save();
  if (!facingRight) { ctx.scale(-1, 1); ctx.translate(-2 * cx, 0); }
  const walk = Math.sin(frame * 0.22) * 10;
  // Boots
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx - 11, e.y - 14, 10, 14);
  ctx.fillRect(cx + 1, e.y - 14, 10, 14);
  // Legs
  ctx.fillStyle = F || "#2d4a1e";
  ctx.save(); ctx.translate(cx - 6, e.y - 42); ctx.rotate(walk * 0.025); ctx.fillRect(-5, 0, 10, 28); ctx.restore();
  ctx.save(); ctx.translate(cx + 6, e.y - 42); ctx.rotate(-walk * 0.025); ctx.fillRect(-5, 0, 10, 28); ctx.restore();
  // Torso
  ctx.fillStyle = F || "#2d5a1e";
  ctx.fillRect(cx - 14, e.y - 78, 28, 38);
  // Arms + gun
  ctx.fillStyle = F || "#2d4a1e";
  ctx.fillRect(cx + 12, e.y - 74, 8, 22);
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx + 18, e.y - 76, 24, 8);
  // Head
  ctx.fillStyle = F || "#c8a880";
  ctx.fillRect(cx - 10, e.y - 98, 20, 22);
  // Helmet
  ctx.fillStyle = F || "#2d5a1e";
  ctx.fillRect(cx - 12, e.y - 102, 24, 12);
  ctx.restore();
}

function drawArmored(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  // Boots
  ctx.fillStyle = F || "#111";
  ctx.fillRect(cx - 15, e.y - 16, 13, 16);
  ctx.fillRect(cx + 2, e.y - 16, 13, 16);
  // Legs
  ctx.fillStyle = F || "#1a2a1a";
  ctx.fillRect(cx - 14, e.y - 50, 12, 34);
  ctx.fillRect(cx + 2, e.y - 50, 12, 34);
  // Torso armor
  ctx.fillStyle = F || "#1e3a1e";
  ctx.fillRect(cx - 18, e.y - 88, 36, 40);
  ctx.fillStyle = F || "#2d5a2e";
  ctx.fillRect(cx - 16, e.y - 82, 32, 28);
  // Shoulder pads
  ctx.fillStyle = F || "#1e3a1e";
  ctx.fillRect(cx - 22, e.y - 88, 10, 20);
  ctx.fillRect(cx + 12, e.y - 88, 10, 20);
  // Gun
  ctx.fillStyle = F || "#111";
  ctx.fillRect(cx + 16, e.y - 82, 32, 10);
  // Head
  ctx.fillStyle = F || "#c8a880";
  ctx.fillRect(cx - 12, e.y - 108, 24, 22);
  ctx.fillStyle = F || "#1e3a1e";
  ctx.fillRect(cx - 14, e.y - 112, 28, 12);
  // Visor
  ctx.fillStyle = F || "#374151";
  ctx.fillRect(cx - 11, e.y - 108, 22, 8);
}

function drawSniper(ctx: CanvasRenderingContext2D, e: Enemy, _frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  ctx.fillStyle = F || "#1a2a10";
  ctx.fillRect(cx - 11, e.y - 16, 10, 16);
  ctx.fillRect(cx + 1, e.y - 16, 10, 16);
  ctx.fillStyle = F || "#2d4a1e";
  ctx.fillRect(cx - 12, e.y - 52, 24, 36);
  ctx.fillStyle = F || "#3d5a2e";
  ctx.fillRect(cx - 14, e.y - 90, 28, 40);
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx + 12, e.y - 88, 42, 8);
  ctx.fillStyle = F || "#374151";
  ctx.fillRect(cx + 50, e.y - 94, 6, 20);
  ctx.fillStyle = F || "#c8a880";
  ctx.fillRect(cx - 10, e.y - 110, 20, 22);
  ctx.fillStyle = F || "#1a2a10";
  ctx.fillRect(cx - 12, e.y - 114, 24, 10);
  ctx.fillStyle = F || "rgba(100,200,100,0.3)";
  ctx.beginPath();
  ctx.arc(cx + 52, e.y - 84, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMarksman(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  const walk = Math.sin(frame * 0.2) * 8;
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx - 12, e.y - 16, 11, 16);
  ctx.fillRect(cx + 1, e.y - 16, 11, 16);
  ctx.fillStyle = F || "#374151";
  ctx.save(); ctx.translate(cx - 6, e.y - 46); ctx.rotate(walk * 0.024); ctx.fillRect(-5, 0, 10, 30); ctx.restore();
  ctx.save(); ctx.translate(cx + 6, e.y - 46); ctx.rotate(-walk * 0.024); ctx.fillRect(-5, 0, 10, 30); ctx.restore();
  ctx.fillStyle = F || "#4b5563";
  ctx.fillRect(cx - 15, e.y - 86, 30, 42);
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx + 13, e.y - 80, 36, 9);
  ctx.fillStyle = F || "#6b7280";
  ctx.fillRect(cx + 46, e.y - 86, 5, 18);
  ctx.fillStyle = F || "#c8a880";
  ctx.fillRect(cx - 10, e.y - 106, 20, 22);
  ctx.fillStyle = F || "#374151";
  ctx.fillRect(cx - 12, e.y - 110, 24, 10);
}

function drawDrone(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const hover = Math.sin(frame * 0.07 + e.phase) * 10;
  const dy = e.y - 200 + hover;
  const F = hurt ? "#fbbf24" : null;
  const rotorAngle = frame * 0.55;
  // Rotors
  for (let b = 0; b < 4; b++) {
    const ox = b < 2 ? -25 : 25, oy = b % 2 === 0 ? -8 : 8;
    ctx.save();
    ctx.translate(cx + ox, dy + oy);
    ctx.strokeStyle = F || "rgba(200,210,220,0.85)";
    ctx.lineWidth = 3;
    for (let r = 0; r < 2; r++) {
      const ra = rotorAngle + r * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * 2, Math.sin(ra)); ctx.lineTo(Math.cos(ra) * 18, Math.sin(ra) * 3); ctx.stroke();
    }
    ctx.fillStyle = F || "#1a1a1a";
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Body
  ctx.fillStyle = F || "#1a1a2e";
  ctx.fillRect(cx - 28, dy - 6, 56, 18);
  ctx.fillStyle = F || "#374151";
  ctx.fillRect(cx - 18, dy - 10, 36, 6);
  // Camera
  ctx.fillStyle = F || "#111";
  ctx.beginPath(); ctx.arc(cx, dy + 14, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = F || "rgba(56,189,248,0.5)";
  ctx.beginPath(); ctx.arc(cx, dy + 14, 4, 0, Math.PI * 2); ctx.fill();
  // Down shadow
  const dwGrad = ctx.createRadialGradient(cx, e.y, 0, cx, e.y, 60);
  dwGrad.addColorStop(0, "rgba(0,0,0,0.25)");
  dwGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dwGrad;
  ctx.beginPath(); ctx.ellipse(cx, e.y, 60, 8, 0, 0, Math.PI * 2); ctx.fill();
}

function drawTank(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  // Tracks
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(e.x - 5, e.y - 26, e.width + 10, 26);
  ctx.strokeStyle = F || "#2d2d2d";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const tx = e.x - 5 + (i * 18 + frame * 1.5) % (e.width + 10);
    ctx.beginPath(); ctx.moveTo(tx, e.y - 26); ctx.lineTo(tx, e.y); ctx.stroke();
  }
  // Hull
  ctx.fillStyle = F || "#3a4a2a";
  ctx.fillRect(e.x + 4, e.y - 72, e.width - 8, 46);
  // Turret
  ctx.fillStyle = F || "#2d3a1e";
  ctx.fillRect(cx - 28, e.y - 96, 56, 28);
  // Barrel
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx + 26, e.y - 90, 52, 14);
  // Hatch
  ctx.fillStyle = F || "#1a2a10";
  ctx.fillRect(cx - 12, e.y - 100, 24, 10);
  ctx.strokeStyle = F || "#2d3a1e";
  ctx.lineWidth = 1;
  ctx.strokeRect(e.x + 8, e.y - 56, e.width - 16, 42);
  ctx.beginPath(); ctx.moveTo(cx, e.y - 56); ctx.lineTo(cx, e.y - 14); ctx.stroke();
}

function drawBulldozer(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  // Tracks
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(e.x - 5, e.y - 26, e.width + 10, 26);
  ctx.strokeStyle = F || "#2d2d2d";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const tx = e.x - 5 + (i * 19 + frame * 1.2) % (e.width + 10);
    ctx.beginPath(); ctx.moveTo(tx, e.y - 26); ctx.lineTo(tx, e.y); ctx.stroke();
  }
  // Hull
  ctx.fillStyle = F || "#4a4a3a";
  ctx.fillRect(e.x + 4, e.y - 76, e.width - 8, 50);
  // Cab
  ctx.fillStyle = F || "#2a2a20";
  ctx.fillRect(cx - 22, e.y - 100, 44, 28);
  ctx.fillStyle = F || "#111";
  ctx.fillRect(cx - 18, e.y - 94, 12, 4);
  ctx.fillRect(cx + 6, e.y - 94, 12, 4);
  // Smokestack
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(e.x + e.width - 14, e.y - 110, 8, 36);
  ctx.fillStyle = "rgba(100,100,100,0.3)";
  ctx.beginPath(); ctx.arc(e.x + e.width - 10, e.y - 114, 5 + Math.sin(frame * 0.1) * 2, 0, Math.PI * 2); ctx.fill();
  // Blade
  ctx.fillStyle = F || "#374151";
  ctx.fillRect(e.x - 22, e.y - 68, 28, 52);
  ctx.fillStyle = F || "#1f2937";
  ctx.fillRect(e.x - 20, e.y - 66, 6, 48);
  ctx.fillRect(e.x - 12, e.y - 66, 6, 48);
  ctx.fillStyle = F || "#6b7280";
  ctx.fillRect(e.x - 22, e.y - 18, 28, 6);
}

function drawAPC(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const F = hurt ? "#fbbf24" : null;
  // Wheels
  ctx.fillStyle = F || "#1a1a1a";
  for (let i = 0; i < 4; i++) {
    const wx = e.x + 12 + i * (e.width - 24) / 3;
    ctx.beginPath(); ctx.arc(wx, e.y - 8, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = F || "#2d2d2d"; ctx.lineWidth = 2;
    ctx.beginPath();
    const angle = frame * 0.1;
    ctx.moveTo(wx + Math.cos(angle) * 10, e.y - 8 + Math.sin(angle) * 10);
    ctx.lineTo(wx - Math.cos(angle) * 10, e.y - 8 - Math.sin(angle) * 10);
    ctx.stroke();
  }
  // Hull
  ctx.fillStyle = F || "#2d4a2e";
  ctx.fillRect(e.x, e.y - 70, e.width, 50);
  ctx.fillStyle = F || "#1e3a1e";
  ctx.fillRect(e.x + 8, e.y - 76, e.width - 16, 12);
  // Gun on top
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(cx - 6, e.y - 82, 12, 12);
  ctx.fillRect(cx + 4, e.y - 80, 28, 6);
  // Windows
  ctx.fillStyle = F || "#374151";
  ctx.fillRect(e.x + 8, e.y - 62, 20, 12);
  ctx.fillRect(e.x + e.width - 28, e.y - 62, 20, 12);
}

function drawApache(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const hover = Math.sin(frame * 0.055 + e.phase) * 14;
  const dy = e.y - 200 + hover;
  const F = hurt ? "#fbbf24" : null;
  const rotorAngle = frame * 0.4;
  // Main rotor
  ctx.save();
  ctx.translate(cx - 10, dy - 18);
  ctx.strokeStyle = F || "rgba(180,190,200,0.85)";
  ctx.lineWidth = 4;
  for (let b = 0; b < 4; b++) {
    const ba = rotorAngle + b * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(ba) * 4, Math.sin(ba) * 2);
    ctx.bezierCurveTo(Math.cos(ba) * 30, Math.sin(ba) * 8, Math.cos(ba) * 62, Math.sin(ba) * 4, Math.cos(ba) * 74, Math.sin(ba) * 1.5);
    ctx.stroke();
  }
  ctx.fillStyle = F || "#1a1a1a";
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Tail boom
  ctx.fillStyle = F || "#2d3a1e";
  ctx.beginPath();
  ctx.moveTo(e.x + e.width - 8, dy);
  ctx.lineTo(e.x + e.width - 4, dy - 22);
  ctx.lineTo(e.x + e.width + 50, dy - 14);
  ctx.lineTo(e.x + e.width + 48, dy + 4);
  ctx.lineTo(e.x + e.width - 8, dy + 12);
  ctx.closePath();
  ctx.fill();
  // Body
  ctx.fillStyle = F || "#2d3a1e";
  ctx.fillRect(e.x + 8, dy - 22, e.width - 20, 40);
  ctx.beginPath(); ctx.ellipse(cx - 6, dy + 10, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = F || "#0f1f0a";
  ctx.beginPath();
  ctx.moveTo(e.x + 8, dy - 22);
  ctx.bezierCurveTo(e.x + 4, dy - 30, e.x - 12, dy - 24, e.x - 16, dy - 8);
  ctx.lineTo(e.x - 12, dy + 6);
  ctx.lineTo(e.x + 8, dy + 10);
  ctx.closePath();
  ctx.fill();
  // Cockpit glass
  ctx.fillStyle = F || "rgba(56,189,248,0.25)";
  ctx.beginPath();
  ctx.moveTo(e.x + 6, dy - 20);
  ctx.bezierCurveTo(e.x + 2, dy - 28, e.x - 10, dy - 22, e.x - 14, dy - 8);
  ctx.lineTo(e.x - 10, dy + 4);
  ctx.lineTo(e.x + 6, dy + 8);
  ctx.closePath();
  ctx.fill();
  // Missiles
  ctx.fillStyle = F || "#263318";
  ctx.fillRect(e.x + 14, dy + 2, 30, 7);
  ctx.fillRect(e.x + 14, dy - 6, 30, 7);
  // Tail rotor
  const tailSpin = frame * 0.7;
  ctx.save();
  ctx.translate(e.x + e.width + 62, dy - 24);
  ctx.strokeStyle = F || "rgba(200,210,200,0.8)";
  ctx.lineWidth = 2.5;
  for (let b = 0; b < 2; b++) {
    const ba = tailSpin + b * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ba) * 2, Math.sin(ba) * 2);
    ctx.lineTo(Math.cos(ba) * 16, Math.sin(ba) * 4);
    ctx.stroke();
  }
  ctx.fillStyle = F || "#1a1a1a";
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Landing gear
  ctx.fillStyle = F || "#1a1a1a";
  ctx.fillRect(e.x - 22, dy + 6, 10, 12);
  ctx.fillRect(e.x - 32, dy + 10, 12, 5);
  // Blink light
  if (Math.floor(frame * 0.15) % 3 < 1) {
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(e.x + e.width + 48, dy - 8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // Ground shadow
  const dwGrad = ctx.createRadialGradient(cx - 10, e.y, 0, cx - 10, e.y, 80);
  dwGrad.addColorStop(0, "rgba(200,210,200,0.07)");
  dwGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dwGrad;
  ctx.beginPath(); ctx.ellipse(cx - 10, e.y, 80, 12, 0, 0, Math.PI * 2); ctx.fill();
}

function drawWarplane(ctx: CanvasRenderingContext2D, e: Enemy, frame: number, hurt: boolean) {
  const cx = e.x + e.width / 2;
  const wHover = Math.sin(frame * 0.06 + e.phase) * 12;
  const wy = e.y - 150 + wHover;
  const F = hurt ? "#fbbf24" : null;
  ctx.fillStyle = F || "#1e293b";
  ctx.beginPath();
  ctx.moveTo(e.x, wy);
  ctx.lineTo(cx + 40, wy - 30);
  ctx.lineTo(e.x + e.width, wy);
  ctx.lineTo(cx, wy - 50);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = F || "#0f172a";
  ctx.fillRect(e.x - 20, wy - 20, e.width + 40, 12);
  ctx.fillStyle = F || "#f97316";
  ctx.shadowColor = "#f97316"; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(cx, wy - 10, 7, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Ground shadow
  const dwGrad2 = ctx.createRadialGradient(cx, e.y, 0, cx, e.y, 90);
  dwGrad2.addColorStop(0, "rgba(0,0,0,0.12)");
  dwGrad2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dwGrad2;
  ctx.beginPath(); ctx.ellipse(cx, e.y, 90, 10, 0, 0, Math.PI * 2); ctx.fill();
}

// ─── Particles / PowerUps / Collectibles / Projectiles ───────────────────────

export function drawParticle(ctx: CanvasRenderingContext2D, pt: Particle) {
  const alpha = pt.life / pt.maxLife;
  ctx.globalAlpha = alpha;
  if (pt.text) {
    ctx.fillStyle = pt.color;
    ctx.font = `bold ${pt.size || 14}px 'Press Start 2P', monospace`;
    ctx.textAlign = "center";
    ctx.fillText(pt.text, pt.x, pt.y);
  } else {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - (pt.size || 4) / 2, pt.y - (pt.size || 4) / 2, pt.size || 4, pt.size || 4);
  }
  ctx.globalAlpha = 1;
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, frame: number) {
  const bob = Math.sin(frame * 0.1 + pu.bobOffset) * 5;
  const pulse = Math.sin(frame * 0.15) * 0.3 + 0.8;
  ctx.globalAlpha = Math.min(1, pu.life / 40) * pulse;
  const colors: Record<string, string> = { health: "#22c55e", speed: "#60a5fa", power: "#f59e0b", shield: "#22d3ee" };
  const icons: Record<string, string> = { health: "+", speed: ">>", power: "*", shield: "O" };
  ctx.fillStyle = colors[pu.type] || "#fff";
  ctx.shadowColor = colors[pu.type] || "#fff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(pu.x, pu.y + bob, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText(icons[pu.type] || "?", pu.x, pu.y + bob + 3);
  ctx.globalAlpha = 1;
}

export function drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible, frame: number) {
  const def = COLLECTIBLE_DEFS[c.type];
  if (!def) return;
  const bob = Math.sin(frame * 0.08 + c.bobOffset) * 6;
  const pulse = Math.sin(frame * 0.12) * 0.2 + 0.85;
  ctx.globalAlpha = Math.min(1, c.life / 60) * pulse;
  ctx.fillStyle = def.color;
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 16;
  ctx.fillRect(c.x - 20, c.y + bob - 20, 40, 40);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText(def.label.substring(0, 6).toUpperCase(), c.x, c.y + bob + 4);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(c.x - 20, c.y + bob - 20, 40, 40);
  ctx.globalAlpha = 1;
}

export function drawProjectile(ctx: CanvasRenderingContext2D, pr: Projectile, frame: number) {
  if (pr.exploding) {
    const maxTimer = pr.type === "rocket" ? 40 : 32;
    const t = Math.max(0, 1 - pr.explodeTimer / maxTimer);
    ctx.save();
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 3;
    ctx.shadowColor = "#f97316"; ctx.shadowBlur = 22;
    ctx.globalAlpha = Math.max(0, (1 - t) * 0.75);
    ctx.beginPath(); ctx.arc(pr.explodeX, pr.explodeY, t * 115, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = Math.max(0, 1 - t * 1.5);
    ctx.fillStyle = "#f97316";
    ctx.beginPath(); ctx.arc(pr.explodeX, pr.explodeY, t * 72, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
    return;
  }
  if (!pr.warned && pr.warnTimer > 0) return;

  // Bullet
  if (pr.type === "bullet") {
    pr.trail.forEach((pt, i) => {
      ctx.globalAlpha = (i / pr.trail.length) * 0.5;
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 6;
    ctx.fillRect(pr.x - 4, pr.y - 2, 8, 4);
    ctx.shadowBlur = 0;
    return;
  }
  // Sniper shot
  if (pr.type === "sniper_shot") {
    ctx.save();
    ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2.5; ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.85;
    const sx = pr.x - pr.vx * 2, sy = pr.y - pr.vy * 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pr.x, pr.y); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
    return;
  }
  // Grenade (player)
  if (pr.type === "grenade_player") {
    pr.trail.forEach((pt, i) => {
      ctx.globalAlpha = (i / pr.trail.length) * 0.35;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#16a34a"; ctx.strokeStyle = "#86efac"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#dcfce7";
    ctx.beginPath(); ctx.arc(pr.x - 2, pr.y - 2, 3, 0, Math.PI * 2); ctx.fill();
    return;
  }
  // Tank rocket
  if (pr.type === "tank_rocket") {
    pr.trail.forEach((pt, i) => {
      ctx.globalAlpha = (i / pr.trail.length) * 0.6;
      const col = i > pr.trail.length * 0.6 ? "#f97316" : "#fbbf24";
      ctx.fillStyle = col;
      const s = 3 + (i / pr.trail.length) * 7;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, s / 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ef4444";
    ctx.save();
    const tankAngle = Math.atan2(pr.vy, pr.vx);
    ctx.translate(pr.x, pr.y); ctx.rotate(tankAngle);
    ctx.fillRect(-14, -4, 28, 8);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-18, -3, 7, 6);
    ctx.fillStyle = "#f97316";
    ctx.beginPath(); ctx.arc(14, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  if (pr.type === "rock") {
    // Trail
    pr.trail.forEach((pt, i) => {
      ctx.globalAlpha = (i / pr.trail.length) * 0.5;
      ctx.fillStyle = "#78716c";
      ctx.fillRect(pt.x - 5, pt.y - 5, 10, 10);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(pr.x - 10, pr.y - 10, 20, 20);
    return;
  }
  if (pr.type === "rocket") {
    // Trail
    pr.trail.forEach((pt, i) => {
      ctx.globalAlpha = (i / pr.trail.length) * 0.7;
      const col = i > pr.trail.length * 0.7 ? "#f97316" : "#fbbf24";
      ctx.fillStyle = col;
      const s = 4 + (i / pr.trail.length) * 8;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, s / 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#9ca3af";
    ctx.save();
    const angle = Math.atan2(pr.vy, pr.vx);
    ctx.translate(pr.x, pr.y);
    ctx.rotate(angle);
    ctx.fillRect(-16, -5, 32, 10);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-20, -4, 8, 8);
    ctx.restore();
    return;
  }

  // bomb / hellfire
  pr.trail.forEach((pt, i) => {
    ctx.globalAlpha = (i / pr.trail.length) * 0.6;
    ctx.fillStyle = pr.type === "hellfire" ? "#ef4444" : "#f97316";
    ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8);
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = pr.type === "hellfire" ? "#dc2626" : "#f97316";
  ctx.beginPath(); ctx.arc(pr.x, pr.y, 8, 0, Math.PI * 2); ctx.fill();
}

export function drawProjectileWarnings(ctx: CanvasRenderingContext2D, projectiles: Projectile[], player: GameState["player"], frame: number) {
  for (const pr of projectiles) {
    if (pr.warned || pr.exploding) continue;
    const flash = Math.floor(pr.warnTimer / 5) % 2 === 0;
    ctx.save();
    if (pr.type === "bomb") {
      const ix = pr.targetX;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5;
      ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 10;
      const pulse = 28 + Math.sin(frame * 0.22) * 7;
      ctx.beginPath(); ctx.arc(ix, FLOOR_Y - 4, pulse, 0, Math.PI * 2); ctx.stroke();
      if (flash) {
        const xs = 16; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ix - xs, FLOOR_Y - xs); ctx.lineTo(ix + xs, FLOOR_Y + xs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix + xs, FLOOR_Y - xs); ctx.lineTo(ix - xs, FLOOR_Y + xs); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = flash ? 0.95 : 0.5;
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("▼", ix, FLOOR_Y - 52 + Math.sin(frame * 0.18) * 5);
      const pcx = player.x + player.width / 2;
      ctx.globalAlpha = flash ? 1 : 0.35;
      ctx.fillStyle = "#ef4444"; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8;
      ctx.font = "bold 14px 'Press Start 2P', monospace"; ctx.textAlign = "center";
      ctx.fillText("!", pcx, player.y - player.height - 18);
      ctx.shadowBlur = 0;
    } else if (pr.type === "tank_rocket") {
      // Horizontal rocket warning — flash at origin side
      const flash = Math.floor(pr.warnTimer / 5) % 2 === 0;
      ctx.globalAlpha = flash ? 0.9 : 0.5;
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center";
      const arrowDir = pr.vx > 0 ? "►" : "◄";
      ctx.fillText(arrowDir, pr.x, pr.y - 20 + Math.sin(frame * 0.2) * 4);
      ctx.globalAlpha = flash ? 1 : 0.35;
      ctx.fillStyle = "#ef4444"; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8;
      ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = "center";
      ctx.fillText("ROCKET!", pr.x, pr.y - 38);
      ctx.shadowBlur = 0;
    } else if (pr.type === "hellfire") {
      const pcx = player.x + player.width / 2;
      const pcy = player.y - player.height / 2;
      const progress = pr.warnTimer / pr.warnMaxTimer;
      const rSize = 34 + progress * 22;
      ctx.globalAlpha = flash ? 0.9 : 0.5;
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
      ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 12;
      const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [sx, sy] of corners) {
        const bLen = 13;
        ctx.beginPath(); ctx.moveTo(pcx + sx * rSize, pcy + sy * rSize); ctx.lineTo(pcx + sx * (rSize - bLen), pcy + sy * rSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pcx + sx * rSize, pcy + sy * rSize); ctx.lineTo(pcx + sx * rSize, pcy + sy * (rSize - bLen)); ctx.stroke();
      }
      ctx.fillStyle = flash ? "#ef4444" : "rgba(239,68,68,0.5)";
      ctx.beginPath(); ctx.arc(pcx, pcy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (flash) {
        ctx.globalAlpha = 1; ctx.fillStyle = "#ef4444"; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 6;
        ctx.font = "9px 'Press Start 2P', monospace"; ctx.textAlign = "center";
        ctx.fillText("MISSILE LOCK!", pcx, pcy - rSize - 10);
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

export function drawHUD(ctx: CanvasRenderingContext2D, gs: GameState) {
  const p = gs.player;
  const charDef = CHARACTERS[p.activeChar];

  // HP bar
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(12, 12, 220, 22);
  const hpRatio = p.hp / p.maxHp;
  ctx.fillStyle = hpRatio > 0.6 ? "#22c55e" : hpRatio > 0.3 ? "#f59e0b" : "#ef4444";
  ctx.fillRect(12, 12, 220 * Math.max(0, hpRatio), 22);
  ctx.strokeStyle = "#78716c"; ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, 220, 22);
  ctx.fillStyle = "#fff";
  ctx.font = "9px 'Press Start 2P', monospace"; ctx.textAlign = "left";
  ctx.fillText(`${charDef.name}  HP: ${Math.max(0, p.hp)}/${p.maxHp}`, 18, 27);

  // Score
  ctx.fillStyle = "#fbbf24";
  ctx.font = "11px 'Press Start 2P', monospace"; ctx.textAlign = "right";
  ctx.fillText(`SCORE: ${gs.score}`, CANVAS_W - 12, 28);

  // Combo
  if (gs.combo >= 2) {
    ctx.globalAlpha = Math.min(1, gs.comboTimer / 40);
    ctx.fillStyle = gs.combo >= 5 ? "#f97316" : "#fbbf24";
    ctx.font = `${Math.min(12 + gs.combo, 22)}px 'Press Start 2P', monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`${gs.combo}x COMBO`, CANVAS_W - 12, 50);
    ctx.globalAlpha = 1;
  }

  // Rock cooldown bar
  const rockRatio = 1 - Math.min(1, p.rockCooldown / 120);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(12, 38, 120, 10);
  ctx.fillStyle = rockRatio >= 1 ? "#9ca3af" : "#6b7280";
  ctx.fillRect(12, 38, 120 * rockRatio, 10);
  ctx.strokeStyle = "#6b7280";
  ctx.strokeRect(12, 38, 120, 10);
  ctx.fillStyle = "#fff";
  ctx.font = "7px 'Press Start 2P', monospace"; ctx.textAlign = "left";
  ctx.fillText(rockRatio >= 1 ? "ROCK READY" : "ROCK COOL", 14, 47);

  // Coin counter
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(12, 52, 120, 18);
  ctx.strokeStyle = "#92400e"; ctx.lineWidth = 1;
  ctx.strokeRect(12, 52, 120, 18);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "9px 'Press Start 2P', monospace"; ctx.textAlign = "left";
  ctx.fillText(`\u{1FA99} ${gs.coins}`, 16, 65);

  // Weapon slot
  const wId = p.activeWeapon;
  const wDef = wId ? SHOP_WEAPONS.find(w => w.id === wId) : null;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(12, 74, 120, 18);
  ctx.strokeStyle = wDef ? "#22c55e" : "#44403c"; ctx.lineWidth = 1;
  ctx.strokeRect(12, 74, 120, 18);
  ctx.fillStyle = wDef ? "#22c55e" : "#6b7280";
  ctx.font = "7px 'Press Start 2P', monospace"; ctx.textAlign = "left";
  if (wDef) {
    const ammo = p.weaponAmmo[wId] ?? 0;
    ctx.fillText(`F:${wDef.label.substring(0, 8)} x${ammo}`, 16, 87);
  } else {
    ctx.fillText("F: NO WEAPON", 16, 87);
  }

  // Buffs
  let bOff = 0;
  if (p.buffs.speedTimer > 0) {
    ctx.fillStyle = "#60a5fa"; ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = "left";
    ctx.fillText(">> FAST", 12, 98 + bOff); bOff += 15;
  }
  if (p.buffs.powerTimer > 0) {
    ctx.fillStyle = "#f59e0b"; ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = "left";
    ctx.fillText("* POWER", 12, 98 + bOff); bOff += 15;
  }
  if (p.buffs.shielded) {
    ctx.fillStyle = "#22d3ee"; ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = "left";
    ctx.fillText("O SHIELD", 12, 98 + bOff);
  }

  // Char switch flash
  if (p.charSwitchTimer > 0) {
    ctx.fillStyle = charDef.color;
    ctx.shadowColor = charDef.color; ctx.shadowBlur = 10;
    ctx.font = "14px 'Press Start 2P', monospace"; ctx.textAlign = "center";
    ctx.fillText(`${charDef.name}!`, CANVAS_W / 2, 60);
    ctx.shadowBlur = 0;
  }

  // Controls reminder (bottom)
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, CANVAS_H - 18, CANVAS_W, 18);
  ctx.fillStyle = "#6b7280";
  ctx.font = "6.5px 'Press Start 2P', monospace"; ctx.textAlign = "center";
  ctx.fillText("ARROWS/WASD:MOVE  SPACE/UP:JUMP  Z/J:PUNCH  X/K:THROW ROCK  F:FIRE WEAPON  B:SHOP  V:SUMMON  C:SWITCH CHAR", CANVAS_W / 2, CANVAS_H - 5);
}
