import type { GameState, Player, Enemy, Particle, Collectible, GameCallbacks } from "./gameTypes";
import { CANVAS_W, FLOOR_Y, GRAVITY, CHARACTERS, ENEMY_DEFS, COLLECTIBLE_DEFS, STAGE_COLLECTIBLES } from "./gameConstants";

export function createPlayer(charIndex = 0): Player {
  const c = CHARACTERS[charIndex];
  return {
    id: "player",
    x: 200, y: FLOOR_Y,
    width: 44, height: 84,
    vx: 0, vy: 0,
    hp: c.maxHp, maxHp: c.maxHp,
    isJumping: false,
    facingRight: true,
    isAttacking: false,
    attackTimer: 0,
    specialCooldown: 0,
    color: c.color,
    hurtTimer: 0,
    chargeTimer: 0,
    allyCD: [0, 0, 0],
    activeChar: charIndex,
    buffs: { speedTimer: 0, powerTimer: 0, shielded: false },
    charSwitchTimer: 0,
    summonCooldown: 0,
    rockCooldown: 0,
    rocketCooldown: 0,
    canDoubleJump: true,
    activeWeapon: "",
    weaponAmmo: {},
    weaponCooldown: 0,
  };
}

const AERIAL_TYPES = new Set(["drone", "apache", "warplane", "bomb_plane_mini", "bomb_plane_large"]);

export function spawnEnemy(type: string): Enemy {
  const def = ENEMY_DEFS[type];
  if (!def) throw new Error(`Unknown enemy type: ${type}`);
  const isAerial = AERIAL_TYPES.has(type);
  const spawnY = isAerial ? FLOOR_Y - 180 - Math.random() * 80 : FLOOR_Y;
  return {
    id: String(Math.random()),
    type,
    hp: def.hp, maxHp: def.hp,
    speed: def.speed + Math.random() * 0.3,
    width: def.w, height: def.h,
    damage: def.dmg,
    color: "#000",
    x: CANVAS_W + 100 + Math.random() * 300,
    y: spawnY,
    vx: 0, vy: 0,
    state: "walk",
    stateTimer: 0,
    animTimer: 0,
    phase: Math.random() * Math.PI * 2,
    attackCooldown: 60 + Math.floor(Math.random() * 60),
  };
}

export function spawnStageCollectibles(gs: GameState, stageIndex: number) {
  const types = STAGE_COLLECTIBLES[stageIndex] || [];
  types.forEach((type, i) => {
    gs.collectibles.push({
      id: String(Math.random()),
      x: 300 + i * 340 + Math.random() * 200,
      y: FLOOR_Y - 30,
      type,
      life: 1800,
      bobOffset: Math.random() * Math.PI * 2,
      collected: false,
    });
  });
}

export function applyCollectibleBuffs(player: Player, inventory: string[], onParticle: (p: Particle) => void) {
  inventory.forEach((type) => {
    if (type === "medkit") {
      player.hp = Math.min(player.maxHp, player.hp + 50);
      onParticle({ x: player.x + player.width / 2, y: player.y - player.height, vx: 0, vy: -2, life: 50, maxLife: 50, color: "#22c55e", text: "+50 HP (Kit)", size: 16 });
    } else if (type === "aidpkg") {
      player.hp = Math.min(player.maxHp, player.hp + 60);
      onParticle({ x: player.x + player.width / 2, y: player.y - player.height, vx: 0, vy: -2, life: 50, maxLife: 50, color: "#fb923c", text: "+60 HP (Aid)", size: 16 });
    } else if (type === "keys") {
      player.buffs.speedTimer = Math.max(player.buffs.speedTimer, 900);
      onParticle({ x: player.x + player.width / 2, y: player.y - player.height, vx: 0, vy: -2, life: 50, maxLife: 50, color: "#a78bfa", text: "SPEED BOOST!", size: 14 });
    } else if (type === "water") {
      player.buffs.speedTimer = Math.max(player.buffs.speedTimer, 400);
    }
  });
}

