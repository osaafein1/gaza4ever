export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const GRAVITY = 1.1;
export const FLOOR_Y = CANVAS_H - 100;

export const CHARACTERS = [
  { name: "HANDALAH", color: "#3b82f6", maxHp: 100, moveSpeed: 6,   attackDamage: 22, blastCost: 200 },
  { name: "KAREEM",   color: "#22c55e", maxHp: 140, moveSpeed: 4.8, attackDamage: 20, blastCost: 220 },
  { name: "MARIAM",   color: "#f97316", maxHp: 80,  moveSpeed: 8.2, attackDamage: 32, blastCost: 180 },
  { name: "FATIMAH",  color: "#a78bfa", maxHp: 110, moveSpeed: 6,   attackDamage: 26, blastCost: 160 },
];

export const ENEMY_DEFS: Record<string, { hp: number; speed: number; w: number; h: number; dmg: number }> = {
  patrol:          { hp: 45,   speed: 1.1,  w: 46,  h: 100, dmg: 10 },
  soldier:         { hp: 90,   speed: 0.95, w: 46,  h: 105, dmg: 16 },
  armored:         { hp: 180,  speed: 0.8,  w: 52,  h: 110, dmg: 28 },
  sniper:          { hp: 110,  speed: 0.7,  w: 44,  h: 120, dmg: 30 },
  marksman:        { hp: 120,  speed: 0.85, w: 46,  h: 112, dmg: 22 },
  drone:           { hp: 80,   speed: 2.8,  w: 80,  h: 70,  dmg: 18 },
  tank:            { hp: 380,  speed: 0.55, w: 150, h: 85,  dmg: 50 },
  bulldozer:       { hp: 450,  speed: 0.5,  w: 155, h: 90,  dmg: 45 },
  apc:             { hp: 280,  speed: 0.9,  w: 130, h: 80,  dmg: 38 },
  apache:          { hp: 700,  speed: 1.8,  w: 180, h: 90,  dmg: 60 },
  warplane:        { hp: 900,  speed: 1.4,  w: 180, h: 80,  dmg: 70 },
  bomb_plane_mini: { hp: 600,  speed: 2.6,  w: 155, h: 65,  dmg: 50 },
  bomb_plane_large:{ hp: 1400, speed: 1.6,  w: 260, h: 80,  dmg: 75 },
  d9:              { hp: 2000, speed: 0.28, w: 190, h: 105, dmg: 70 },
};

export const STAGE_DEFS = [
  {
    id: "jabalia",
    name: "JABALIA",
    subtitle: "Northern Gaza",
    color: "#f97316",
    desc: "Start your journey south through the ruins of the refugee camp",
    waves: 3,
    enemyTier: ["patrol", "soldier"],
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
    id: "nuseirat",
    name: "NUSEIRAT",
    subtitle: "Central Gaza — Refugee Camp",
    color: "#a855f7",
    desc: "Push through the heart of the camp — the most densely shelled ground",
    waves: 3,
    enemyTier: ["armored", "soldier", "sniper", "apc", "drone"],
    bossType: "bomb_plane_mini",
  },
  {
    id: "khan-younis",
    name: "KHAN YOUNIS",
    subtitle: "Southern Gaza",
    color: "#fbbf24",
    desc: "Push through the southern districts toward safety",
    waves: 3,
    enemyTier: ["armored", "sniper", "marksman", "apc", "drone"],
    bossType: "bomb_plane_large",
  },
  {
    id: "rafah",
    name: "RAFAH",
    subtitle: "The Border",
    color: "#22c55e",
    desc: "Reach the crossing — freedom is within sight",
    waves: 1,
    enemyTier: ["armored", "sniper", "soldier", "marksman", "apc", "drone"],
    bossType: "d9",
  },
];

