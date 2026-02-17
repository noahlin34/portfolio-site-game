import type { MutableRefObject } from 'react'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, TiltShift2, Vignette } from '@react-three/postprocessing'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
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
      dpr={[1, 1.25]}
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
        gl.shadowMap.enabled = false
      }}
    >
      <EnvironmentScene controlsRef={controlsRef} config={config} level={level} />

      <EffectComposer multisampling={0} resolutionScale={0.8} enableNormalPass={false}>
        <TiltShift2 blur={0.06} taper={0.7} start={[0, 0.5]} end={[1, 0.5]} direction={[0, 1]} samples={6} />
        <Bloom
          intensity={config.post.bloomIntensity * 0.72}
          luminanceThreshold={config.post.bloomThreshold}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={config.post.bloomRadius}
        />
        <BrightnessContrast brightness={config.post.colorBrightness * 0.8} contrast={config.post.colorContrast * 0.92} />
        <HueSaturation hue={0.006} saturation={config.post.colorSaturation * 0.9} />
        <Vignette eskil={false} offset={config.post.vignetteOffset} darkness={config.post.vignetteDarkness * 0.88} />
      </EffectComposer>
    </Canvas>
  )
}
