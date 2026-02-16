export type Vec3 = [number, number, number]
export type Vec2 = [number, number]

export type TerrainKind = 'path' | 'track' | 'grass' | 'water'
export type TerrainShape = 'plane' | 'circle'

export interface TerrainColliderConfig {
  enabled: boolean
  friction?: number
}

export interface TerrainPatch {
  id: string
  kind: TerrainKind
  shape: TerrainShape
  position: Vec3
  rotation: Vec3
  size: Vec2
  collider: TerrainColliderConfig
  materialVariant?: 'default' | 'alt'
}

export type EntityFamily = 'prop' | 'pushable' | 'foliage'

export interface PhysicsConfig {
  shape: 'box' | 'ball'
  mass: number
  friction: number
  restitution: number
}

export interface LevelEntity {
  id: string
  family: EntityFamily
  prefab: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
  color?: string
  physics?: PhysicsConfig
}

export interface LevelData {
  version: 1
  meta: {
    name: string
    updatedAt: string
  }
  terrainPatches: TerrainPatch[]
  entities: LevelEntity[]
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isVec2 = (value: unknown): value is Vec2 =>
  Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber)

const isVec3 = (value: unknown): value is Vec3 =>
  Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber)

const isString = (value: unknown): value is string => typeof value === 'string'

const isTerrainKind = (value: unknown): value is TerrainKind =>
  value === 'path' || value === 'track' || value === 'grass' || value === 'water'

const isTerrainShape = (value: unknown): value is TerrainShape => value === 'plane' || value === 'circle'

const isEntityFamily = (value: unknown): value is EntityFamily =>
  value === 'prop' || value === 'pushable' || value === 'foliage'

const isPhysicsConfig = (value: unknown): value is PhysicsConfig => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (record.shape !== 'box' && record.shape !== 'ball') {
    return false
  }

  return (
    isFiniteNumber(record.mass) &&
    isFiniteNumber(record.friction) &&
    isFiniteNumber(record.restitution)
  )
}

const isTerrainPatch = (value: unknown): value is TerrainPatch => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (!isString(record.id) || !isTerrainKind(record.kind) || !isTerrainShape(record.shape)) {
    return false
  }

  if (!isVec3(record.position) || !isVec3(record.rotation) || !isVec2(record.size)) {
    return false
  }

  if (!record.collider || typeof record.collider !== 'object') {
    return false
  }

  const collider = record.collider as Record<string, unknown>
  if (typeof collider.enabled !== 'boolean') {
    return false
  }
  if (collider.friction !== undefined && !isFiniteNumber(collider.friction)) {
    return false
  }

  if (record.materialVariant !== undefined && record.materialVariant !== 'default' && record.materialVariant !== 'alt') {
    return false
  }

  return true
}

const isLevelEntity = (value: unknown): value is LevelEntity => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (!isString(record.id) || !isEntityFamily(record.family) || !isString(record.prefab)) {
    return false
  }

  if (!isVec3(record.position) || !isVec3(record.rotation) || !isVec3(record.scale)) {
    return false
  }

  if (record.color !== undefined && !isString(record.color)) {
    return false
  }

  if (record.physics !== undefined && !isPhysicsConfig(record.physics)) {
    return false
  }

  return true
}

export const isLevelData = (value: unknown): value is LevelData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (record.version !== 1) {
    return false
  }

  if (!record.meta || typeof record.meta !== 'object') {
    return false
  }
  const meta = record.meta as Record<string, unknown>
  if (!isString(meta.name) || !isString(meta.updatedAt)) {
    return false
  }

  if (!Array.isArray(record.terrainPatches) || !record.terrainPatches.every(isTerrainPatch)) {
    return false
  }
  if (!Array.isArray(record.entities) || !record.entities.every(isLevelEntity)) {
    return false
  }

  return true
}

export const cloneLevelData = (level: LevelData): LevelData =>
  JSON.parse(JSON.stringify(level)) as LevelData