export const SHOP_WEAPONS = [
  { id: "dog",        label: "War Dog",          cost: 3,   damage: 12,  ammo: 1,  firerate: 0,   desc: "Loyal companion — attacks enemies. Can die." },
  { id: "pistol",     label: "Pistol",          cost: 5,   damage: 25,  ammo: 20, firerate: 18,  desc: "Light sidearm — 20 rounds." },
  { id: "m16",        label: "M16 Rifle",        cost: 12,  damage: 20,  ammo: 30, firerate: 8,   desc: "Rapid semi-auto — 30 rounds." },
  { id: "grenade",    label: "Grenade",          cost: 8,   damage: 65,  ammo: 3,  firerate: 60,  desc: "Area explosion — 3 grenades." },
  { id: "machinegun", label: "Machine Gun",      cost: 20,  damage: 12,  ammo: 60, firerate: 2,   desc: "Full-auto suppression — 60 rds." },
  { id: "sniper",     label: "Sniper Rifle",     cost: 15,  damage: 50,  ammo: 5,  firerate: 45,  desc: "Piercing, distance scales dmg — 5 rds." },
  { id: "shotgun",    label: "AOE Shotgun",      cost: 15,  damage: 25,  ammo: 8,  firerate: 35,  desc: "Wide spread blast — 8 rounds." },
  { id: "rocket",     label: "Rocket Launcher",  cost: 18,  damage: 90,  ammo: 3,  firerate: 80,  desc: "Explosive AoE, auto-aims — 3 rds." },
  { id: "missile",    label: "Missile Strike",   cost: 30,  damage: 200, ammo: 1,  firerate: 120, desc: "Screen-wide mushroom cloud — 1 round." },
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
  2: ["medkit", "aidpkg"],
  3: ["keys", "aidpkg"],
  4: [],
};

export const STAGE_ARABIC: Record<number, string> = {
  0: "جباليا",
  1: "مدينة غزة",
  2: "النصيرات",
  3: "خان يونس",
  4: "رفح",
};

export const STAGE_LANDMARKS: Record<number, { name: string; when: string; desc: string; impact: string[] }> = {
  0: {
    name: "Al-Fakhoura UNRWA School",
    when: "Struck October 19, 2023",
    desc: "Hundreds of displaced families were sheltering inside when an Israeli airstrike hit. At least 20 people were killed and dozens more wounded. UNRWA had shared the school's GPS coordinates with Israel to protect it — they were ignored. The school was one of over 100 UNRWA facilities struck during the conflict.",
    impact: [
      "20+ killed, dozens wounded inside the shelter",
      "70% of all Gaza schools damaged or destroyed by 2024",
      "1.9 million people displaced — nearly Gaza's entire population",
    ],
  },
  1: {
    name: "Al-Shifa Hospital",
    when: "Raided November 2023 & March 2024",
    desc: "Gaza's largest hospital, with over 700 beds and 1,500 patients sheltering inside. Israeli forces cut electricity and water for weeks before conducting two major military raids. Patients on ventilators died without power. The March 2024 raid lasted two weeks and left the complex completely destroyed.",
    impact: [
      "Gaza's 36 hospitals — none fully functional by April 2024",
      "WHO documented 34+ hospital attacks in first 6 months",
      "500+ medical workers killed or detained across Gaza",
    ],
  },
  2: {
    name: "Nuseirat Camp Massacre",
    when: "June 8, 2024",
    desc: "An Israeli military operation launched into a crowded Saturday market in broad daylight killed at least 274 Palestinian civilians and wounded over 700 — one of the single deadliest incidents of the war. The Al-Huda mosque, which had served camp families for generations, was also destroyed in the bombardment.",
    impact: [
      "274+ civilians killed in one daytime operation",
      "700+ wounded — hospitals overwhelmed within hours",
      "4 Israeli hostages rescued; 1 killed in the operation",
    ],
  },
  3: {
    name: "Nasser Hospital",
    when: "Besieged February 2024",
    desc: "The largest functioning hospital in southern Gaza, serving over 400,000 displaced people. During a two-week Israeli siege, generator fuel ran out. Patients on ventilators and in intensive care died. Surgeons operated without anaesthesia. After Israeli forces withdrew, mass graves were found in the hospital grounds.",
    impact: [
      "Served 400,000+ displaced people at peak displacement",
      "Mass graves discovered in hospital grounds after withdrawal",
      "Over 700 healthcare workers detained or killed across Gaza",
    ],
  },
  4: {
    name: "Rafah Border Crossing",
    when: "Seized May 7, 2024",
    desc: "Gaza's only crossing not under Israeli control — the sole humanitarian lifeline for medicine, food, and fuel. Israeli forces seized the Palestinian side, halting all aid deliveries. Over one million displaced Palestinians were sheltering in Rafah when the ground offensive began. The UN declared famine in northern Gaza.",
    impact: [
      "500 aid trucks/day before war — near zero after seizure",
      "UN declared famine conditions in northern Gaza by March 2024",
      "1.1 million sheltering in Rafah when offensive began",
    ],
  },
};

