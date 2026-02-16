import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { createAsphaltTexture } from '../materials/asphalt'
import { createPathTileTexture } from '../materials/stylized'
import type { ArtDirectionConfig } from '../config/artDirection'

interface TerrainProps {
  config: ArtDirectionConfig
}

const grassIslands = [
  { position: [-38, 0.03, 26], size: [35, 26], rotation: 0.22, color: '#95a14b' },
  { position: [36, 0.03, -28], size: [40, 28], rotation: -0.28, color: '#97a54c' },
  { position: [-44, 0.03, -36], size: [31, 24], rotation: -0.45, color: '#8d9a44' },
  { position: [52, 0.03, 38], size: [28, 24], rotation: 0.35, color: '#8ea147' },
]

export function Terrain({ config }: TerrainProps) {
  const asphaltTexture = useMemo(
    () => createAsphaltTexture({ seed: config.world.seed + 11, repeat: 46 }),
    [config.world.seed],
  )
  const pathTexture = useMemo(
    () => createPathTileTexture({ seed: config.world.seed + 21, repeat: 20 }),
    [config.world.seed],
  )

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[config.world.size / 2, 0.35, config.world.size / 2]} friction={1.3} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[config.world.size, config.world.size, 1, 1]} />
        <meshStandardMaterial
          map={asphaltTexture ?? undefined}
          color={config.palette.baseGround}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0.14, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[144, 14.2, 1, 1]} />
        <meshStandardMaterial map={pathTexture ?? undefined} color={config.palette.path} roughness={0.88} metalness={0.03} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, -0.78, 0]} position={[12, 0.021, -7]}>
        <planeGeometry args={[102, 10.8, 1, 1]} />
        <meshStandardMaterial map={pathTexture ?? undefined} color={config.palette.path} roughness={0.88} metalness={0.03} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.024, 1.5]}>
        <circleGeometry args={[8.6, 28]} />
        <meshStandardMaterial map={pathTexture ?? undefined} color={config.palette.path} roughness={0.88} metalness={0.03} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0.12, 0]} position={[-45, -0.02, 58]}>
        <planeGeometry args={[78, 46, 1, 1]} />
        <meshStandardMaterial color="#62bfd1" roughness={0.28} metalness={0.16} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0.12, 0]} position={[-45, 0.012, 58]}>
        <planeGeometry args={[82, 50, 1, 1]} />
        <meshStandardMaterial color="#8ca95e" roughness={0.94} metalness={0.01} transparent opacity={0.88} />
      </mesh>

      {grassIslands.map((island, index) => (
        <mesh
          key={`grass-island-${index}`}
          receiveShadow
          rotation={[-Math.PI / 2, island.rotation, 0]}
          position={island.position as [number, number, number]}
        >
          <planeGeometry args={[island.size[0], island.size[1], 1, 1]} />
          <meshStandardMaterial color={island.color} roughness={1} metalness={0} />
        </mesh>
      ))}
    </RigidBody>
  )
}
