import type { MutableRefObject } from 'react'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import type { DriveControlsState } from '../hooks/useDriveControls'
import { artDirectionDefaults } from './config/artDirection'
import { EnvironmentScene } from './world/EnvironmentScene'

interface SceneProps {
  controlsRef: MutableRefObject<DriveControlsState>
}

export function DrivingScene({ controlsRef }: SceneProps) {
  const config = artDirectionDefaults

  return (
    <Canvas
      orthographic
      shadows
      camera={{
        position: config.camera.offset,
        zoom: config.camera.zoom,
        near: 0.1,
        far: 320,
      }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = config.post.exposure
        gl.shadowMap.enabled = true
        gl.shadowMap.type = PCFSoftShadowMap
      }}
    >
      <EnvironmentScene controlsRef={controlsRef} config={config} />

      <EffectComposer multisampling={2} enableNormalPass={false}>
        <Bloom
          intensity={config.post.bloomIntensity}
          luminanceThreshold={config.post.bloomThreshold}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={config.post.bloomRadius}
        />
        <Vignette eskil={false} offset={config.post.vignetteOffset} darkness={config.post.vignetteDarkness} />
      </EffectComposer>
    </Canvas>
  )
}
