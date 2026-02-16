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
    background: '#f5b274',
    fog: '#e8a372',
    baseGround: '#ba9057',
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
    fogNear: 46,
    fogFar: 188,
    ambientColor: '#ffd8b2',
    ambientIntensity: 0.17,
    hemisphereSky: '#ffdcb9',
    hemisphereGround: '#643c58',
    hemisphereIntensity: 1.18,
    sunColor: '#ffd2a4',
    sunIntensity: 3.26,
    sunPosition: [58, 16, -41],
    fillColor: '#b56de9',
    fillIntensity: 0.44,
    fillPosition: [-92, 28, 84],
    shadowMapSize: 2048,
    shadowBounds: 62,
  },
  post: {
    exposure: 1.05,
    aoIntensity: 2.45,
    aoRadius: 2.05,
    aoDistanceFalloff: 1.7,
    aoSamples: 10,
    aoDenoiseSamples: 6,
    aoDenoiseRadius: 8,
    aoColor: '#5f3d63',
    colorSaturation: 0.1,
    colorContrast: 0.08,
    colorBrightness: -0.02,
    bloomIntensity: 0.88,
    bloomThreshold: 0.71,
    bloomRadius: 0.82,
    vignetteOffset: 0.23,
    vignetteDarkness: 0.38,
  },
  density: {
    grassTufts: 560,
    trees: 30,
    bushes: 66,
    rocks: 56,
    glowPoints: 5,
    sparkles: 220,
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
