import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, Group, LinearFilter, Sprite, SpriteMaterial, SRGBColorSpace } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { createRng, randomRange } from '../utils/random'

interface EffectsProps {
  config: ArtDirectionConfig
}

interface GlowPoint {
  position: [number, number, number]
  speed: number
  phase: number
}

export function Effects({ config }: EffectsProps) {
  const glowRefs = useRef<Group[]>([])
  const flareRef = useRef<Sprite>(null)

  const { glowPoints, sparklePositions } = useMemo(() => {
    const rng = createRng(config.world.seed + 404)
    const half = config.world.size * 0.5

    const points: GlowPoint[] = []
    for (let index = 0; index < config.density.glowPoints; index += 1) {
      points.push({
        position: [randomRange(rng, -half * 0.72, half * 0.72), randomRange(rng, 0.9, 1.5), randomRange(rng, -half * 0.72, half * 0.72)],
        speed: randomRange(rng, 0.44, 0.9),
        phase: randomRange(rng, 0, Math.PI * 2),
      })
    }

    const positions = new Float32Array(config.density.sparkles * 3)
    for (let index = 0; index < config.density.sparkles; index += 1) {
      const i3 = index * 3
      positions[i3] = randomRange(rng, -half * 0.88, half * 0.88)
      positions[i3 + 1] = randomRange(rng, 0.12, 0.8)
      positions[i3 + 2] = randomRange(rng, -half * 0.88, half * 0.88)
    }

    return { glowPoints: points, sparklePositions: positions }
  }, [config.density.glowPoints, config.density.sparkles, config.world.seed, config.world.size])
  const flareTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }

    const gradient = context.createRadialGradient(128, 128, 10, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(255, 246, 224, 0.72)')
    gradient.addColorStop(0.4, 'rgba(255, 198, 142, 0.34)')
    gradient.addColorStop(0.72, 'rgba(255, 142, 88, 0.12)')
    gradient.addColorStop(1, 'rgba(255, 118, 72, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 256, 256)

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.needsUpdate = true
    return texture
  }, [])

  useFrame(({ clock, camera }) => {
    const elapsed = clock.elapsedTime
    glowPoints.forEach((point, index) => {
      const ref = glowRefs.current[index]
      if (!ref) {
        return
      }
      ref.position.y = point.position[1] + Math.sin(elapsed * point.speed + point.phase) * 0.28
      ref.rotation.y = elapsed * 1.4
      ref.scale.setScalar(0.92 + Math.sin(elapsed * point.speed + point.phase) * 0.08)
    })

    const flare = flareRef.current
    if (flare) {
      flare.position.set(camera.position.x - 54, 22, camera.position.z - 42)
      flare.scale.setScalar(62)
      const material = flare.material as SpriteMaterial
      material.opacity = 0.3
    }
  })

  return (
    <group>
      {glowPoints.map((point, index) => (
        <group
          key={`glow-${index}`}
          ref={(node) => {
            if (node) {
              glowRefs.current[index] = node
            }
          }}
          position={point.position}
        >
          <mesh>
            <octahedronGeometry args={[0.33, 0]} />
            <meshBasicMaterial color="#ff8dd8" transparent opacity={0.84} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial color="#fff2fc" transparent opacity={0.82} />
          </mesh>
        </group>
      ))}

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparklePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.085}
          color="#fff3df"
          transparent
          opacity={0.6}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {flareTexture ? (
        <sprite ref={flareRef} position={[-54, 22, -42]} renderOrder={3}>
          <spriteMaterial
            map={flareTexture}
            color="#ffd7a4"
            transparent
            opacity={0.3}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ) : null}
    </group>
  )
}
