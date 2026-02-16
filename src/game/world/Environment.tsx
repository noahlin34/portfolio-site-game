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
        castShadow
        intensity={config.lighting.sunIntensity}
        color={config.lighting.sunColor}
        position={config.lighting.sunPosition}
        shadow-mapSize={[config.lighting.shadowMapSize, config.lighting.shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-config.lighting.shadowBounds}
        shadow-camera-right={config.lighting.shadowBounds}
        shadow-camera-top={config.lighting.shadowBounds}
        shadow-camera-bottom={-config.lighting.shadowBounds}
        shadow-normalBias={0.03}
        shadow-bias={-0.00005}
        shadow-radius={3}
      />
      <directionalLight
        intensity={config.lighting.fillIntensity}
        color={config.lighting.fillColor}
        position={config.lighting.fillPosition}
      />
      <directionalLight intensity={0.18} color="#ffc5d5" position={[-32, 16, -70]} />
    </>
  )
}
