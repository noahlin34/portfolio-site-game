# R3F Driving Sandbox

A Three.js game prototype built with Vite + React + TypeScript, using React Three Fiber for rendering and Rapier for physics.

## Features

- Drivable car rigid body with keyboard controls
- Dynamic obstacles the car can bump and push around with physics
- Real-time shadows from directional light
- Custom animated GLSL shader material on the ground
- Third-person follow camera with smoothing

## Controls

- `W` / `ArrowUp`: accelerate
- `S` / `ArrowDown`: reverse
- `A` / `ArrowLeft`: steer left
- `D` / `ArrowRight`: steer right
- `Space`: brake

## Tech Stack

- `vite` `7.3.1`
- `three` `0.182.0`
- `@react-three/fiber` `9.5.0`
- `@react-three/rapier` `2.2.0`
- `@react-three/drei` `10.7.7`
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