export const STAGE_HISTORY: Record<number, { title: string; text: string; fact: string }> = {
  0: {
    title: "Jabalia Refugee Camp — جباليا",
    text: "Founded in 1948 when 750,000 Palestinians were expelled during the Nakba. Today over 116,000 people live in just 1.4 km² — one of the most densely populated places on Earth. Since October 2023 it has been bombed repeatedly, reducing entire blocks to rubble.",
    fact: "Established: 1948 · Population: 116,000 · Area: 1.4 km²",
  },
  1: {
    title: "Gaza City — مدينة غزة",
    text: "One of the oldest continuously inhabited cities on Earth, with over 4,000 years of history. Its ancient port was a crossroads of Egyptian, Greek, Roman, and Islamic civilisations. Since October 2023, large parts of the city have been reduced to rubble.",
    fact: "Founded: ~3,000 BCE · UNESCO heritage sites · Population: 590,000",
  },
  2: {
    title: "Nuseirat Refugee Camp — النصيرات",
    text: "Established in 1948 for refugees expelled from Lydda and Ramle. One of the eight refugee camps in central Gaza, home to over 85,000 people. The camp sits in the heart of the Gaza Strip and was one of the most intensively shelled areas in 2023–2024.",
    fact: "Established: 1948 · Population: 85,000 · Central Gaza Strip",
  },
  3: {
    title: "Khan Younis — خان يونس",
    text: "Founded in the 14th century by Mamluk emir Yunis Khan. Its caravanserai once hosted pilgrims traveling to Mecca. In 2024, Khan Younis became the site of major ground operations that displaced hundreds of thousands from their homes.",
    fact: "Founded: 14th century · Historic Mamluk fortress · Population: 340,000",
  },
  4: {
    title: "Rafah — رفح",
    text: "The southernmost city of Gaza, split by the 1979 Egypt–Israel peace treaty. Its crossing is the only gateway to the outside world not controlled by Israel. In early 2024, over one million displaced Palestinians sheltered here, only to face a ground offensive.",
    fact: "Border crossing: Egypt–Gaza · Pop. 2024: 1.4 million displaced · Last exit",
  },
};

export function getStageStories(charName: string, companions: string[]): Record<number, string[]> {
  const c0 = companions[0] ?? "Kareem";
  const c1 = companions[1] ?? "Mariam";
  const c2 = companions[2] ?? "Fatimah";
  return {
    0: [
      `${charName} walks with the fighters out of the rubble.`,
      "Jabalia camp is burning behind them.",
      "They carry nothing — only a sister's name.",
      '"Nour is in Rafah. We will reach her."',
      "Behind them: the ruins of Al-Fakhoura school.",
      "Families sheltered there. Now it is dust.",
      "STAGE 1 — ESCAPE JABALIA",
    ],
    1: [
      "Gaza City. Once a living, breathing heart.",
      "Now its streets are silence and dust.",
      "Al-Shifa hospital rises ahead — dark, powerless.",
      "Patients died when the electricity was cut.",
      `"Every Palestinian child carries a key," ${c0} says.`,
      "STAGE 2 — CROSS GAZA CITY",
    ],
    2: [
      "Nuseirat camp. A city inside a camp.",
      "85,000 people living in the heart of Gaza.",
      `${charName} recognises the smell of the market.`,
      "Their family used to come here on Fridays.",
      "The market is gone. The mosque is rubble.",
      `"Keep moving," ${c1} says. "Nour is waiting."`,
      "STAGE 3 — THROUGH NUSEIRAT",
    ],
    3: [
      "Khan Younis. Hundreds of thousands on the road.",
      `${charName} walks between ${c0} and ${c1}.`,
      "Together they move through the dust.",
      "The ancient fortress crumbles. Nasser hospital is dark.",
      `"Even the birds must escape," ${c2} whispers.`,
      "One more stop. Nour is close.",
      "STAGE 4 — THROUGH KHAN YOUNIS",
    ],
    4: [
      "Rafah. The border shimmers in the morning light.",
      "Over a million people have gathered here.",
      `${charName} runs ahead, scanning every face.`,
      "Then — a voice. Their name. Her voice.",
      `"${charName}!"`,
      "Nour is alive. But the crossing is blocked.",
      "Fight through. Together. Freedom is one step away.",
      "STAGE 5 — REACH RAFAH",
    ],
  };
}
