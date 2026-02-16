import { useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Object3D } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { createAsphaltTexture } from '../materials/asphalt'
import { createPathTileTexture, createWaterTexture } from '../materials/stylized'
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
        roughness: 0.9,
        metalness: 0.03,
      }
    case 'track':
      return {
        color: patch.materialVariant === 'alt' ? '#423751' : '#352f49',
        roughness: 0.94,
        metalness: 0.02,
      }
    case 'water':
      return {
        color: patch.materialVariant === 'alt' ? '#2f7293' : '#234e77',
        roughness: 0.28,
        metalness: 0.12,
      }
    case 'grass':
    default:
      return {
        color: patch.materialVariant === 'alt' ? '#9cae53' : '#8ea147',
        roughness: 0.99,
        metalness: 0.01,
      }
  }
}

export function LevelTerrain({ config, level, selectable, selectedPatchId, onSelectPatch, objectRefs }: LevelTerrainProps) {
  const patchGroupRefs = useRef<Record<string, Object3D | null>>({})
  const trackCurbRefs = useRef<Record<string, Object3D | null>>({})
  const asphaltTexture = useMemo(
    () => createAsphaltTexture({ seed: config.world.seed + 11, repeat: 46 }),
    [config.world.seed],
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

  useFrame(({ camera }) => {
    if (selectable) {
      return
    }

    const cullRadius = config.world.size * 0.74

    level.terrainPatches.forEach((patch) => {
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

    level.terrainPatches.forEach((patch) => {
      if (patch.kind !== 'track' || patch.shape !== 'plane') {
        return
      }
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

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[config.world.size, config.world.size, 1, 1]} />
        <meshStandardMaterial
          map={asphaltTexture ?? undefined}
          color={config.palette.baseGround}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {level.terrainPatches.map((patch) => {
        const materialProps = getPatchMaterialProps(patch, config)
        const map =
          patch.kind === 'path'
            ? pathTexture
            : patch.kind === 'track'
              ? trackTexture
              : patch.kind === 'water'
                ? waterTexture
              : undefined
        const showWaterAccent = !selectable && patch.kind === 'water' && patch.shape === 'circle' && patch.size[0] >= 4

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
              receiveShadow
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
                <circleGeometry args={[patch.size[0], 30]} />
              ) : (
                <planeGeometry args={[patch.size[0], patch.size[1], 1, 1]} />
              )}
              <meshStandardMaterial
                map={map ?? undefined}
                color={selectedPatchId === patch.id ? '#f6d39c' : materialProps.color}
                roughness={patch.kind === 'water' ? 0.4 : materialProps.roughness}
                metalness={patch.kind === 'water' ? 0.08 : materialProps.metalness}
                emissive={patch.kind === 'water' ? '#163558' : '#000000'}
                emissiveIntensity={patch.kind === 'water' ? 0.18 : 0}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>

            {showWaterAccent ? (
              <>
                <mesh
                  rotation={patch.rotation}
                  position={[patch.position[0], patch.position[1] + 0.0038, patch.position[2]]}
                >
                  <ringGeometry args={[patch.size[0] * 0.94, patch.size[0] * 1.02, 56]} />
                  <meshBasicMaterial color="#dff7ff" transparent opacity={0.26} depthWrite={false} />
                </mesh>
                <mesh rotation={patch.rotation} position={[patch.position[0], patch.position[1] + 0.0056, patch.position[2]]}>
                  <ringGeometry args={[patch.size[0] * 0.985, patch.size[0] * 1.005, 30, 1, 0.18, Math.PI * 0.58]} />
                  <meshBasicMaterial color="#fff8e8" transparent opacity={0.32} depthWrite={false} />
                </mesh>
              </>
            ) : null}
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
                      <mesh castShadow receiveShadow position={[x, 0.012, -sideZ]}>
                        <boxGeometry args={[segmentWidth * 0.94, 0.024, 1.4]} />
                        <meshStandardMaterial color={color} roughness={0.66} metalness={0.02} />
                      </mesh>
                      <mesh castShadow receiveShadow position={[x, 0.012, sideZ]}>
                        <boxGeometry args={[segmentWidth * 0.94, 0.024, 1.4]} />
                        <meshStandardMaterial color={color} roughness={0.66} metalness={0.02} />
                      </mesh>
                    </group>
                  )
                })}

                {[-12, 2, 16, 30].map((x, index) => (
                  <group key={`chevron-${patch.id}-${index}`} position={[x, 0.013, 3.8 - index * 1.1]}>
                    <mesh rotation={[0, Math.PI * 0.25, 0]}>
                      <boxGeometry args={[1.85, 0.018, 0.3]} />
                      <meshStandardMaterial color="#f4ebf4" roughness={0.44} metalness={0.02} />
                    </mesh>
                    <mesh position={[0, 0, -1.24]} rotation={[0, -Math.PI * 0.25, 0]}>
                      <boxGeometry args={[1.85, 0.018, 0.3]} />
                      <meshStandardMaterial color="#f4ebf4" roughness={0.44} metalness={0.02} />
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
