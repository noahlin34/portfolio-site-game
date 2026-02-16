import { Suspense, type MutableRefObject } from 'react'
import { Physics } from '@react-three/rapier'
import type { DriveControlsState } from '../../hooks/useDriveControls'
import type { ArtDirectionConfig } from '../config/artDirection'
import { VehiclePhysicsController } from '../vehicle/VehiclePhysicsController'
import { Effects } from './Effects'
import { Environment } from './Environment'
import { Foliage } from './Foliage'
import { Props } from './Props'
import { PushableObjects } from './PushableObjects'
import { Terrain } from './Terrain'

interface EnvironmentSceneProps {
  controlsRef: MutableRefObject<DriveControlsState>
  config: ArtDirectionConfig
}

export function EnvironmentScene({ controlsRef, config }: EnvironmentSceneProps) {
  return (
    <>
      <Environment config={config} />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} colliders={false}>
          <Terrain config={config} />
          <Foliage config={config} />
          <Props config={config} />
          <PushableObjects config={config} />
          <VehiclePhysicsController controlsRef={controlsRef} config={config} />
        </Physics>
      </Suspense>

      <Effects config={config} />
    </>
  )
}
