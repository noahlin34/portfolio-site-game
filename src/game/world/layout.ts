export const isPathArea = (x: number, z: number) => {
  const mainPath = Math.abs(z - x * 0.14) < 6.8 && x > -78 && x < 78
  const crossPath = Math.abs(z + x * 0.22 + 2.5) < 5.6 && z > -62 && z < 62
  const plaza = (x + 2) * (x + 2) + (z - 1.5) * (z - 1.5) < 95
  return mainPath || crossPath || plaza
}

export const isPlayableArea = (x: number, z: number, worldSize: number) => {
  const margin = worldSize * 0.5 - 4
  return Math.abs(x) < margin && Math.abs(z) < margin
}
