import { useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Matrix4 } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { getSharedWarmMatcapTexture } from '../materials/stylized'
import { composeMatrix, createRng, randomRange } from '../utils/random'
import { isPathArea, isPathEdgeArea, isPlayableArea } from './layout'

interface FoliageProps {
  config: ArtDirectionConfig
}

interface TreePlacement {
  trunk: Matrix4
  canopyLower: Matrix4
  canopyUpper: Matrix4
  contactShadow: Matrix4
  color: 'pink' | 'yellow' | 'green'
}

const applyMatrices = (instance: InstancedMesh | null, matrices: Matrix4[]) => {
  if (!instance) {
    return
  }

  matrices.forEach((matrix, index) => {
    instance.setMatrixAt(index, matrix)
  })
  instance.instanceMatrix.needsUpdate = true
}

export function Foliage({ config }: FoliageProps) {
  const grassRef = useRef<InstancedMesh>(null)
  const tallGrassRef = useRef<InstancedMesh>(null)
  const bushRef = useRef<InstancedMesh>(null)
  const bushShadowRef = useRef<InstancedMesh>(null)
  const flowerRef = useRef<InstancedMesh>(null)
  const trunkRef = useRef<InstancedMesh>(null)
  const treeShadowRef = useRef<InstancedMesh>(null)
  const pinkCanopyLowerRef = useRef<InstancedMesh>(null)
  const yellowCanopyLowerRef = useRef<InstancedMesh>(null)
  const greenCanopyLowerRef = useRef<InstancedMesh>(null)
  const pinkCanopyUpperRef = useRef<InstancedMesh>(null)
  const yellowCanopyUpperRef = useRef<InstancedMesh>(null)
  const greenCanopyUpperRef = useRef<InstancedMesh>(null)

  const sunDirection = useMemo(() => {
    const x = -config.lighting.sunPosition[0]
    const z = -config.lighting.sunPosition[2]
    const length = Math.hypot(x, z) || 1
    return { x: x / length, z: z / length, angle: Math.atan2(z, x) }
  }, [config.lighting.sunPosition])

  const { grassMatrices, tallGrassMatrices, bushMatrices, bushShadowMatrices, flowerMatrices, trees } = useMemo(() => {
    const rng = createRng(config.world.seed + 101)
    const half = config.world.size * 0.5

    const grassMatricesData: Matrix4[] = []
    const tallGrassMatricesData: Matrix4[] = []
    const bushMatricesData: Matrix4[] = []
    const bushShadowMatricesData: Matrix4[] = []
    const flowerMatricesData: Matrix4[] = []
    const treeData: TreePlacement[] = []

    let grassAttempts = 0
    while (grassMatricesData.length < config.density.grassTufts && grassAttempts < config.density.grassTufts * 18) {
      grassAttempts += 1
      const x = randomRange(rng, -half, half)
      const z = randomRange(rng, -half, half)

      if (!isPlayableArea(x, z, config.world.size) || isPathArea(x, z)) {
        continue
      }

      const baseScale = randomRange(rng, 0.4, 0.98)
      grassMatricesData.push(composeMatrix(x, 0.09, z, baseScale, randomRange(rng, 0.82, 1.28), baseScale, randomRange(rng, 0, Math.PI * 2)))

      if (rng() > 0.7) {
        const tallScale = baseScale * randomRange(rng, 0.56, 0.88)
        tallGrassMatricesData.push(
          composeMatrix(
            x + randomRange(rng, -0.45, 0.45),
            0.14,
            z + randomRange(rng, -0.45, 0.45),
            tallScale,
            randomRange(rng, 1.0, 1.42),
            tallScale,
            randomRange(rng, 0, Math.PI * 2),
          ),
        )
      }

      if (rng() > 0.77) {
        const flowerScale = randomRange(rng, 0.08, 0.16)
        flowerMatricesData.push(
          composeMatrix(
            x + randomRange(rng, -0.5, 0.5),
            randomRange(rng, 0.24, 0.38),
            z + randomRange(rng, -0.5, 0.5),
            flowerScale,
            flowerScale * randomRange(rng, 0.7, 1.4),
            flowerScale,
            randomRange(rng, 0, Math.PI * 2),
          ),
        )
      }
    }

    let edgeGrassAttempts = 0
    const edgeGrassTarget = Math.round(config.density.grassTufts * 0.34)
    while (edgeGrassAttempts < edgeGrassTarget * 14 && edgeGrassAttempts < 3600) {
      edgeGrassAttempts += 1
      const x = randomRange(rng, -half, half)
      const z = randomRange(rng, -half, half)

      if (!isPlayableArea(x, z, config.world.size) || isPathArea(x, z) || !isPathEdgeArea(x, z)) {
        continue
      }

      const baseScale = randomRange(rng, 0.5, 1.05)
      grassMatricesData.push(
        composeMatrix(
          x + randomRange(rng, -0.2, 0.2),
          0.1,
          z + randomRange(rng, -0.2, 0.2),
          baseScale,
          randomRange(rng, 0.84, 1.3),
          baseScale,
          randomRange(rng, 0, Math.PI * 2),
        ),
      )

      if (rng() > 0.26) {
        const tallScale = baseScale * randomRange(rng, 0.56, 0.9)
        tallGrassMatricesData.push(
          composeMatrix(
            x + randomRange(rng, -0.5, 0.5),
            0.15,
            z + randomRange(rng, -0.5, 0.5),
            tallScale,
            randomRange(rng, 1.02, 1.5),
            tallScale,
            randomRange(rng, 0, Math.PI * 2),
          ),
        )
      }

      if (rng() > 0.58) {
        const flowerScale = randomRange(rng, 0.08, 0.18)
        flowerMatricesData.push(
          composeMatrix(
            x + randomRange(rng, -0.4, 0.4),
            randomRange(rng, 0.24, 0.34),
            z + randomRange(rng, -0.4, 0.4),
            flowerScale,
            flowerScale * randomRange(rng, 0.9, 1.5),
            flowerScale,
            randomRange(rng, 0, Math.PI * 2),
          ),
        )
      }
    }

    let bushAttempts = 0
    while (bushMatricesData.length < config.density.bushes && bushAttempts < config.density.bushes * 28) {
      bushAttempts += 1
      const x = randomRange(rng, -half, half)
      const z = randomRange(rng, -half, half)
      if (!isPlayableArea(x, z, config.world.size) || isPathArea(x, z)) {
        continue
      }

      if (Math.hypot(x, z) < 12) {
        continue
      }

      const scale = randomRange(rng, 1.2, 2.6)
      bushMatricesData.push(composeMatrix(x, 0.56, z, scale, scale * randomRange(rng, 0.6, 0.9), scale, randomRange(rng, 0, Math.PI * 2)))
      const bushOffset = 0.24 + scale * 0.22
      bushShadowMatricesData.push(
        composeMatrix(
          x + sunDirection.x * bushOffset,
          0.03,
          z + sunDirection.z * bushOffset,
          scale * 0.94 * (1 + Math.abs(sunDirection.x) * 0.18),
          1,
          scale * 0.46 * (1 + Math.abs(sunDirection.z) * 0.18),
          sunDirection.angle,
        ),
      )
    }

    let treeAttempts = 0
    while (treeData.length < config.density.trees && treeAttempts < config.density.trees * 38) {
      treeAttempts += 1
      const x = randomRange(rng, -half + 6, half - 6)
      const z = randomRange(rng, -half + 6, half - 6)
      if (!isPlayableArea(x, z, config.world.size) || isPathArea(x, z)) {
        continue
      }

      if (Math.hypot(x, z) < 16) {
        continue
      }

      const trunkHeight = randomRange(rng, 1.8, 2.9)
      const canopyScale = randomRange(rng, 1.9, 3.3)
      const colorRoll = rng()
      const color: TreePlacement['color'] = colorRoll > 0.67 ? 'pink' : colorRoll > 0.35 ? 'yellow' : 'green'

      treeData.push({
        trunk: composeMatrix(x, trunkHeight * 0.55, z, 0.42, trunkHeight, 0.42, randomRange(rng, 0, Math.PI * 2)),
        canopyLower: composeMatrix(
          x + randomRange(rng, -0.14, 0.14),
          trunkHeight + canopyScale * 0.34,
          z + randomRange(rng, -0.14, 0.14),
          canopyScale,
          canopyScale * randomRange(rng, 0.9, 1.06),
          canopyScale,
          randomRange(rng, 0, Math.PI * 2),
        ),
        canopyUpper: composeMatrix(
          x + randomRange(rng, -0.26, 0.26),
          trunkHeight + canopyScale * 0.84,
          z + randomRange(rng, -0.26, 0.26),
          canopyScale * randomRange(rng, 0.52, 0.7),
          canopyScale * randomRange(rng, 0.58, 0.78),
          canopyScale * randomRange(rng, 0.52, 0.7),
          randomRange(rng, 0, Math.PI * 2),
        ),
        contactShadow: composeMatrix(
          x + sunDirection.x * (0.66 + trunkHeight * 0.36),
          0.035,
          z + sunDirection.z * (0.66 + trunkHeight * 0.36),
          canopyScale * 1.16 * (1 + Math.abs(sunDirection.x) * 0.18),
          1,
          canopyScale * 0.58 * (1 + Math.abs(sunDirection.z) * 0.18),
          sunDirection.angle,
        ),
        color,
      })
    }

    return {
      grassMatrices: grassMatricesData,
      tallGrassMatrices: tallGrassMatricesData,
      bushMatrices: bushMatricesData,
      bushShadowMatrices: bushShadowMatricesData,
      flowerMatrices: flowerMatricesData,
      trees: treeData,
    }
  }, [config.density.bushes, config.density.grassTufts, config.density.trees, config.world.seed, config.world.size, sunDirection.angle, sunDirection.x, sunDirection.z])

  const trunkMatrices = useMemo(() => trees.map((tree) => tree.trunk), [trees])
  const pinkCanopyLowerMatrices = useMemo(() => trees.filter((tree) => tree.color === 'pink').map((tree) => tree.canopyLower), [trees])
  const yellowCanopyLowerMatrices = useMemo(() => trees.filter((tree) => tree.color === 'yellow').map((tree) => tree.canopyLower), [trees])
  const greenCanopyLowerMatrices = useMemo(() => trees.filter((tree) => tree.color === 'green').map((tree) => tree.canopyLower), [trees])
  const pinkCanopyUpperMatrices = useMemo(() => trees.filter((tree) => tree.color === 'pink').map((tree) => tree.canopyUpper), [trees])
  const yellowCanopyUpperMatrices = useMemo(() => trees.filter((tree) => tree.color === 'yellow').map((tree) => tree.canopyUpper), [trees])
  const greenCanopyUpperMatrices = useMemo(() => trees.filter((tree) => tree.color === 'green').map((tree) => tree.canopyUpper), [trees])
  const treeShadowMatrices = useMemo(() => trees.map((tree) => tree.contactShadow), [trees])
  const foliageMatcap = useMemo(() => getSharedWarmMatcapTexture(), [])

  useLayoutEffect(() => {
    applyMatrices(grassRef.current, grassMatrices)
    applyMatrices(tallGrassRef.current, tallGrassMatrices)
    applyMatrices(bushRef.current, bushMatrices)
    applyMatrices(bushShadowRef.current, bushShadowMatrices)
    applyMatrices(flowerRef.current, flowerMatrices)
    applyMatrices(treeShadowRef.current, treeShadowMatrices)
    applyMatrices(trunkRef.current, trunkMatrices)
    applyMatrices(pinkCanopyLowerRef.current, pinkCanopyLowerMatrices)
    applyMatrices(yellowCanopyLowerRef.current, yellowCanopyLowerMatrices)
    applyMatrices(greenCanopyLowerRef.current, greenCanopyLowerMatrices)
    applyMatrices(pinkCanopyUpperRef.current, pinkCanopyUpperMatrices)
    applyMatrices(yellowCanopyUpperRef.current, yellowCanopyUpperMatrices)
    applyMatrices(greenCanopyUpperRef.current, greenCanopyUpperMatrices)
  }, [
    grassMatrices,
    tallGrassMatrices,
    bushMatrices,
    bushShadowMatrices,
    flowerMatrices,
    treeShadowMatrices,
    trunkMatrices,
    pinkCanopyLowerMatrices,
    yellowCanopyLowerMatrices,
    greenCanopyLowerMatrices,
    pinkCanopyUpperMatrices,
    yellowCanopyUpperMatrices,
    greenCanopyUpperMatrices,
  ])

  return (
    <group>
      <instancedMesh ref={treeShadowRef} args={[undefined, undefined, treeShadowMatrices.length]} renderOrder={1}>
        <circleGeometry args={[1, 14]} />
        <meshBasicMaterial color="#21131f" transparent opacity={0.24} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={bushShadowRef} args={[undefined, undefined, bushShadowMatrices.length]} renderOrder={1}>
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial color="#221520" transparent opacity={0.2} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={grassRef} args={[undefined, undefined, grassMatrices.length]}>
        <coneGeometry args={[0.2, 0.82, 6]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.grassA}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={tallGrassRef} args={[undefined, undefined, tallGrassMatrices.length]}>
        <coneGeometry args={[0.14, 1.22, 5]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color="#8f9841"
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={bushRef} args={[undefined, undefined, bushMatrices.length]}>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.grassB}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowerMatrices.length]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color="#fff8e8"
        />
      </instancedMesh>

      <instancedMesh ref={trunkRef} args={[undefined, undefined, trunkMatrices.length]}>
        <cylinderGeometry args={[0.22, 0.34, 1.2, 6]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.trunk}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={pinkCanopyLowerRef} args={[undefined, undefined, pinkCanopyLowerMatrices.length]}>
        <icosahedronGeometry args={[0.86, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.foliagePink}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={yellowCanopyLowerRef} args={[undefined, undefined, yellowCanopyLowerMatrices.length]}>
        <icosahedronGeometry args={[0.86, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.foliageYellow}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={greenCanopyLowerRef} args={[undefined, undefined, greenCanopyLowerMatrices.length]}>
        <icosahedronGeometry args={[0.86, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.foliageGreen}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={pinkCanopyUpperRef} args={[undefined, undefined, pinkCanopyUpperMatrices.length]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.foliagePink}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={yellowCanopyUpperRef} args={[undefined, undefined, yellowCanopyUpperMatrices.length]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.foliageYellow}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={greenCanopyUpperRef} args={[undefined, undefined, greenCanopyUpperMatrices.length]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshMatcapMaterial
          matcap={foliageMatcap ?? undefined}
          color={config.palette.foliageGreen}
          flatShading
        />
      </instancedMesh>
    </group>
  )
}
