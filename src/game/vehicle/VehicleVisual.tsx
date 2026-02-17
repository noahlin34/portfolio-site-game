import { memo, type MutableRefObject, type RefObject, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MeshBasicMaterial } from 'three'
import { getSharedCoolMatcapTexture, getSharedDarkMatcapTexture, getSharedWarmMatcapTexture } from '../materials/stylized'

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
  const warmMatcap = useMemo(() => getSharedWarmMatcapTexture() ?? undefined, [])
  const coolMatcap = useMemo(() => getSharedCoolMatcapTexture() ?? undefined, [])
  const darkMatcap = useMemo(() => getSharedDarkMatcapTexture() ?? undefined, [])
  const tailLeftMaterialRef = useRef<MeshBasicMaterial>(null)
  const tailRightMaterialRef = useRef<MeshBasicMaterial>(null)

  useFrame((_, delta) => {
    const lerp = 1 - Math.exp(-delta * 16)
    const target = brakingRef.current ? 0.95 : 0.46

    if (tailLeftMaterialRef.current) {
      tailLeftMaterialRef.current.opacity += (target - tailLeftMaterialRef.current.opacity) * lerp
    }
    if (tailRightMaterialRef.current) {
      tailRightMaterialRef.current.opacity += (target - tailRightMaterialRef.current.opacity) * lerp
    }
  })

  return (
    <group ref={chassisRef} position={[0, 0.55, 0]}>
      <mesh>
        <boxGeometry args={[1.78, 0.43, 3.52]} />
        <meshMatcapMaterial matcap={warmMatcap} color="#be2f3f" />
      </mesh>

      <mesh position={[0, 0.26, -0.23]}>
        <boxGeometry args={[1.58, 0.28, 2.72]} />
        <meshMatcapMaterial matcap={warmMatcap} color="#cd3d47" />
      </mesh>

      <mesh position={[0, 0.54, -0.32]}>
        <boxGeometry args={[1.2, 0.24, 1.44]} />
        <meshMatcapMaterial matcap={warmMatcap} color="#f8f5ee" />
      </mesh>

      <mesh position={[0, 0.61, -0.32]}>
        <boxGeometry args={[1.02, 0.2, 1.22]} />
        <meshMatcapMaterial matcap={coolMatcap} color="#90a7bb" />
      </mesh>

      <mesh position={[0, -0.08, -1.77]}>
        <boxGeometry args={[1.58, 0.24, 0.26]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#24252b" />
      </mesh>
      <mesh position={[0, -0.08, 1.77]}>
        <boxGeometry args={[1.58, 0.24, 0.26]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#24252b" />
      </mesh>

      <mesh position={[-0.86, -0.08, 0]}>
        <boxGeometry args={[0.07, 0.15, 2.86]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#23242a" />
      </mesh>
      <mesh position={[0.86, -0.08, 0]}>
        <boxGeometry args={[0.07, 0.15, 2.86]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#23242a" />
      </mesh>

      <mesh position={[0, 0.03, -1.8]}>
        <boxGeometry args={[0.9, 0.16, 0.07]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#16181c" />
      </mesh>

      <mesh position={[-0.56, 0.08, -1.78]}>
        <boxGeometry args={[0.22, 0.11, 0.09]} />
        <meshBasicMaterial color="#ffe8b4" />
      </mesh>
      <mesh position={[0.56, 0.08, -1.78]}>
        <boxGeometry args={[0.22, 0.11, 0.09]} />
        <meshBasicMaterial color="#ffe8b4" />
      </mesh>

      <mesh position={[-0.57, 0.05, 1.78]}>
        <boxGeometry args={[0.24, 0.1, 0.08]} />
        <meshBasicMaterial ref={tailLeftMaterialRef} color="#ff6f67" transparent opacity={0.46} />
      </mesh>
      <mesh position={[0.57, 0.05, 1.78]}>
        <boxGeometry args={[0.24, 0.1, 0.08]} />
        <meshBasicMaterial ref={tailRightMaterialRef} color="#ff6f67" transparent opacity={0.46} />
      </mesh>

      <mesh position={[-0.95, 0.33, -0.58]}>
        <boxGeometry args={[0.09, 0.08, 0.2]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#191a1e" />
      </mesh>
      <mesh position={[0.95, 0.33, -0.58]}>
        <boxGeometry args={[0.09, 0.08, 0.2]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#191a1e" />
      </mesh>

      <mesh position={[0, 0.34, -0.97]}>
        <boxGeometry args={[1.12, 0.04, 0.72]} />
        <meshMatcapMaterial matcap={coolMatcap} color="#9cb6c8" transparent opacity={0.84} />
      </mesh>
      <mesh position={[0, 0.34, 0.43]}>
        <boxGeometry args={[1.02, 0.04, 0.52]} />
        <meshMatcapMaterial matcap={coolMatcap} color="#7f98ad" transparent opacity={0.78} />
      </mesh>

      <mesh position={[0, 0.52, -1.16]}>
        <boxGeometry args={[0.68, 0.07, 0.34]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#191b1f" />
      </mesh>
      <mesh position={[0, 0.52, -1.48]}>
        <boxGeometry args={[0.46, 0.05, 0.28]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#24262d" />
      </mesh>

      <mesh position={[0, 0.78, -0.62]}>
        <boxGeometry args={[1.24, 0.06, 0.18]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#2f333b" />
      </mesh>
      <mesh position={[-0.5, 0.84, -0.62]}>
        <boxGeometry args={[0.08, 0.12, 0.16]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#242933" />
      </mesh>
      <mesh position={[0.5, 0.84, -0.62]}>
        <boxGeometry args={[0.08, 0.12, 0.16]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#242933" />
      </mesh>

      <group position={[-0.86, -0.17, 1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 24]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#14161a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
          <meshMatcapMaterial matcap={warmMatcap} color="#db535d" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#2a2b34" />
        </mesh>
      </group>

      <group position={[0.86, -0.17, 1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 24]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#14161a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
          <meshMatcapMaterial matcap={warmMatcap} color="#db535d" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#2a2b34" />
        </mesh>
      </group>

      <group ref={frontLeftSteerRef} position={[-0.86, -0.17, -1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 24]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#14161a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
          <meshMatcapMaterial matcap={warmMatcap} color="#db535d" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#2a2b34" />
        </mesh>
      </group>

      <group ref={frontRightSteerRef} position={[0.86, -0.17, -1.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 24]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#14161a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
          <meshMatcapMaterial matcap={warmMatcap} color="#db535d" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
          <meshMatcapMaterial matcap={darkMatcap} color="#2a2b34" />
        </mesh>
      </group>
    </group>
  )
})

VehicleVisual.displayName = 'VehicleVisual'
