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
        color: patch.materialVariant === 'alt' ? '#e4b17a' : config.palette.path,
        roughness: 0.88,
        metalness: 0.03,
      }
    case 'track':
      return {
        color: patch.materialVariant === 'alt' ? '#473c5a' : '#3d344f',
        roughness: 0.9,
        metalness: 0.03,
      }
    case 'water':
      return {
        color: patch.materialVariant === 'alt' ? '#74bfd4' : '#62bfd1',
        roughness: 0.28,
        metalness: 0.16,
      }
    case 'grass':
    default:
      return {
        color: patch.materialVariant === 'alt' ? '#96a950' : '#8ea147',
        roughness: 0.96,
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

        if (patch.shape === 'circle') {
          return (
            <CuboidCollider
              key={`collider-${patch.id}`}
              args={[patch.size[0], height, patch.size[0]]}
              position={[patch.position[0], patch.position[1] - height, patch.position[2]]}
              rotation={patch.rotation}
              friction={friction}
            />
          )
        }

        return (
          <CuboidCollider
            key={`collider-${patch.id}`}
            args={[patch.size[0] / 2, height, patch.size[1] / 2]}
            position={[patch.position[0], patch.position[1] - height, patch.position[2]]}
            rotation={patch.rotation}
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
          <mesh
            key={patch.id}
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
            />
          </mesh>
        )
      })}
    </RigidBody>
  )
}
