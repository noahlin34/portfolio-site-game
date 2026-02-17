import { type MutableRefObject, useMemo, useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, type RapierRigidBody, RigidBody } from '@react-three/rapier'
import { Mesh, MeshBasicMaterial, Quaternion, Vector3, type Group } from 'three'
import type { Line2 } from 'three-stdlib'
import type { ArtDirectionConfig } from '../config/artDirection'
import type { DriveControlsState } from '../../hooks/useDriveControls'
import { VehicleVisual } from './VehicleVisual'

interface VehiclePhysicsControllerProps {
  controlsRef: MutableRefObject<DriveControlsState>
  config: ArtDirectionConfig
}

const upAxis = new Vector3(0, 1, 0)

export function VehiclePhysicsController({ controlsRef, config }: VehiclePhysicsControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const chassisRef = useRef<Group>(null)
  const frontLeftSteerRef = useRef<Group>(null)
  const frontRightSteerRef = useRef<Group>(null)
  const carShadowRef = useRef<Mesh>(null)
  const carShadowMaterialRef = useRef<MeshBasicMaterial>(null)
  const brakeRef = useRef(false)

  const { camera } = useThree()

  const forwardRef = useRef(new Vector3())
  const rightRef = useRef(new Vector3())
  const frontForwardRef = useRef(new Vector3())
  const frontRightRef = useRef(new Vector3())
  const frontPointRef = useRef(new Vector3())
  const rearPointRef = useRef(new Vector3())
  const cameraGoalRef = useRef(new Vector3())
  const focusTargetRef = useRef(new Vector3())
  const smoothedFocusRef = useRef(new Vector3())
  const lookAtTargetRef = useRef(new Vector3())
  const quaternionRef = useRef(new Quaternion())
  const lastSafePositionRef = useRef(new Vector3(0, 1, 0))
  const steeringAngleRef = useRef(0)
  const cameraInitializedRef = useRef(false)
  const trailTimerRef = useRef(0)
  const trailPointsRef = useRef<[number, number, number][]>([])
  const trailLineRef = useRef<Line2>(null)
  const trailFlatRef = useRef<Float32Array>(new Float32Array(72 * 3))
  const resetTranslationRef = useRef({ x: 0, y: 0, z: 0 })
  const zeroVelocityRef = useRef({ x: 0, y: 0, z: 0 })
  const driveImpulseRef = useRef({ x: 0, y: 0, z: 0 })
  const rollingImpulseRef = useRef({ x: 0, y: 0, z: 0 })
  const frontGripImpulseRef = useRef({ x: 0, y: 0, z: 0 })
  const rearGripImpulseRef = useRef({ x: 0, y: 0, z: 0 })
  const angularVelocityRef = useRef({ x: 0, y: 0, z: 0 })
  const limitedVelocityRef = useRef({ x: 0, y: 0, z: 0 })
  const cameraOffset = useMemo(
    () => new Vector3(config.camera.offset[0], config.camera.offset[1], config.camera.offset[2]),
    [config.camera.offset],
  )
  const sunDirection = useMemo(() => {
    const x = -config.lighting.sunPosition[0]
    const z = -config.lighting.sunPosition[2]
    const length = Math.hypot(x, z) || 1
    return { x: x / length, z: z / length }
  }, [config.lighting.sunPosition])

  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05)
    const rigidBody = rigidBodyRef.current

    if (!rigidBody) {
      return
    }

    const forward = forwardRef.current
    const right = rightRef.current
    const frontForward = frontForwardRef.current
    const frontRight = frontRightRef.current
    const frontPoint = frontPointRef.current
    const rearPoint = rearPointRef.current
    const cameraGoal = cameraGoalRef.current
    const lookAtTarget = lookAtTargetRef.current
    const quaternion = quaternionRef.current

    const rotation = rigidBody.rotation()
    quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

    forward.set(0, 0, -1).applyQuaternion(quaternion)
    forward.y = 0

    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1)
    } else {
      forward.normalize()
    }

    right.set(forward.z, 0, -forward.x)

    const linvel = rigidBody.linvel()
    const forwardSpeed = linvel.x * forward.x + linvel.z * forward.z

    const controls = controlsRef.current
    brakeRef.current = controls.brake
    const throttleInput = Number(controls.forward) - Number(controls.backward)
    const steerInput = Number(controls.left) - Number(controls.right)

    const speedRatio = Math.min(1, Math.abs(forwardSpeed) / config.vehicle.maxSpeed)
    const steerLimit = config.vehicle.maxSteerAngle * (1 - speedRatio * 0.3)
    const targetSteering = steerInput * steerLimit
    const steerDamping = Math.abs(steerInput) > 0.001 ? config.vehicle.steerInRate : config.vehicle.steerOutRate
    const steerLerp = 1 - Math.exp(-delta * steerDamping)
    const steeringAngle = steeringAngleRef.current + (targetSteering - steeringAngleRef.current) * steerLerp
    steeringAngleRef.current = steeringAngle

    frontForward.copy(forward).applyAxisAngle(upAxis, steeringAngle).normalize()
    frontRight.set(frontForward.z, 0, -frontForward.x).normalize()

    const translation = rigidBody.translation()

    const carShadow = carShadowRef.current
    if (carShadow) {
      const lift = Math.max(0, translation.y - 1)
      const offset = 0.36 + lift * 0.82
      const speedStretch = Math.min(0.42, Math.abs(forwardSpeed) / config.vehicle.maxSpeed * 0.42)
      const liftStretch = Math.min(0.5, lift * 0.24)
      const shadowScale = 1 + speedStretch + liftStretch
      carShadow.position.set(
        translation.x + sunDirection.x * offset,
        0.032,
        translation.z + sunDirection.z * offset,
      )
      carShadow.rotation.z = Math.atan2(sunDirection.z, sunDirection.x)
      carShadow.scale.set(
        2.05 * shadowScale * (1 + Math.abs(sunDirection.x) * 0.16),
        1.38 * shadowScale * (1 + Math.abs(sunDirection.z) * 0.16),
        1,
      )
    }
    const carShadowMaterial = carShadowMaterialRef.current
    if (carShadowMaterial) {
      const lift = Math.max(0, translation.y - 1)
      const opacityTarget = Math.max(0.08, 0.34 * (1 - Math.min(0.85, lift * 0.52)))
      carShadowMaterial.opacity = opacityTarget
    }

    if (translation.y > 0.15 && translation.y < 2.5) {
      lastSafePositionRef.current.set(translation.x, 1, translation.z)
    }
    if (translation.y < -1.2) {
      const safePosition = lastSafePositionRef.current
      const resetTranslation = resetTranslationRef.current
      resetTranslation.x = safePosition.x
      resetTranslation.y = safePosition.y
      resetTranslation.z = safePosition.z
      rigidBody.setTranslation(resetTranslation, true)
      rigidBody.setLinvel(zeroVelocityRef.current, true)
      rigidBody.setAngvel(zeroVelocityRef.current, true)
      steeringAngleRef.current = 0
      if (frontLeftSteerRef.current) {
        frontLeftSteerRef.current.rotation.y = 0
      }
      if (frontRightSteerRef.current) {
        frontRightSteerRef.current.rotation.y = 0
      }
      return
    }
    frontPoint.set(
      translation.x + forward.x * config.vehicle.halfWheelBase,
      translation.y,
      translation.z + forward.z * config.vehicle.halfWheelBase,
    )
    rearPoint.set(
      translation.x - forward.x * config.vehicle.halfWheelBase,
      translation.y,
      translation.z - forward.z * config.vehicle.halfWheelBase,
    )

    const targetSpeed = throttleInput * config.vehicle.maxSpeed
    const speedDelta = targetSpeed - forwardSpeed
    const accelerationStrength = controls.brake ? config.vehicle.brakePower : config.vehicle.acceleration
    const driveImpulse = Math.min(
      config.vehicle.maxDriveImpulse,
      Math.max(-config.vehicle.maxDriveImpulse, speedDelta * accelerationStrength * delta),
    )

    const driveImpulseVector = driveImpulseRef.current
    driveImpulseVector.x = frontForward.x * driveImpulse
    driveImpulseVector.y = 0
    driveImpulseVector.z = frontForward.z * driveImpulse
    rigidBody.applyImpulseAtPoint(driveImpulseVector, frontPoint, true)

    const rollingImpulse = -forwardSpeed * config.vehicle.rollingResistance * delta
    const rollingImpulseVector = rollingImpulseRef.current
    rollingImpulseVector.x = forward.x * rollingImpulse
    rollingImpulseVector.y = 0
    rollingImpulseVector.z = forward.z * rollingImpulse
    rigidBody.applyImpulseAtPoint(rollingImpulseVector, rearPoint, true)

    const frontVelocity = rigidBody.velocityAtPoint(frontPoint)
    const rearVelocity = rigidBody.velocityAtPoint(rearPoint)
    const frontLateralSpeed = frontVelocity.x * frontRight.x + frontVelocity.z * frontRight.z
    const rearLateralSpeed = rearVelocity.x * right.x + rearVelocity.z * right.z

    const frontGripImpulse = -frontLateralSpeed * config.vehicle.frontLateralGrip * delta
    const frontGripVector = frontGripImpulseRef.current
    frontGripVector.x = frontRight.x * frontGripImpulse
    frontGripVector.y = 0
    frontGripVector.z = frontRight.z * frontGripImpulse
    rigidBody.applyImpulseAtPoint(frontGripVector, frontPoint, true)

    const rearGripImpulse = -rearLateralSpeed * config.vehicle.rearLateralGrip * delta
    const rearGripVector = rearGripImpulseRef.current
    rearGripVector.x = right.x * rearGripImpulse
    rearGripVector.y = 0
    rearGripVector.z = right.z * rearGripImpulse
    rigidBody.applyImpulseAtPoint(rearGripVector, rearPoint, true)

    const wheelBase = config.vehicle.halfWheelBase * 2
    const targetYawRate = (forwardSpeed / wheelBase) * Math.tan(steeringAngle)
    const angvel = rigidBody.angvel()
    const yawLerp = 1 - Math.exp(-delta * config.vehicle.steerYawResponse)
    const angularVelocity = angularVelocityRef.current
    angularVelocity.x = 0
    angularVelocity.y = angvel.y + (targetYawRate - angvel.y) * yawLerp
    angularVelocity.z = 0
    rigidBody.setAngvel(angularVelocity, true)

    const limitedVelocity = rigidBody.linvel()
    const horizontalSpeed = Math.hypot(limitedVelocity.x, limitedVelocity.z)

    if (horizontalSpeed > config.vehicle.maxSpeed) {
      const scale = config.vehicle.maxSpeed / horizontalSpeed
      const limitedVelocityOut = limitedVelocityRef.current
      limitedVelocityOut.x = limitedVelocity.x * scale
      limitedVelocityOut.y = limitedVelocity.y
      limitedVelocityOut.z = limitedVelocity.z * scale
      rigidBody.setLinvel(limitedVelocityOut, true)
    }

    const steerAbs = Math.abs(steeringAngle)
    if (steerAbs < 0.0001) {
      if (frontLeftSteerRef.current) {
        frontLeftSteerRef.current.rotation.y = 0
      }
      if (frontRightSteerRef.current) {
        frontRightSteerRef.current.rotation.y = 0
      }
    } else {
      const track = config.vehicle.frontTrackWidth
      const turnRadius = wheelBase / Math.tan(steerAbs)
      const innerAngle = Math.atan(wheelBase / Math.max(0.01, turnRadius - track * 0.5))
      const outerAngle = Math.atan(wheelBase / (turnRadius + track * 0.5))
      const steeringSign = Math.sign(steeringAngle)

      if (frontLeftSteerRef.current) {
        frontLeftSteerRef.current.rotation.y = steeringSign > 0 ? innerAngle : -outerAngle
      }
      if (frontRightSteerRef.current) {
        frontRightSteerRef.current.rotation.y = steeringSign > 0 ? outerAngle : -innerAngle
      }
    }

    const focusTarget = focusTargetRef.current
    const smoothedFocus = smoothedFocusRef.current

    if (chassisRef.current) {
      chassisRef.current.getWorldPosition(focusTarget)
    } else {
      focusTarget.set(translation.x, translation.y, translation.z)
    }
    focusTarget.y = config.camera.lookY

    if (!cameraInitializedRef.current) {
      smoothedFocus.copy(focusTarget)
      camera.position.copy(cameraGoal.copy(smoothedFocus).add(cameraOffset))
      cameraInitializedRef.current = true
    } else {
      const focusLerp = 1 - Math.exp(-delta * config.camera.focusDamping)
      smoothedFocus.lerp(focusTarget, focusLerp)

      cameraGoal.copy(smoothedFocus).add(cameraOffset)
      const cameraLerp = 1 - Math.exp(-delta * config.camera.positionDamping)
      camera.position.lerp(cameraGoal, cameraLerp)
    }

    lookAtTarget.copy(smoothedFocus)
    camera.lookAt(lookAtTarget)

    trailTimerRef.current += delta
    if (trailTimerRef.current >= 0.08) {
      trailTimerRef.current = 0
      const points = trailPointsRef.current
      const lastPoint = points.length > 0 ? points[points.length - 1] : null
      const hasMovedEnough = !lastPoint || Math.hypot(lastPoint[0] - translation.x, lastPoint[2] - translation.z) > 0.3
      if (!hasMovedEnough) {
        return
      }

      points.push([translation.x, 0.08, translation.z])
      if (points.length > 72) {
        points.shift()
      }
      if (points.length > 1 && trailLineRef.current) {
        const flat = trailFlatRef.current
        let cursor = 0
        for (let index = 0; index < points.length; index += 1) {
          const point = points[index]
          flat[cursor] = point[0]
          flat[cursor + 1] = point[1]
          flat[cursor + 2] = point[2]
          cursor += 3
        }
        trailLineRef.current.geometry.setPositions(flat.subarray(0, points.length * 3))
        trailLineRef.current.visible = true
      }
    }
  })

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        position={[0, 1, 0]}
        mass={2.1}
        linearDamping={0.32}
        angularDamping={0.72}
        friction={1.2}
        restitution={0.08}
        enabledRotations={[false, true, false]}
        ccd
        canSleep={false}
      >
        <CuboidCollider args={[0.86, 0.38, 1.7]} />
        <VehicleVisual
          chassisRef={chassisRef}
          frontLeftSteerRef={frontLeftSteerRef}
          frontRightSteerRef={frontRightSteerRef}
          brakingRef={brakeRef}
        />
      </RigidBody>

      <Line
        ref={trailLineRef}
        points={[
          [0, 0.08, 0],
          [0, 0.08, 0],
        ]}
        color="#fff8ee"
        lineWidth={1.8}
        transparent
        opacity={0.92}
        depthWrite={false}
        visible={false}
      />

      <mesh ref={carShadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.032, 0]} renderOrder={1}>
        <circleGeometry args={[1, 18]} />
        <meshBasicMaterial
          ref={carShadowMaterialRef}
          color="#2a1825"
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}
