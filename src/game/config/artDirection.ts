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
    fogNear: 50,
    fogFar: 176,
    ambientColor: '#ffd8b6',
    ambientIntensity: 0.24,
    hemisphereSky: '#ffd9b8',
    hemisphereGround: '#6e4567',
    hemisphereIntensity: 1.15,
    sunColor: '#ffbf7e',
    sunIntensity: 2.86,
    sunPosition: [52, 19, -34],
    fillColor: '#955de5',
    fillIntensity: 0.72,
    fillPosition: [-78, 20, 90],
    shadowMapSize: 4096,
    shadowBounds: 92,
  },
  post: {
    exposure: 1.08,
    bloomIntensity: 1.02,
    bloomThreshold: 0.66,
    bloomRadius: 0.9,
    vignetteOffset: 0.22,
    vignetteDarkness: 0.4,
  },
  density: {
    grassTufts: 720,
    trees: 34,
    bushes: 86,
    rocks: 72,
    glowPoints: 7,
    sparkles: 340,
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
