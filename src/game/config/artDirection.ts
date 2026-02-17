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
    aoIntensity: number
    aoRadius: number
    aoDistanceFalloff: number
    aoSamples: number
    aoDenoiseSamples: number
    aoDenoiseRadius: number
    aoColor: string
    colorSaturation: number
    colorContrast: number
    colorBrightness: number
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
    background: '#f3b379',
    fog: '#e5a06f',
    baseGround: '#c18c57',
    path: '#e2a369',
    grassA: '#b6be5a',
    grassB: '#8f9643',
    foliagePink: '#f197b7',
    foliageYellow: '#ddd96c',
    foliageGreen: '#8fb159',
    trunk: '#6d4e3c',
    propWood: '#946844',
    propStone: '#978fab',
  },
  lighting: {
    fogNear: 54,
    fogFar: 198,
    ambientColor: '#ffe0c2',
    ambientIntensity: 0.22,
    hemisphereSky: '#ffe2c2',
    hemisphereGround: '#5e3a53',
    hemisphereIntensity: 0.94,
    sunColor: '#ffd2a4',
    sunIntensity: 2.94,
    sunPosition: [62, 18, -44],
    fillColor: '#9e67d8',
    fillIntensity: 0.18,
    fillPosition: [-92, 28, 84],
    shadowMapSize: 2048,
    shadowBounds: 62,
  },
  post: {
    exposure: 1.03,
    aoIntensity: 2.45,
    aoRadius: 2.05,
    aoDistanceFalloff: 1.7,
    aoSamples: 10,
    aoDenoiseSamples: 6,
    aoDenoiseRadius: 8,
    aoColor: '#5f3d63',
    colorSaturation: 0.1,
    colorContrast: 0.08,
    colorBrightness: -0.005,
    bloomIntensity: 0.58,
    bloomThreshold: 0.8,
    bloomRadius: 0.62,
    vignetteOffset: 0.2,
    vignetteDarkness: 0.24,
  },
  density: {
    grassTufts: 560,
    trees: 30,
    bushes: 66,
    rocks: 56,
    glowPoints: 3,
    sparkles: 120,
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
