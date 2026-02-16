import rawLevel from './level.json'
import type { LevelData } from './schema'
import { cloneLevelData, isLevelData } from './schema'

if (!isLevelData(rawLevel)) {
  throw new Error('Invalid bundled level.json')
}

export const bundledLevelData: LevelData = rawLevel

export const createDefaultLevelData = (): LevelData => cloneLevelData(bundledLevelData)
