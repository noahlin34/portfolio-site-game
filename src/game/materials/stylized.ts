import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { createRng } from '../utils/random'

interface PathTileTextureOptions {
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
