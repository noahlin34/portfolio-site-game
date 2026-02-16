import type { MutableRefObject } from 'react'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, Vignette } from '@react-three/postprocessing'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import type { DriveControlsState } from '../hooks/useDriveControls'
import { artDirectionDefaults } from './config/artDirection'
import type { LevelData } from './level/schema'
import { EnvironmentScene } from './world/EnvironmentScene'

interface SceneProps {
  controlsRef: MutableRefObject<DriveControlsState>
  level: LevelData
}

export function DrivingScene({ controlsRef, level }: SceneProps) {
  const config = artDirectionDefaults

  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: config.camera.offset,
        zoom: config.camera.zoom,
        near: 0.1,
        far: 320,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = config.post.exposure
        gl.shadowMap.enabled = true
        gl.shadowMap.type = PCFShadowMap
      }}
    >
      <EnvironmentScene controlsRef={controlsRef} config={config} level={level} />

      <EffectComposer multisampling={0} resolutionScale={0.7} enableNormalPass={false}>
        <N8AO
          quality="performance"
          aoRadius={config.post.aoRadius}
          distanceFalloff={config.post.aoDistanceFalloff}
          intensity={config.post.aoIntensity * 0.76}
          aoSamples={Math.min(config.post.aoSamples, 8)}
          denoiseSamples={config.post.aoDenoiseSamples}
          denoiseRadius={config.post.aoDenoiseRadius}
          color={config.post.aoColor}
          halfRes
          depthAwareUpsampling
          screenSpaceRadius
        />
        <Bloom
          intensity={config.post.bloomIntensity * 0.66}
          luminanceThreshold={config.post.bloomThreshold}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={config.post.bloomRadius}
        />
        <BrightnessContrast brightness={config.post.colorBrightness} contrast={config.post.colorContrast * 0.86} />
        <HueSaturation hue={0.004} saturation={config.post.colorSaturation * 0.84} />
        <Vignette eskil={false} offset={config.post.vignetteOffset} darkness={config.post.vignetteDarkness * 0.88} />
      </EffectComposer>
    </Canvas>
  )
}
