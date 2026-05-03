# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Gaza Forever (`artifacts/gaza-forever`)
- **Kind**: React + Vite web app (frontend only, no backend)
- **Preview path**: `/` (port 19294)
- **Description**: Canvas-based side-scrolling beat-em-up RPG — "Escape Gaza: Earth Defenders"
- **Tech**: React, Wouter routing, HTML Canvas 2D API, Press Start 2P + Noto Sans Arabic fonts
- **Game structure**:
  - `src/lib/gameConstants.ts` — all game data (characters, stages, enemies, collectibles)
  - `src/lib/gameTypes.ts` — TypeScript interfaces
  - `src/lib/gameLogic.ts` — `updateGame`, player/enemy logic, projectiles
  - `src/lib/bgRenderer.ts` — per-stage parallax background renderers
  - `src/lib/gameRenderer.ts` — canvas draw functions (player, enemies, HUD, particles)
  - `src/components/GazaMap.tsx` — SVG route map of Gaza strip
  - `src/pages/MenuPage.tsx` — character + stage select screen
  - `src/pages/GamePage.tsx` — game loop, phase management, input handling
- **Gameplay**: 4 characters (Ahmed, Kareem, Mariam, Samir), 4 stages (Jabalia → Gaza City → Khan Younis → Rafah), wave-based enemies + boss per stage, story screens with historical context
