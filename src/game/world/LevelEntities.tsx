import { BallCollider, CuboidCollider, type RapierRigidBody, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import { Mesh, MeshBasicMaterial, type Object3D } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { EntityVisual } from '../level/prefabs'
import type { LevelData, LevelEntity } from '../level/schema'

interface LevelEntitiesProps {
  config: ArtDirectionConfig
  level: LevelData
  simulatePhysics?: boolean
  selectable?: boolean
  selectedEntityId?: string | null
  onSelectEntity?: (entityId: string) => void
  objectRefs?: MutableRefObject<Record<string, Object3D | null>>
}

interface PushableEntityProps {
  entity: LevelEntity
  config: ArtDirectionConfig
}

function SelectionMarker() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.15, 24]} />
      <meshBasicMaterial color="#fff4c3" transparent opacity={0.92} />
    </mesh>
  )
}

function PushableEntity({ entity, config }: PushableEntityProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const shadowRef = useRef<Mesh>(null)
  const shadowMaterialRef = useRef<MeshBasicMaterial>(null)
  const sunDirection = useMemo(() => {
    const x = -config.lighting.sunPosition[0]
    const z = -config.lighting.sunPosition[2]
    const length = Math.hypot(x, z) || 1
    return { x: x / length, z: z / length }
  }, [config.lighting.sunPosition])

  useFrame(() => {
    const rigidBody = rigidBodyRef.current
    const shadow = shadowRef.current
    const shadowMaterial = shadowMaterialRef.current
    if (!rigidBody || !shadow || !shadowMaterial) {
      return
    }

    const translation = rigidBody.translation()
    const baseY = translation.y - entity.scale[1] * 0.5
    const lift = Math.max(0, baseY - 0.02)
    const offset = 0.2 + lift * 0.72
    const baseRadius = Math.max(entity.scale[0], entity.scale[2]) * 0.56
    const stretch = 1 + Math.min(0.72, lift * 0.55)
    const squash = 1 + Math.min(0.36, lift * 0.3)
    const directionAngle = Math.atan2(sunDirection.z, sunDirection.x)

    shadow.position.set(
      translation.x + sunDirection.x * offset,
      0.03,
      translation.z + sunDirection.z * offset,
    )
    shadow.rotation.z = directionAngle
    shadow.scale.set(
      baseRadius * (1 + Math.abs(sunDirection.x) * 0.18) * stretch,
      baseRadius * (1 + Math.abs(sunDirection.z) * 0.18) * squash,
      1,
    )
    shadowMaterial.opacity = Math.max(0.07, 0.26 * (1 - Math.min(0.88, lift * 0.82)))
  })

  const physics = entity.physics ?? {
    shape: entity.prefab === 'push_ball' ? 'ball' : 'box',
    mass: 1.6,
    friction: 1,
    restitution: 0.1,
  }

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        position={entity.position}
        rotation={entity.rotation}
        linearDamping={0.3}
        angularDamping={0.44}
        friction={physics.friction}
        restitution={physics.restitution}
        mass={physics.mass}
      >
        {physics.shape === 'ball' ? (
          <BallCollider args={[Math.max(entity.scale[0], entity.scale[1], entity.scale[2]) * 0.5]} />
        ) : (
          <CuboidCollider args={[entity.scale[0] / 2, entity.scale[1] / 2, entity.scale[2] / 2]} />
        )}
        <group scale={entity.scale}>
          <EntityVisual entity={entity} config={config} />
        </group>
      </RigidBody>

      <mesh ref={shadowRef} position={[entity.position[0], 0.03, entity.position[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[Math.max(entity.scale[0], entity.scale[2]) * 0.56, 12]} />
        <meshBasicMaterial ref={shadowMaterialRef} color="#2b1825" transparent opacity={0.24} depthWrite={false} />
      </mesh>
    </>
  )
}

export function LevelEntities({
  config,
  level,
  simulatePhysics,
  selectable,
  selectedEntityId,
  onSelectEntity,
  objectRefs,
}: LevelEntitiesProps) {
  const staticEntityRefs = useRef<Record<string, Object3D | null>>({})
  const cullTimerRef = useRef(0)
  const sunDirection = useMemo(() => {
    const x = -config.lighting.sunPosition[0]
    const z = -config.lighting.sunPosition[2]
    const length = Math.hypot(x, z) || 1
    return { x: x / length, z: z / length, angle: Math.atan2(z, x) }
  }, [config.lighting.sunPosition])

  useFrame(({ camera }, delta) => {
    if (selectable) {
      return
    }
    cullTimerRef.current += delta
    if (cullTimerRef.current < 1 / 12) {
      return
    }
    cullTimerRef.current = 0

    const cullRadius = config.world.size * 0.7
    const cullRadiusSq = cullRadius * cullRadius

    level.entities.forEach((entity) => {
      if (entity.family === 'pushable') {
        return
      }

      const object = staticEntityRefs.current[entity.id]
      if (!object) {
        return
      }

      const dx = entity.position[0] - camera.position.x
      const dz = entity.position[2] - camera.position.z
      object.visible = dx * dx + dz * dz < cullRadiusSq
    })
  })

  return (
    <>
      {level.entities.map((entity) => {
        const isSelected = selectedEntityId === entity.id
        const onSelect = (event: { stopPropagation: () => void }) => {
          if (!selectable || !onSelectEntity) {
            return
          }
          event.stopPropagation()
          onSelectEntity(entity.id)
        }

        if (entity.family === 'pushable' && simulatePhysics) {
          return <PushableEntity key={entity.id} entity={entity} config={config} />
        }

        return (
          <group
            key={entity.id}
            ref={(node) => {
              staticEntityRefs.current[entity.id] = node
              if (!objectRefs) {
                return
              }
              objectRefs.current[`entity:${entity.id}`] = node
            }}
            position={entity.position}
            rotation={entity.rotation}
            scale={entity.scale}
            onPointerDown={onSelect}
          >
            {!selectable ? (
              <mesh
                position={[
                  sunDirection.x * (0.22 + entity.scale[1] * 0.22),
                  0.03,
                  sunDirection.z * (0.22 + entity.scale[1] * 0.22),
                ]}
                rotation={[-Math.PI / 2, 0, sunDirection.angle]}
                renderOrder={1}
              >
                <circleGeometry args={[Math.max(entity.scale[0], entity.scale[2]) * 0.62, 12]} />
                <meshBasicMaterial
                  color="#211420"
                  transparent
                  opacity={Math.min(0.3, 0.11 + entity.scale[1] * 0.03)}
                  depthWrite={false}
                />
              </mesh>
            ) : null}

            <EntityVisual entity={entity} config={config} />

            {isSelected ? <SelectionMarker /> : null}
          </group>
        )
      })}
    </>
  )
}
