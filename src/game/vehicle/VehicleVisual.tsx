import { memo, type MutableRefObject, type RefObject, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MeshStandardMaterial } from 'three'

export interface VehicleVisualProps {
  chassisRef: RefObject<Group | null>
  frontLeftSteerRef: RefObject<Group | null>
  frontRightSteerRef: RefObject<Group | null>
  brakingRef: MutableRefObject<boolean>
}

export const VehicleVisual = memo(function VehicleVisual({
  chassisRef,
  frontLeftSteerRef,
  frontRightSteerRef,
  brakingRef,
}: VehicleVisualProps) {
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
        <meshPhysicalMaterial color="#be2f3f" roughness={0.28} metalness={0.35} clearcoat={0.82} clearcoatRoughness={0.16} />
      </mesh>

      <mesh position={[0, 0.26, -0.23]} castShadow receiveShadow>
        <boxGeometry args={[1.58, 0.28, 2.72]} />
        <meshPhysicalMaterial color="#cd3d47" roughness={0.24} metalness={0.32} clearcoat={0.78} clearcoatRoughness={0.14} />
      </mesh>

      <mesh position={[0, 0.54, -0.32]} castShadow>
        <boxGeometry args={[1.2, 0.24, 1.44]} />
        <meshPhysicalMaterial color="#f8f5ee" roughness={0.16} metalness={0.08} clearcoat={0.38} clearcoatRoughness={0.26} />
      </mesh>

      <mesh position={[0, 0.61, -0.32]}>
        <boxGeometry args={[1.02, 0.2, 1.22]} />
        <meshPhysicalMaterial color="#90a7bb" roughness={0.08} metalness={0.78} clearcoat={0.58} clearcoatRoughness={0.08} />
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
        <meshPhysicalMaterial color="#9cb6c8" roughness={0.08} metalness={0.72} transparent opacity={0.82} transmission={0.18} />
      </mesh>
      <mesh position={[0, 0.34, 0.43]}>
        <boxGeometry args={[1.02, 0.04, 0.52]} />
        <meshPhysicalMaterial color="#7f98ad" roughness={0.1} metalness={0.66} transparent opacity={0.7} transmission={0.14} />
      </mesh>

      <mesh position={[0, 0.52, -1.16]} castShadow>
        <boxGeometry args={[0.68, 0.07, 0.34]} />
        <meshStandardMaterial color="#191b1f" roughness={0.48} metalness={0.24} />
      </mesh>
      <mesh position={[0, 0.52, -1.48]} castShadow>
        <boxGeometry args={[0.46, 0.05, 0.28]} />
        <meshStandardMaterial color="#24262d" roughness={0.52} metalness={0.2} />
      </mesh>

      <mesh position={[0, 0.78, -0.62]} castShadow receiveShadow>
        <boxGeometry args={[1.24, 0.06, 0.18]} />
        <meshStandardMaterial color="#2f333b" roughness={0.36} metalness={0.48} />
      </mesh>
      <mesh position={[-0.5, 0.84, -0.62]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.12, 0.16]} />
        <meshStandardMaterial color="#242933" roughness={0.38} metalness={0.5} />
      </mesh>
      <mesh position={[0.5, 0.84, -0.62]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.12, 0.16]} />
        <meshStandardMaterial color="#242933" roughness={0.38} metalness={0.5} />
      </mesh>

      <group position={[-0.86, -0.17, 1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshPhysicalMaterial color="#db535d" roughness={0.24} metalness={0.74} clearcoat={0.62} clearcoatRoughness={0.14} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 14]} />
          <meshStandardMaterial color="#2a2b34" roughness={0.42} metalness={0.34} />
        </mesh>
      </group>

      <group position={[0.86, -0.17, 1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshPhysicalMaterial color="#db535d" roughness={0.24} metalness={0.74} clearcoat={0.62} clearcoatRoughness={0.14} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 14]} />
          <meshStandardMaterial color="#2a2b34" roughness={0.42} metalness={0.34} />
        </mesh>
      </group>

      <group ref={frontLeftSteerRef} position={[-0.86, -0.17, -1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshPhysicalMaterial color="#db535d" roughness={0.24} metalness={0.74} clearcoat={0.62} clearcoatRoughness={0.14} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 14]} />
          <meshStandardMaterial color="#2a2b34" roughness={0.42} metalness={0.34} />
        </mesh>
      </group>

      <group ref={frontRightSteerRef} position={[0.86, -0.17, -1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
          <meshPhysicalMaterial color="#db535d" roughness={0.24} metalness={0.74} clearcoat={0.62} clearcoatRoughness={0.14} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 14]} />
          <meshStandardMaterial color="#2a2b34" roughness={0.42} metalness={0.34} />
        </mesh>
      </group>
    </group>
  )
})

VehicleVisual.displayName = 'VehicleVisual'
