export interface Player {
  id: string;
  x: number; y: number;
  width: number; height: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  isJumping: boolean;
  facingRight: boolean;
  isAttacking: boolean;
  attackTimer: number;
  specialCooldown: number;
  color: string;
  hurtTimer: number;
  chargeTimer: number;
  allyCD: [number, number, number];
  activeChar: number;
  buffs: { speedTimer: number; powerTimer: number; shielded: boolean };
  charSwitchTimer: number;
  summonCooldown: number;
  rockCooldown: number;
  rocketCooldown: number;
}

export interface Enemy {
  id: string;
  type: string;
  hp: number; maxHp: number;
  speed: number;
  width: number; height: number;
  damage: number;
  color: string;
  x: number; y: number;
  vx: number; vy: number;
  state: string;
  stateTimer: number;
  animTimer: number;
  phase: number;
  attackCooldown: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  size?: number;
  text?: string;
  kind?: string;
}

export interface PowerUp {
  id: string;
  x: number; y: number;
  type: string;
  life: number;
  bobOffset: number;
}

export interface Collectible {
  id: string;
  x: number; y: number;
  type: string;
  life: number;
  bobOffset: number;
  collected: boolean;
}

export interface Summon {
  id: string;
  x: number; y: number;
  vx: number;
  life: number; maxLife: number;
  dir: number;
}

export interface TrailPoint { x: number; y: number; }

export interface Projectile {
  id: string;
  type: string;
  x: number; y: number;
  vx: number; vy: number;
  targetX: number; targetY: number;
  damage: number;
  trail: TrailPoint[];
  life: number; maxLife: number;
  warned: boolean;
  warnTimer: number;
  warnMaxTimer: number;
  exploding: boolean;
  explodeTimer: number;
  explodeX: number;
  explodeY: number;
}

export interface Beam {
  active: boolean;
  x: number; y: number;
  progress: number;
  facingRight: boolean;
}

export interface BgStar { x: number; y: number; r: number; twinkle: number; }
export interface BgCloud { x: number; y: number; w: number; h: number; speed: number; }
export interface BgMountain { x: number; h: number; w: number; }
export interface BgRuin { x: number; h: number; w: number; dmg: number; }
export interface BgSmoke { x: number; y: number; r: number; phase: number; speed: number; }
export interface BgDebris { x: number; y: number; angle: number; size: number; }
export interface BgTent { x: number; w: number; h: number; }

export interface BgData {
  offset: number;
  type: string;
  blackHoleAngle: number;
  stars: BgStar[];
  clouds: BgCloud[];
  mountains: BgMountain[];
  vines: unknown[];
  ruins: BgRuin[];
  eyePairs: unknown[];
  spores: unknown[];
  lightning: { timer: number; x: number; y2: number; active: boolean };
  smoke: BgSmoke[];
  debris: BgDebris[];
  tents: BgTent[];
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  particles: Particle[];
  powerUps: PowerUp[];
  collectibles: Collectible[];
  summons: Summon[];
  projectiles: Projectile[];
  beam: Beam;
  keys: Record<string, boolean>;
  keysDown: Record<string, boolean>;
  shake: number;
  waveKills: number;
  waveTarget: number;
  comboTimer: number;
  score: number;
  combo: number;
  frameCount: number;
  bgData: BgData;
  scoreMultiplier: number;
  regenTimer: number;
}

export interface GameCallbacks {
  onParticle: (p: Particle) => void;
  onEnemyDie: (e: Enemy) => void;
  onPlayerDie: () => void;
  onWaveComplete: () => void;
  onComboChange: (n: number) => void;
  onScoreChange: (n: number) => void;
  onAllyCD: (cds: [number, number, number]) => void;
  onCollectItem: (type: string) => void;
}
