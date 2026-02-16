import { type MutableRefObject, type RefObject, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MeshStandardMaterial } from 'three'

export interface VehicleVisualProps {
  chassisRef: RefObject<Group | null>
  frontLeftSteerRef: RefObject<Group | null>
  frontRightSteerRef: RefObject<Group | null>
  brakingRef: MutableRefObject<boolean>
}

export function VehicleVisual({ chassisRef, frontLeftSteerRef, frontRightSteerRef, brakingRef }: VehicleVisualProps) {
  const tailLeftMaterialRef = useRef<MeshStandardMaterial>(null)
  const tailRightMaterialRef = useRef<MeshStandardMaterial>(null)

  useFrame((_, delta) => {
    const lerp = 1 - Math.exp(-delta * 16)
    const target = brakingRef.current ? 1.55 : 0.5

    if (tailLeftMaterialRef.current) {
      tailLeftMaterialRef.current.emissiveIntensity += (target - tailLeftMaterialRef.current.emissiveIntensity) * lerp
    }
    if (tailRightMaterialRef.current) {
      tailRightMaterialRef.current.emissiveIntensity += (target - tailRightMaterialRef.current.emissiveIntensity) * lerp
    }
  })

  return (
    <group ref={chassisRef} position={[0, 0.55, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.78, 0.43, 3.52]} />
        <meshStandardMaterial color="#bd3340" roughness={0.34} metalness={0.28} />
      </mesh>

      <mesh position={[0, 0.26, -0.23]} castShadow receiveShadow>
        <boxGeometry args={[1.58, 0.28, 2.72]} />
        <meshStandardMaterial color="#ca3e45" roughness={0.32} metalness={0.24} />
      </mesh>

      <mesh position={[0, 0.54, -0.32]} castShadow>
        <boxGeometry args={[1.2, 0.24, 1.44]} />
        <meshStandardMaterial color="#f7f6f2" roughness={0.18} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.61, -0.32]}>
        <boxGeometry args={[1.02, 0.2, 1.22]} />
        <meshStandardMaterial color="#94b1c3" roughness={0.08} metalness={0.78} />
      </mesh>

      <mesh position={[0, -0.08, -1.77]} castShadow receiveShadow>
        <boxGeometry args={[1.58, 0.24, 0.26]} />
        <meshStandardMaterial color="#24252b" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.08, 1.77]} castShadow receiveShadow>
        <boxGeometry args={[1.58, 0.24, 0.26]} />
        <meshStandardMaterial color="#24252b" roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[-0.86, -0.08, 0]} castShadow>
        <boxGeometry args={[0.07, 0.15, 2.86]} />
        <meshStandardMaterial color="#23242a" roughness={0.7} metalness={0.08} />
      </mesh>
      <mesh position={[0.86, -0.08, 0]} castShadow>
        <boxGeometry args={[0.07, 0.15, 2.86]} />
        <meshStandardMaterial color="#23242a" roughness={0.7} metalness={0.08} />
      </mesh>

      <mesh position={[0, 0.03, -1.8]}>
        <boxGeometry args={[0.9, 0.16, 0.07]} />
        <meshStandardMaterial color="#16181c" roughness={0.48} metalness={0.35} />
      </mesh>

      <mesh position={[-0.56, 0.08, -1.78]}>
        <boxGeometry args={[0.22, 0.11, 0.09]} />
        <meshStandardMaterial color="#ffe8b4" emissive="#ffcf77" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0.56, 0.08, -1.78]}>
        <boxGeometry args={[0.22, 0.11, 0.09]} />
        <meshStandardMaterial color="#ffe8b4" emissive="#ffcf77" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>

      <mesh position={[-0.57, 0.05, 1.78]}>
        <boxGeometry args={[0.24, 0.1, 0.08]} />
        <meshStandardMaterial ref={tailLeftMaterialRef} color="#ff5d58" emissive="#a51512" emissiveIntensity={0.5} roughness={0.24} />
      </mesh>
      <mesh position={[0.57, 0.05, 1.78]}>
        <boxGeometry args={[0.24, 0.1, 0.08]} />
        <meshStandardMaterial ref={tailRightMaterialRef} color="#ff5d58" emissive="#a51512" emissiveIntensity={0.5} roughness={0.24} />
      </mesh>

      <mesh position={[-0.95, 0.33, -0.58]} castShadow>
        <boxGeometry args={[0.09, 0.08, 0.2]} />
        <meshStandardMaterial color="#191a1e" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0.95, 0.33, -0.58]} castShadow>
        <boxGeometry args={[0.09, 0.08, 0.2]} />
        <meshStandardMaterial color="#191a1e" roughness={0.45} metalness={0.2} />
      </mesh>

      <mesh position={[0, 0.34, -0.97]}>
        <boxGeometry args={[1.12, 0.04, 0.72]} />
        <meshStandardMaterial color="#9cb6c8" roughness={0.1} metalness={0.72} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, 0.34, 0.43]}>
        <boxGeometry args={[1.02, 0.04, 0.52]} />
        <meshStandardMaterial color="#7f98ad" roughness={0.12} metalness={0.66} transparent opacity={0.65} />
      </mesh>

      <group position={[-0.86, -0.17, 1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
        </mesh>
      </group>

      <group position={[0.86, -0.17, 1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
        </mesh>
      </group>

      <group ref={frontLeftSteerRef} position={[-0.86, -0.17, -1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
        </mesh>
      </group>

      <group ref={frontRightSteerRef} position={[0.86, -0.17, -1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
        </mesh>
      </group>
    </group>
  )
}
