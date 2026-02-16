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

  context.fillStyle = '#383b40'
  context.fillRect(0, 0, size, size)

  const imageData = context.getImageData(0, 0, size, size)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const grain = (rng() * 2 - 1) * 22
    const pebble = rng() > 0.88 ? 18 + rng() * 20 : 0
    const oil = rng() > 0.975 ? -(14 + rng() * 24) : 0

    const value = Math.max(22, Math.min(136, Math.round(58 + grain + pebble + oil)))
    data[index] = value
    data[index + 1] = value + (rng() > 0.58 ? 1 : 0)
    data[index + 2] = value + (rng() > 0.68 ? 2 : 0)
    data[index + 3] = 255
  }

  context.putImageData(imageData, 0, 0)

  context.strokeStyle = 'rgb(25 26 29 / 20%)'
  for (let line = 0; line < 8; line += 1) {
    const y = Math.floor(rng() * size)
    context.lineWidth = 1 + rng() * 1.3
    context.beginPath()
    context.moveTo(0, y + (rng() - 0.5) * 8)
    context.quadraticCurveTo(size * 0.5, y + (rng() - 0.5) * 24, size, y + (rng() - 0.5) * 8)
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
