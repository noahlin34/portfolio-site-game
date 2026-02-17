import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { createRng } from '../utils/random'

interface AsphaltTextureOptions {
  seed: number
  repeat?: number
  size?: number
}

export const createAsphaltTexture = ({
  seed,
  repeat = 42,
  size = 512,
}: AsphaltTextureOptions) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  const rng = createRng(seed)

  context.fillStyle = '#5e6276'
  context.fillRect(0, 0, size, size)

  const imageData = context.getImageData(0, 0, size, size)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const grain = (rng() * 2 - 1) * 14
    const pebble = rng() > 0.9 ? 8 + rng() * 10 : 0
    const oil = rng() > 0.984 ? -(8 + rng() * 10) : 0
    const warmDust = rng() > 0.965 ? 8 + rng() * 8 : 0

    const value = Math.max(56, Math.min(176, Math.round(96 + grain + pebble + oil)))
    data[index] = Math.max(42, value + warmDust)
    data[index + 1] = Math.max(44, value + (rng() > 0.66 ? 1 : 0))
    data[index + 2] = Math.max(50, value + 6)
    data[index + 3] = 255
  }

  context.putImageData(imageData, 0, 0)

  context.strokeStyle = 'rgb(24 24 34 / 11%)'
  for (let line = 0; line < 6; line += 1) {
    const y = Math.floor(rng() * size)
    context.lineWidth = 0.8 + rng() * 0.9
    context.beginPath()
    context.moveTo(0, y + (rng() - 0.5) * 6)
    context.quadraticCurveTo(size * 0.5, y + (rng() - 0.5) * 16, size, y + (rng() - 0.5) * 6)
    context.stroke()
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
