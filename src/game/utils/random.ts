import { Matrix4, Quaternion, Vector3 } from 'three'

export const createRng = (seed: number) => {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const randomRange = (rng: () => number, min: number, max: number) => min + (max - min) * rng()

export const randomSign = (rng: () => number) => (rng() > 0.5 ? 1 : -1)

const tempPosition = new Vector3()
const tempScale = new Vector3()
const tempQuaternion = new Quaternion()
const upAxis = new Vector3(0, 1, 0)

export const composeMatrix = (
  x: number,
  y: number,
  z: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number,
  yaw: number,
) => {
  tempPosition.set(x, y, z)
  tempScale.set(scaleX, scaleY, scaleZ)
  tempQuaternion.setFromAxisAngle(upAxis, yaw)
  const matrix = new Matrix4()
  matrix.compose(tempPosition, tempQuaternion, tempScale)
  return matrix
}
