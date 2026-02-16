import { useLayoutEffect, useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import { InstancedMesh, Matrix4 } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { composeMatrix, createRng, randomRange } from '../utils/random'
import { isPathArea, isPlayableArea } from './layout'

interface PropsProps {
  config: ArtDirectionConfig
}

const applyMatrices = (instance: InstancedMesh | null, matrices: Matrix4[]) => {
  if (!instance) {
    return
  }

  matrices.forEach((matrix, index) => instance.setMatrixAt(index, matrix))
  instance.instanceMatrix.needsUpdate = true
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
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
}

function Cone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.18, 0]}>
        <coneGeometry args={[0.34, 0.46, 6]} />
        <meshStandardMaterial color="#df6b3a" roughness={0.56} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.07, 14]} />
        <meshStandardMaterial color="#f6f1f1" roughness={0.35} metalness={0.06} />
      </mesh>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.44, 0.5, 0.04, 14]} />
        <meshStandardMaterial color="#6f4c35" roughness={0.82} metalness={0.02} />
      </mesh>
    </group>
  )
}

function Bleachers({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
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

      <mesh castShadow position={[-4.7, 0.52, 0.54]} rotation={[0, 0, -0.24]}>
        <boxGeometry args={[0.12, 1.52, 1.6]} />
        <meshStandardMaterial color="#71728a" roughness={0.42} metalness={0.34} />
      </mesh>
      <mesh castShadow position={[4.7, 0.52, 0.54]} rotation={[0, 0, 0.24]}>
        <boxGeometry args={[0.12, 1.52, 1.6]} />
        <meshStandardMaterial color="#71728a" roughness={0.42} metalness={0.34} />
      </mesh>
      <mesh castShadow position={[0, 1.24, -0.26]}>
        <boxGeometry args={[10.2, 0.18, 0.16]} />
        <meshStandardMaterial color="#6d657f" roughness={0.42} metalness={0.34} />
      </mesh>
    </group>
  )
}

export function Props({ config }: PropsProps) {
  const rockRef = useRef<InstancedMesh>(null)

  const rockMatrices = useMemo(() => {
    const rng = createRng(config.world.seed + 203)
    const half = config.world.size * 0.5
    const matrices: Matrix4[] = []

    let attempts = 0
    while (matrices.length < config.density.rocks && attempts < config.density.rocks * 20) {
      attempts += 1
      const x = randomRange(rng, -half, half)
      const z = randomRange(rng, -half, half)

      if (!isPlayableArea(x, z, config.world.size)) {
        continue
      }

      if (!isPathArea(x, z) && Math.hypot(x, z) < 18) {
        continue
      }

      const scale = randomRange(rng, 0.28, 0.85)
      matrices.push(composeMatrix(x, scale * 0.38, z, scale, scale * randomRange(rng, 0.8, 1.4), scale, randomRange(rng, 0, Math.PI * 2)))
    }

    return matrices
  }, [config.density.rocks, config.world.seed, config.world.size])

  useLayoutEffect(() => {
    applyMatrices(rockRef.current, rockMatrices)
  }, [rockMatrices])

  return (
    <group>
      <group position={[34, 0.2, 16]}>
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

      <group position={[24, 0.2, 13]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.5, 2.8, 3.8]} />
          <meshStandardMaterial color="#85527f" roughness={0.78} metalness={0.05} />
        </mesh>
        <mesh position={[0, 2.02, 0]} castShadow>
          <boxGeometry args={[4.9, 0.42, 4.2]} />
          <meshStandardMaterial color="#c24d42" roughness={0.72} metalness={0.07} />
        </mesh>
        <mesh position={[0, 2.46, 0]} castShadow>
          <boxGeometry args={[4.3, 0.42, 3.6]} />
          <meshStandardMaterial color="#c24d42" roughness={0.72} metalness={0.07} />
        </mesh>
        <mesh position={[0, 1.1, -1.94]}>
          <boxGeometry args={[1.3, 1.5, 0.1]} />
          <meshStandardMaterial color="#2b1f44" roughness={0.38} metalness={0.1} />
        </mesh>
      </group>

      <Bleachers position={[-11.5, 0, 23]} rotation={[0, -0.18, 0]} />

      <group position={[24.8, 0, 24.2]} rotation={[0, -0.2, 0]}>
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
      </group>

      <group position={[20.4, 0.12, 22.4]} rotation={[0, 0.18, 0]}>
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

      <group position={[-8, 0, 20]}>
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
        <mesh castShadow position={[0, 0.66, -0.26]}>
          <boxGeometry args={[3.1, 0.14, 0.16]} />
          <meshStandardMaterial color="#765134" roughness={0.88} metalness={0.04} />
        </mesh>
      </group>

      <group position={[-20, 0, 42]} rotation={[0, 0.18, 0]}>
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

      <Lantern position={[-17, 0, 23]} />
      <Lantern position={[12, 0, 30]} />
      <Lantern position={[31, 0, 6]} />
      <Lantern position={[-27, 0, -14]} />

      <Cone position={[-24, 0, 13.5]} />
      <Cone position={[-27.4, 0, 10.5]} />

      <mesh position={[-6, 0.5, -16]} castShadow>
        <boxGeometry args={[2.6, 0.8, 0.3]} />
        <meshStandardMaterial color="#e7dff1" roughness={0.4} metalness={0.06} />
      </mesh>
      <mesh position={[-3.1, 0.55, -16.2]} castShadow>
        <boxGeometry args={[2, 0.9, 0.32]} />
        <meshStandardMaterial color="#e7dff1" roughness={0.4} metalness={0.06} />
      </mesh>

      <instancedMesh ref={rockRef} args={[undefined, undefined, rockMatrices.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={config.palette.propStone} roughness={0.92} metalness={0.01} />
      </instancedMesh>
    </group>
  )
}
