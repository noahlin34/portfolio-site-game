import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { ArtDirectionConfig } from '../config/artDirection'
import { getSharedCoolMatcapTexture, getSharedDarkMatcapTexture, getSharedWarmMatcapTexture } from '../materials/stylized'
import type { LevelEntity } from './schema'

interface EntityVisualProps {
  entity: LevelEntity
  config: ArtDirectionConfig
}

interface MatcapSet {
  warm: ReturnType<typeof getSharedWarmMatcapTexture> | undefined
  cool: ReturnType<typeof getSharedCoolMatcapTexture> | undefined
  dark: ReturnType<typeof getSharedDarkMatcapTexture> | undefined
}

function TreeVisual({ canopyColor, config, matcaps }: { canopyColor: string; config: ArtDirectionConfig; matcaps: MatcapSet }) {
  return (
    <group>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.18, 0.34, 2.1, 6]} />
        <meshMatcapMaterial matcap={matcaps.dark} color={config.palette.trunk} flatShading />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <icosahedronGeometry args={[0.98, 0]} />
        <meshMatcapMaterial matcap={matcaps.warm} color={canopyColor} flatShading />
      </mesh>
      <mesh position={[0.25, 3.2, -0.12]} rotation={[0, 0.4, 0]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshMatcapMaterial matcap={matcaps.warm} color={canopyColor} flatShading />
      </mesh>
      <mesh position={[-0.28, 3.08, 0.16]} rotation={[0, -0.26, 0]}>
        <dodecahedronGeometry args={[0.52, 0]} />
        <meshMatcapMaterial matcap={matcaps.warm} color={canopyColor} flatShading />
      </mesh>
    </group>
  )
}

