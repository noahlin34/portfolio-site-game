import type { MutableRefObject } from 'react'
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
    </Canvas>
  )
}
