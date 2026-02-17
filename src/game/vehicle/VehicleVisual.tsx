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

function Wheel({ darkMatcap }: { darkMatcap: ReturnType<typeof getSharedDarkMatcapTexture> | undefined }) {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.24, 16]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#191821" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.245, 12]} />
        <meshBasicMaterial color="#f6f2ef" />
      </mesh>
    </group>
  )
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
    const lerp = 1 - Math.exp(-delta * 14)
    const target = brakingRef.current ? 0.96 : 0.5
    if (tailLeftMaterialRef.current) {
      tailLeftMaterialRef.current.opacity += (target - tailLeftMaterialRef.current.opacity) * lerp
    }
    if (tailRightMaterialRef.current) {
      tailRightMaterialRef.current.opacity += (target - tailRightMaterialRef.current.opacity) * lerp
    }
  })

  return (
    <group ref={chassisRef} position={[0, 0.52, 0]}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.92, 0.44, 3.42]} />
        <meshMatcapMaterial matcap={warmMatcap} color="#c32624" />
      </mesh>

      <mesh position={[0, 0.27, -0.22]}>
        <boxGeometry args={[1.06, 0.26, 1.28]} />
        <meshMatcapMaterial matcap={warmMatcap} color="#b78761" />
      </mesh>

      <mesh position={[0, 0.41, -0.22]}>
        <boxGeometry args={[0.96, 0.2, 1.04]} />
        <meshMatcapMaterial matcap={coolMatcap} color="#5e82b4" />
      </mesh>

      <mesh position={[0, 0.06, -1.76]}>
        <boxGeometry args={[1.84, 0.24, 0.22]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#111218" />
      </mesh>

      <mesh position={[0, 0.03, 1.74]}>
        <boxGeometry args={[1.84, 0.17, 0.18]} />
        <meshMatcapMaterial matcap={warmMatcap} color="#b81e1e" />
      </mesh>

      <mesh position={[-0.57, 0.02, -1.78]}>
        <boxGeometry args={[0.22, 0.1, 0.08]} />
        <meshBasicMaterial color="#ffe6a8" />
      </mesh>
      <mesh position={[0.57, 0.02, -1.78]}>
        <boxGeometry args={[0.22, 0.1, 0.08]} />
        <meshBasicMaterial color="#ffe6a8" />
      </mesh>

      <mesh position={[-0.54, 0.02, 1.78]}>
        <boxGeometry args={[0.2, 0.1, 0.07]} />
        <meshBasicMaterial ref={tailLeftMaterialRef} color="#ff6960" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.54, 0.02, 1.78]}>
        <boxGeometry args={[0.2, 0.1, 0.07]} />
        <meshBasicMaterial ref={tailRightMaterialRef} color="#ff6960" transparent opacity={0.5} />
      </mesh>

      <mesh position={[0, 0.08, -0.98]}>
        <boxGeometry args={[0.52, 0.08, 0.42]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#17181f" />
      </mesh>
      <mesh position={[0, 0.1, -1.22]}>
        <boxGeometry args={[0.34, 0.06, 0.28]} />
        <meshMatcapMaterial matcap={darkMatcap} color="#0f1016" />
      </mesh>

      <mesh position={[-0.9, -0.02, 0]}>
        <boxGeometry args={[0.06, 0.08, 2.84]} />
        <meshBasicMaterial color="#f6f2ef" />
      </mesh>
      <mesh position={[0.9, -0.02, 0]}>
        <boxGeometry args={[0.06, 0.08, 2.84]} />
        <meshBasicMaterial color="#f6f2ef" />
      </mesh>

      <group position={[-0.86, -0.18, 1.08]}>
        <Wheel darkMatcap={darkMatcap} />
      </group>
      <group position={[0.86, -0.18, 1.08]}>
        <Wheel darkMatcap={darkMatcap} />
      </group>
      <group ref={frontLeftSteerRef} position={[-0.86, -0.18, -1.08]}>
        <Wheel darkMatcap={darkMatcap} />
      </group>
      <group ref={frontRightSteerRef} position={[0.86, -0.18, -1.08]}>
        <Wheel darkMatcap={darkMatcap} />
      </group>
    </group>
  )
})

VehicleVisual.displayName = 'VehicleVisual'
