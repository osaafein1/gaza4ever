---
name: Gaza Forever game architecture
description: Key design decisions for the canvas beat-em-up RPG artifact
---

## Controls layout (as of shop refactor)
- Z/J = melee punch
- X/K = throw rock (replaced Spirit Blast)
- F = fire equipped shop weapon
- B = open/close weapon shop (auto-pauses)
- Space/W/ArrowUp = jump / double-jump
- C = switch character
- V = summon ally
- R = no longer fires rocket (only used on dead/win to navigate)

## Weapon shop system
- SHOP_WEAPONS in gameConstants.ts defines all buyable weapons (pistol/m16/grenade/machinegun/sniper/rocket)
- Coins tracked in GameState.coins + coinsRef in GamePage.tsx — persist across stages
- weaponInventoryRef + activeWeaponRef persist weapon state across stages
- Shop opens with B key → pauses game → click Buy/Equip/Close

## Coin economy
- patrol/soldier/armored/sniper_enemy/marksman/apc = 1 coin
- drone = 3 coins; tank/bulldozer = 5 coins; apache/warplane = 20 coins
- Awarded in onEnemyDie callback in GamePage.tsx

## Drone placement rule
- Drones ONLY in stage 1 (gaza-city) enemyTier — removed from all other stages

## Tank rockets
- Tanks and bulldozers fire "tank_rocket" projectiles horizontally every 240 frames
- 18-frame warning flash before traveling; player must jump to dodge
- Damage = 40; travels at vx=±9

## Projectile types
- rock: player throws, gravity, single hit
- bullet: from pistol/m16/machinegun, fast horizontal, single hit
- sniper_shot: from sniper, very fast, piercing
- grenade_player: from grenade weapon, gravity, AoE on impact
- rocket: from rocket launcher weapon, auto-aims, AoE
- tank_rocket: from tank/bulldozer, horizontal enemy projectile
- bomb: from drone, falls
- hellfire: from apache, tracks player

## Babel JSX quirk
Always use multi-line array/function format; never `]; }` on same line as array close.

## HUD layout
- HP bar (top-left)
- Rock cooldown bar (below HP)
- Coin counter
- Weapon slot (shows F:weapon ammo)
- Buff indicators (FAST/POWER/SHIELD)
- Score (top-right)