export function EntityVisual({ entity, config }: EntityVisualProps) {
  const matcaps = useMemo<MatcapSet>(
    () => ({
      warm: getSharedWarmMatcapTexture() ?? undefined,
      cool: getSharedCoolMatcapTexture() ?? undefined,
      dark: getSharedDarkMatcapTexture() ?? undefined,
    }),
    [],
  )

  switch (entity.prefab) {
    case 'house':
      return (
        <group>
          <mesh>
            <boxGeometry args={[4.5, 2.8, 3.8]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#85527f" />
          </mesh>
          <mesh position={[0, 2.02, 0]}>
            <boxGeometry args={[4.9, 0.42, 4.2]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#c24d42" />
          </mesh>
          <mesh position={[0, 2.46, 0]}>
            <boxGeometry args={[4.3, 0.42, 3.6]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#c24d42" />
          </mesh>
        </group>
      )
    case 'bleachers':
      return (
        <group>
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[10, 0.24, 0.62]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#c48758" />
          </mesh>
          <mesh position={[0, 0.68, 0.5]}>
            <boxGeometry args={[10, 0.24, 0.62]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#c48758" />
          </mesh>
          <mesh position={[0, 0.34, 1.0]}>
            <boxGeometry args={[10, 0.24, 0.62]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#c48758" />
          </mesh>
        </group>
      )
    case 'scoreboard':
      return (
        <group>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[4.8, 3.1, 0.24]} />
            <meshMatcapMaterial matcap={matcaps.dark} color="#3b3d4f" />
          </mesh>
          <mesh position={[-2.3, 1.1, 0]}>
            <boxGeometry args={[0.28, 3.9, 0.28]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#6f7184" />
          </mesh>
          <mesh position={[2.3, 1.1, 0]}>
            <boxGeometry args={[0.28, 3.9, 0.28]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#6f7184" />
          </mesh>
          <Text position={[0, 2.55, 0.18]} fontSize={0.46} color="#ffffff" anchorX="center" anchorY="middle">
            RESET
          </Text>
          <Text position={[0, 1.84, 0.18]} fontSize={0.26} color="#f5f2fd" anchorX="center" anchorY="middle">
            in 2h 20m
          </Text>

          <group position={[-2.8, 0.2, 0.1]} rotation={[0, 0.18, 0]}>
            <mesh>
              <sphereGeometry args={[0.68, 18, 18]} />
              <meshMatcapMaterial matcap={matcaps.warm} color="#e74c3e" />
            </mesh>
            <mesh position={[0, 0.04, 0.64]}>
              <cylinderGeometry args={[0.42, 0.42, 0.14, 20]} />
              <meshMatcapMaterial matcap={matcaps.cool} color="#f6edf2" />
            </mesh>
            <mesh position={[0, 0.07, 0.74]} rotation={[0, 0, -Math.PI * 0.24]}>
              <boxGeometry args={[0.06, 0.24, 0.08]} />
              <meshMatcapMaterial matcap={matcaps.dark} color="#413847" />
            </mesh>
            <mesh position={[0.34, 0.56, 0.22]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshMatcapMaterial matcap={matcaps.warm} color="#d84337" />
            </mesh>
            <mesh position={[-0.34, 0.56, 0.22]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshMatcapMaterial matcap={matcaps.warm} color="#d84337" />
            </mesh>
          </group>
        </group>
      )
    case 'bench':
      return (
        <group>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[3, 0.18, 0.78]} />
            <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.propWood} />
          </mesh>
          <mesh position={[-1.36, 0.52, 0]}>
            <boxGeometry args={[0.22, 0.52, 0.22]} />
            <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.propWood} />
          </mesh>
          <mesh position={[1.36, 0.52, 0]}>
            <boxGeometry args={[0.22, 0.52, 0.22]} />
            <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.propWood} />
          </mesh>
        </group>
      )
    case 'bench_long':
      return (
        <group>
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[7.2, 0.22, 1.16]} />
            <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.propWood} />
          </mesh>
          <mesh position={[-3.1, 0.62, 0]}>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.propWood} />
          </mesh>
          <mesh position={[3.1, 0.62, 0]}>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.propWood} />
          </mesh>
        </group>
      )
    case 'lantern':
      return (
        <group>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.16, 1.75, 0.16]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#8b7da4" />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <boxGeometry args={[0.46, 0.56, 0.46]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#6e6487" />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <boxGeometry args={[0.3, 0.42, 0.3]} />
            <meshBasicMaterial color="#ffd89a" />
          </mesh>
        </group>
      )
    case 'cone':
      return (
        <group>
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.34, 0.46, 6]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#df6b3a" />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 0.07, 14]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#f6f1f1" />
          </mesh>
        </group>
      )
    case 'arrow_sign':
      return (
        <group>
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.2, 1.9, 0.2]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#6e6988" />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <coneGeometry args={[0.42, 0.76, 5]} />
            <meshMatcapMaterial matcap={matcaps.warm} color="#e96f45" />
          </mesh>
          <mesh position={[0.56, 1.4, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <coneGeometry args={[0.28, 0.6, 5]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#58a6d9" />
          </mesh>
        </group>
      )
    case 'name_sign':
      return (
        <group>
          <Text
            position={[0, 0.92, 0]}
            rotation={[-Math.PI * 0.02, 0.06, 0]}
            fontSize={2.2}
            letterSpacing={0.02}
            color="#ead6f8"
            anchorX="center"
            anchorY="middle"
            outlineColor="#cfb2e8"
            outlineWidth={0.045}
          >
            BRUNO SIMON
          </Text>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[22, 0.08, 1.18]} />
            <meshMatcapMaterial matcap={matcaps.cool} color="#dcb4ed" transparent opacity={0.22} />
          </mesh>
        </group>
      )
    case 'rock':
      return (
        <mesh>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshMatcapMaterial matcap={matcaps.dark} color={entity.color ?? config.palette.propStone} />
        </mesh>
      )
    case 'push_box':
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshMatcapMaterial matcap={matcaps.warm} color={entity.color ?? '#aa7859'} />
        </mesh>
      )
    case 'push_ball':
      return (
        <mesh>
          <sphereGeometry args={[0.5, 22, 22]} />
          <meshMatcapMaterial matcap={matcaps.warm} color={entity.color ?? '#f2d674'} />
        </mesh>
      )
    case 'tree_pink':
      return <TreeVisual canopyColor={config.palette.foliagePink} config={config} matcaps={matcaps} />
    case 'tree_yellow':
      return <TreeVisual canopyColor={config.palette.foliageYellow} config={config} matcaps={matcaps} />
    case 'tree_green':
      return <TreeVisual canopyColor={config.palette.foliageGreen} config={config} matcaps={matcaps} />
    case 'bush':
      return (
        <mesh position={[0, 0.75, 0]}>
          <dodecahedronGeometry args={[0.75, 0]} />
          <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.grassB} flatShading />
        </mesh>
      )
    case 'grass_tuft':
      return (
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.38, 1.35, 6]} />
          <meshMatcapMaterial matcap={matcaps.warm} color={config.palette.grassA} flatShading />
        </mesh>
      )
    default:
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshMatcapMaterial matcap={matcaps.warm} color="#ff4b5c" />
        </mesh>
      )
  }
}
