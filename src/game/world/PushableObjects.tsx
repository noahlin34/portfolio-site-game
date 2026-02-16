import { useMemo } from 'react'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { ArtDirectionConfig } from '../config/artDirection'
import { createRng, randomRange } from '../utils/random'

interface PushableObjectsProps {
  config: ArtDirectionConfig
}

interface Pushable {
  id: string
  kind: 'box' | 'ball'
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}

export function PushableObjects({ config }: PushableObjectsProps) {
  const objects = useMemo<Pushable[]>(() => {
    const rng = createRng(config.world.seed + 303)
    const list: Pushable[] = []

    for (let index = 0; index < 34; index += 1) {
      const radius = randomRange(rng, 13, 68)
      const angle = randomRange(rng, 0, Math.PI * 2)
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      if (Math.abs(x) < 8 && Math.abs(z) < 16) {
        continue
      }

      const ball = rng() > 0.52
      const size = randomRange(rng, 0.75, 1.6)

      if (ball) {
        const diameter = Number((size * 0.9).toFixed(2))
        list.push({
          id: `ball-${index}`,
          kind: 'ball',
          position: [x, diameter * 0.5, z],
          scale: [diameter, diameter, diameter],
          color: rng() > 0.5 ? '#f2d674' : '#ed9f87',
        })
        continue
      }

      const width = Number(size.toFixed(2))
      const height = Number((size * randomRange(rng, 0.85, 1.35)).toFixed(2))
      const depth = Number((size * randomRange(rng, 0.8, 1.2)).toFixed(2))
      list.push({
        id: `box-${index}`,
        kind: 'box',
        position: [x, height * 0.5, z],
        scale: [width, height, depth],
        color: rng() > 0.5 ? '#9c83b5' : '#aa7859',
      })
    }

    return list
  }, [config.world.seed])

  return (
    <>
      {objects.map((object) => (
        <RigidBody
          key={object.id}
          colliders={false}
          position={object.position}
          linearDamping={0.3}
          angularDamping={0.44}
          friction={1}
          restitution={0.1}
          mass={object.kind === 'ball' ? 1.05 : 1.8}
        >
          {object.kind === 'ball' ? (
            <>
              <BallCollider args={[object.scale[0] * 0.5]} />
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[object.scale[0] * 0.5, 24, 24]} />
                <meshStandardMaterial color={object.color} roughness={0.54} metalness={0.12} />
              </mesh>
            </>
          ) : (
            <>
              <CuboidCollider args={[object.scale[0] / 2, object.scale[1] / 2, object.scale[2] / 2]} />
              <mesh castShadow receiveShadow>
                <boxGeometry args={object.scale} />
                <meshStandardMaterial color={object.color} roughness={0.7} metalness={0.06} />
              </mesh>
            </>
          )}
        </RigidBody>
      ))}
    </>
  )
}
