import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { createRng } from '../utils/random'

interface PathTileTextureOptions {
  seed: number
  size?: number
  repeat?: number
}

interface WaterTextureOptions {
  seed: number
  size?: number
  repeat?: number
}

export const createPathTileTexture = ({ seed, size = 512, repeat = 18 }: PathTileTextureOptions) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  const rng = createRng(seed)
  context.fillStyle = '#db9d60'
  context.fillRect(0, 0, size, size)

  const tiles = 12
  const tileSize = size / tiles

  for (let y = 0; y < tiles; y += 1) {
    for (let x = 0; x < tiles; x += 1) {
      const toneShift = (rng() - 0.5) * 24
      const shade = Math.round(218 + toneShift)
      context.fillStyle = `rgb(${shade} ${Math.max(112, shade - 58)} ${Math.max(60, shade - 102)})`
      context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)

      context.strokeStyle = 'rgb(172 112 73 / 42%)'
      context.lineWidth = 1.3
      context.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize)

      if (rng() > 0.82) {
        context.fillStyle = 'rgb(156 95 58 / 45%)'
        context.fillRect(x * tileSize + tileSize * 0.2, y * tileSize + tileSize * 0.2, tileSize * 0.12, tileSize * 0.12)
      }
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export const createWaterTexture = ({ seed, size = 384, repeat = 11 }: WaterTextureOptions) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  const rng = createRng(seed)
  context.fillStyle = '#2a5f82'
  context.fillRect(0, 0, size, size)

  const imageData = context.getImageData(0, 0, size, size)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const n = (rng() * 2 - 1) * 18
    const ripple = rng() > 0.9 ? 14 + rng() * 12 : 0
    const shade = Math.max(28, Math.min(182, Math.round(85 + n + ripple)))
    data[index] = Math.max(20, shade - 34)
    data[index + 1] = Math.max(38, shade - 7)
    data[index + 2] = Math.max(76, shade + 24)
    data[index + 3] = 255
  }

  context.putImageData(imageData, 0, 0)
  context.strokeStyle = 'rgb(224 246 255 / 18%)'
  for (let line = 0; line < 18; line += 1) {
    const y = Math.floor(rng() * size)
    context.lineWidth = 0.8 + rng() * 1.4
    context.beginPath()
    context.moveTo(0, y + (rng() - 0.5) * 8)
    context.quadraticCurveTo(size * 0.5, y + (rng() - 0.5) * 20, size, y + (rng() - 0.5) * 8)
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
