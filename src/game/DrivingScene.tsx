import { Suspense, type MutableRefObject, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BallCollider, CuboidCollider, Physics, type RapierRigidBody, RigidBody } from '@react-three/rapier'
import { ACESFilmicToneMapping, Color, PCFSoftShadowMap, Quaternion, Vector3, type Group } from 'three'
import type { DriveControlsState } from '../hooks/useDriveControls'

const GROUND_SIZE = 160
const MAX_SPEED = 22
const ACCELERATION = 10
const BRAKE_POWER = 20
const ROLLING_RESISTANCE = 1.8
const FRONT_LATERAL_GRIP = 10
const REAR_LATERAL_GRIP = 16
const MAX_DRIVE_IMPULSE = 2.4
const HALF_WHEEL_BASE = 1.08
const FRONT_TRACK_WIDTH = 1.72
const MAX_STEER_ANGLE = Math.PI / 4.2
const STEER_IN_RATE = 10
const STEER_OUT_RATE = 14
const STEER_YAW_RESPONSE = 13
const CAMERA_FOCUS_DAMPING = 6
const CAMERA_POSITION_DAMPING = 9
const CAMERA_LOOK_Y = 1
const UP_AXIS = new Vector3(0, 1, 0)
const GROUND_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv * 130.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const GROUND_FRAGMENT_SHADER = `
  uniform vec3 uBaseColor;
  uniform vec3 uStoneColor;
  uniform vec3 uOilColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float macro = fbm(vUv * 0.045);
    float mid = fbm(vUv * 0.16 + 12.0);
    float grain = noise(vUv * 1.9);

    float aggregateA = smoothstep(0.58, 0.93, hash(floor(vUv * 1.25)));
    float aggregateB = smoothstep(0.72, 0.97, hash(floor(vUv * 2.45) + 18.3));
    float aggregate = clamp(aggregateA * 0.45 + aggregateB * 0.4, 0.0, 1.0);

    float tarPatch = smoothstep(0.62, 0.93, fbm(vUv * 0.09 + 42.0)) * 0.32;
    float seam = smoothstep(0.47, 0.53, fract((vUv.y + sin(vUv.x * 0.035) * 1.1) * 0.085)) * 0.08;

    vec3 color = mix(uBaseColor, uStoneColor, aggregate);
    color *= 0.78 + macro * 0.28 + mid * 0.1;
    color = mix(color, uOilColor, tarPatch);
    color += (grain - 0.5) * 0.06;
    color *= 1.0 - seam;

    gl_FragColor = vec4(color, 1.0);
  }
`

interface SceneProps {
  controlsRef: MutableRefObject<DriveControlsState>
}

interface Obstacle {
  id: string
  kind: 'box' | 'ball'
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}

const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 91.133 + 7.31) * 47353.5453
  return value - Math.floor(value)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function GroundMaterial() {
  const uniforms = useMemo(() => ({
    uBaseColor: { value: new Color('#2f3136') },
    uStoneColor: { value: new Color('#44474d') },
    uOilColor: { value: new Color('#202327') },
  }), [])

  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={GROUND_VERTEX_SHADER}
      fragmentShader={GROUND_FRAGMENT_SHADER}
    />
  )
}

function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[GROUND_SIZE / 2, 0.3, GROUND_SIZE / 2]} friction={1.2} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE, 1, 1]} />
        <GroundMaterial />
      </mesh>
    </RigidBody>
  )
}

