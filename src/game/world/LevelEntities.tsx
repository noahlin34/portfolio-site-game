import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { MutableRefObject } from 'react'
import { type Object3D } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { EntityVisual } from '../level/prefabs'
import type { LevelData } from '../level/schema'

interface LevelEntitiesProps {
  config: ArtDirectionConfig
  level: LevelData
  simulatePhysics?: boolean
  selectable?: boolean
  selectedEntityId?: string | null
  onSelectEntity?: (entityId: string) => void
  objectRefs?: MutableRefObject<Record<string, Object3D | null>>
}

function SelectionMarker() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.15, 24]} />
      <meshBasicMaterial color="#fff4c3" transparent opacity={0.92} />
    </mesh>
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
          const physics = entity.physics ?? {
            shape: entity.prefab === 'push_ball' ? 'ball' : 'box',
            mass: 1.6,
            friction: 1,
            restitution: 0.1,
          }
          return (
            <RigidBody
              key={entity.id}
              colliders={false}
              position={entity.position}
              rotation={entity.rotation}
              linearDamping={0.3}
              angularDamping={0.44}
              friction={physics.friction}
              restitution={physics.restitution}
              mass={physics.mass}
              ccd
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
          )
        }

        return (
          <group
            key={entity.id}
            ref={(node) => {
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
            <EntityVisual entity={entity} config={config} />

            {isSelected ? <SelectionMarker /> : null}
          </group>
        )
      })}
    </>
  )
}
