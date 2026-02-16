import { OrbitControls, TransformControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MOUSE, Vector3, type Object3D } from 'three'
import { artDirectionDefaults, type ArtDirectionConfig } from '../game/config/artDirection'
import { LevelEntities } from '../game/world/LevelEntities'
import { LevelTerrain } from '../game/world/LevelTerrain'
import { Environment } from '../game/world/Environment'
import type { LevelData, Vec3 } from '../game/level/schema'

export type Selection =
  | {
      type: 'terrain'
      id: string
    }
  | {
      type: 'entity'
      id: string
    }
  | null

interface EditorViewportProps {
  level: LevelData
  config?: ArtDirectionConfig
  selection: Selection
  transformMode: 'translate' | 'rotate' | 'scale'
  showGrid: boolean
  onSelect: (selection: Selection) => void
  onGroundPaint: (point: Vec3) => void
  onCommitTransform: (selection: Exclude<Selection, null>, transform: { position: Vec3; rotation: Vec3; scale: Vec3 }) => void
}

const toVec3 = (vector: Vector3): Vec3 => [vector.x, vector.y, vector.z]
const toVec3FromXYZ = (value: { x: number; y: number; z: number }): Vec3 => [value.x, value.y, value.z]

export function EditorViewport({
  level,
  config = artDirectionDefaults,
  selection,
  transformMode,
  showGrid,
  onSelect,
  onGroundPaint,
  onCommitTransform,
}: EditorViewportProps) {
  const objectRefs = useRef<Record<string, Object3D | null>>({})
  const paintActiveRef = useRef(false)
  const lastPaintRef = useRef<Vector3 | null>(null)
  const panModifierRef = useRef(false)
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const [selectedObject, setSelectedObject] = useState<Object3D | undefined>(undefined)
  const selectedObjectRef = useRef<Object3D | undefined>(undefined)
  const { camera, gl } = useThree()

  const selectionKey = selection ? `${selection.type}:${selection.id}` : null

  useEffect(() => {
    camera.position.set(18, 24, 18)
    camera.lookAt(0, 0, 0)
  }, [camera])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        panModifierRef.current = true
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        panModifierRef.current = false
      }
    }
    const onBlur = () => {
      panModifierRef.current = false
      paintActiveRef.current = false
      lastPaintRef.current = null
    }
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    gl.domElement.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      gl.domElement.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl.domElement])

  useFrame(() => {
    const nextObject = selectionKey ? objectRefs.current[selectionKey] ?? undefined : undefined
    if (selectedObjectRef.current !== nextObject) {
      selectedObjectRef.current = nextObject
      setSelectedObject(nextObject)
    }

    if (!selectionKey) {
      return
    }
    const current = objectRefs.current[selectionKey]
    if (!current) {
      return
    }
    current.updateMatrixWorld()
  })

  const gridSize = useMemo(() => config.world.size, [config.world.size])

  return (
    <>
      <Environment config={config} />

      <Physics gravity={[0, -9.81, 0]} colliders={false}>
        <LevelTerrain
          config={config}
          level={level}
          selectable
          selectedPatchId={selection?.type === 'terrain' ? selection.id : null}
          onSelectPatch={(patchId) => onSelect({ type: 'terrain', id: patchId })}
          objectRefs={objectRefs}
        />

        <LevelEntities
          config={config}
          level={level}
          simulatePhysics={false}
          selectable
          selectedEntityId={selection?.type === 'entity' ? selection.id : null}
          onSelectEntity={(entityId) => onSelect({ type: 'entity', id: entityId })}
          objectRefs={objectRefs}
        />
      </Physics>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onPointerDown={(event) => {
          const shouldPan = panModifierRef.current || event.button === 2 || event.button === 1
          if (event.button !== 0 || shouldPan) {
            return
          }
          event.stopPropagation()
          paintActiveRef.current = true
          const point = event.point.clone()
          onGroundPaint(toVec3(point))
          lastPaintRef.current = point
          onSelect(null)
        }}
        onPointerMove={(event) => {
          if (!paintActiveRef.current) {
            return
          }
          const point = event.point.clone()
          const lastPaint = lastPaintRef.current
          if (!lastPaint || lastPaint.distanceTo(point) > 1.1) {
            onGroundPaint(toVec3(point))
            lastPaintRef.current = point
          }
        }}
        onPointerUp={() => {
          paintActiveRef.current = false
          lastPaintRef.current = null
        }}
        onContextMenu={(event) => {
          event.nativeEvent.preventDefault()
        }}
      >
        <planeGeometry args={[config.world.size, config.world.size, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showGrid ? <gridHelper args={[gridSize, 34, '#7f6a58', '#5a4a40']} position={[0, 0.02, 0]} /> : null}

      <OrbitControls
        makeDefault
        enabled={orbitEnabled}
        enableRotate={false}
        enablePan
        enableZoom
        minZoom={16}
        maxZoom={72}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
      />

      {selection && selectedObject ? (
        <TransformControls
          object={selectedObject}
          mode={transformMode}
          translationSnap={0.25}
          rotationSnap={Math.PI / 12}
          scaleSnap={0.1}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => {
            setOrbitEnabled(true)
            const object = selectedObject
            if (!object || !selection) {
              return
            }
            onCommitTransform(selection, {
              position: toVec3(object.position),
              rotation: toVec3FromXYZ(object.rotation),
              scale: toVec3(object.scale),
            })
          }}
        />
      ) : null}
    </>
  )
}
