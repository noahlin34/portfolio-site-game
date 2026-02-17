import { useLayoutEffect, useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh, type Object3D } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { createAsphaltTexture } from '../materials/asphalt'
import { createGroundBounceCompiler, createGroundBounceProgramKey } from '../materials/fakeLighting'
import { createGroundGradientTexture, createPathTileTexture, createWaterTexture } from '../materials/stylized'
import type { LevelData, TerrainPatch } from '../level/schema'

interface LevelTerrainProps {
  config: ArtDirectionConfig
  level: LevelData
  selectable?: boolean
  selectedPatchId?: string | null
  onSelectPatch?: (patchId: string) => void
  objectRefs?: MutableRefObject<Record<string, Object3D | null>>
}

const getPatchMaterialProps = (patch: TerrainPatch, config: ArtDirectionConfig) => {
  switch (patch.kind) {
    case 'path':
      return {
        color: patch.materialVariant === 'alt' ? '#e7b177' : config.palette.path,
      }
    case 'track':
      return {
        color: patch.materialVariant === 'alt' ? '#423751' : '#352f49',
      }
    case 'water':
      return {
        color: patch.materialVariant === 'alt' ? '#5ca5b4' : '#4f98a8',
      }
    case 'grass':
    default:
      return {
        color: patch.materialVariant === 'alt' ? '#9cae53' : '#8ea147',
      }
  }
}

const matrixPosition = new Vector3()
const matrixScale = new Vector3()
const matrixQuaternion = new Quaternion()
const matrixEuler = new Euler()
const matrixCompose = new Matrix4()

const applyPatchMatrices = (
  mesh: InstancedMesh | null,
  patches: TerrainPatch[],
  yOffset: number,
  scaleMultiplier = 1,
) => {
  if (!mesh) {
    return
  }

  patches.forEach((patch, index) => {
    matrixPosition.set(patch.position[0], patch.position[1] + yOffset, patch.position[2])
    matrixEuler.set(patch.rotation[0], patch.rotation[1], patch.rotation[2])
    matrixQuaternion.setFromEuler(matrixEuler)
    if (patch.shape === 'circle') {
      matrixScale.set(patch.size[0] * scaleMultiplier, patch.size[0] * scaleMultiplier, 1)
    } else {
      matrixScale.set(patch.size[0] * scaleMultiplier, patch.size[1] * scaleMultiplier, 1)
    }
    matrixCompose.compose(matrixPosition, matrixQuaternion, matrixScale)
    mesh.setMatrixAt(index, matrixCompose)
  })

  mesh.instanceMatrix.needsUpdate = true
}

