import type { ArtDirectionConfig } from '../config/artDirection'

interface EnvironmentProps {
  config: ArtDirectionConfig
}

export function Environment({ config }: EnvironmentProps) {
  return (
    <>
      <color attach="background" args={[config.palette.background]} />
      <fog attach="fog" args={[config.palette.fog, config.lighting.fogNear, config.lighting.fogFar]} />

      <hemisphereLight
        args={[
          config.lighting.hemisphereSky,
          config.lighting.hemisphereGround,
          config.lighting.hemisphereIntensity,
        ]}
      />
      <ambientLight intensity={config.lighting.ambientIntensity} color={config.lighting.ambientColor} />
      <directionalLight
        intensity={config.lighting.sunIntensity}
        color={config.lighting.sunColor}
        position={config.lighting.sunPosition}
      />
      <directionalLight
        intensity={config.lighting.fillIntensity}
        color={config.lighting.fillColor}
        position={config.lighting.fillPosition}
      />
      <directionalLight intensity={0.2} color="#ffc5d5" position={[-32, 16, -70]} />
    </>
  )
}
