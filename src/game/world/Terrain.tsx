import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { createAsphaltTexture } from '../materials/asphalt'
import { createPathTileTexture } from '../materials/stylized'
import type { ArtDirectionConfig } from '../config/artDirection'

interface TerrainProps {
  config: ArtDirectionConfig
}

const grassIslands = [
  { position: [-38, 0.01, 26], size: [35, 26], rotation: 0.22, color: '#95a14b' },
  { position: [36, 0.01, -28], size: [40, 28], rotation: -0.28, color: '#97a54c' },
  { position: [-44, 0.01, -36], size: [31, 24], rotation: -0.45, color: '#8d9a44' },
  { position: [52, 0.01, 38], size: [28, 24], rotation: 0.35, color: '#8ea147' },
]

const curbSegments = Array.from({ length: 22 }, (_, index) => ({
  x: -36 + index * 3.3,
  color: index % 2 === 0 ? '#de4d36' : '#f6e5e3',
}))

const chevrons = [
  { x: -4, z: 4.2 },
  { x: 11, z: 2.8 },
  { x: 26, z: 1.6 },
  { x: 41, z: 0.2 },
]

function TrackChevron({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.01, z]}>
      <mesh rotation={[0, Math.PI * 0.25, 0]}>
        <boxGeometry args={[1.85, 0.02, 0.3]} />
        <meshStandardMaterial color="#f4ebf4" roughness={0.44} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0, -1.24]} rotation={[0, -Math.PI * 0.25, 0]}>
        <boxGeometry args={[1.85, 0.02, 0.3]} />
        <meshStandardMaterial color="#f4ebf4" roughness={0.44} metalness={0.02} />
      </mesh>
    </group>
  )
}

export function Terrain({ config }: TerrainProps) {
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
      <CuboidCollider args={[144 / 2, 0.16, 14.2 / 2]} position={[0, -0.16, 0]} rotation={[0, 0.14, 0]} friction={1.35} />
      <CuboidCollider args={[102 / 2, 0.16, 10.8 / 2]} position={[12, -0.16, -7]} rotation={[0, -0.78, 0]} friction={1.35} />
      <CuboidCollider args={[8.6, 0.16, 8.6]} position={[-2, -0.16, 1.5]} friction={1.35} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[config.world.size, config.world.size, 1, 1]} />
        <meshStandardMaterial
          map={asphaltTexture ?? undefined}
          color={config.palette.baseGround}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0.14, 0]} position={[0, 0.006, 0]}>
        <planeGeometry args={[144, 14.2, 1, 1]} />
        <meshStandardMaterial
          map={pathTexture ?? undefined}
          color={config.palette.path}
          roughness={0.88}
          metalness={0.03}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, -0.78, 0]} position={[12, 0.0062, -7]}>
        <planeGeometry args={[102, 10.8, 1, 1]} />
        <meshStandardMaterial
          map={pathTexture ?? undefined}
          color={config.palette.path}
          roughness={0.88}
          metalness={0.03}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.0064, 1.5]}>
        <circleGeometry args={[8.6, 28]} />
        <meshStandardMaterial
          map={pathTexture ?? undefined}
          color={config.palette.path}
          roughness={0.88}
          metalness={0.03}
        />
      </mesh>

      <group position={[13.5, 0, 6]} rotation={[0, -0.21, 0]}>
        <CuboidCollider args={[82 / 2, 0.16, 33 / 2]} position={[0, -0.16, 0]} friction={1.35} />

        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0076, 0]}>
          <planeGeometry args={[82, 33, 1, 1]} />
          <meshStandardMaterial
            map={trackTexture ?? undefined}
            color="#3d344f"
            roughness={0.9}
            metalness={0.03}
          />
        </mesh>

        {curbSegments.map((segment) => (
          <group key={`curb-${segment.x}`}>
            <mesh
              receiveShadow
              castShadow
              position={[segment.x, 0.012, -17]}
            >
              <boxGeometry args={[3.18, 0.024, 1.5]} />
              <meshStandardMaterial color={segment.color} roughness={0.66} metalness={0.02} />
            </mesh>
            <mesh receiveShadow castShadow position={[segment.x, 0.028, -16.56]}>
              <boxGeometry args={[2.72, 0.02, 0.62]} />
              <meshStandardMaterial
                color={segment.color === '#de4d36' ? '#b9382a' : '#e7d8d8'}
                roughness={0.68}
                metalness={0.02}
              />
            </mesh>
          </group>
        ))}

        {chevrons.map((chevron) => (
          <TrackChevron key={`chevron-${chevron.x}`} x={chevron.x} z={chevron.z} />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0.12, 0]} position={[-45, -0.02, 58]}>
        <planeGeometry args={[78, 46, 1, 1]} />
        <meshStandardMaterial color="#62bfd1" roughness={0.28} metalness={0.16} />
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
