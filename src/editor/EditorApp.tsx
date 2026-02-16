import { Canvas } from '@react-three/fiber'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, Vignette } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import { artDirectionDefaults } from '../game/config/artDirection'
import { createDefaultLevelData } from '../game/level/defaultLevel'
import { entityPrefabs, getPrefabById, getPrefabsByFamily } from '../game/level/prefabCatalog'
import { cloneLevelData, isLevelData, type EntityFamily, type LevelData, type LevelEntity, type TerrainKind, type TerrainShape } from '../game/level/schema'
import { EditorViewport, type Selection } from './EditorViewport'

type ToolFamily = 'terrain' | EntityFamily
type TransformMode = 'translate' | 'rotate' | 'scale'

interface EditorAppProps {
  initialLevel: LevelData
  onSaveLevel: (level: LevelData) => Promise<{ updatedAt: string }>
  onReloadLevel: () => Promise<LevelData>
}

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`

const spawnHeightForEntity = (entity: LevelEntity) => {
  if (entity.family === 'pushable') {
    return Math.max(0.4, entity.scale[1] * 0.5)
  }
  if (entity.prefab === 'bush') {
    return 0.5
  }
  if (entity.prefab === 'grass_tuft') {
    return 0.2
  }
  return 0
}

const numberField = (
  value: number,
  onChange: (next: number) => void,
  step = 0.1,
  min?: number,
) => (
  <input
    type="number"
    value={value}
    step={step}
    min={min}
    onChange={(event) => onChange(Number(event.target.value))}
  />
)

export function EditorApp({ initialLevel, onSaveLevel, onReloadLevel }: EditorAppProps) {
  const [draft, setDraft] = useState<LevelData>(() => cloneLevelData(initialLevel))
  const [selection, setSelection] = useState<Selection>(null)
  const [toolFamily, setToolFamily] = useState<ToolFamily>('terrain')
  const [selectedPrefab, setSelectedPrefab] = useState('house')
  const [terrainKind, setTerrainKind] = useState<TerrainKind>('path')
  const [terrainShape, setTerrainShape] = useState<TerrainShape>('plane')
  const [transformMode, setTransformMode] = useState<TransformMode>('translate')
  const [showGrid, setShowGrid] = useState(true)
  const [statusText, setStatusText] = useState('Ready')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(initialLevel.meta.updatedAt)
  const baselineRef = useRef(JSON.stringify(initialLevel))

  useEffect(() => {
    if (toolFamily === 'terrain') {
      return
    }
    const candidates = getPrefabsByFamily(toolFamily)
    if (!candidates.some((prefab) => prefab.id === selectedPrefab)) {
      setSelectedPrefab(candidates[0]?.id ?? '')
    }
  }, [selectedPrefab, toolFamily])

  useEffect(() => {
    const next = cloneLevelData(initialLevel)
    setDraft(next)
    setLastSavedAt(next.meta.updatedAt)
    baselineRef.current = JSON.stringify(next)
  }, [initialLevel])

  const dirty = useMemo(() => JSON.stringify(draft) !== baselineRef.current, [draft])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) {
        return
      }
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const placeAtPoint = (x: number, z: number) => {
    if (toolFamily === 'terrain') {
      const nextPatch = {
        id: newId('patch'),
        kind: terrainKind,
        shape: terrainShape,
        position: [x, terrainKind === 'water' ? -0.02 : 0.006, z] as [number, number, number],
        rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
        size: terrainShape === 'plane' ? ([12, 6] as [number, number]) : ([4, 4] as [number, number]),
        collider: { enabled: terrainKind !== 'water', friction: terrainKind === 'track' ? 1.38 : 1.35 },
        materialVariant: 'default' as const,
      }

      setDraft((previous) => ({
        ...previous,
        meta: { ...previous.meta, updatedAt: new Date().toISOString() },
        terrainPatches: [...previous.terrainPatches, nextPatch],
      }))
      return
    }

    const prefab = getPrefabById(selectedPrefab)
    if (!prefab || prefab.family !== toolFamily) {
      return
    }

    const nextEntity: LevelEntity = {
      id: newId(toolFamily),
      family: toolFamily,
      prefab: prefab.id,
      position: [x, 0, z],
      rotation: [0, 0, 0],
      scale: [...prefab.defaultScale] as [number, number, number],
      color: prefab.defaultColor,
      physics: prefab.defaultPhysics ? { ...prefab.defaultPhysics } : undefined,
    }
    nextEntity.position[1] = spawnHeightForEntity(nextEntity)

    setDraft((previous) => ({
      ...previous,
      meta: { ...previous.meta, updatedAt: new Date().toISOString() },
      entities: [...previous.entities, nextEntity],
    }))
  }

  const selectedPatch = selection?.type === 'terrain' ? draft.terrainPatches.find((patch) => patch.id === selection.id) ?? null : null
  const selectedEntity = selection?.type === 'entity' ? draft.entities.find((entity) => entity.id === selection.id) ?? null : null

  const patchToolOptions = (
    <>
      <label>
        Terrain Kind
        <select value={terrainKind} onChange={(event) => setTerrainKind(event.target.value as TerrainKind)}>
          <option value="path">Path</option>
          <option value="track">Track</option>
          <option value="grass">Grass</option>
          <option value="water">Water</option>
        </select>
      </label>
      <label>
        Shape
        <select value={terrainShape} onChange={(event) => setTerrainShape(event.target.value as TerrainShape)}>
          <option value="plane">Plane</option>
          <option value="circle">Circle</option>
        </select>
      </label>
    </>
  )

  const entityToolOptions = (
    <label>
      Prefab
      <select value={selectedPrefab} onChange={(event) => setSelectedPrefab(event.target.value)}>
        {getPrefabsByFamily(toolFamily as EntityFamily).map((prefab) => (
          <option key={prefab.id} value={prefab.id}>
            {prefab.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <main className="editor-shell">
      <aside className="editor-panel left">
        <h2>Level Editor</h2>
        <p>Paint/place with left drag. Pan with right drag or hold space + drag.</p>
        <div className="editor-route-links">
          <a href="/">Play</a>
          <a href="/editor">Editor</a>
        </div>

        <section>
          <h3>Placement</h3>
          <div className="mode-row">
            <button className={toolFamily === 'terrain' ? 'active' : ''} onClick={() => setToolFamily('terrain')}>
              Terrain
            </button>
            <button className={toolFamily === 'prop' ? 'active' : ''} onClick={() => setToolFamily('prop')}>
              Props
            </button>
            <button className={toolFamily === 'pushable' ? 'active' : ''} onClick={() => setToolFamily('pushable')}>
              Pushables
            </button>
            <button className={toolFamily === 'foliage' ? 'active' : ''} onClick={() => setToolFamily('foliage')}>
              Foliage
            </button>
          </div>
          {toolFamily === 'terrain' ? patchToolOptions : entityToolOptions}
        </section>

        <section>
          <h3>Transform</h3>
          <div className="mode-row">
            <button className={transformMode === 'translate' ? 'active' : ''} onClick={() => setTransformMode('translate')}>
              Move
            </button>
            <button className={transformMode === 'rotate' ? 'active' : ''} onClick={() => setTransformMode('rotate')}>
              Rotate
            </button>
            <button className={transformMode === 'scale' ? 'active' : ''} onClick={() => setTransformMode('scale')}>
              Scale
            </button>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
            Show grid
          </label>
        </section>

        <section>
          <h3>Persistence</h3>
          <div className="mode-row">
            <button
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true)
                setStatusText('Saving...')
                try {
                  const nextLevel: LevelData = {
                    ...draft,
                    meta: { ...draft.meta, updatedAt: new Date().toISOString() },
                  }
                  const result = await onSaveLevel(nextLevel)
                  const syncedLevel: LevelData = {
                    ...nextLevel,
                    meta: { ...nextLevel.meta, updatedAt: result.updatedAt },
                  }
                  setDraft(syncedLevel)
                  baselineRef.current = JSON.stringify(syncedLevel)
                  setLastSavedAt(result.updatedAt)
                  setStatusText(`Saved at ${new Date(result.updatedAt).toLocaleTimeString()}`)
                } catch (error) {
                  setStatusText(error instanceof Error ? error.message : 'Save failed')
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              Save
            </button>
            <button
              onClick={async () => {
                setStatusText('Reloading...')
                const level = await onReloadLevel()
                setDraft(level)
                baselineRef.current = JSON.stringify(level)
                setLastSavedAt(level.meta.updatedAt)
                setSelection(null)
                setStatusText('Reloaded from disk')
              }}
            >
              Revert
            </button>
          </div>
          <div className="mode-row">
            <button
              onClick={() => {
                const reset = createDefaultLevelData()
                setDraft(reset)
                setSelection(null)
                setStatusText('Reset to bundled default')
              }}
            >
              Reset
            </button>
            <button
              onClick={() => {
                const payload = JSON.stringify(draft, null, 2)
                const blob = new Blob([payload], { type: 'application/json' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = 'level-export.json'
                link.click()
                URL.revokeObjectURL(link.href)
                setStatusText('Exported JSON')
              }}
            >
              Export
            </button>
            <label className="file-import">
              Import
              <input
                type="file"
                accept="application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    return
                  }
                  const text = await file.text()
                  try {
                    const payload = JSON.parse(text) as unknown
                    if (!isLevelData(payload)) {
                      throw new Error('Invalid level format')
                    }
                    setDraft(payload)
                    setSelection(null)
                    setStatusText('Imported JSON')
                  } catch (error) {
                    setStatusText(error instanceof Error ? error.message : 'Import failed')
                  } finally {
                    event.target.value = ''
                  }
                }}
              />
            </label>
          </div>
          <p className="status-line">{statusText}</p>
          <p className="status-line">Last saved: {new Date(lastSavedAt).toLocaleString()}</p>
          <p className="status-line">{dirty ? 'Unsaved changes' : 'No unsaved changes'}</p>
        </section>
      </aside>

      <section className="editor-canvas-wrap">
        <Canvas
          orthographic
          shadows
          camera={{ position: artDirectionDefaults.camera.offset, zoom: 40, near: 0.1, far: 480 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping
            gl.toneMappingExposure = artDirectionDefaults.post.exposure
            gl.shadowMap.enabled = true
            gl.shadowMap.type = PCFSoftShadowMap
          }}
        >
          <EditorViewport
            level={draft}
            selection={selection}
            transformMode={transformMode}
            showGrid={showGrid}
            onSelect={setSelection}
            onGroundPaint={(point) => placeAtPoint(point[0], point[2])}
            onCommitTransform={(nextSelection, transform) => {
              setDraft((previous) => {
                if (nextSelection.type === 'terrain') {
                  return {
                    ...previous,
                    meta: { ...previous.meta, updatedAt: new Date().toISOString() },
                    terrainPatches: previous.terrainPatches.map((patch) =>
                      patch.id === nextSelection.id
                        ? { ...patch, position: transform.position, rotation: transform.rotation, size: [Math.abs(transform.scale[0]) * patch.size[0], Math.abs(transform.scale[2]) * patch.size[1]] }
                        : patch,
                    ),
                  }
                }

                return {
                  ...previous,
                  meta: { ...previous.meta, updatedAt: new Date().toISOString() },
                  entities: previous.entities.map((entity) =>
                    entity.id === nextSelection.id
                      ? {
                          ...entity,
                          position: transform.position,
                          rotation: transform.rotation,
                          scale: [Math.abs(transform.scale[0]), Math.abs(transform.scale[1]), Math.abs(transform.scale[2])],
                        }
                      : entity,
                  ),
                }
              })
            }}
          />
          <EffectComposer multisampling={2} enableNormalPass={false}>
            <N8AO
              quality="high"
              aoRadius={artDirectionDefaults.post.aoRadius}
              distanceFalloff={artDirectionDefaults.post.aoDistanceFalloff}
              intensity={artDirectionDefaults.post.aoIntensity * 0.92}
              aoSamples={artDirectionDefaults.post.aoSamples}
              denoiseSamples={artDirectionDefaults.post.aoDenoiseSamples}
              denoiseRadius={artDirectionDefaults.post.aoDenoiseRadius}
              color={artDirectionDefaults.post.aoColor}
              screenSpaceRadius
            />
            <Bloom
              intensity={artDirectionDefaults.post.bloomIntensity * 0.84}
              luminanceThreshold={artDirectionDefaults.post.bloomThreshold}
              luminanceSmoothing={0.35}
              mipmapBlur
              radius={artDirectionDefaults.post.bloomRadius}
            />
            <BrightnessContrast
              brightness={artDirectionDefaults.post.colorBrightness}
              contrast={artDirectionDefaults.post.colorContrast * 0.92}
            />
            <HueSaturation hue={0.004} saturation={artDirectionDefaults.post.colorSaturation * 0.92} />
            <Vignette
              eskil={false}
              offset={artDirectionDefaults.post.vignetteOffset}
              darkness={artDirectionDefaults.post.vignetteDarkness}
            />
          </EffectComposer>
        </Canvas>
      </section>

      <aside className="editor-panel right">
        <h3>Inspector</h3>
        {selectedPatch ? (
          <section>
            <p>
              <strong>{selectedPatch.id}</strong>
            </p>
            <label>
              Kind
              <select
                value={selectedPatch.kind}
                onChange={(event) => {
                  const kind = event.target.value as TerrainKind
                  setDraft((previous) => ({
                    ...previous,
                    terrainPatches: previous.terrainPatches.map((patch) => (patch.id === selectedPatch.id ? { ...patch, kind } : patch)),
                  }))
                }}
              >
                <option value="path">Path</option>
                <option value="track">Track</option>
                <option value="grass">Grass</option>
                <option value="water">Water</option>
              </select>
            </label>
            <label>
              Shape
              <select
                value={selectedPatch.shape}
                onChange={(event) => {
                  const shape = event.target.value as TerrainShape
                  setDraft((previous) => ({
                    ...previous,
                    terrainPatches: previous.terrainPatches.map((patch) => (patch.id === selectedPatch.id ? { ...patch, shape } : patch)),
                  }))
                }}
              >
                <option value="plane">Plane</option>
                <option value="circle">Circle</option>
              </select>
            </label>
            <label>
              Friction
              {numberField(selectedPatch.collider.friction ?? 1.35, (value) => {
                setDraft((previous) => ({
                  ...previous,
                  terrainPatches: previous.terrainPatches.map((patch) =>
                    patch.id === selectedPatch.id ? { ...patch, collider: { ...patch.collider, friction: value } } : patch,
                  ),
                }))
              }, 0.05, 0)}
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedPatch.collider.enabled}
                onChange={(event) => {
                  const enabled = event.target.checked
                  setDraft((previous) => ({
                    ...previous,
                    terrainPatches: previous.terrainPatches.map((patch) =>
                      patch.id === selectedPatch.id ? { ...patch, collider: { ...patch.collider, enabled } } : patch,
                    ),
                  }))
                }}
              />
              Collider enabled
            </label>
            <div className="mode-row">
              <button
                onClick={() => {
                  const clone = {
                    ...selectedPatch,
                    id: newId('patch'),
                    position: [selectedPatch.position[0] + 2, selectedPatch.position[1], selectedPatch.position[2] + 2] as [number, number, number],
                  }
                  setDraft((previous) => ({ ...previous, terrainPatches: [...previous.terrainPatches, clone] }))
                }}
              >
                Duplicate
              </button>
              <button
                onClick={() => {
                  setDraft((previous) => ({
                    ...previous,
                    terrainPatches: previous.terrainPatches.filter((patch) => patch.id !== selectedPatch.id),
                  }))
                  setSelection(null)
                }}
              >
                Delete
              </button>
            </div>
          </section>
        ) : null}

        {selectedEntity ? (
          <section>
            <p>
              <strong>{selectedEntity.id}</strong>
            </p>
            <label>
              Prefab
              <select
                value={selectedEntity.prefab}
                onChange={(event) => {
                  const prefabId = event.target.value
                  setDraft((previous) => ({
                    ...previous,
                    entities: previous.entities.map((entity) =>
                      entity.id === selectedEntity.id ? { ...entity, prefab: prefabId } : entity,
                    ),
                  }))
                }}
              >
                {entityPrefabs
                  .filter((prefab) => prefab.family === selectedEntity.family)
                  .map((prefab) => (
                    <option key={prefab.id} value={prefab.id}>
                      {prefab.label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Scale X
              {numberField(selectedEntity.scale[0], (value) => {
                setDraft((previous) => ({
                  ...previous,
                  entities: previous.entities.map((entity) =>
                    entity.id === selectedEntity.id ? { ...entity, scale: [Math.abs(value), entity.scale[1], entity.scale[2]] } : entity,
                  ),
                }))
              }, 0.1, 0.1)}
            </label>
            <label>
              Scale Y
              {numberField(selectedEntity.scale[1], (value) => {
                setDraft((previous) => ({
                  ...previous,
                  entities: previous.entities.map((entity) =>
                    entity.id === selectedEntity.id ? { ...entity, scale: [entity.scale[0], Math.abs(value), entity.scale[2]] } : entity,
                  ),
                }))
              }, 0.1, 0.1)}
            </label>
            <label>
              Scale Z
              {numberField(selectedEntity.scale[2], (value) => {
                setDraft((previous) => ({
                  ...previous,
                  entities: previous.entities.map((entity) =>
                    entity.id === selectedEntity.id ? { ...entity, scale: [entity.scale[0], entity.scale[1], Math.abs(value)] } : entity,
                  ),
                }))
              }, 0.1, 0.1)}
            </label>
            {selectedEntity.family === 'pushable' && selectedEntity.physics ? (
              <>
                <label>
                  Mass
                  {numberField(selectedEntity.physics.mass, (value) => {
                    setDraft((previous) => ({
                      ...previous,
                      entities: previous.entities.map((entity) =>
                        entity.id === selectedEntity.id && entity.physics
                          ? { ...entity, physics: { ...entity.physics, mass: Math.max(0.1, value) } }
                          : entity,
                      ),
                    }))
                  }, 0.1, 0.1)}
                </label>
                <label>
                  Friction
                  {numberField(selectedEntity.physics.friction, (value) => {
                    setDraft((previous) => ({
                      ...previous,
                      entities: previous.entities.map((entity) =>
                        entity.id === selectedEntity.id && entity.physics
                          ? { ...entity, physics: { ...entity.physics, friction: Math.max(0, value) } }
                          : entity,
                      ),
                    }))
                  }, 0.05, 0)}
                </label>
              </>
            ) : null}
            <div className="mode-row">
              <button
                onClick={() => {
                  const clone: LevelEntity = {
                    ...selectedEntity,
                    id: newId(selectedEntity.family),
                    position: [selectedEntity.position[0] + 1.5, selectedEntity.position[1], selectedEntity.position[2] + 1.5],
                    scale: [...selectedEntity.scale] as [number, number, number],
                    rotation: [...selectedEntity.rotation] as [number, number, number],
                    physics: selectedEntity.physics ? { ...selectedEntity.physics } : undefined,
                  }
                  setDraft((previous) => ({ ...previous, entities: [...previous.entities, clone] }))
                }}
              >
                Duplicate
              </button>
              <button
                onClick={() => {
                  setDraft((previous) => ({
                    ...previous,
                    entities: previous.entities.filter((entity) => entity.id !== selectedEntity.id),
                  }))
                  setSelection(null)
                }}
              >
                Delete
              </button>
            </div>
          </section>
        ) : null}

        {!selectedPatch && !selectedEntity ? <p>Select terrain or an entity to edit details.</p> : null}
      </aside>
    </main>
  )
}
