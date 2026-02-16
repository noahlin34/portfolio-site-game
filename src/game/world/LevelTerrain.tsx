import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { MutableRefObject } from 'react'
import type { Object3D } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { createAsphaltTexture } from '../materials/asphalt'
import { createPathTileTexture } from '../materials/stylized'
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
        color: patch.materialVariant === 'alt' ? '#2a6287' : '#244e77',
        roughness: 0.34,
        metalness: 0.08,
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

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
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
              : undefined

        return (
          <group key={patch.id}>
            <mesh
              ref={(node) => {
                if (!objectRefs) {
                  return
                }
                objectRefs.current[`terrain:${patch.id}`] = node
              }}
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
                roughness={materialProps.roughness}
                metalness={materialProps.metalness}
                emissive={patch.kind === 'water' ? '#1f3867' : '#000000'}
                emissiveIntensity={patch.kind === 'water' ? 0.12 : 0}
              />
            </mesh>

            {!selectable && patch.kind === 'water' ? (
              <>
                <mesh
                  rotation={patch.rotation}
                  position={[patch.position[0], patch.position[1] + 0.004, patch.position[2]]}
                  scale={[1.03, 1.03, 1.03]}
                >
                  {patch.shape === 'circle' ? (
                    <ringGeometry args={[patch.size[0] * 0.88, patch.size[0] * 1.04, 64]} />
                  ) : (
                    <planeGeometry args={[patch.size[0], patch.size[1], 1, 1]} />
                  )}
                  <meshBasicMaterial color="#74d9dc" transparent opacity={0.22} depthWrite={false} />
                </mesh>
                {patch.shape === 'circle' ? (
                  <mesh
                    rotation={patch.rotation}
                    position={[patch.position[0], patch.position[1] + 0.0062, patch.position[2]]}
                  >
                    <ringGeometry args={[patch.size[0] * 0.965, patch.size[0] * 1.015, 64]} />
                    <meshBasicMaterial color="#fff7df" transparent opacity={0.22} depthWrite={false} />
                  </mesh>
                ) : null}
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
              </group>
            )
          })
        : null}
    </RigidBody>
  )
}