function Obstacles() {
  const obstacles = useMemo<Obstacle[]>(() => {
    const items: Obstacle[] = []

    for (let index = 0; index < 36; index += 1) {
      const radius = 12 + pseudoRandom(index * 5 + 1) * 56
      const angle = pseudoRandom(index * 5 + 2) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      if (Math.abs(x) < 8 && Math.abs(z) < 14) {
        continue
      }

      const isBall = pseudoRandom(index * 5 + 3) > 0.56
      const size = 0.8 + pseudoRandom(index * 5 + 4) * 1.4
      const hue = Math.floor(25 + pseudoRandom(index * 5 + 5) * 180)

      if (isBall) {
        const diameter = Number((size * 0.92).toFixed(2))
        items.push({
          id: `ball-${index}`,
          kind: 'ball',
          position: [x, diameter * 0.5, z],
          scale: [diameter, diameter, diameter],
          color: `hsl(${hue} 58% 57%)`,
        })
      } else {
        const width = Number(size.toFixed(2))
        const height = Number((size * (0.9 + pseudoRandom(index * 2) * 0.55)).toFixed(2))
        const depth = Number((size * (0.85 + pseudoRandom(index * 3) * 0.5)).toFixed(2))

        items.push({
          id: `box-${index}`,
          kind: 'box',
          position: [x, height * 0.5, z],
          scale: [width, height, depth],
          color: `hsl(${hue} 46% 48%)`,
        })
      }
    }

    return items
  }, [])

  return (
    <>
      {obstacles.map((obstacle) => (
        <RigidBody
          key={obstacle.id}
          colliders={false}
          position={obstacle.position}
          linearDamping={0.35}
          angularDamping={0.45}
          friction={1}
          restitution={0.12}
          mass={obstacle.kind === 'ball' ? 1.1 : 1.7}
        >
          {obstacle.kind === 'ball' ? (
            <>
              <BallCollider args={[obstacle.scale[0] * 0.5]} />
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[obstacle.scale[0] * 0.5, 24, 24]} />
                <meshStandardMaterial color={obstacle.color} roughness={0.5} metalness={0.1} />
              </mesh>
            </>
          ) : (
            <>
              <CuboidCollider args={[obstacle.scale[0] / 2, obstacle.scale[1] / 2, obstacle.scale[2] / 2]} />
              <mesh castShadow receiveShadow>
                <boxGeometry args={obstacle.scale} />
                <meshStandardMaterial color={obstacle.color} roughness={0.68} metalness={0.03} />
              </mesh>
            </>
          )}
        </RigidBody>
      ))}
    </>
  )
}

