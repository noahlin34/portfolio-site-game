export type Vec3 = [number, number, number]

export interface ArtDirectionConfig {
  world: {
    size: number
    seed: number
  }
  camera: {
    offset: Vec3
    lookY: number
    focusDamping: number
    positionDamping: number
    zoom: number
  }
  palette: {
    background: string
    fog: string
    baseGround: string
    path: string
    grassA: string
    grassB: string
    foliagePink: string
    foliageYellow: string
    foliageGreen: string
    trunk: string
    propWood: string
    propStone: string
  }
  lighting: {
    fogNear: number
    fogFar: number
    ambientColor: string
    ambientIntensity: number
    hemisphereSky: string
    hemisphereGround: string
    hemisphereIntensity: number
    sunColor: string
    sunIntensity: number
    sunPosition: Vec3
    fillColor: string
    fillIntensity: number
    fillPosition: Vec3
    shadowMapSize: number
    shadowBounds: number
  }
  post: {
    exposure: number
    bloomIntensity: number
    bloomThreshold: number
    bloomRadius: number
    vignetteOffset: number
    vignetteDarkness: number
  }
  density: {
    grassTufts: number
    trees: number
    bushes: number
    rocks: number
    glowPoints: number
    sparkles: number
  }
  vehicle: {
    maxSpeed: number
    acceleration: number
    brakePower: number
    rollingResistance: number
    frontLateralGrip: number
    rearLateralGrip: number
    maxDriveImpulse: number
    halfWheelBase: number
    frontTrackWidth: number
    maxSteerAngle: number
    steerInRate: number
    steerOutRate: number
    steerYawResponse: number
  }
}

export const artDirectionDefaults: ArtDirectionConfig = {
  world: {
    size: 170,
    seed: 7711,
  },
  camera: {
    offset: [15.5, 14.2, 15.5],
    lookY: 1,
    focusDamping: 6,
    positionDamping: 9,
    zoom: 43,
  },
  palette: {
    background: '#f7b375',
    fog: '#ebaa73',
    baseGround: '#b58b54',
    path: '#dc9f62',
    grassA: '#aeb852',
    grassB: '#8a8f3f',
    foliagePink: '#ef8ca7',
    foliageYellow: '#d9d46a',
    foliageGreen: '#89ad55',
    trunk: '#6a4b3a',
    propWood: '#8c613e',
    propStone: '#8d86a0',
  },
  lighting: {
    fogNear: 54,
    fogFar: 178,
    ambientColor: '#ffe2bf',
    ambientIntensity: 0.24,
    hemisphereSky: '#ffd7b3',
    hemisphereGround: '#7f5f43',
    hemisphereIntensity: 0.98,
    sunColor: '#ffbe7b',
    sunIntensity: 2.75,
    sunPosition: [54, 17, -33],
    fillColor: '#9fb9ff',
    fillIntensity: 0.46,
    fillPosition: [-80, 20, 88],
    shadowMapSize: 4096,
    shadowBounds: 92,
  },
  post: {
    exposure: 1.02,
    bloomIntensity: 0.78,
    bloomThreshold: 0.72,
    bloomRadius: 0.84,
    vignetteOffset: 0.21,
    vignetteDarkness: 0.4,
  },
  density: {
    grassTufts: 620,
    trees: 28,
    bushes: 70,
    rocks: 60,
    glowPoints: 8,
    sparkles: 380,
  },
  vehicle: {
    maxSpeed: 22,
    acceleration: 10,
    brakePower: 20,
    rollingResistance: 1.8,
    frontLateralGrip: 10,
    rearLateralGrip: 16,
    maxDriveImpulse: 2.4,
    halfWheelBase: 1.08,
    frontTrackWidth: 1.72,
    maxSteerAngle: Math.PI / 4.2,
    steerInRate: 10,
    steerOutRate: 14,
    steerYawResponse: 13,
  },
}
