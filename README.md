# Stylized Isometric Driving Sandbox

A stylized Three.js driving game prototype built with Vite + React + TypeScript, using React Three Fiber for rendering and Rapier for physics.

## Features

- Locked isometric camera with smooth follow
- Front-wheel steering vehicle model (bicycle/Ackermann-style behavior)
- Pushable dynamic world objects via Rapier physics
- Dev-only in-browser level editor (`/editor`) with paint placement and transform gizmos
- Persistent level saves to `src/game/level/level.json` through a Vite dev API
- Golden-hour stylized lighting and soft dynamic shadows
- Layered stylized world composition:
  - tiled paths
  - water edge
  - dense grass/trees/bushes
  - decorative props and glow effects
- Postprocessing pass (bloom + vignette)

## Controls

- `W` / `ArrowUp`: accelerate
- `S` / `ArrowDown`: reverse
- `A` / `ArrowLeft`: steer left
- `D` / `ArrowRight`: steer right
- `Space`: brake

## Level Editor

- Open `http://localhost:5173/editor`
- Use left panel to pick terrain/entities and paint them into the scene
- Select objects to move/rotate/scale with gizmos
- Save writes directly to `src/game/level/level.json` (dev server only)
- Use Export/Import for quick snapshots and backups

## Project Structure

- `src/game/config/artDirection.ts`: centralized art direction + gameplay tuning
- `src/game/level/*`: canonical level schema, prefab catalog, and persisted level data
- `src/game/world/*`: data-driven terrain/entity rendering, effects, lighting composition
- `src/game/vehicle/*`: vehicle visuals + physics controller
- `src/game/materials/*`: procedural texture/material generators
- `src/editor/*`: in-browser editor route, viewport, and tooling UI

## Tech Stack

- `vite` `7.3.1`
- `three` `0.182.0`
- `@react-three/fiber` `9.5.0`
- `@react-three/rapier` `2.2.0`
- `@react-three/drei` `10.7.7`
- `@react-three/postprocessing` `3.0.4`
- `postprocessing` `6.38.2`
- `react` / `react-dom` `19.2.4`
- `typescript` `5.9.3`

Versions above were validated with `npm view` on February 16, 2026.

## Run Locally

```bash
npm install
npm run dev
```

## Build and Lint

```bash
npm run lint
npm run build
```

## Reference Docs

- Vite: https://vite.dev/guide/
- Three.js docs: https://threejs.org/docs/
- Three.js shadows manual: https://threejs.org/manual/#en/shadows
- React Three Fiber docs: https://r3f.docs.pmnd.rs/getting-started/introduction
- React Three Rapier docs: https://pmndrs.github.io/react-three-rapier/
- Rapier JS guide: https://rapier.rs/docs/user_guides/javascript/
