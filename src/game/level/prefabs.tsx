import { Text } from '@react-three/drei'
import type { ArtDirectionConfig } from '../config/artDirection'
import type { LevelEntity } from './schema'

interface EntityVisualProps {
  entity: LevelEntity
  config: ArtDirectionConfig
}

function TreeVisual({ canopyColor, config }: { canopyColor: string; config: ArtDirectionConfig }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 2.1, 6]} />
        <meshStandardMaterial color={config.palette.trunk} roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.8, 0]}>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color={canopyColor} roughness={0.82} metalness={0.02} />
      </mesh>
    </group>
  )
}

export function EntityVisual({ entity, config }: EntityVisualProps) {
  switch (entity.prefab) {
    case 'house':
      return (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.5, 2.8, 3.8]} />
            <meshStandardMaterial color="#85527f" roughness={0.78} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[0, 2.02, 0]}>
            <boxGeometry args={[4.9, 0.42, 4.2]} />
            <meshStandardMaterial color="#c24d42" roughness={0.72} metalness={0.07} />
          </mesh>
          <mesh castShadow position={[0, 2.46, 0]}>
            <boxGeometry args={[4.3, 0.42, 3.6]} />
            <meshStandardMaterial color="#c24d42" roughness={0.72} metalness={0.07} />
          </mesh>
        </group>
      )
    case 'bleachers':
      return (
        <group>
          <mesh castShadow position={[0, 1.02, 0]}>
            <boxGeometry args={[10, 0.24, 0.62]} />
            <meshStandardMaterial color="#c48758" roughness={0.78} metalness={0.06} />
          </mesh>
          <mesh castShadow position={[0, 0.68, 0.5]}>
            <boxGeometry args={[10, 0.24, 0.62]} />
            <meshStandardMaterial color="#c48758" roughness={0.78} metalness={0.06} />
          </mesh>
          <mesh castShadow position={[0, 0.34, 1.0]}>
            <boxGeometry args={[10, 0.24, 0.62]} />
            <meshStandardMaterial color="#c48758" roughness={0.78} metalness={0.06} />
          </mesh>
        </group>
      )
    case 'scoreboard':
      return (
        <group>
          <mesh castShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[4.8, 3.1, 0.24]} />
            <meshStandardMaterial color="#3b3d4f" roughness={0.42} metalness={0.38} />
          </mesh>
          <mesh castShadow position={[-2.3, 1.1, 0]}>
            <boxGeometry args={[0.28, 3.9, 0.28]} />
            <meshStandardMaterial color="#6f7184" roughness={0.44} metalness={0.34} />
          </mesh>
          <mesh castShadow position={[2.3, 1.1, 0]}>
            <boxGeometry args={[0.28, 3.9, 0.28]} />
            <meshStandardMaterial color="#6f7184" roughness={0.44} metalness={0.34} />
          </mesh>
          <Text position={[0, 2.55, 0.18]} fontSize={0.46} color="#ffffff" anchorX="center" anchorY="middle">
            RESET
          </Text>
          <Text position={[0, 1.84, 0.18]} fontSize={0.26} color="#f5f2fd" anchorX="center" anchorY="middle">
            in 2h 20m
          </Text>

          <group position={[-2.8, 0.2, 0.1]} rotation={[0, 0.18, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.68, 18, 18]} />
              <meshStandardMaterial color="#e74c3e" roughness={0.46} metalness={0.08} />
            </mesh>
            <mesh position={[0, 0.04, 0.64]}>
              <cylinderGeometry args={[0.42, 0.42, 0.14, 20]} />
              <meshStandardMaterial color="#f6edf2" roughness={0.18} metalness={0.06} />
            </mesh>
            <mesh position={[0, 0.07, 0.74]} rotation={[0, 0, -Math.PI * 0.24]}>
              <boxGeometry args={[0.06, 0.24, 0.08]} />
              <meshStandardMaterial color="#413847" roughness={0.35} metalness={0.25} />
            </mesh>
            <mesh position={[0.34, 0.56, 0.22]} castShadow>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#d84337" roughness={0.46} metalness={0.08} />
            </mesh>
            <mesh position={[-0.34, 0.56, 0.22]} castShadow>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#d84337" roughness={0.46} metalness={0.08} />
            </mesh>
          </group>
        </group>
      )
    case 'bench':
      return (
        <group>
          <mesh castShadow position={[0, 0.34, 0]}>
            <boxGeometry args={[3, 0.18, 0.78]} />
            <meshStandardMaterial color={config.palette.propWood} roughness={0.84} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[-1.36, 0.52, 0]}>
            <boxGeometry args={[0.22, 0.52, 0.22]} />
            <meshStandardMaterial color={config.palette.propWood} roughness={0.82} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[1.36, 0.52, 0]}>
            <boxGeometry args={[0.22, 0.52, 0.22]} />
            <meshStandardMaterial color={config.palette.propWood} roughness={0.82} metalness={0.05} />
          </mesh>
        </group>
      )
    case 'bench_long':
      return (
        <group>
          <mesh castShadow position={[0, 0.36, 0]}>
            <boxGeometry args={[7.2, 0.22, 1.16]} />
            <meshStandardMaterial color={config.palette.propWood} roughness={0.82} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[-3.1, 0.62, 0]}>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color={config.palette.propWood} roughness={0.82} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[3.1, 0.62, 0]}>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color={config.palette.propWood} roughness={0.82} metalness={0.05} />
          </mesh>
        </group>
      )
    case 'lantern':
      return (
        <group>
          <mesh castShadow position={[0, 0.9, 0]}>
            <boxGeometry args={[0.16, 1.75, 0.16]} />
            <meshStandardMaterial color="#8b7da4" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh castShadow position={[0, 1.95, 0]}>
            <boxGeometry args={[0.46, 0.56, 0.46]} />
            <meshStandardMaterial color="#6e6487" roughness={0.34} metalness={0.45} />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <boxGeometry args={[0.3, 0.42, 0.3]} />
            <meshStandardMaterial color="#ffd89a" emissive="#ffc772" emissiveIntensity={0.85} roughness={0.2} />
          </mesh>
        </group>
      )
    case 'cone':
      return (
        <group>
          <mesh castShadow position={[0, 0.18, 0]}>
            <coneGeometry args={[0.34, 0.46, 6]} />
            <meshStandardMaterial color="#df6b3a" roughness={0.56} metalness={0.04} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 0.07, 14]} />
            <meshStandardMaterial color="#f6f1f1" roughness={0.35} metalness={0.06} />
          </mesh>
        </group>
      )
    case 'arrow_sign':
      return (
        <group>
          <mesh castShadow position={[0, 0.95, 0]}>
            <boxGeometry args={[0.2, 1.9, 0.2]} />
            <meshStandardMaterial color="#6e6988" roughness={0.58} metalness={0.24} />
          </mesh>
          <mesh castShadow position={[0, 1.8, 0]}>
            <coneGeometry args={[0.42, 0.76, 5]} />
            <meshStandardMaterial color="#e96f45" roughness={0.52} metalness={0.03} />
          </mesh>
          <mesh castShadow position={[0.56, 1.4, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <coneGeometry args={[0.28, 0.6, 5]} />
            <meshStandardMaterial color="#58a6d9" roughness={0.52} metalness={0.03} />
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
            <meshStandardMaterial color="#dcb4ed" roughness={0.54} metalness={0.03} transparent opacity={0.22} />
          </mesh>
        </group>
      )
    case 'rock':
      return (
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color={entity.color ?? config.palette.propStone} roughness={0.9} metalness={0.02} />
        </mesh>
      )
    case 'push_box':
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={entity.color ?? '#aa7859'} roughness={0.7} metalness={0.06} />
        </mesh>
      )
    case 'push_ball':
      return (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.5, 22, 22]} />
          <meshStandardMaterial color={entity.color ?? '#f2d674'} roughness={0.54} metalness={0.12} />
        </mesh>
      )
    case 'tree_pink':
      return <TreeVisual canopyColor={config.palette.foliagePink} config={config} />
    case 'tree_yellow':
      return <TreeVisual canopyColor={config.palette.foliageYellow} config={config} />
    case 'tree_green':
      return <TreeVisual canopyColor={config.palette.foliageGreen} config={config} />
    case 'bush':
      return (
        <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
          <dodecahedronGeometry args={[0.75, 0]} />
          <meshStandardMaterial color={config.palette.grassB} roughness={0.88} metalness={0.02} />
        </mesh>
      )
    case 'grass_tuft':
      return (
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <coneGeometry args={[0.42, 1.2, 5]} />
          <meshStandardMaterial color={config.palette.grassA} roughness={0.96} metalness={0.01} />
        </mesh>
      )
    default:
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff4b5c" roughness={0.5} metalness={0.1} />
        </mesh>
      )
  }
}
