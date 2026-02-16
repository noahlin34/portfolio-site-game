import { createDefaultLevelData } from './defaultLevel'
import { cloneLevelData, isLevelData, type LevelData } from './schema'

const LEVEL_ENDPOINT = '/__editor/level'

export async function loadLevel(): Promise<LevelData> {
  try {
    const response = await fetch(LEVEL_ENDPOINT, { method: 'GET' })
    if (!response.ok) {
      return createDefaultLevelData()
    }

    const data: unknown = await response.json()
    if (!isLevelData(data)) {
      return createDefaultLevelData()
    }
    return data
  } catch {
    return createDefaultLevelData()
  }
}

export async function saveLevel(level: LevelData): Promise<{ updatedAt: string }> {
  const response = await fetch(LEVEL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(level),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to save level')
  }

  const payload = (await response.json()) as { updatedAt?: string }
  return { updatedAt: payload.updatedAt ?? new Date().toISOString() }
}

export const cloneForEditing = (level: LevelData): LevelData => cloneLevelData(level)
