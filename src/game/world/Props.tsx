import { useLayoutEffect, useMemo, useRef } from 'react'
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

      <Lantern position={[-17, 0, 23]} />
      <Lantern position={[12, 0, 30]} />
      <Lantern position={[31, 0, 6]} />
      <Lantern position={[-27, 0, -14]} />

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
