import { CanvasTexture, LinearFilter, type Texture, RepeatWrapping, SRGBColorSpace } from 'three'
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

interface GroundGradientTextureOptions {
  repeatX?: number
  repeatY?: number
  topLeft?: string
  topRight?: string
  bottomLeft?: string
  bottomRight?: string
}

interface MatcapTextureOptions {
  size?: number
  base?: string
  mid?: string
  shadow?: string
  highlight?: string
}

let cachedWarmMatcap: Texture | null | undefined
let cachedCoolMatcap: Texture | null | undefined
let cachedDarkMatcap: Texture | null | undefined

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

export const createGroundGradientTexture = ({
  repeatX = 1,
  repeatY = 1,
  topLeft = '#f2bc84',
  topRight = '#df9f67',
  bottomLeft = '#bf824d',
  bottomRight = '#a66d3f',
}: GroundGradientTextureOptions = {}) => {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.fillStyle = topLeft
  context.fillRect(0, 0, 1, 1)

  context.fillStyle = topRight
  context.fillRect(1, 0, 1, 1)

  context.fillStyle = bottomLeft
  context.fillRect(0, 1, 1, 1)

  context.fillStyle = bottomRight
  context.fillRect(1, 1, 1, 1)

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export const createWarmMatcapTexture = ({
  size = 256,
  base = '#cf7b57',
  mid = '#f3b185',
  shadow = '#603545',
  highlight = '#fff1d4',
}: MatcapTextureOptions = {}) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  context.fillStyle = base
  context.fillRect(0, 0, size, size)

  const shadowGradient = context.createRadialGradient(size * 0.42, size * 0.58, size * 0.12, size * 0.5, size * 0.5, size * 0.6)
  shadowGradient.addColorStop(0, mid)
  shadowGradient.addColorStop(0.45, base)
  shadowGradient.addColorStop(1, shadow)
  context.fillStyle = shadowGradient
  context.fillRect(0, 0, size, size)

  const highlightGradient = context.createRadialGradient(size * 0.36, size * 0.28, size * 0.02, size * 0.34, size * 0.24, size * 0.24)
  highlightGradient.addColorStop(0, 'rgba(255,255,255,0.85)')
  highlightGradient.addColorStop(0.4, highlight)
  highlightGradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = highlightGradient
  context.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export const createCoolMatcapTexture = (options: MatcapTextureOptions = {}) =>
  createWarmMatcapTexture({
    base: '#5f7da0',
    mid: '#98b1cf',
    shadow: '#2d3658',
    highlight: '#eef6ff',
    ...options,
  })

export const createDarkMatcapTexture = (options: MatcapTextureOptions = {}) =>
  createWarmMatcapTexture({
    base: '#343441',
    mid: '#5c5d73',
    shadow: '#171722',
    highlight: '#b9bed0',
    ...options,
  })

export const getSharedWarmMatcapTexture = () => {
  if (cachedWarmMatcap === undefined) {
    cachedWarmMatcap = createWarmMatcapTexture()
  }
  return cachedWarmMatcap
}

export const getSharedCoolMatcapTexture = () => {
  if (cachedCoolMatcap === undefined) {
    cachedCoolMatcap = createCoolMatcapTexture()
  }
  return cachedCoolMatcap
}

export const getSharedDarkMatcapTexture = () => {
  if (cachedDarkMatcap === undefined) {
    cachedDarkMatcap = createDarkMatcapTexture()
  }
  return cachedDarkMatcap
}
