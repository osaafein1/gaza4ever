export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const GRAVITY = 1.1;
export const FLOOR_Y = CANVAS_H - 100;

export const CHARACTERS = [
  { name: "AHMED",  color: "#3b82f6", maxHp: 100, moveSpeed: 6,   attackDamage: 22, blastCost: 200 },
  { name: "KAREEM", color: "#22c55e", maxHp: 140, moveSpeed: 4.8, attackDamage: 20, blastCost: 220 },
  { name: "MARIAM", color: "#f97316", maxHp: 80,  moveSpeed: 8.2, attackDamage: 32, blastCost: 180 },
  { name: "SAMIR",  color: "#a78bfa", maxHp: 110, moveSpeed: 6,   attackDamage: 26, blastCost: 160 },
];

export const ENEMY_DEFS: Record<string, { hp: number; speed: number; w: number; h: number; dmg: number }> = {
  patrol:    { hp: 45,  speed: 1.1,  w: 46,  h: 100, dmg: 10 },
  soldier:   { hp: 90,  speed: 0.95, w: 46,  h: 105, dmg: 16 },
  armored:   { hp: 180, speed: 0.8,  w: 52,  h: 110, dmg: 28 },
  sniper:    { hp: 110, speed: 0.7,  w: 44,  h: 120, dmg: 30 },
  marksman:  { hp: 120, speed: 0.85, w: 46,  h: 112, dmg: 22 },
  drone:     { hp: 80,  speed: 2.8,  w: 80,  h: 70,  dmg: 18 },
  tank:      { hp: 380, speed: 0.55, w: 150, h: 85,  dmg: 50 },
  bulldozer: { hp: 450, speed: 0.5,  w: 155, h: 90,  dmg: 45 },
  apc:       { hp: 280, speed: 0.9,  w: 130, h: 80,  dmg: 38 },
  apache:    { hp: 700, speed: 1.8,  w: 180, h: 90,  dmg: 60 },
  warplane:  { hp: 900, speed: 1.4,  w: 180, h: 80,  dmg: 70 },
};

export const STAGE_DEFS = [
  {
    id: "jabalia",
    name: "JABALIA",
    subtitle: "Northern Gaza",
    color: "#f97316",
    desc: "Start your journey south through the ruins of the refugee camp",
    waves: 3,
    enemyTier: ["patrol", "soldier", "drone"],
    bossType: "tank",
  },
  {
    id: "gaza-city",
    name: "GAZA CITY",
    subtitle: "Central Gaza",
    color: "#ef4444",
    desc: "Navigate the shattered streets of the old city",
    waves: 3,
    enemyTier: ["soldier", "armored", "sniper", "drone"],
    bossType: "tank",
  },
  {
    id: "khan-younis",
    name: "KHAN YOUNIS",
    subtitle: "Southern Gaza",
    color: "#fbbf24",
    desc: "Push through the southern districts toward safety",
    waves: 3,
    enemyTier: ["armored", "sniper", "marksman", "drone", "apc"],
    bossType: "bulldozer",
  },
  {
    id: "rafah",
    name: "RAFAH",
    subtitle: "The Border",
    color: "#22c55e",
    desc: "Reach the crossing — freedom is within sight",
    waves: 1,
    enemyTier: ["armored", "sniper", "soldier", "marksman", "drone", "apc"],
    bossType: "apache",
  },
];

export const COLLECTIBLE_DEFS: Record<string, { label: string; desc: string; color: string; icon: string }> = {
  medkit:    { label: "Medical Kit",      desc: "+50 HP at stage start",     color: "#22c55e", icon: "✚" },
  documents: { label: "Documents",        desc: "x2 score this stage",       color: "#60a5fa", icon: "📄" },
  radio:     { label: "Shortwave Radio",  desc: "Reveals enemy positions",   color: "#f59e0b", icon: "📻" },
  water:     { label: "Water Canteen",    desc: "Slow HP regen",             color: "#38bdf8", icon: "💧" },
  keys:      { label: "Car Keys",         desc: "+30% movement speed",       color: "#a78bfa", icon: "🔑" },
  aidpkg:    { label: "Aid Package",      desc: "+60 HP at stage start",     color: "#fb923c", icon: "📦" },
};

export const STAGE_COLLECTIBLES: Record<number, string[]> = {
  0: ["medkit", "documents"],
  1: ["radio", "water"],
  2: ["keys", "aidpkg"],
  3: [],
};

export const STAGE_ARABIC: Record<number, string> = {
  0: "جباليا",
  1: "مدينة غزة",
  2: "خان يونس",
  3: "رفح",
};

export const STAGE_HISTORY: Record<number, { title: string; text: string; fact: string }> = {
  0: {
    title: "Jabalia Refugee Camp",
    text: "Founded in 1948 when 750,000 Palestinians were expelled during the Nakba. Today over 110,000 people live in just 1.4 km² — one of the most densely populated places on Earth. Since October 2023 it has been bombed repeatedly, reducing entire blocks to rubble.",
    fact: "Established: 1948 · Population: 116,000 · Area: 1.4 km²",
  },
  1: {
    title: "Gaza City — مدينة غزة",
    text: "One of the oldest continuously inhabited cities on Earth, with over 4,000 years of history. Its ancient port was a crossroads of Egyptian, Greek, Roman, and Islamic civilisations. Since October 2023, large parts of the city have been reduced to rubble.",
    fact: "Founded: ~3,000 BCE · UNESCO heritage sites · Population: 590,000",
  },
  2: {
    title: "Khan Younis — خان يونس",
    text: "Founded in the 14th century by Mamluk emir Yunis Khan. Its caravanserai once hosted pilgrims traveling to Mecca. In 2024, Khan Younis became the site of operations that displaced hundreds of thousands from their homes.",
    fact: "Founded: 14th century · Historic Ottoman fortress · Population: 340,000",
  },
  3: {
    title: "Rafah — رفح",
    text: "The southernmost city of Gaza, split by the 1979 Egypt-Israel peace treaty. Its crossing is the only gateway to the outside world not controlled by Israel. In early 2024, over one million displaced Palestinians sheltered here.",
    fact: "Border crossing: Egypt–Gaza · Pop. 2024: 1.4 million displaced · Last exit",
  },
};

export const STAGE_STORIES: Record<number, string[]> = {
  0: [
    "October 2023. The bombs began at dawn.",
    "Ahmed's family hides in Jabalia camp.",
    "The camp is surrounded. Roads are cut.",
    '"We must go south. Now."',
    "STAGE 1 — ESCAPE JABALIA",
  ],
  1: [
    "They reach Gaza City on foot.",
    "Streets once full of life — now silent rubble.",
    "Al-Shifa hospital, the university, the market...",
    "...all gone. But people still move.",
    '"Gaza will not be erased from memory."',
    "STAGE 2 — CROSS GAZA CITY",
  ],
  2: [
    "Days of walking. Khan Younis comes into sight.",
    "Hundreds of thousands crowd the roads.",
    "Families carry mattresses, infants, bread.",
    "Ahmed sees a child drawing on a wall:",
    '"We will return."',
    "STAGE 3 — THROUGH KHAN YOUNIS",
  ],
  3: [
    "Rafah. The border is close.",
    "Over a million people wait here.",
    "The crossing opens and closes without warning.",
    "Ahmed holds his family's documents tight.",
    '"One step at a time. We are almost free."',
    "STAGE 4 — REACH RAFAH",
  ],
};
