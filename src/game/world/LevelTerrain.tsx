import { useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import type { Object3D, ShaderMaterial } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { createAsphaltTexture } from '../materials/asphalt'
import { createPathTileTexture } from '../materials/stylized'
import type { LevelData, TerrainPatch } from '../level/schema'

interface LevelTerrainProps {
  config: ArtDirectionConfig
  level: LevelData
  selectable?: boolean
  selectedPatchId?: string | null
  onSelectPatch?: (patchId: string) => void
  objectRefs?: MutableRefObject<Record<string, Object3D | null>>
}

const waterVertexShader = `
uniform float uTime;
varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;
  vec3 pos = position;
  float waveA = sin((uv.x * 14.0 + uTime * 0.35)) * 0.018;
  float waveB = cos((uv.y * 16.0 - uTime * 0.28)) * 0.014;
  float waveC = sin(((uv.x + uv.y) * 21.0 + uTime * 0.22)) * 0.01;
  vWave = waveA + waveB + waveC;
  pos.z += vWave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const waterFragmentShader = `
uniform float uTime;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform vec3 uGlowColor;
uniform vec3 uSpecColor;
varying vec2 vUv;
varying float vWave;

float edgeStrength(vec2 uv) {
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  return 1.0 - smoothstep(0.02, 0.14, edge);
}

void main() {
  float radial = length(vUv - vec2(0.5)) * 1.72;
  float depth = smoothstep(0.14, 0.97, radial + vWave * 0.85);
  vec3 base = mix(uShallowColor, uDeepColor, depth);

  float rippleA = sin((vUv.x * 46.0 + vUv.y * 37.0) + uTime * 1.24) * 0.5 + 0.5;
  float rippleB = sin((vUv.x * 29.0 - vUv.y * 34.0) - uTime * 1.12) * 0.5 + 0.5;
  float streak = smoothstep(0.72, 0.99, rippleA) * (1.0 - depth) * 0.22;
  float caustic = smoothstep(0.74, 0.98, rippleB) * (1.0 - depth) * 0.18;
  float foam = edgeStrength(vUv) * (0.72 + sin((vUv.x - vUv.y) * 26.0 + uTime * 1.85) * 0.28);
  float spec = smoothstep(0.78, 1.0, sin(vUv.x * 58.0 - vUv.y * 55.0 + uTime * 1.6) * 0.5 + 0.5) * (1.0 - depth) * 0.18;

  vec3 color = base + uGlowColor * (streak + caustic) + uFoamColor * foam * 0.55 + uSpecColor * spec;
  gl_FragColor = vec4(color, 0.97);
}
`

interface WaterUniforms {
  uTime: { value: number }
  uDeepColor: { value: Color }
  uShallowColor: { value: Color }
  uFoamColor: { value: Color }
  uGlowColor: { value: Color }
  uSpecColor: { value: Color }
}

const getPatchMaterialProps = (patch: TerrainPatch, config: ArtDirectionConfig) => {
  switch (patch.kind) {
    case 'path':
      return {
        color: patch.materialVariant === 'alt' ? '#e7b177' : config.palette.path,
        roughness: 0.9,
        metalness: 0.03,
      }
    case 'track':
      return {
        color: patch.materialVariant === 'alt' ? '#423751' : '#352f49',
        roughness: 0.94,
        metalness: 0.02,
      }
    case 'water':
      return {
        color: patch.materialVariant === 'alt' ? '#2f7293' : '#234e77',
        roughness: 0.28,
        metalness: 0.12,
      }
    case 'grass':
    default:
      return {
        color: patch.materialVariant === 'alt' ? '#9cae53' : '#8ea147',
        roughness: 0.99,
        metalness: 0.01,
      }
  }
}

export function LevelTerrain({ config, level, selectable, selectedPatchId, onSelectPatch, objectRefs }: LevelTerrainProps) {
  const waterMaterialRefs = useRef<Record<string, ShaderMaterial | null>>({})
  const asphaltTexture = useMemo(
    () => createAsphaltTexture({ seed: config.world.seed + 11, repeat: 46 }),
    [config.world.seed],
  )
  const trackTexture = useMemo(
    () => createAsphaltTexture({ seed: config.world.seed + 31, repeat: 24 }),
    [config.world.seed],
  )
  const pathTexture = useMemo(
    () => createPathTileTexture({ seed: config.world.seed + 21, repeat: 20 }),
    [config.world.seed],
  )

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    Object.values(waterMaterialRefs.current).forEach((material) => {
      if (!material) {
        return
      }
      const uniforms = material.uniforms as unknown as WaterUniforms
      uniforms.uTime.value = time
    })
  })

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[config.world.size / 2, 3, config.world.size / 2]} position={[0, -3, 0]} friction={1.3} />

      {level.terrainPatches.map((patch) => {
        if (!patch.collider.enabled) {
          return null
        }

        const friction = patch.collider.friction ?? 1.3
        const height = 0.16
        const colliderRotation: [number, number, number] = [0, patch.rotation[2], 0]

        if (patch.shape === 'circle') {
          return (
            <CuboidCollider
              key={`collider-${patch.id}`}
              args={[patch.size[0], height, patch.size[0]]}
              position={[patch.position[0], patch.position[1] - height, patch.position[2]]}
              rotation={colliderRotation}
              friction={friction}
            />
          )
        }

        return (
          <CuboidCollider
            key={`collider-${patch.id}`}
            args={[patch.size[0] / 2, height, patch.size[1] / 2]}
            position={[patch.position[0], patch.position[1] - height, patch.position[2]]}
            rotation={colliderRotation}
            friction={friction}
          />
        )
      })}

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[config.world.size, config.world.size, 1, 1]} />
        <meshStandardMaterial
          map={asphaltTexture ?? undefined}
          color={config.palette.baseGround}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {level.terrainPatches.map((patch) => {
        const materialProps = getPatchMaterialProps(patch, config)
        const useWaterShader = !selectable && patch.kind === 'water'
        const map =
          useWaterShader
            ? undefined
            : patch.kind === 'path'
            ? pathTexture
            : patch.kind === 'track'
              ? trackTexture
              : undefined

        return (
          <group key={patch.id}>
            <mesh
              ref={(node) => {
                if (!objectRefs) {
                  return
                }
                objectRefs.current[`terrain:${patch.id}`] = node
              }}
              receiveShadow
              rotation={patch.rotation}
              position={patch.position}
              scale={[1, 1, 1]}
              onPointerDown={(event) => {
                if (!selectable || !onSelectPatch) {
                  return
                }
                event.stopPropagation()
                onSelectPatch(patch.id)
              }}
            >
              {patch.shape === 'circle' ? (
                <circleGeometry args={[patch.size[0], 30]} />
              ) : (
                <planeGeometry args={[patch.size[0], patch.size[1], 1, 1]} />
              )}
              {useWaterShader ? (
                <shaderMaterial
                  ref={(node) => {
                    waterMaterialRefs.current[patch.id] = (node as ShaderMaterial | null) ?? null
                  }}
                  vertexShader={waterVertexShader}
                  fragmentShader={waterFragmentShader}
                  uniforms={{
                    uTime: { value: 0 },
                    uDeepColor: { value: new Color('#21416f') },
                    uShallowColor: { value: new Color(patch.materialVariant === 'alt' ? '#2f8aa5' : '#2d7291') },
                    uFoamColor: { value: new Color('#fff9e9') },
                    uGlowColor: { value: new Color('#99ead4') },
                    uSpecColor: { value: new Color('#f4f1e9') },
                  }}
                  transparent
                  depthWrite={false}
                />
              ) : (
                <meshStandardMaterial
                  map={map ?? undefined}
                  color={selectedPatchId === patch.id ? '#f6d39c' : materialProps.color}
                  roughness={materialProps.roughness}
                  metalness={materialProps.metalness}
                  emissive={patch.kind === 'water' ? '#1b3964' : '#000000'}
                  emissiveIntensity={patch.kind === 'water' ? 0.22 : 0}
                />
              )}
            </mesh>

            {!selectable && patch.kind === 'water' ? (
              <>
                {patch.shape === 'circle' ? (
                  <mesh
                    rotation={patch.rotation}
                    position={[patch.position[0], patch.position[1] + 0.0018, patch.position[2]]}
                    scale={[0.7, 0.7, 0.7]}
                  >
                    <circleGeometry args={[patch.size[0], 54]} />
                    <meshBasicMaterial color="#1d325d" transparent opacity={0.34} depthWrite={false} />
                  </mesh>
                ) : null}
                <mesh
                  rotation={patch.rotation}
                  position={[patch.position[0], patch.position[1] + 0.004, patch.position[2]]}
                  scale={[1.03, 1.03, 1.03]}
                >
                  {patch.shape === 'circle' ? (
                    <ringGeometry args={[patch.size[0] * 0.88, patch.size[0] * 1.04, 64]} />
                  ) : (
                    <planeGeometry args={[patch.size[0], patch.size[1], 1, 1]} />
                  )}
                  <meshBasicMaterial color="#71d8cf" transparent opacity={0.3} depthWrite={false} />
                </mesh>
                {patch.shape === 'circle' ? (
                  <mesh
                    rotation={patch.rotation}
                    position={[patch.position[0], patch.position[1] + 0.0062, patch.position[2]]}
                  >
                    <ringGeometry args={[patch.size[0] * 0.965, patch.size[0] * 1.015, 64]} />
                    <meshBasicMaterial color="#fff7df" transparent opacity={0.3} depthWrite={false} />
                  </mesh>
                ) : null}

                {patch.shape === 'circle' ? (
                  <group rotation={patch.rotation} position={[patch.position[0], patch.position[1] + 0.0085, patch.position[2]]}>
                    <mesh rotation={[0, 0, -0.35]}>
                      <ringGeometry args={[patch.size[0] * 0.985, patch.size[0] * 1.004, 36, 1, 0.1, Math.PI * 0.58]} />
                      <meshBasicMaterial color="#fff8e8" transparent opacity={0.42} depthWrite={false} />
                    </mesh>
                    <mesh rotation={[0, 0, 1.2]}>
                      <ringGeometry args={[patch.size[0] * 0.982, patch.size[0] * 1.0, 36, 1, 0.2, Math.PI * 0.34]} />
                      <meshBasicMaterial color="#fff8e8" transparent opacity={0.35} depthWrite={false} />
                    </mesh>
                    <mesh rotation={[0, 0, -2.1]}>
                      <ringGeometry args={[patch.size[0] * 0.98, patch.size[0] * 1.002, 36, 1, 0.1, Math.PI * 0.42]} />
                      <meshBasicMaterial color="#fef6de" transparent opacity={0.3} depthWrite={false} />
                    </mesh>
                  </group>
                ) : null}
              </>
            ) : null}
          </group>
        )
      })}

      {!selectable
        ? level.terrainPatches.map((patch) => {
            if (patch.kind !== 'track' || patch.shape !== 'plane') {
              return null
            }

            const segmentCount = Math.max(14, Math.round(patch.size[0] / 3.3))
            const segmentWidth = patch.size[0] / segmentCount
            const sideZ = patch.size[1] * 0.5

            return (
              <group
                key={`track-curbs-${patch.id}`}
                position={[patch.position[0], 0, patch.position[2]]}
                rotation={[0, patch.rotation[2], 0]}
              >
                {Array.from({ length: segmentCount }, (_, index) => {
                  const x = -patch.size[0] * 0.5 + segmentWidth * (index + 0.5)
                  const color = index % 2 === 0 ? '#de4d36' : '#f6e5e3'
                  return (
                    <group key={`curb-segment-${patch.id}-${index}`}>
                      <mesh castShadow receiveShadow position={[x, 0.012, -sideZ]}>
                        <boxGeometry args={[segmentWidth * 0.94, 0.024, 1.4]} />
                        <meshStandardMaterial color={color} roughness={0.66} metalness={0.02} />
                      </mesh>
                      <mesh castShadow receiveShadow position={[x, 0.012, sideZ]}>
                        <boxGeometry args={[segmentWidth * 0.94, 0.024, 1.4]} />
                        <meshStandardMaterial color={color} roughness={0.66} metalness={0.02} />
                      </mesh>
                    </group>
                  )
                })}

                {[-12, 2, 16, 30].map((x, index) => (
                  <group key={`chevron-${patch.id}-${index}`} position={[x, 0.013, 3.8 - index * 1.1]}>
                    <mesh rotation={[0, Math.PI * 0.25, 0]}>
                      <boxGeometry args={[1.85, 0.018, 0.3]} />
                      <meshStandardMaterial color="#f4ebf4" roughness={0.44} metalness={0.02} />
                    </mesh>
                    <mesh position={[0, 0, -1.24]} rotation={[0, -Math.PI * 0.25, 0]}>
                      <boxGeometry args={[1.85, 0.018, 0.3]} />
                      <meshStandardMaterial color="#f4ebf4" roughness={0.44} metalness={0.02} />
                    </mesh>
                  </group>
                ))}
              </group>
            )
          })
        : null}
    </RigidBody>
  )
}
