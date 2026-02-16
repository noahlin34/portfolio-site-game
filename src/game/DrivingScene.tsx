import { Suspense, type MutableRefObject, useMemo, useRef } from 'react'
import { Sky } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BallCollider, CuboidCollider, Physics, type RapierRigidBody, RigidBody } from '@react-three/rapier'
import { ACESFilmicToneMapping, Color, PCFSoftShadowMap, Quaternion, ShaderMaterial, Vector3, type Group } from 'three'
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
const MAX_STEER_ANGLE = Math.PI / 5.2
const STEER_IN_RATE = 10
const STEER_OUT_RATE = 14
const CAMERA_FOCUS_DAMPING = 6
const CAMERA_POSITION_DAMPING = 9
const CAMERA_LOOK_Y = 1
const UP_AXIS = new Vector3(0, 1, 0)
const GROUND_VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv * 8.0;
    vec3 transformed = position;
    float wave = sin((position.x + uTime * 0.8) * 0.24) * cos((position.y + uTime * 0.7) * 0.3);
    transformed.z += wave * 0.6;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`
const GROUND_FRAGMENT_SHADER = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    float stripe = 0.5 + 0.5 * sin(vUv.x + vUv.y * 0.7);
    float checker = 0.5 + 0.5 * cos(vUv.x * 0.6) * sin(vUv.y * 0.6);
    float blend = clamp((stripe * 0.7 + checker * 0.3) + (vWave * 0.2), 0.0, 1.0);
    vec3 color = mix(uColorA, uColorB, blend);
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
  const materialRef = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new Color('#27512c') },
    uColorB: { value: new Color('#4d9862') },
  }), [])

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) {
      return
    }

    material.uniforms.uTime.value += delta
  })

  return (
    <shaderMaterial
      ref={materialRef}
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
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE, 220, 220]} />
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
    const steerLimit = MAX_STEER_ANGLE * (1 - speedRatio * 0.45)
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
        x: forward.x * driveImpulse,
        y: 0,
        z: forward.z * driveImpulse,
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
          <boxGeometry args={[1.7, 0.5, 3.4]} />
          <meshStandardMaterial color="#b52f33" roughness={0.38} metalness={0.25} />
        </mesh>

        <mesh position={[0, 0.42, -0.28]} castShadow>
          <boxGeometry args={[1.2, 0.36, 1.4]} />
          <meshStandardMaterial color="#f7f5ef" roughness={0.22} metalness={0.1} />
        </mesh>

        <mesh position={[0, 0.58, -0.3]}>
          <boxGeometry args={[0.98, 0.22, 1.14]} />
          <meshStandardMaterial color="#96bcd9" roughness={0.08} metalness={0.85} />
        </mesh>

        <mesh position={[-0.86, -0.17, 1.08]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.31, 0.31, 0.2, 24]} />
          <meshStandardMaterial color="#1e1e24" roughness={0.88} metalness={0.06} />
        </mesh>
        <mesh position={[0.86, -0.17, 1.08]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.31, 0.31, 0.2, 24]} />
          <meshStandardMaterial color="#1e1e24" roughness={0.88} metalness={0.06} />
        </mesh>
        <group ref={frontLeftSteerRef} position={[-0.86, -0.17, -1.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.31, 0.31, 0.2, 24]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.88} metalness={0.06} />
          </mesh>
        </group>
        <group ref={frontRightSteerRef} position={[0.86, -0.17, -1.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.31, 0.31, 0.2, 24]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.88} metalness={0.06} />
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

      <Sky
        distance={450000}
        sunPosition={[55, 14, -35]}
        turbidity={6.3}
        rayleigh={1.05}
        mieCoefficient={0.018}
        mieDirectionalG={0.88}
      />

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