export function updateGame(gs: GameState, enemies: Enemy[], particles: Particle[], callbacks: GameCallbacks) {
  gs.frameCount++;
  const p = gs.player;
  const charDef = CHARACTERS[p.activeChar];

  if (p.buffs.speedTimer > 0) p.buffs.speedTimer--;
  if (p.buffs.powerTimer > 0) p.buffs.powerTimer--;
  if (p.charSwitchTimer > 0) p.charSwitchTimer--;
  if (p.summonCooldown > 0) p.summonCooldown--;
  if (p.rockCooldown > 0) p.rockCooldown--;
  if (p.rocketCooldown > 0) p.rocketCooldown--;
  if (p.weaponCooldown > 0) p.weaponCooldown--;
  for (let i = 0; i < 3; i++) { if (p.allyCD[i] > 0) p.allyCD[i]--; }
  callbacks.onAllyCD([p.allyCD[0], p.allyCD[1], p.allyCD[2]]);

  if (p.hurtTimer > 0) p.hurtTimer--;
  if (p.attackTimer > 0) { p.attackTimer--; } else { p.isAttacking = false; }
  if (p.specialCooldown > 0) p.specialCooldown--;
  if (p.chargeTimer > 0) p.chargeTimer--;

  // Regen from water
  if (gs.regenTimer !== undefined) {
    gs.regenTimer--;
    if (gs.regenTimer <= 0) gs.regenTimer = 0;
  }

  const baseSpeed = charDef.moveSpeed;
  const speed = baseSpeed * (p.buffs.speedTimer > 0 ? 1.55 : 1);

  if (!p.isAttacking || p.isJumping) {
    if (gs.keys["ArrowLeft"] || gs.keys["KeyA"]) {
      p.vx = -speed;
      p.facingRight = false;
    } else if (gs.keys["ArrowRight"] || gs.keys["KeyD"]) {
      p.vx = speed;
      p.facingRight = true;
    } else {
      p.vx *= 0.82;
    }
  } else {
    p.vx *= 0.7;
  }

  p.vy += GRAVITY;
  p.x += p.vx;
  p.y += p.vy;

  if (p.y >= FLOOR_Y) {
    p.y = FLOOR_Y;
    p.vy = 0;
    p.isJumping = false;
    p.canDoubleJump = true;
  }
  p.x = Math.max(0, Math.min(CANVAS_W - p.width, p.x));

  if (gs.comboTimer > 0) {
    gs.comboTimer--;
    if (gs.comboTimer <= 0) { gs.combo = 0; callbacks.onComboChange(0); }
  }

  // Attack hitbox
  if (p.isAttacking && p.attackTimer === 16) {
    const dmgBase = charDef.attackDamage * (p.buffs.powerTimer > 0 ? 1.7 : 1);
    const reach = 80;
    const px = p.x + (p.facingRight ? p.width : 0);
    for (const e of enemies) {
      if (e.state === "dead") continue;
      const ex = e.x + e.width / 2;
      const inRange = p.facingRight ? ex > p.x && ex < px + reach : ex < p.x + p.width && ex > px - reach;
      const yClose = Math.abs((e.y - e.height / 2) - (p.y - p.height / 2)) < p.height * 0.9;
      if (inRange && yClose) {
        const dmg = Math.floor(dmgBase + Math.random() * 8);
        e.hp -= dmg;
        e.state = "hurt";
        e.stateTimer = 14;
        e.vx = (p.facingRight ? 1 : -1) * 5;
        gs.shake = Math.max(gs.shake, 7);
        for (let j = 0; j < 5; j++) callbacks.onParticle({ x: e.x + e.width / 2, y: e.y - e.height / 2, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 6 - 2, life: 18, maxLife: 18, color: j < 3 ? "#ef4444" : "#fbbf24", size: 4 + Math.random() * 5 });
        callbacks.onParticle({ x: e.x + e.width / 2, y: e.y - e.height - 20, vx: 0, vy: -1.5, life: 28, maxLife: 28, color: "#fff", text: `-${dmg}`, size: 13 });
        if (e.hp <= 0) {
          e.state = "dead";
          e.stateTimer = 0;
          callbacks.onEnemyDie(e, "melee");
          gs.combo++;
          gs.comboTimer = 160;
          callbacks.onComboChange(gs.combo);
          gs.score += 100 * gs.scoreMultiplier;
          callbacks.onScoreChange(gs.score);
        }
      }
    }
  }

  // Beam attack
  if (gs.beam && gs.beam.active) {
    gs.beam.progress = Math.min(1, gs.beam.progress + 0.035);
    const beamLen = gs.beam.progress * (gs.beam.facingRight ? CANVAS_W - gs.beam.x : gs.beam.x);
    const bx1 = gs.beam.facingRight ? gs.beam.x : gs.beam.x - beamLen;
    const bx2 = gs.beam.facingRight ? gs.beam.x + beamLen : gs.beam.x;
    for (const e of enemies) {
      if (e.state === "dead") continue;
      const ex = e.x + e.width / 2;
      if (ex >= bx1 && ex <= bx2 && Math.abs(e.y - gs.beam.y) < 60) {
        if (gs.frameCount % 4 === 0) {
          const bdmg = Math.floor(charDef.attackDamage * 0.5 + Math.random() * 5);
          e.hp -= bdmg;
          e.state = "hurt";
          e.stateTimer = 8;
          callbacks.onParticle({ x: e.x + e.width / 2, y: e.y - e.height / 2, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 5 - 1, life: 14, maxLife: 14, color: charDef.color, size: 5 + Math.random() * 5 });
          if (e.hp <= 0) {
            e.state = "dead";
            e.stateTimer = 0;
            callbacks.onEnemyDie(e, "beam");
            gs.combo++;
            gs.comboTimer = 160;
            callbacks.onComboChange(gs.combo);
            gs.score += 200 * gs.scoreMultiplier;
            callbacks.onScoreChange(gs.score);
          }
        }
      }
    }
    if (gs.beam.progress >= 1) gs.beam.active = false;
  }

  // Summons
  if (gs.summons) {
    for (let i = gs.summons.length - 1; i >= 0; i--) {
      const s = gs.summons[i];
      s.x += s.vx;
      s.life--;
      for (const e of enemies) {
        if (e.state === "dead") continue;
        if (Math.abs(e.x + e.width / 2 - s.x) < 50 && Math.abs(e.y - FLOOR_Y) < 20) {
          e.hp -= 25;
          e.state = "hurt";
          e.stateTimer = 12;
          gs.score += 50 * gs.scoreMultiplier;
          callbacks.onScoreChange(gs.score);
          if (e.hp <= 0) {
            e.state = "dead";
            e.stateTimer = 0;
            callbacks.onEnemyDie(e, "summon");
          }
          s.life = 0;
          break;
        }
      }
      if (s.life <= 0 || s.x < -60 || s.x > CANVAS_W + 60) gs.summons.splice(i, 1);
    }
  }

  // Power-ups
  for (let i = gs.powerUps.length - 1; i >= 0; i--) {
    const pu = gs.powerUps[i];
    pu.life--;
    if (pu.life <= 0) { gs.powerUps.splice(i, 1); continue; }
    const px = p.x + p.width / 2, py = p.y - p.height / 2;
    const dx = pu.x - px, dy = pu.y - py;
    if (Math.sqrt(dx * dx + dy * dy) < 36) {
      gs.powerUps.splice(i, 1);
      if (pu.type === "health") {
        p.hp = Math.min(p.maxHp, p.hp + 35);
        callbacks.onParticle({ x: pu.x, y: pu.y, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#22c55e", text: "+35 HP", size: 14 });
      } else if (pu.type === "speed") {
        p.buffs.speedTimer = 300;
        callbacks.onParticle({ x: pu.x, y: pu.y, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#60a5fa", text: "FASTER!", size: 14 });
      } else if (pu.type === "power") {
        p.buffs.powerTimer = 300;
        callbacks.onParticle({ x: pu.x, y: pu.y, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#f59e0b", text: "STRONGER!", size: 14 });
      } else if (pu.type === "shield") {
        p.buffs.shielded = true;
        callbacks.onParticle({ x: pu.x, y: pu.y, vx: 0, vy: -2, life: 40, maxLife: 40, color: "#22d3ee", text: "SHIELD!", size: 14 });
      }
    }
  }

  // Collectibles
  for (let i = gs.collectibles.length - 1; i >= 0; i--) {
    const c2 = gs.collectibles[i] as Collectible;
    if (c2.collected) continue;
    c2.life--;
    if (c2.life <= 0) { gs.collectibles.splice(i, 1); continue; }
    const px = p.x + p.width / 2, py = p.y - p.height / 2;
    const dx = c2.x - px, dy = c2.y - py;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      c2.collected = true;
      const def = COLLECTIBLE_DEFS[c2.type];
      callbacks.onCollectItem(c2.type);
      callbacks.onParticle({ x: c2.x, y: c2.y - 30, vx: 0, vy: -2, life: 60, maxLife: 60, color: def?.color || "#fff", text: def?.label || c2.type, size: 12 });
      gs.collectibles.splice(i, 1);
    }
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.state === "dead") {
      e.stateTimer--;
      if (e.stateTimer < 0) {
        enemies.splice(i, 1);
        gs.waveKills++;
        if (gs.waveKills >= gs.waveTarget) callbacks.onWaveComplete();
      }
      continue;
    }
    const isAerial = AERIAL_TYPES.has(e.type);
    e.animTimer++;
    if (e.state === "hurt") { e.stateTimer--; if (e.stateTimer <= 0) e.state = "walk"; }

    if (isAerial) {
      if (e.state === "walk") e.vx = p.x + p.width / 2 > e.x + e.width / 2 ? e.speed : -e.speed;
      else e.vx *= 0.8;
      const targetY = FLOOR_Y - 200 - Math.sin(e.phase + gs.frameCount * 0.03) * 20;
      e.y += (targetY - e.y) * 0.04;
    } else {
      if (e.state === "walk") e.vx = p.x + p.width / 2 > e.x + e.width / 2 ? e.speed : -e.speed;
      else e.vx *= 0.7;
    }
    e.x += e.vx;
    if (isAerial && e.state !== "hurt" && e.animTimer > 60) {
      const eCx = e.x + e.width / 2;
      const pCx = p.x + p.width / 2;
      const dx = Math.abs(pCx - eCx);
      if (e.type === "drone" && dx < 210 && e.animTimer % 220 === 0) {
        const wm = 75;
        gs.projectiles.push({
          id: String(Math.random()), type: "bomb",
          x: eCx, y: e.y + 12,
          vx: p.vx * 0.25, vy: 0,
          targetX: pCx + p.vx * 18, targetY: FLOOR_Y,
          damage: 22, trail: [], life: 380, maxLife: 380,
          warned: false, warnTimer: wm, warnMaxTimer: wm,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }
      if (e.type === "apache" && dx < 700 && e.animTimer % 280 === 0) {
        const wm = 90; const spd = 8.5;
        const ddx = pCx - eCx; const ddy = p.y - p.height / 2 - e.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        gs.projectiles.push({
          id: String(Math.random()), type: "hellfire",
          x: ddx > 0 ? e.x + e.width - 22 : e.x + 22, y: e.y + 12,
          vx: ddx / dist * spd, vy: ddy / dist * spd,
          targetX: pCx, targetY: p.y - p.height / 2,
          damage: 40, trail: [], life: 360, maxLife: 360,
          warned: false, warnTimer: wm, warnMaxTimer: wm,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }
      if (e.type === "bomb_plane_mini" && dx < 480 && e.animTimer % 200 === 0) {
        const wm2 = 60; const spd2 = 5.8;
        const bddx = pCx - eCx; const bddy = p.y - p.height / 2 - e.y;
        const bdist = Math.sqrt(bddx * bddx + bddy * bddy) || 1;
        gs.projectiles.push({
          id: String(Math.random()), type: "hellfire",
          x: eCx, y: e.y + 20,
          vx: bddx / bdist * spd2, vy: bddy / bdist * spd2,
          targetX: pCx, targetY: p.y - p.height / 2,
          damage: 35, trail: [], life: 380, maxLife: 380,
          warned: false, warnTimer: wm2, warnMaxTimer: wm2,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }
      if (e.type === "bomb_plane_large" && dx < 650 && e.animTimer % 160 === 0) {
        for (let bIdx = 0; bIdx < 2; bIdx++) {
          const wm3 = 80; const spd3 = 5.2;
          const offX = (bIdx - 0.5) * 80;
          const tx = pCx + offX; const ty = p.y - p.height / 2;
          const lddx = tx - eCx; const lddy = ty - e.y;
          const ldist = Math.sqrt(lddx * lddx + lddy * lddy) || 1;
          gs.projectiles.push({
            id: String(Math.random()), type: "hellfire",
            x: eCx + offX * 0.3, y: e.y + 24,
            vx: lddx / ldist * spd3, vy: lddy / ldist * spd3,
            targetX: tx, targetY: ty,
            damage: 50, trail: [], life: 500, maxLife: 500,
            warned: false, warnTimer: wm3, warnMaxTimer: wm3,
            exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
          });
        }
      }
    }
    if (!isAerial) {
      e.attackCooldown--;
      const dist = Math.abs(p.x + p.width / 2 - (e.x + e.width / 2));
      const attackRange = e.width / 2 + p.width / 2 + 8;
      if (dist < attackRange && e.attackCooldown <= 0 && e.state !== "hurt") {
        e.attackCooldown = 60 + Math.floor(Math.random() * 80);
        if (!p.buffs.shielded) {
          p.hp -= e.damage;
          p.hurtTimer = 20;
          gs.shake = Math.max(gs.shake, 12);
          for (let j = 0; j < 6; j++) callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: (Math.random() - 0.5) * 10, vy: -3 - Math.random() * 5, life: 20, maxLife: 20, color: "#ef4444", size: 4 + Math.random() * 4 });
          if (p.hp <= 0) callbacks.onPlayerDie();
        } else {
          p.buffs.shielded = false;
          callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: 0, vy: -2, life: 30, maxLife: 30, color: "#22d3ee", text: "BLOCKED!", size: 16 });
        }
      }
      // Soldiers and marksmen fire bullets every 6 seconds (360 frames)
      if ((e.type === "soldier" || e.type === "marksman" || e.type === "armored") && dist < 520 && e.state !== "hurt" && e.animTimer > 120 && e.animTimer % 360 === 0) {
        const dir = p.x + p.width / 2 > e.x + e.width / 2 ? 1 : -1;
        gs.projectiles.push({
          id: String(Math.random()), type: "soldier_bullet",
          x: dir > 0 ? e.x + e.width : e.x, y: e.y - e.height * 0.65,
          vx: dir * 11, vy: (Math.random() - 0.5) * 0.8,
          targetX: 0, targetY: 0,
          damage: Math.round(e.damage * 0.55), trail: [], life: 110, maxLife: 110,
          warned: true, warnTimer: 0, warnMaxTimer: 0,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }
      // Tank and bulldozer fire ground rockets
      if ((e.type === "tank" || e.type === "bulldozer") && dist < 660 && e.state !== "hurt" && e.animTimer > 80 && e.animTimer % 240 === 0) {
        const dir = p.x + p.width / 2 > e.x + e.width / 2 ? 1 : -1;
        const wm = 18;
        gs.projectiles.push({
          id: String(Math.random()), type: "tank_rocket",
          x: dir > 0 ? e.x + e.width : e.x, y: e.y - 32,
          vx: dir * 9, vy: 0,
          targetX: 0, targetY: 0,
          damage: 40, trail: [], life: 200, maxLife: 200,
          warned: false, warnTimer: wm, warnMaxTimer: wm,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }
      // D9 bulldozer fires massive boulders
      if (e.type === "d9" && dist < 700 && e.state !== "hurt" && e.animTimer > 80 && e.animTimer % 160 === 0) {
        const d9dir = p.x + p.width / 2 > e.x + e.width / 2 ? 1 : -1;
        gs.projectiles.push({
          id: String(Math.random()), type: "rock",
          x: d9dir > 0 ? e.x + e.width : e.x, y: e.y - 50,
          vx: d9dir * 10, vy: -20,
          targetX: 0, targetY: 0,
          damage: 60, trail: [], life: 280, maxLife: 280,
          warned: true, warnTimer: 0, warnMaxTimer: 0,
          exploding: false, explodeTimer: 0, explodeX: 0, explodeY: 0,
        });
      }
    }
    e.x = Math.max(-e.width, e.x);
  }

  if (gs.shake > 0) gs.shake = Math.max(0, gs.shake - 1);

  // Projectiles
  for (let i = gs.projectiles.length - 1; i >= 0; i--) {
    const pr = gs.projectiles[i];
    if (pr.exploding) {
      pr.explodeTimer--;
      if (pr.explodeTimer <= 0) gs.projectiles.splice(i, 1);
      continue;
    }
    pr.life--;
    if (pr.life <= 0) { gs.projectiles.splice(i, 1); continue; }

    if (pr.type === "rock") {
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 10) pr.trail.shift();
      pr.vy += 0.62;
      pr.x += pr.vx; pr.y += pr.vy;
      let rockHit = false;
      for (const e of enemies) {
        if (e.state === "dead") continue;
        if (pr.x > e.x - 12 && pr.x < e.x + e.width + 12 && pr.y > e.y - e.height - 12 && pr.y < e.y + 12) {
          e.hp -= pr.damage; e.state = "hurt"; e.stateTimer = 16; e.vx += pr.vx * 0.3;
          gs.shake = Math.max(gs.shake, 9);
          for (let j = 0; j < 8; j++) callbacks.onParticle({ x: pr.x, y: pr.y, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 7 - 2, life: 20, maxLife: 20, color: j < 4 ? "#78716c" : "#a8a29e", size: 3 + Math.random() * 5 });
          callbacks.onParticle({ x: e.x + e.width / 2, y: e.y - e.height / 2 - 24, vx: 0, vy: -1.4, life: 34, maxLife: 34, color: "#f97316", text: "SMASH!", size: 16 });
          if (e.hp <= 0) {
            e.state = "dead"; e.stateTimer = 0; callbacks.onEnemyDie(e, "rock");
            gs.combo++; gs.comboTimer = 160; callbacks.onComboChange(gs.combo);
            gs.score += 150 * gs.scoreMultiplier; callbacks.onScoreChange(gs.score);
          }
          rockHit = true; break;
        }
      }
      if (rockHit || pr.y >= FLOOR_Y || pr.x < -60 || pr.x > CANVAS_W + 60) {
        if (pr.y >= FLOOR_Y) for (let j = 0; j < 5; j++) callbacks.onParticle({ x: pr.x, y: FLOOR_Y, vx: (Math.random() - 0.5) * 9, vy: -2 - Math.random() * 4, life: 14, maxLife: 14, color: "#78716c", size: 2 + Math.random() * 4 });
        gs.projectiles.splice(i, 1);
      }
      continue;
    }

    // Bullet / sniper shot (player weapons — hit enemies)
    if (pr.type === "bullet" || pr.type === "sniper_shot") {
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 8) pr.trail.shift();
      pr.x += pr.vx; pr.y += pr.vy;
      const isPiercing = pr.type === "sniper_shot";
      let bulletHit = false;
      for (const e of enemies) {
        if (e.state === "dead") continue;
        if (pr.x > e.x - 14 && pr.x < e.x + e.width + 14 && pr.y > e.y - e.height - 14 && pr.y < e.y + 14) {
          // Sniper scales damage with distance (targetX = launch X)
          const travelDist = isPiercing ? Math.abs(pr.x - pr.targetX) : 0;
          const actualDmg = isPiercing ? Math.round(pr.damage * (1 + travelDist / 280)) : pr.damage;
          e.hp -= actualDmg; e.state = "hurt"; e.stateTimer = 14; e.vx += pr.vx * 0.15;
          gs.shake = Math.max(gs.shake, isPiercing ? 14 : 6);
          for (let j = 0; j < 6; j++) callbacks.onParticle({ x: pr.x, y: pr.y, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 6 - 2, life: 16, maxLife: 16, color: j < 3 ? "#ef4444" : "#fbbf24", size: 3 + Math.random() * 5 });
          callbacks.onParticle({ x: e.x + e.width / 2, y: e.y - e.height - 22, vx: 0, vy: -1.5, life: 28, maxLife: 28, color: "#fff", text: `-${actualDmg}`, size: 13 });
          if (e.hp <= 0) {
            e.state = "dead"; e.stateTimer = 0; callbacks.onEnemyDie(e, pr.sourceWeapon);
            gs.combo++; gs.comboTimer = 160; callbacks.onComboChange(gs.combo);
            gs.score += (isPiercing ? 200 : 100) * gs.scoreMultiplier; callbacks.onScoreChange(gs.score);
          }
          if (!isPiercing) { bulletHit = true; break; }
        }
      }
      if (bulletHit || pr.x < -30 || pr.x > CANVAS_W + 30 || pr.y < -30 || pr.y > FLOOR_Y + 20) {
        gs.projectiles.splice(i, 1);
      }
      continue;
    }

    // Grenade (player — AoE on impact)
    if (pr.type === "grenade_player") {
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 10) pr.trail.shift();
      pr.vy += 0.58;
      pr.x += pr.vx; pr.y += pr.vy;
      let grenHit = false;
      for (const e of enemies) {
        if (e.state === "dead") continue;
        if (pr.x > e.x - 14 && pr.x < e.x + e.width + 14 && pr.y > e.y - e.height - 14 && pr.y < e.y + 14) {
          grenHit = true; break;
        }
      }
      if (grenHit || pr.y >= FLOOR_Y) {
        const ex = pr.x, ey = Math.min(pr.y, FLOOR_Y);
        const blastR = 110;
        for (const t of enemies) {
          if (t.state === "dead") continue;
          const tdx = t.x + t.width / 2 - ex; const tdy = t.y - t.height / 2 - ey;
          if (Math.sqrt(tdx * tdx + tdy * tdy) < blastR) {
            t.hp -= pr.damage; t.state = "hurt"; t.stateTimer = 22; t.vx += (tdx / (Math.abs(tdx) || 1)) * 7;
            if (t.hp <= 0) {
              t.state = "dead"; t.stateTimer = 0; callbacks.onEnemyDie(t, "grenade");
              gs.combo++; gs.comboTimer = 160; callbacks.onComboChange(gs.combo);
              gs.score += 200 * gs.scoreMultiplier; callbacks.onScoreChange(gs.score);
            }
          }
        }
        gs.shake = Math.max(gs.shake, 22);
        for (let j = 0; j < 24; j++) {
          const col = j < 9 ? "#f97316" : j < 16 ? "#fbbf24" : j < 22 ? "#ef4444" : "#4b5563";
          callbacks.onParticle({ x: ex, y: ey, vx: (Math.random() - 0.5) * 20, vy: -Math.random() * 16 - 3, life: 28 + Math.random() * 32, maxLife: 60, color: col, size: 6 + Math.random() * 12 });
        }
        callbacks.onParticle({ x: ex, y: ey - 50, vx: 0, vy: -2, life: 56, maxLife: 56, color: "#ef4444", text: "BOOM!", size: 26 });
        pr.exploding = true; pr.explodeTimer = 34; pr.explodeX = ex; pr.explodeY = ey;
      } else if (pr.x < -80 || pr.x > CANVAS_W + 80) {
        gs.projectiles.splice(i, 1);
      }
      continue;
    }

    // Tank rocket (enemy — horizontal, hits player on ground)
    if (pr.type === "tank_rocket") {
      if (!pr.warned) {
        pr.warnTimer--;
        if (pr.warnTimer <= 0) pr.warned = true;
        continue;
      }
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 12) pr.trail.shift();
      pr.x += pr.vx; pr.y += pr.vy;
      const pHit = pr.x > p.x - 14 && pr.x < p.x + p.width + 14 && pr.y > p.y - p.height - 10 && pr.y < p.y + 8;
      if (pHit) {
        if (!p.buffs.shielded) {
          p.hp -= pr.damage; p.hurtTimer = 26; gs.shake = Math.max(gs.shake, 20);
          for (let j = 0; j < 8; j++) callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 9 - 2, life: 22, maxLife: 22, color: "#ef4444", size: 5 + Math.random() * 5 });
          if (p.hp <= 0) callbacks.onPlayerDie();
        } else {
          p.buffs.shielded = false;
          callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: 0, vy: -2, life: 30, maxLife: 30, color: "#22d3ee", text: "BLOCKED!", size: 16 });
        }
      }
      if (pHit || pr.x < -30 || pr.x > CANVAS_W + 30) {
        const ex = pr.x, ey = pr.y;
        gs.shake = Math.max(gs.shake, 16);
        for (let j = 0; j < 18; j++) {
          const col = j < 7 ? "#f97316" : j < 13 ? "#fbbf24" : "#ef4444";
          callbacks.onParticle({ x: ex, y: ey, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 12 - 2, life: 24 + Math.random() * 28, maxLife: 52, color: col, size: 5 + Math.random() * 10 });
        }
        pr.exploding = true; pr.explodeTimer = 28; pr.explodeX = ex; pr.explodeY = ey;
      }
      continue;
    }

    // Soldier bullet (enemy — damages player on contact)
    if (pr.type === "soldier_bullet") {
      pr.x += pr.vx; pr.y += pr.vy;
      const pHitSB = pr.x > p.x - 10 && pr.x < p.x + p.width + 10 && pr.y > p.y - p.height - 10 && pr.y < p.y + 8;
      if (pHitSB) {
        if (!p.buffs.shielded) {
          p.hp -= pr.damage; p.hurtTimer = 22; gs.shake = Math.max(gs.shake, 10);
          for (let j = 0; j < 6; j++) callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 7 - 2, life: 18, maxLife: 18, color: "#ef4444", size: 4 + Math.random() * 4 });
          if (p.hp <= 0) callbacks.onPlayerDie();
        } else {
          p.buffs.shielded = false;
          callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: 0, vy: -2, life: 30, maxLife: 30, color: "#22d3ee", text: "BLOCKED!", size: 16 });
        }
        gs.projectiles.splice(i, 1);
        continue;
      }
      if (pr.x < -40 || pr.x > CANVAS_W + 40) gs.projectiles.splice(i, 1);
      continue;
    }

    if (pr.type === "rocket") {
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 14) pr.trail.shift();
      pr.x += pr.vx; pr.y += pr.vy;
      let rocketHit = false;
      for (const e of enemies) {
        if (e.state === "dead") continue;
        const hitMargin = 20;
        if (pr.x > e.x - hitMargin && pr.x < e.x + e.width + hitMargin && pr.y > e.y - e.height - hitMargin && pr.y < e.y + hitMargin) {
          rocketHit = true;
          const blastR = 130;
          for (const t of enemies) {
            if (t.state === "dead") continue;
            const tdx = t.x + t.width / 2 - pr.x; const tdy = t.y - t.height / 2 - pr.y;
            if (Math.sqrt(tdx * tdx + tdy * tdy) < blastR) {
              t.hp -= pr.damage; t.state = "hurt"; t.stateTimer = 20; t.vx += tdx / (Math.abs(tdx) || 1) * 8;
              if (t.hp <= 0) {
                t.state = "dead"; t.stateTimer = 0; callbacks.onEnemyDie(t, "rocket");
                gs.combo++; gs.comboTimer = 160; callbacks.onComboChange(gs.combo);
                gs.score += 250 * gs.scoreMultiplier; callbacks.onScoreChange(gs.score);
              }
            }
          }
          break;
        }
      }
      if (!rocketHit && (pr.x < -10 || pr.x > CANVAS_W + 10 || pr.y >= FLOOR_Y || pr.y < -20)) rocketHit = true;
      if (rocketHit) {
        const ex = pr.x, ey = Math.min(pr.y, FLOOR_Y);
        gs.shake = Math.max(gs.shake, 28);
        for (let j = 0; j < 28; j++) {
          const col = j < 10 ? "#f97316" : j < 18 ? "#fbbf24" : j < 24 ? "#ef4444" : "#4b5563";
          callbacks.onParticle({ x: ex, y: ey, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 18 - 3, life: 30 + Math.random() * 35, maxLife: 65, color: col, size: 6 + Math.random() * 14 });
        }
        callbacks.onParticle({ x: ex, y: ey - 50, vx: 0, vy: -2, life: 60, maxLife: 60, color: "#ef4444", text: "BOOM!", size: 28 });
        pr.exploding = true; pr.explodeTimer = 40; pr.explodeX = ex; pr.explodeY = ey;
      }
      continue;
    }

    // Missile (player — massive AoE)
    if (pr.type === "missile") {
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 20) pr.trail.shift();
      pr.x += pr.vx; pr.y += pr.vy;
      let missileHit = false;
      for (const e of enemies) {
        if (e.state === "dead") continue;
        const hm = 32;
        if (pr.x > e.x - hm && pr.x < e.x + e.width + hm && pr.y > e.y - e.height - hm && pr.y < e.y + hm) {
          missileHit = true; break;
        }
      }
      if (!missileHit && (pr.x < -20 || pr.x > CANVAS_W + 20 || pr.y >= FLOOR_Y || pr.y < -50)) missileHit = true;
      if (missileHit) {
        const ex = pr.x, ey = Math.min(pr.y, FLOOR_Y);
        const blastR = 290;
        for (const t of enemies) {
          if (t.state === "dead") continue;
          const tdx = t.x + t.width / 2 - ex; const tdy = t.y - t.height / 2 - ey;
          if (Math.sqrt(tdx * tdx + tdy * tdy) < blastR) {
            t.hp -= pr.damage; t.state = "hurt"; t.stateTimer = 30; t.vx += (tdx / (Math.abs(tdx) || 1)) * 14;
            if (t.hp <= 0) {
              t.state = "dead"; t.stateTimer = 0; callbacks.onEnemyDie(t, "missile");
              gs.combo++; gs.comboTimer = 180; callbacks.onComboChange(gs.combo);
              gs.score += 600 * gs.scoreMultiplier; callbacks.onScoreChange(gs.score);
            }
          }
        }
        // Mushroom cloud: ground hit kills ALL non-boss enemies
        if (pr.y >= FLOOR_Y - 30) {
          for (const mt of enemies) {
            if (mt.state === "dead" || mt.isBoss) continue;
            mt.hp = 0; mt.state = "dead"; mt.stateTimer = 0;
            callbacks.onEnemyDie(mt, "missile");
            gs.combo++; gs.comboTimer = 180; callbacks.onComboChange(gs.combo);
            gs.score += 200 * gs.scoreMultiplier; callbacks.onScoreChange(gs.score);
          }
        }
        gs.shake = Math.max(gs.shake, 45);
        for (let j = 0; j < 60; j++) {
          const col = j < 20 ? "#f97316" : j < 38 ? "#fbbf24" : j < 52 ? "#ef4444" : "#1c1917";
          callbacks.onParticle({ x: ex + (Math.random() - 0.5) * blastR * 0.7, y: ey + (Math.random() - 0.5) * 50, vx: (Math.random() - 0.5) * 30, vy: -Math.random() * 24 - 4, life: 45 + Math.random() * 55, maxLife: 100, color: col, size: 10 + Math.random() * 22 });
        }
        callbacks.onParticle({ x: ex, y: ey - 90, vx: 0, vy: -3, life: 80, maxLife: 80, color: "#ef4444", text: "💥 MISSILE!", size: 38 });
        pr.exploding = true; pr.explodeTimer = 70; pr.explodeX = ex; pr.explodeY = ey;
      }
      continue;
    }

    if (!pr.warned) {
      pr.warnTimer--;
      if (pr.warnTimer <= 0) pr.warned = true;
      continue;
    }
    pr.trail.push({ x: pr.x, y: pr.y });
    if (pr.trail.length > 18) pr.trail.shift();
    if (pr.type === "bomb") {
      pr.vy += 0.55;
    } else {
      const hDx = p.x + p.width / 2 - pr.x; const hDy = p.y - p.height / 2 - pr.y;
      const hDist = Math.sqrt(hDx * hDx + hDy * hDy) || 1;
      pr.vx += hDx / hDist * 0.38; pr.vy += hDy / hDist * 0.38;
      const spd = Math.sqrt(pr.vx * pr.vx + pr.vy * pr.vy);
      if (spd > 12) { pr.vx = pr.vx / spd * 12; pr.vy = pr.vy / spd * 12; }
    }
    pr.x += pr.vx; pr.y += pr.vy;

    const doExplode = (ex: number, ey: number) => {
      pr.exploding = true; pr.explodeTimer = 32; pr.explodeX = ex; pr.explodeY = ey;
      const big = pr.type === "hellfire";
      gs.shake = Math.max(gs.shake, big ? 22 : 14);
      for (let j = 0; j < 20; j++) {
        const col = j < 8 ? "#f97316" : j < 14 ? "#fbbf24" : j < 18 ? "#ef4444" : "#4b5563";
        callbacks.onParticle({ x: ex, y: ey, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 13 - 2, life: 25 + Math.random() * 30, maxLife: 55, color: col, size: 5 + Math.random() * 12 });
      }
      callbacks.onParticle({ x: ex, y: ey - 44, vx: 0, vy: -1.5, life: 55, maxLife: 55, color: "#ef4444", text: "BOOM!", size: 24 });
      const blastR = big ? 90 : 60;
      const bdx = p.x + p.width / 2 - ex; const bdy = p.y - p.height / 2 - ey;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < blastR) {
        if (!p.buffs.shielded) {
          p.hp -= pr.damage; p.hurtTimer = 26; gs.shake = Math.max(gs.shake, big ? 26 : 18);
          for (let j = 0; j < 10; j++) callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 10 - 2, life: 22, maxLife: 22, color: "#ef4444", size: 4 + Math.random() * 6 });
          if (p.hp <= 0) callbacks.onPlayerDie();
        } else {
          p.buffs.shielded = false;
          callbacks.onParticle({ x: p.x + p.width / 2, y: p.y - p.height / 2, vx: 0, vy: -2, life: 30, maxLife: 30, color: "#22d3ee", text: "BLOCKED!", size: 16 });
        }
      }
    };

    if (pr.y >= FLOOR_Y) { doExplode(pr.x, FLOOR_Y); continue; }
    if (pr.x < -120 || pr.x > CANVAS_W + 120) { gs.projectiles.splice(i, 1); continue; }
    const hitR = pr.type === "hellfire" ? 26 : 18;
    const pdx = p.x + p.width / 2 - pr.x; const pdy = p.y - p.height / 2 - pr.y;
    if (Math.sqrt(pdx * pdx + pdy * pdy) < hitR) { doExplode(pr.x, pr.y); continue; }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.12; pt.life--;
    if (pt.life <= 0) particles.splice(i, 1);
  }
}

export function spawnDeathParticles(gs: GameState, e: Enemy, onParticle: (p: Particle) => void) {
  const cx = e.x + e.width / 2, cy = e.y - e.height / 2;
  for (let i = 0; i < 12; i++) {
    onParticle({ x: cx, y: cy, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 10 - 3, life: 30 + Math.random() * 20, maxLife: 50, color: i % 2 === 0 ? "#ef4444" : "#78716c", size: 4 + Math.random() * 7 });
  }
  onParticle({ x: cx, y: cy - 40, vx: 0, vy: -2, life: 48, maxLife: 48, color: "#fbbf24", text: "+100", size: 14 });
  if (Math.random() < 0.28) {
    const types = ["health", "speed", "power", "shield"];
    gs.powerUps.push({ id: String(Math.random()), x: cx, y: cy, type: types[Math.floor(Math.random() * types.length)], life: 360, bobOffset: Math.random() * Math.PI * 2 });
  }
}
