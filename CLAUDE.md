# QR Maze Race — CLAUDE.md

## Project Overview
A 3D multiplayer maze racing game. Players scan or generate a QR code that seeds a deterministic maze, then race through it — either solo vs an AI enemy or head-to-head against a human opponent in a shared room.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| UI | React 18 + Tailwind CSS 3 |
| 3D Engine | Three.js via @react-three/fiber + @react-three/drei |
| QR Generate | qrcode.js |
| QR Decode | jsQR |
| Maze Logic | Recursive Backtracker, Mulberry32 seeded RNG |
| Enemy AI | A* pathfinding |
| Database | Convex (real-time sync) |
| Build | Vite 8 + TypeScript |

## Dev Commands
```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build → dist/
npx convex dev       # Convex backend (requires CONVEX_DEPLOYMENT env var)
```

## Project Structure
```
src/
  components/
    ThreeScene.tsx       — R3F canvas: maze walls, player/enemy/guest cubes, floor
    MazeGame.tsx         — Solo vs AI wrapper (useGameLoop hook + ThreeScene + HUD)
    MultiplayerGame.tsx  — Human vs human race (in-memory sync → Convex mutations)
    MultiplayerLobby.tsx — Create room / join by 6-digit code flow
    QRScanner.tsx        — Generate random QR or upload image to decode
    HUD.tsx              — Timer, distance, mobile D-pad
    VictoryScreen.tsx    — Win/loss overlay with particle burst
    Leaderboard.tsx      — Top scores table

  hooks/
    useGameLoop.ts       — Solo game loop: player movement, A* enemy AI tick, keyboard
    useMaze.ts           — Convenience wrapper around generateMaze + serializeMaze

  lib/
    mazeGenerator.ts     — Recursive Backtracker → Cell[][] grid with N/S/E/W walls
    pathfinding.ts       — A* over the maze grid (used by enemy AI)
    qrUtils.ts           — QR generation (qrcode.js), decoding (jsQR), room codes
    seedRandom.ts        — Mulberry32 PRNG + FNV-style string hash

convex/
  schema.ts              — players, gameRooms, leaderboard tables
  players.ts             — getOrCreate, recordWin, recordLoss
  gameRooms.ts           — create, join, updateHostPos, updateGuestPos, finish*
  leaderboard.ts         — submit, getTop, getByPlayer
```

## Convex Schema
```
players        — username, totalWins, totalLosses, bestTime
gameRooms      — roomCode (6-digit), qrData, mazeData, hostId/guestId,
                 hostPos/guestPos, hostFinished/guestFinished, status, winnerId
leaderboard    — playerId, username, mazeId, completionTime, difficulty, score
```

## Game Modes

### Solo vs AI
- Player: gold cube, starts at (0,0)
- Enemy: red cube, starts at (width-1, height-1), uses A* to hunt the player
- Enemy speed: easy=700ms/step · medium=400ms · hard=200ms
- Win: reach exit before enemy catches you

### Human vs Human (Multiplayer)
1. Player 1 clicks "Create Room" → generates QR → maze seeded from QR data
2. 6-digit room code displayed + a QR of the room code itself
3. Player 2 enters room code → joins
4. 3-2-1 countdown → both race the same maze
5. First to (width-1, height-1) wins; times shown for both players
6. **In-memory bus** used for local/demo; swap `raceState` with Convex mutations for production

## Maze Algorithm
Recursive Backtracker starting from a random cell (seeded).
Same QR string → same maze every time (deterministic via Mulberry32 PRNG).
Default size: 15×15. Walls stored as `{ N, S, E, W: boolean }` per cell.

## Three.js Scene
- CELL = 2 world units per cell
- Walls: dark blue `meshStandardMaterial` with cyan emissive glow
- Player: gold emissive box (floating bob animation)
- Guest: cyan emissive box
- Enemy: red emissive box
- Exit: spinning gold box + green floor disc
- Camera: isometric-ish top-down, OrbitControls enabled

## Scoring Formula
```
score = max(0, (10000 - floor(timeMs/1000)*10) * multiplier)
multiplier: easy=1, medium=2, hard=3
```

## Connecting Convex in Production
1. `npx convex dev` — creates deployment, sets CONVEX_URL
2. Wrap `<App />` with `<ConvexProvider client={convex}>` in `main.tsx`
3. Replace in-memory `rooms` / `raceState` objects with Convex mutations:
   - `gameRooms.create` / `gameRooms.join`
   - `gameRooms.updateHostPos` / `gameRooms.updateGuestPos`
   - `gameRooms.finishHost` / `gameRooms.finishGuest`
4. Subscribe to `gameRooms.getById` for real-time opponent position

## Key Design Decisions
- **Offline-first**: multiplayer works without Convex via in-memory shared objects — swappable with Convex mutations with zero game-logic changes.
- **Deterministic mazes**: same QR string always produces the same maze, so both players get identical layouts without transmitting the full grid at join time.
- **R3F over raw Three.js**: cleaner React lifecycle integration, automatic disposal, and easier animation via `useFrame`.
- **Mulberry32 over Math.random()**: reproducible, seedable, no external dependency.
