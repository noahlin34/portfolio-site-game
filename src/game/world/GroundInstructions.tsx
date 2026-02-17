import { Text } from '@react-three/drei'

export function GroundInstructions() {
  return (
    <group position={[-1.5, 0.052, 7.5]} rotation={[-Math.PI / 2, 0.12, 0]}>
      <Text
        position={[0, 0, 0]}
        fontSize={1.22}
        letterSpacing={0.02}
        color="#fff1dd"
        anchorX="center"
        anchorY="middle"
      >
        W / A / S / D
      </Text>
      <Text
        position={[0, -1.45, 0]}
        fontSize={0.62}
        letterSpacing={0.01}
        color="#ffd9a9"
        anchorX="center"
        anchorY="middle"
      >
        OR ARROW KEYS
      </Text>
    </group>
  )
}