export function LevelTerrain({ config, level, selectable, selectedPatchId, onSelectPatch, objectRefs }: LevelTerrainProps) {
  const patchGroupRefs = useRef<Record<string, Object3D | null>>({})
  const trackCurbRefs = useRef<Record<string, Object3D | null>>({})
  const cullTimerRef = useRef(0)
  const waterPlaneDefaultRef = useRef<InstancedMesh>(null)
  const waterPlaneAltRef = useRef<InstancedMesh>(null)
  const waterCircleDefaultRef = useRef<InstancedMesh>(null)
  const waterCircleAltRef = useRef<InstancedMesh>(null)
  const waterDepthRef = useRef<InstancedMesh>(null)
  const waterShoreRef = useRef<InstancedMesh>(null)
  const waterFoamRefA = useRef<InstancedMesh>(null)
  const waterFoamRefB = useRef<InstancedMesh>(null)
  const waterAccentOuterRef = useRef<InstancedMesh>(null)
  const waterAccentInnerRef = useRef<InstancedMesh>(null)
  const groundGradientTexture = useMemo(
    () =>
      createGroundGradientTexture({
        topLeft: '#f3bb7f',
        topRight: '#dd9f66',
        bottomLeft: '#bc824d',
        bottomRight: '#9d673e',
      }),
    [],
  )
  const trackTexture = useMemo(
    () => createAsphaltTexture({ seed: config.world.seed + 31, repeat: 24 }),
    [config.world.seed],
  )
  const pathTexture = useMemo(
    () => createPathTileTexture({ seed: config.world.seed + 21, repeat: 20 }),
    [config.world.seed],
  )
  const waterTexture = useMemo(
    () => createWaterTexture({ seed: config.world.seed + 17, repeat: 12 }),
    [config.world.seed],
  )
  const terrainRenderPatches = useMemo(
    () => (selectable ? level.terrainPatches : level.terrainPatches.filter((patch) => patch.kind !== 'water')),
    [level.terrainPatches, selectable],
  )
  const waterPatches = useMemo(
    () => (selectable ? [] : level.terrainPatches.filter((patch) => patch.kind === 'water')),
    [level.terrainPatches, selectable],
  )
  const waterPlaneDefaultPatches = useMemo(
    () => waterPatches.filter((patch) => patch.shape === 'plane' && (patch.materialVariant ?? 'default') === 'default'),
    [waterPatches],
  )
  const waterPlaneAltPatches = useMemo(
    () => waterPatches.filter((patch) => patch.shape === 'plane' && patch.materialVariant === 'alt'),
    [waterPatches],
  )
  const waterCircleDefaultPatches = useMemo(
    () => waterPatches.filter((patch) => patch.shape === 'circle' && (patch.materialVariant ?? 'default') === 'default'),
    [waterPatches],
  )
  const waterCircleAltPatches = useMemo(
    () => waterPatches.filter((patch) => patch.shape === 'circle' && patch.materialVariant === 'alt'),
    [waterPatches],
  )
  const waterCirclePatches = useMemo(
    () => waterPatches.filter((patch) => patch.shape === 'circle'),
    [waterPatches],
  )
  const waterAccentPatches = useMemo(
    () => waterPatches.filter((patch) => patch.shape === 'circle' && patch.size[0] >= 4),
    [waterPatches],
  )
  const trackPlanePatches = useMemo(
    () => level.terrainPatches.filter((patch) => patch.kind === 'track' && patch.shape === 'plane'),
    [level.terrainPatches],
  )
  const terrainGroundBounce = useMemo(
    () => createGroundBounceCompiler({ color: [1, 0.5, 0.24], intensity: 0.2, maxHeight: 3.4 }),
    [],
  )
  const terrainGroundBounceKey = useMemo(
    () => createGroundBounceProgramKey({ color: [1, 0.5, 0.24], intensity: 0.2, maxHeight: 3.4 }),
    [],
  )

  useLayoutEffect(() => {
    if (selectable) {
      return
    }
    applyPatchMatrices(waterPlaneDefaultRef.current, waterPlaneDefaultPatches, 0)
    applyPatchMatrices(waterPlaneAltRef.current, waterPlaneAltPatches, 0)
    applyPatchMatrices(waterCircleDefaultRef.current, waterCircleDefaultPatches, 0)
    applyPatchMatrices(waterCircleAltRef.current, waterCircleAltPatches, 0)
    applyPatchMatrices(waterDepthRef.current, waterCirclePatches, 0.0015, 0.72)
    applyPatchMatrices(waterShoreRef.current, waterCirclePatches, 0.0045, 1.06)
    applyPatchMatrices(waterFoamRefA.current, waterCirclePatches, 0.006, 1.02)
    applyPatchMatrices(waterFoamRefB.current, waterCirclePatches, 0.0062, 0.98)
    applyPatchMatrices(waterAccentOuterRef.current, waterAccentPatches, 0.0038)
    applyPatchMatrices(waterAccentInnerRef.current, waterAccentPatches, 0.0056)
  }, [
    selectable,
    waterPlaneDefaultPatches,
    waterPlaneAltPatches,
    waterCircleDefaultPatches,
    waterCircleAltPatches,
    waterCirclePatches,
    waterAccentPatches,
  ])

  useFrame(({ camera }, delta) => {
    if (selectable) {
      return
    }
    cullTimerRef.current += delta
    if (cullTimerRef.current < 1 / 12) {
      return
    }
    cullTimerRef.current = 0

    const cullRadius = config.world.size * 0.74

    terrainRenderPatches.forEach((patch) => {
      const group = patchGroupRefs.current[patch.id]
      if (!group) {
        return
      }
      const extent = patch.shape === 'circle' ? patch.size[0] : Math.max(patch.size[0], patch.size[1]) * 0.5
      const dx = patch.position[0] - camera.position.x
      const dz = patch.position[2] - camera.position.z
      const threshold = cullRadius + extent
      group.visible = dx * dx + dz * dz < threshold * threshold
    })

    trackPlanePatches.forEach((patch) => {
      const curbs = trackCurbRefs.current[patch.id]
      if (!curbs) {
        return
      }
      const extent = Math.max(patch.size[0], patch.size[1]) * 0.6
      const dx = patch.position[0] - camera.position.x
      const dz = patch.position[2] - camera.position.z
      const threshold = cullRadius + extent
      curbs.visible = dx * dx + dz * dz < threshold * threshold
    })
  })

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[config.world.size / 2, 3, config.world.size / 2]} position={[0, -3, 0]} friction={1.3} />

      {level.terrainPatches.map((patch) => {
        if (!patch.collider.enabled) {
          return null
        }

        const friction = patch.collider.friction ?? 1.3
        const height = 0.16
        const colliderRotation: [number, number, number] = [0, patch.rotation[2], 0]

        if (patch.shape === 'circle') {
          return (
            <CuboidCollider
              key={`collider-${patch.id}`}
              args={[patch.size[0], height, patch.size[0]]}
              position={[patch.position[0], patch.position[1] - height, patch.position[2]]}
              rotation={colliderRotation}
              friction={friction}
            />
          )
        }

        return (
          <CuboidCollider
            key={`collider-${patch.id}`}
            args={[patch.size[0] / 2, height, patch.size[1] / 2]}
            position={[patch.position[0], patch.position[1] - height, patch.position[2]]}
            rotation={colliderRotation}
            friction={friction}
          />
        )
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[config.world.size, config.world.size, 1, 1]} />
        <meshBasicMaterial map={groundGradientTexture ?? undefined} color={config.palette.baseGround} />
      </mesh>

      {!selectable ? (
        <>
          {waterPlaneDefaultPatches.length > 0 ? (
            <instancedMesh ref={waterPlaneDefaultRef} args={[undefined, undefined, waterPlaneDefaultPatches.length]} renderOrder={2}>
              <planeGeometry args={[1, 1, 1, 1]} />
              <meshLambertMaterial
                map={waterTexture ?? undefined}
                color="#4f98a8"
                emissive="#2f6f80"
                emissiveIntensity={0.12}
                onBeforeCompile={terrainGroundBounce}
                customProgramCacheKey={() => terrainGroundBounceKey}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </instancedMesh>
          ) : null}

          {waterPlaneAltPatches.length > 0 ? (
            <instancedMesh ref={waterPlaneAltRef} args={[undefined, undefined, waterPlaneAltPatches.length]} renderOrder={2}>
              <planeGeometry args={[1, 1, 1, 1]} />
              <meshLambertMaterial
                map={waterTexture ?? undefined}
                color="#5ca5b4"
                emissive="#327385"
                emissiveIntensity={0.12}
                onBeforeCompile={terrainGroundBounce}
                customProgramCacheKey={() => terrainGroundBounceKey}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </instancedMesh>
          ) : null}

          {waterCircleDefaultPatches.length > 0 ? (
            <instancedMesh ref={waterCircleDefaultRef} args={[undefined, undefined, waterCircleDefaultPatches.length]} renderOrder={2}>
              <circleGeometry args={[1, 18]} />
              <meshLambertMaterial
                map={waterTexture ?? undefined}
                color="#4f98a8"
                emissive="#2f6f80"
                emissiveIntensity={0.12}
                onBeforeCompile={terrainGroundBounce}
                customProgramCacheKey={() => terrainGroundBounceKey}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </instancedMesh>
          ) : null}

          {waterCircleAltPatches.length > 0 ? (
            <instancedMesh ref={waterCircleAltRef} args={[undefined, undefined, waterCircleAltPatches.length]} renderOrder={2}>
              <circleGeometry args={[1, 18]} />
              <meshLambertMaterial
                map={waterTexture ?? undefined}
                color="#5ca5b4"
                emissive="#327385"
                emissiveIntensity={0.12}
                onBeforeCompile={terrainGroundBounce}
                customProgramCacheKey={() => terrainGroundBounceKey}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </instancedMesh>
          ) : null}

          {waterCirclePatches.length > 0 ? (
            <>
              <instancedMesh ref={waterDepthRef} args={[undefined, undefined, waterCirclePatches.length]} renderOrder={2}>
                <circleGeometry args={[1, 18]} />
                <meshBasicMaterial color="#143e66" transparent opacity={0.52} depthWrite={false} />
              </instancedMesh>
              <instancedMesh ref={waterShoreRef} args={[undefined, undefined, waterCirclePatches.length]} renderOrder={3}>
                <ringGeometry args={[0.78, 1.08, 22]} />
                <meshBasicMaterial color="#89d7d3" transparent opacity={0.22} depthWrite={false} />
              </instancedMesh>
              <instancedMesh ref={waterFoamRefA} args={[undefined, undefined, waterCirclePatches.length]} renderOrder={3}>
                <ringGeometry args={[0.985, 1.01, 22, 1, 0.12, Math.PI * 0.52]} />
                <meshBasicMaterial color="#fff8f4" transparent opacity={0.68} depthWrite={false} />
              </instancedMesh>
              <instancedMesh ref={waterFoamRefB} args={[undefined, undefined, waterCirclePatches.length]} renderOrder={3}>
                <ringGeometry args={[0.972, 1.0, 20, 1, Math.PI * 1.14, Math.PI * 0.42]} />
                <meshBasicMaterial color="#edf9fc" transparent opacity={0.44} depthWrite={false} />
              </instancedMesh>
            </>
          ) : null}

          {waterAccentPatches.length > 0 ? (
            <>
              <instancedMesh ref={waterAccentOuterRef} args={[undefined, undefined, waterAccentPatches.length]}>
                <ringGeometry args={[0.94, 1.02, 28]} />
                <meshBasicMaterial color="#e9fbff" transparent opacity={0.22} depthWrite={false} />
              </instancedMesh>
              <instancedMesh ref={waterAccentInnerRef} args={[undefined, undefined, waterAccentPatches.length]}>
                <ringGeometry args={[0.985, 1.005, 18, 1, 0.18, Math.PI * 0.58]} />
                <meshBasicMaterial color="#fff8e8" transparent opacity={0.28} depthWrite={false} />
              </instancedMesh>
            </>
          ) : null}
        </>
      ) : null}

      {terrainRenderPatches.map((patch) => {
        const materialProps = getPatchMaterialProps(patch, config)
        const map =
          patch.kind === 'path'
            ? pathTexture
            : patch.kind === 'track'
              ? trackTexture
              : undefined

        return (
          <group
            key={patch.id}
            ref={(node) => {
              patchGroupRefs.current[patch.id] = node
            }}
          >
            <mesh
              ref={(node) => {
                if (!objectRefs) {
                  return
                }
                objectRefs.current[`terrain:${patch.id}`] = node
              }}
              renderOrder={2}
              rotation={patch.rotation}
              position={patch.position}
              scale={[1, 1, 1]}
              onPointerDown={(event) => {
                if (!selectable || !onSelectPatch) {
                  return
                }
                event.stopPropagation()
                onSelectPatch(patch.id)
              }}
            >
              {patch.shape === 'circle' ? (
                <circleGeometry args={[patch.size[0], 20]} />
              ) : (
                <planeGeometry args={[patch.size[0], patch.size[1], 1, 1]} />
              )}
              <meshLambertMaterial
                map={map ?? undefined}
                color={selectedPatchId === patch.id ? '#f6d39c' : materialProps.color}
                emissive={patch.kind === 'water' ? '#163558' : '#000000'}
                emissiveIntensity={patch.kind === 'water' ? 0.18 : 0}
                onBeforeCompile={terrainGroundBounce}
                customProgramCacheKey={() => terrainGroundBounceKey}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </group>
        )
      })}

      {!selectable
        ? level.terrainPatches.map((patch) => {
            if (patch.kind !== 'track' || patch.shape !== 'plane') {
              return null
            }

            const segmentCount = Math.max(14, Math.round(patch.size[0] / 3.3))
            const segmentWidth = patch.size[0] / segmentCount
            const sideZ = patch.size[1] * 0.5

            return (
              <group
                key={`track-curbs-${patch.id}`}
                ref={(node) => {
                  trackCurbRefs.current[patch.id] = node
                }}
                position={[patch.position[0], 0, patch.position[2]]}
                rotation={[0, patch.rotation[2], 0]}
              >
                {Array.from({ length: segmentCount }, (_, index) => {
                  const x = -patch.size[0] * 0.5 + segmentWidth * (index + 0.5)
                  const color = index % 2 === 0 ? '#de4d36' : '#f6e5e3'
                  return (
                    <group key={`curb-segment-${patch.id}-${index}`}>
                      <mesh position={[x, 0.012, -sideZ]}>
                        <boxGeometry args={[segmentWidth * 0.94, 0.024, 1.4]} />
                        <meshLambertMaterial
                          color={color}
                          onBeforeCompile={terrainGroundBounce}
                          customProgramCacheKey={() => terrainGroundBounceKey}
                        />
                      </mesh>
                      <mesh position={[x, 0.012, sideZ]}>
                        <boxGeometry args={[segmentWidth * 0.94, 0.024, 1.4]} />
                        <meshLambertMaterial
                          color={color}
                          onBeforeCompile={terrainGroundBounce}
                          customProgramCacheKey={() => terrainGroundBounceKey}
                        />
                      </mesh>
                    </group>
                  )
                })}

                {[-12, 2, 16, 30].map((x, index) => (
                  <group key={`chevron-${patch.id}-${index}`} position={[x, 0.013, 3.8 - index * 1.1]}>
                    <mesh rotation={[0, Math.PI * 0.25, 0]}>
                      <boxGeometry args={[1.85, 0.018, 0.3]} />
                      <meshLambertMaterial
                        color="#f4ebf4"
                        onBeforeCompile={terrainGroundBounce}
                        customProgramCacheKey={() => terrainGroundBounceKey}
                      />
                    </mesh>
                    <mesh position={[0, 0, -1.24]} rotation={[0, -Math.PI * 0.25, 0]}>
                      <boxGeometry args={[1.85, 0.018, 0.3]} />
                      <meshLambertMaterial
                        color="#f4ebf4"
                        onBeforeCompile={terrainGroundBounce}
                        customProgramCacheKey={() => terrainGroundBounceKey}
                      />
                    </mesh>
                  </group>
                ))}
              </group>
            )
          })
        : null}
    </RigidBody>
  )
}
