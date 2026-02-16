# AGENTS.md

Operational guidance for coding agents working in `portfolio-site-game`.

This file is intentionally strict. Follow it to avoid regressions and repeated no-op bug-fix loops.

## 1. Project Mission

Build and maintain a stylized isometric driving sandbox with:
- R3F + Three.js rendering
- Rapier vehicle/object physics
- A dev-only in-browser level editor at `/editor`
- Persistent level data in `src/game/level/level.json`

Primary outcomes:
- Car remains drivable and stable
- Terrain/render/collider alignment stays correct
- Editor changes persist reliably
- Visual style remains consistent (stylized golden-hour look)

## 2. Non-Negotiable Workflow

1. Reproduce before fixing.
2. Form a concrete hypothesis tied to exact files/functions.
3. Make minimal, targeted change.
4. Validate with required checks (Section 8).
5. Commit intentionally and frequently.
6. Push after grouped checkpoints unless user asks otherwise.

Do not ship speculative fixes that are not validated.

## 3. Repo Map (Current Runtime Truth)

### App entry and routing
- `src/App.tsx`
  - `/` = driving scene
  - `/editor` = level editor

### Runtime scene
- `src/game/DrivingScene.tsx`
- `src/game/world/EnvironmentScene.tsx`
- `src/game/world/LevelTerrain.tsx`
- `src/game/world/LevelEntities.tsx`
- `src/game/vehicle/VehiclePhysicsController.tsx`
- `src/game/vehicle/VehicleVisual.tsx`
- `src/game/config/artDirection.ts`

### Level data + persistence
- `src/game/level/schema.ts`
- `src/game/level/level.json`
- `src/game/level/defaultLevel.ts`
- `src/game/level/levelStore.ts`
- `vite.config.ts` (`/__editor/level` dev API)

### Editor
- `src/editor/EditorApp.tsx`
- `src/editor/EditorViewport.tsx`

### Legacy components (not primary runtime path)
- `src/game/world/Terrain.tsx`, `Props.tsx`, `Foliage.tsx`, `PushableObjects.tsx`

Do not assume legacy files affect current runtime unless they are wired back in.

## 4. Commands

Install:
```bash
npm install
```

Dev:
```bash
npm run dev
```

Validate (required before finalizing):
```bash
npm run lint
npm run build
```

## 5. Coding Standards for This Repo

- TypeScript strict mode is active. Keep types explicit at interfaces/boundaries.
- Keep changes localized. Avoid broad refactors unless requested.
- Prefer data-driven changes via `LevelData` over hardcoded scene edits.
- Preserve stylized art direction and existing camera/gameplay defaults unless task requires changes.
- Avoid adding new dependencies without clear need.

## 6. Known Failure Modes and Guardrails

These caused real regressions. Treat them as hard constraints.

### A) “Floating sheets” / terrain appears in sky
Cause pattern:
- Rotating ground planes on wrong axis.

Guardrail:
- Ground plane visual meshes should use:
  - `rotation={[-Math.PI / 2, 0, yawZ]}` for heading
- Do not rotate these via Y when using a `-PI/2` X-tilt plane convention.

### B) Car becomes undriveable after terrain edits
Cause pattern:
- Colliders inheriting full visual plane rotation including `-PI/2`.

Guardrail:
- In `LevelTerrain`, collider rotation must be ground-yaw only:
  - `colliderRotation = [0, patch.rotation[2], 0]`
- Collider `args` are half-extents for cuboids.

### C) “Fixes” that do nothing for sinking/clipping
Cause pattern:
- Tweaking visual offsets without validating colliders.
- Chasing render artifacts while physics remains unchanged.

Guardrail:
- Always check both:
  - visual transform
  - collider transform/shape/friction
- For physics issues, validate with actual drive test path and object contact.

### D) Editor cannot pan
Cause pattern:
- Paint layer capturing all pointer buttons.

Guardrail:
- Left click = paint/place only.
- Right drag = pan.
- OrbitControls mappings must explicitly define mouse buttons.

### E) Data loss / save appears broken
Cause pattern:
- Assuming production build can write files.

Guardrail:
- Saving to disk works only through Vite dev middleware (`apply: 'serve'`).
- `/__editor/level` is dev-only.
- Keep schema validation (`isLevelData`) in write path.

## 7. Loop-Breaker Protocol (Prevent No-Op Fix Cycles)

If a bug survives one fix attempt, do this before a second attempt:

1. Reproduce and record exact behavior in one sentence.
2. Identify exact runtime code path and prove it is active.
3. Inspect both visual and physics representations (if spatial bug).
4. State one falsifiable hypothesis.
5. Make one change that directly tests that hypothesis.
6. Re-run validation and re-test reproduction.

If bug survives two attempts:
- Stop doing micro-tweaks.
- Do a root-cause pass with file-level reasoning and a short diagnostic matrix:
  - render transform
  - collider transform
  - collider shape/extents
  - body type/damping/ccd
  - input mapping/control capture

Do not continue with “maybe this helps” patches.

## 8. Required Validation Checklist

Before final handoff, run:
- `npm run lint`
- `npm run build`

Manual checks for scene/editor changes:

### Gameplay checks (`/`)
- Car can accelerate, brake, steer, and recover from contact.
- Car does not instantly lose driveability on terrain patches.
- Pushables still collide and move plausibly.

### Editor checks (`/editor`)
- Left-click paint places selected item.
- Right-drag pans camera.
- Selection + transform gizmo updates level data.
- Save writes to `src/game/level/level.json` in dev.
- Revert reloads from disk.

When fixing physics/render bugs, include a note of exact scenario tested.

## 9. Editing and Data Rules

### `LevelData` is source of truth
- Add/edit terrain/entities in `src/game/level/level.json` or via editor save.
- Keep schema-compatible shape.

### Terrain patch conventions
- `position`, `rotation`, `size` drive visuals.
- Collider enabled via `patch.collider.enabled`.
- Friction defaults to `1.3` if omitted.

### Entity conventions
- `family: 'prop' | 'pushable' | 'foliage'`
- Pushables should include `physics` block.
- Keep IDs stable and unique.

## 10. Commit Policy for This Project

- Commit frequently and intentionally.
- Prefer scoped commits with clear intent:
  - `fix: ...`
  - `feat: ...`
  - `refactor: ...`
  - `docs: ...`
- If doing multi-step work, commit at each verified checkpoint.
- Don’t bundle unrelated changes.

## 11. Bug Report Response Template (Use Internally)

When user reports a bug, structure work like this:

1. **Reproduction**: exact observed behavior.
2. **Suspected root cause**: file + mechanism.
3. **Patch**: minimal targeted fix.
4. **Validation**: lint/build + manual scenario.
5. **Residual risk**: what still might fail and where.

## 12. Practical Do/Don’t

Do:
- Verify that modified file is actually used by runtime route.
- Keep camera/physics/editor controls explicit and deterministic.
- Preserve existing style palette/lighting direction unless asked.

Don’t:
- Reintroduce giant transparent overlay planes for terrain blending.
- Apply full plane rotation directly to physics colliders.
- Capture all mouse buttons on editor paint surface.
- Claim fixes without a reproduction-based retest.

## 13. Current Baseline Expectations (as of latest commits)

- `/` is playable with stable drive controls.
- `/editor` supports placement, selection, transforms, and persistence.
- Terrain colliders use yaw extracted from patch Z-rotation.
- Right-drag panning works in editor.

If any of these regress, treat as high-priority and run the loop-breaker protocol.
