import { type MutableRefObject, useMemo, useRef, useState } from 'react'
import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, type RapierRigidBody, RigidBody } from '@react-three/rapier'
import { Quaternion, Vector3, type Group } from 'three'
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
  const steeringAngleRef = useRef(0)
  const cameraInitializedRef = useRef(false)
  const trailTimerRef = useRef(0)
  const [trailPoints, setTrailPoints] = useState<[number, number, number][]>([])
  const cameraOffset = useMemo(
    () => new Vector3(config.camera.offset[0], config.camera.offset[1], config.camera.offset[2]),
    [config.camera.offset],
  )

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

    rigidBody.applyImpulseAtPoint(
      {
        x: frontForward.x * driveImpulse,
        y: 0,
        z: frontForward.z * driveImpulse,
      },
      frontPoint,
      true,
    )

    const rollingImpulse = -forwardSpeed * config.vehicle.rollingResistance * delta
    rigidBody.applyImpulseAtPoint(
      {
        x: forward.x * rollingImpulse,
        y: 0,
        z: forward.z * rollingImpulse,
      },
      rearPoint,
      true,
    )

    const frontVelocity = rigidBody.velocityAtPoint(frontPoint)
    const rearVelocity = rigidBody.velocityAtPoint(rearPoint)
    const frontLateralSpeed = frontVelocity.x * frontRight.x + frontVelocity.z * frontRight.z
    const rearLateralSpeed = rearVelocity.x * right.x + rearVelocity.z * right.z

    rigidBody.applyImpulseAtPoint(
      {
        x: frontRight.x * (-frontLateralSpeed * config.vehicle.frontLateralGrip * delta),
        y: 0,
        z: frontRight.z * (-frontLateralSpeed * config.vehicle.frontLateralGrip * delta),
      },
      frontPoint,
      true,
    )

    rigidBody.applyImpulseAtPoint(
      {
        x: right.x * (-rearLateralSpeed * config.vehicle.rearLateralGrip * delta),
        y: 0,
        z: right.z * (-rearLateralSpeed * config.vehicle.rearLateralGrip * delta),
      },
      rearPoint,
      true,
    )

    const wheelBase = config.vehicle.halfWheelBase * 2
    const targetYawRate = (forwardSpeed / wheelBase) * Math.tan(steeringAngle)
    const angvel = rigidBody.angvel()
    const yawLerp = 1 - Math.exp(-delta * config.vehicle.steerYawResponse)
    rigidBody.setAngvel({ x: 0, y: angvel.y + (targetYawRate - angvel.y) * yawLerp, z: 0 }, true)

    const limitedVelocity = rigidBody.linvel()
    const horizontalSpeed = Math.hypot(limitedVelocity.x, limitedVelocity.z)

    if (horizontalSpeed > config.vehicle.maxSpeed) {
      const scale = config.vehicle.maxSpeed / horizontalSpeed
      rigidBody.setLinvel(
        {
          x: limitedVelocity.x * scale,
          y: limitedVelocity.y,
          z: limitedVelocity.z * scale,
        },
        true,
      )
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
      setTrailPoints((previous) => {
        const next = [...previous, [translation.x, 0.08, translation.z] as [number, number, number]]
        if (next.length > 72) {
          next.shift()
        }
        return next
      })
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

      {trailPoints.length > 1 ? (
        <Line
          points={trailPoints}
          color="#fff8ee"
          lineWidth={1.8}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      ) : null}
    </>
  )
}
