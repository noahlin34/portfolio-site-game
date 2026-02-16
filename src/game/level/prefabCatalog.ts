import type { EntityFamily, PhysicsConfig } from './schema'

export interface EntityPrefabDefinition {
  id: string
  family: EntityFamily
  label: string
  defaultScale: [number, number, number]
  defaultPhysics?: PhysicsConfig
  defaultColor?: string
}

export const terrainKindOptions = [
  { id: 'path', label: 'Path' },
  { id: 'track', label: 'Track' },
  { id: 'grass', label: 'Grass' },
  { id: 'water', label: 'Water' },
] as const

export const terrainShapeOptions = [
  { id: 'plane', label: 'Plane' },
  { id: 'circle', label: 'Circle' },
] as const

export const entityPrefabs: EntityPrefabDefinition[] = [
  { id: 'house', family: 'prop', label: 'House', defaultScale: [1, 1, 1] },
  { id: 'bleachers', family: 'prop', label: 'Bleachers', defaultScale: [1, 1, 1] },
  { id: 'scoreboard', family: 'prop', label: 'Scoreboard', defaultScale: [1, 1, 1] },
  { id: 'bench', family: 'prop', label: 'Bench', defaultScale: [1, 1, 1] },
  { id: 'bench_long', family: 'prop', label: 'Long Bench', defaultScale: [1, 1, 1] },
  { id: 'lantern', family: 'prop', label: 'Lantern', defaultScale: [1, 1, 1] },
  { id: 'cone', family: 'prop', label: 'Cone', defaultScale: [1, 1, 1] },
  { id: 'arrow_sign', family: 'prop', label: 'Arrow Sign', defaultScale: [1, 1, 1] },
  { id: 'rock', family: 'prop', label: 'Rock', defaultScale: [1, 1, 1] },

  {
    id: 'push_box',
    family: 'pushable',
    label: 'Pushable Box',
    defaultScale: [1.1, 1.4, 1.1],
    defaultPhysics: { shape: 'box', mass: 1.8, friction: 1, restitution: 0.1 },
    defaultColor: '#9c83b5',
  },
  {
    id: 'push_ball',
    family: 'pushable',
    label: 'Pushable Ball',
    defaultScale: [1, 1, 1],
    defaultPhysics: { shape: 'ball', mass: 1.1, friction: 1, restitution: 0.12 },
    defaultColor: '#f2d674',
  },

  { id: 'tree_pink', family: 'foliage', label: 'Pink Tree', defaultScale: [1.3, 1.3, 1.3] },
  { id: 'tree_yellow', family: 'foliage', label: 'Yellow Tree', defaultScale: [1.3, 1.3, 1.3] },
  { id: 'tree_green', family: 'foliage', label: 'Green Tree', defaultScale: [1.3, 1.3, 1.3] },
  { id: 'bush', family: 'foliage', label: 'Bush', defaultScale: [1.2, 1, 1.2] },
  { id: 'grass_tuft', family: 'foliage', label: 'Grass Tuft', defaultScale: [1, 1.2, 1] },
]

export const getPrefabsByFamily = (family: EntityFamily) => entityPrefabs.filter((prefab) => prefab.family === family)

export const getPrefabById = (id: string) => entityPrefabs.find((prefab) => prefab.id === id)