function Car({ controlsRef }: SceneProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const chassisRef = useRef<Group>(null)
  const frontLeftSteerRef = useRef<Group>(null)
  const frontRightSteerRef = useRef<Group>(null)
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
  const isoCameraOffset = useMemo(() => new Vector3(16, 15, 16), [])

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
    const throttleInput = Number(controls.forward) - Number(controls.backward)
    const steerInput = Number(controls.left) - Number(controls.right)

    const speedRatio = Math.min(1, Math.abs(forwardSpeed) / MAX_SPEED)
    const steerLimit = MAX_STEER_ANGLE * (1 - speedRatio * 0.3)
    const targetSteering = steerInput * steerLimit
    const steerDamping = Math.abs(steerInput) > 0.001 ? STEER_IN_RATE : STEER_OUT_RATE
    const steerLerp = 1 - Math.exp(-delta * steerDamping)
    const steeringAngle = steeringAngleRef.current + (targetSteering - steeringAngleRef.current) * steerLerp
    steeringAngleRef.current = steeringAngle

    frontForward.copy(forward).applyAxisAngle(UP_AXIS, steeringAngle).normalize()
    frontRight.set(frontForward.z, 0, -frontForward.x).normalize()

    const translation = rigidBody.translation()
    frontPoint.set(
      translation.x + forward.x * HALF_WHEEL_BASE,
      translation.y,
      translation.z + forward.z * HALF_WHEEL_BASE,
    )
    rearPoint.set(
      translation.x - forward.x * HALF_WHEEL_BASE,
      translation.y,
      translation.z - forward.z * HALF_WHEEL_BASE,
    )

    const targetSpeed = throttleInput * MAX_SPEED
    const speedDelta = targetSpeed - forwardSpeed
    const accelerationStrength = controls.brake ? BRAKE_POWER : ACCELERATION
    const driveImpulse = clamp(speedDelta * accelerationStrength * delta, -MAX_DRIVE_IMPULSE, MAX_DRIVE_IMPULSE)
    rigidBody.applyImpulseAtPoint(
      {
        x: frontForward.x * driveImpulse,
        y: 0,
        z: frontForward.z * driveImpulse,
      },
      frontPoint,
      true,
    )

    const rollingImpulse = -forwardSpeed * ROLLING_RESISTANCE * delta
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

    const frontLateralImpulse = -frontLateralSpeed * FRONT_LATERAL_GRIP * delta
    const rearLateralImpulse = -rearLateralSpeed * REAR_LATERAL_GRIP * delta

    rigidBody.applyImpulseAtPoint(
      {
        x: frontRight.x * frontLateralImpulse,
        y: 0,
        z: frontRight.z * frontLateralImpulse,
      },
      frontPoint,
      true,
    )
    rigidBody.applyImpulseAtPoint(
      {
        x: right.x * rearLateralImpulse,
        y: 0,
        z: right.z * rearLateralImpulse,
      },
      rearPoint,
      true,
    )

    const wheelBase = HALF_WHEEL_BASE * 2
    const targetYawRate = (forwardSpeed / wheelBase) * Math.tan(steeringAngle)
    const angvel = rigidBody.angvel()
    const yawLerp = 1 - Math.exp(-delta * STEER_YAW_RESPONSE)
    rigidBody.setAngvel({ x: 0, y: angvel.y + (targetYawRate - angvel.y) * yawLerp, z: 0 }, true)

    const limitedVelocity = rigidBody.linvel()
    const horizontalSpeed = Math.hypot(limitedVelocity.x, limitedVelocity.z)

    if (horizontalSpeed > MAX_SPEED) {
      const scale = MAX_SPEED / horizontalSpeed
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
      const turnRadius = HALF_WHEEL_BASE * 2 / Math.tan(steerAbs)
      const innerAngle = Math.atan((HALF_WHEEL_BASE * 2) / Math.max(0.01, turnRadius - FRONT_TRACK_WIDTH * 0.5))
      const outerAngle = Math.atan((HALF_WHEEL_BASE * 2) / (turnRadius + FRONT_TRACK_WIDTH * 0.5))
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
    focusTarget.y = CAMERA_LOOK_Y

    if (!cameraInitializedRef.current) {
      smoothedFocus.copy(focusTarget)
      camera.position.copy(cameraGoal.copy(smoothedFocus).add(isoCameraOffset))
      cameraInitializedRef.current = true
    } else {
      const focusLerp = 1 - Math.exp(-delta * CAMERA_FOCUS_DAMPING)
      smoothedFocus.lerp(focusTarget, focusLerp)

      cameraGoal.copy(smoothedFocus).add(isoCameraOffset)
      const cameraLerp = 1 - Math.exp(-delta * CAMERA_POSITION_DAMPING)
      camera.position.lerp(cameraGoal, cameraLerp)
    }

    lookAtTarget.copy(smoothedFocus)

    camera.lookAt(lookAtTarget)
  })

  return (
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
      canSleep={false}
    >
      <CuboidCollider args={[0.86, 0.38, 1.7]} />
      <group ref={chassisRef} position={[0, 0.55, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.78, 0.43, 3.52]} />
          <meshStandardMaterial color="#ba3636" roughness={0.35} metalness={0.28} />
        </mesh>

        <mesh position={[0, 0.26, -0.23]} castShadow receiveShadow>
          <boxGeometry args={[1.58, 0.28, 2.72]} />
          <meshStandardMaterial color="#c7403f" roughness={0.34} metalness={0.24} />
        </mesh>

        <mesh position={[0, 0.54, -0.32]} castShadow>
          <boxGeometry args={[1.2, 0.24, 1.44]} />
          <meshStandardMaterial color="#f7f6f2" roughness={0.19} metalness={0.1} />
        </mesh>

        <mesh position={[0, 0.61, -0.32]}>
          <boxGeometry args={[1.02, 0.2, 1.22]} />
          <meshStandardMaterial color="#94b1c3" roughness={0.08} metalness={0.78} />
        </mesh>

        <mesh position={[0, -0.08, -1.77]} castShadow receiveShadow>
          <boxGeometry args={[1.58, 0.24, 0.26]} />
          <meshStandardMaterial color="#24252b" roughness={0.72} metalness={0.08} />
        </mesh>
        <mesh position={[0, -0.08, 1.77]} castShadow receiveShadow>
          <boxGeometry args={[1.58, 0.24, 0.26]} />
          <meshStandardMaterial color="#24252b" roughness={0.72} metalness={0.08} />
        </mesh>

        <mesh position={[-0.86, -0.08, 0]} castShadow>
          <boxGeometry args={[0.07, 0.15, 2.86]} />
          <meshStandardMaterial color="#23242a" roughness={0.7} metalness={0.08} />
        </mesh>
        <mesh position={[0.86, -0.08, 0]} castShadow>
          <boxGeometry args={[0.07, 0.15, 2.86]} />
          <meshStandardMaterial color="#23242a" roughness={0.7} metalness={0.08} />
        </mesh>

        <mesh position={[0, 0.02, -1.8]}>
          <boxGeometry args={[0.88, 0.18, 0.05]} />
          <meshStandardMaterial color="#121319" roughness={0.55} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, -1.8]}>
          <boxGeometry args={[0.88, 0.03, 0.06]} />
          <meshStandardMaterial color="#2d2f34" roughness={0.48} metalness={0.45} />
        </mesh>
        <mesh position={[0, -0.04, -1.8]}>
          <boxGeometry args={[0.88, 0.03, 0.06]} />
          <meshStandardMaterial color="#2d2f34" roughness={0.48} metalness={0.45} />
        </mesh>

        <mesh position={[-0.56, 0.08, -1.78]}>
          <boxGeometry args={[0.22, 0.11, 0.09]} />
          <meshStandardMaterial color="#ffe8b4" emissive="#ffce75" emissiveIntensity={0.35} roughness={0.2} />
        </mesh>
        <mesh position={[0.56, 0.08, -1.78]}>
          <boxGeometry args={[0.22, 0.11, 0.09]} />
          <meshStandardMaterial color="#ffe8b4" emissive="#ffce75" emissiveIntensity={0.35} roughness={0.2} />
        </mesh>

        <mesh position={[-0.57, 0.05, 1.78]}>
          <boxGeometry args={[0.24, 0.1, 0.08]} />
          <meshStandardMaterial color="#ff5d58" emissive="#a51512" emissiveIntensity={0.55} roughness={0.24} />
        </mesh>
        <mesh position={[0.57, 0.05, 1.78]}>
          <boxGeometry args={[0.24, 0.1, 0.08]} />
          <meshStandardMaterial color="#ff5d58" emissive="#a51512" emissiveIntensity={0.55} roughness={0.24} />
        </mesh>

        <mesh position={[-0.95, 0.33, -0.58]} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.2]} />
          <meshStandardMaterial color="#191a1e" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[0.95, 0.33, -0.58]} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.2]} />
          <meshStandardMaterial color="#191a1e" roughness={0.45} metalness={0.2} />
        </mesh>

        <mesh position={[0, 0.34, -0.97]}>
          <boxGeometry args={[1.12, 0.04, 0.72]} />
          <meshStandardMaterial color="#9cb6c8" roughness={0.1} metalness={0.72} transparent opacity={0.78} />
        </mesh>
        <mesh position={[0, 0.34, 0.43]}>
          <boxGeometry args={[1.02, 0.04, 0.52]} />
          <meshStandardMaterial color="#7f98ad" roughness={0.12} metalness={0.66} transparent opacity={0.65} />
        </mesh>

        <mesh position={[-0.48, 0.16, -0.18]}>
          <boxGeometry args={[0.24, 0.03, 0.04]} />
          <meshStandardMaterial color="#dcdbd8" roughness={0.3} metalness={0.42} />
        </mesh>
        <mesh position={[0.48, 0.16, -0.18]}>
          <boxGeometry args={[0.24, 0.03, 0.04]} />
          <meshStandardMaterial color="#dcdbd8" roughness={0.3} metalness={0.42} />
        </mesh>

        <group position={[-0.86, -0.17, 1.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
            <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
            <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
            <meshStandardMaterial color="#a2a9b4" roughness={0.34} metalness={0.82} />
          </mesh>
        </group>

        <group position={[0.86, -0.17, 1.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
            <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
            <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
            <meshStandardMaterial color="#a2a9b4" roughness={0.34} metalness={0.82} />
          </mesh>
        </group>

        <group ref={frontLeftSteerRef} position={[-0.86, -0.17, -1.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
            <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
            <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
            <meshStandardMaterial color="#a2a9b4" roughness={0.34} metalness={0.82} />
          </mesh>
        </group>
        <group ref={frontRightSteerRef} position={[0.86, -0.17, -1.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.33, 0.33, 0.24, 28]} />
            <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0.03} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 22]} />
            <meshStandardMaterial color="#d6dae2" roughness={0.24} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
            <meshStandardMaterial color="#a2a9b4" roughness={0.34} metalness={0.82} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  )
}

function World({ controlsRef }: SceneProps) {
  return (
    <>
      <color attach="background" args={['#ffd1ab']} />
      <fog attach="fog" args={['#f5b784', 70, 190]} />

      <hemisphereLight args={['#ffd8b1', '#7a5839', 0.92]} />
      <ambientLight intensity={0.2} color="#ffe2c3" />
      <directionalLight
        castShadow
        intensity={2.35}
        color="#ffbe7f"
        position={[55, 14, -35]}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={85}
        shadow-camera-bottom={-85}
        shadow-normalBias={0.02}
        shadow-bias={-0.00008}
      />
      <directionalLight intensity={0.38} color="#9cb6ff" position={[-75, 22, 86]} />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} colliders={false}>
          <Ground />
          <Obstacles />
          <Car controlsRef={controlsRef} />
        </Physics>
      </Suspense>
    </>
  )
}

export function DrivingScene({ controlsRef }: SceneProps) {
  return (
    <Canvas
      orthographic
      shadows
      camera={{ position: [16, 15, 16], zoom: 45, near: 0.1, far: 300 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 0.98
        gl.shadowMap.enabled = true
        gl.shadowMap.type = PCFSoftShadowMap
      }}
    >
      <World controlsRef={controlsRef} />
    </Canvas>
  )
}
