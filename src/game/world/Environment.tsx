import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DirectionalLight, Vector2, Vector3 } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'

interface EnvironmentProps {
  config: ArtDirectionConfig
}

export function Environment({ config }: EnvironmentProps) {
  const { gl } = useThree()
  const sunRef = useRef<DirectionalLight>(null)
  const fillRef = useRef<DirectionalLight>(null)
  const rimRef = useRef<DirectionalLight>(null)
  const shadowFocusRef = useRef(new Vector2(0, 0))
  const shadowTimerRef = useRef(0)
  const shadowMapRef = useRef(gl.shadowMap)
  const sunOffset = useMemo(
    () => new Vector3(config.lighting.sunPosition[0], config.lighting.sunPosition[1], config.lighting.sunPosition[2]),
    [config.lighting.sunPosition],
  )
  const fillOffset = useMemo(
    () => new Vector3(config.lighting.fillPosition[0], config.lighting.fillPosition[1], config.lighting.fillPosition[2]),
    [config.lighting.fillPosition],
  )
  const rimOffset = useMemo(() => new Vector3(-32, 16, -70), [])

  useEffect(() => {
    shadowMapRef.current = gl.shadowMap
    const previousAutoUpdate = shadowMapRef.current.autoUpdate
    shadowMapRef.current.autoUpdate = false
    shadowMapRef.current.needsUpdate = true
    return () => {
      shadowMapRef.current.autoUpdate = previousAutoUpdate
      shadowMapRef.current.needsUpdate = true
    }
  }, [gl])

  useFrame(({ camera }, delta) => {
    const focusX = camera.position.x
    const focusZ = camera.position.z

    const sun = sunRef.current
    if (sun) {
      sun.position.set(focusX + sunOffset.x, sunOffset.y, focusZ + sunOffset.z)
      sun.target.position.set(focusX, 0, focusZ)
      sun.target.updateMatrixWorld()
    }

    const fill = fillRef.current
    if (fill) {
      fill.position.set(focusX + fillOffset.x, fillOffset.y, focusZ + fillOffset.z)
    }

    const rim = rimRef.current
    if (rim) {
      rim.position.set(focusX + rimOffset.x, rimOffset.y, focusZ + rimOffset.z)
    }

    shadowTimerRef.current += delta
    const previousFocus = shadowFocusRef.current
    const dx = focusX - previousFocus.x
    const dz = focusZ - previousFocus.y
    if (dx * dx + dz * dz > 0.16 || shadowTimerRef.current > 1 / 24) {
      previousFocus.set(focusX, focusZ)
      shadowTimerRef.current = 0
      shadowMapRef.current.needsUpdate = true
    }
  })

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
        ref={sunRef}
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
        ref={fillRef}
        intensity={config.lighting.fillIntensity}
        color={config.lighting.fillColor}
        position={config.lighting.fillPosition}
      />
      <directionalLight ref={rimRef} intensity={0.18} color="#ffc5d5" position={[-32, 16, -70]} />
    </>
  )
}
