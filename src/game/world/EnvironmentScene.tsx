import { Suspense, type MutableRefObject } from 'react'
import { ContactShadows } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import type { DriveControlsState } from '../../hooks/useDriveControls'
import type { ArtDirectionConfig } from '../config/artDirection'
import type { LevelData } from '../level/schema'
import { VehiclePhysicsController } from '../vehicle/VehiclePhysicsController'
import { Effects } from './Effects'
import { Environment } from './Environment'
import { Foliage } from './Foliage'
import { LevelEntities } from './LevelEntities'
import { LevelTerrain } from './LevelTerrain'

interface EnvironmentSceneProps {
  controlsRef: MutableRefObject<DriveControlsState>
  config: ArtDirectionConfig
  level: LevelData
}

export function EnvironmentScene({ controlsRef, config, level }: EnvironmentSceneProps) {
  return (
    <>
      <Environment config={config} />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} colliders={false}>
          <LevelTerrain config={config} level={level} />
          <Foliage config={config} />
          <LevelEntities config={config} level={level} simulatePhysics />
          <VehiclePhysicsController controlsRef={controlsRef} config={config} />
        </Physics>
      </Suspense>

      <ContactShadows
        position={[0, 0.016, 0]}
        opacity={0.42}
        scale={config.world.size * 0.9}
        blur={2.8}
        far={config.world.size * 0.78}
        color="#5a3457"
        resolution={2048}
        smooth
        frames={Infinity}
      />

      <Effects config={config} />
    </>
  )
}
