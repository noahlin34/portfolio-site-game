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

      <EffectComposer multisampling={0} resolutionScale={0.85} enableNormalPass={false}>
        <TiltShift2 blur={0.05} taper={0.82} start={[0, 0.44]} end={[1, 0.44]} direction={[0, 1]} samples={5} />
        <Bloom
          intensity={config.post.bloomIntensity * 0.62}
          luminanceThreshold={config.post.bloomThreshold}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={config.post.bloomRadius}
        />
        <BrightnessContrast brightness={config.post.colorBrightness * 0.72} contrast={config.post.colorContrast * 0.86} />
        <HueSaturation hue={0.002} saturation={config.post.colorSaturation * 0.72} />
        <Vignette eskil={false} offset={config.post.vignetteOffset} darkness={config.post.vignetteDarkness * 0.82} />
      </EffectComposer>
    </Canvas>
  )
}
