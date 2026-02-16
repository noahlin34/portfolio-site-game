import { useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Matrix4 } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { composeMatrix, createRng, randomRange } from '../utils/random'
import { isPathArea, isPathEdgeArea, isPlayableArea } from './layout'

interface FoliageProps {
  config: ArtDirectionConfig
}

interface TreePlacement {
  trunk: Matrix4
  canopy: Matrix4
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
  const flowerRef = useRef<InstancedMesh>(null)
  const trunkRef = useRef<InstancedMesh>(null)
  const pinkCanopyRef = useRef<InstancedMesh>(null)
  const yellowCanopyRef = useRef<InstancedMesh>(null)
  const greenCanopyRef = useRef<InstancedMesh>(null)

  const { grassMatrices, tallGrassMatrices, bushMatrices, flowerMatrices, trees } = useMemo(() => {
    const rng = createRng(config.world.seed + 101)
    const half = config.world.size * 0.5

    const grassMatricesData: Matrix4[] = []
    const tallGrassMatricesData: Matrix4[] = []
    const bushMatricesData: Matrix4[] = []
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

      const baseScale = randomRange(rng, 0.52, 1.58)
      grassMatricesData.push(composeMatrix(x, 0.14, z, baseScale, randomRange(rng, 0.85, 1.45), baseScale, randomRange(rng, 0, Math.PI * 2)))

      if (rng() > 0.7) {
        const tallScale = baseScale * randomRange(rng, 0.55, 0.95)
        tallGrassMatricesData.push(
          composeMatrix(
            x + randomRange(rng, -0.45, 0.45),
            0.2,
            z + randomRange(rng, -0.45, 0.45),
            tallScale,
            randomRange(rng, 1.1, 1.9),
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

      const baseScale = randomRange(rng, 0.7, 1.7)
      grassMatricesData.push(
        composeMatrix(
          x + randomRange(rng, -0.2, 0.2),
          0.15,
          z + randomRange(rng, -0.2, 0.2),
          baseScale,
          randomRange(rng, 0.9, 1.6),
          baseScale,
          randomRange(rng, 0, Math.PI * 2),
        ),
      )

      if (rng() > 0.26) {
        const tallScale = baseScale * randomRange(rng, 0.62, 1.02)
        tallGrassMatricesData.push(
          composeMatrix(
            x + randomRange(rng, -0.5, 0.5),
            0.23,
            z + randomRange(rng, -0.5, 0.5),
            tallScale,
            randomRange(rng, 1.25, 2.0),
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
        canopy: composeMatrix(x, trunkHeight + canopyScale * 0.42, z, canopyScale, canopyScale, canopyScale, randomRange(rng, 0, Math.PI * 2)),
        color,
      })
    }

    return {
      grassMatrices: grassMatricesData,
      tallGrassMatrices: tallGrassMatricesData,
      bushMatrices: bushMatricesData,
      flowerMatrices: flowerMatricesData,
      trees: treeData,
    }
  }, [config.density.bushes, config.density.grassTufts, config.density.trees, config.world.seed, config.world.size])

  const trunkMatrices = useMemo(() => trees.map((tree) => tree.trunk), [trees])
  const pinkCanopyMatrices = useMemo(() => trees.filter((tree) => tree.color === 'pink').map((tree) => tree.canopy), [trees])
  const yellowCanopyMatrices = useMemo(() => trees.filter((tree) => tree.color === 'yellow').map((tree) => tree.canopy), [trees])
  const greenCanopyMatrices = useMemo(() => trees.filter((tree) => tree.color === 'green').map((tree) => tree.canopy), [trees])

  useLayoutEffect(() => {
    applyMatrices(grassRef.current, grassMatrices)
    applyMatrices(tallGrassRef.current, tallGrassMatrices)
    applyMatrices(bushRef.current, bushMatrices)
    applyMatrices(flowerRef.current, flowerMatrices)
    applyMatrices(trunkRef.current, trunkMatrices)
    applyMatrices(pinkCanopyRef.current, pinkCanopyMatrices)
    applyMatrices(yellowCanopyRef.current, yellowCanopyMatrices)
    applyMatrices(greenCanopyRef.current, greenCanopyMatrices)
  }, [
    grassMatrices,
    tallGrassMatrices,
    bushMatrices,
    flowerMatrices,
    trunkMatrices,
    pinkCanopyMatrices,
    yellowCanopyMatrices,
    greenCanopyMatrices,
  ])

  return (
    <group>
      <instancedMesh ref={grassRef} args={[undefined, undefined, grassMatrices.length]} castShadow receiveShadow>
        <coneGeometry args={[0.42, 1.2, 5]} />
        <meshStandardMaterial color={config.palette.grassA} roughness={0.96} metalness={0.01} />
      </instancedMesh>

      <instancedMesh ref={tallGrassRef} args={[undefined, undefined, tallGrassMatrices.length]} castShadow receiveShadow>
        <coneGeometry args={[0.26, 1.7, 5]} />
        <meshStandardMaterial color="#8f9841" roughness={0.95} metalness={0.01} />
      </instancedMesh>

      <instancedMesh ref={bushRef} args={[undefined, undefined, bushMatrices.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color={config.palette.grassB} roughness={0.88} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowerMatrices.length]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#fff8e8" emissive="#ffe7bc" emissiveIntensity={0.48} roughness={0.36} metalness={0.03} />
      </instancedMesh>

      <instancedMesh ref={trunkRef} args={[undefined, undefined, trunkMatrices.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.34, 1.2, 6]} />
        <meshStandardMaterial color={config.palette.trunk} roughness={0.9} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={pinkCanopyRef} args={[undefined, undefined, pinkCanopyMatrices.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.86, 0]} />
        <meshStandardMaterial color={config.palette.foliagePink} roughness={0.82} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={yellowCanopyRef} args={[undefined, undefined, yellowCanopyMatrices.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.86, 0]} />
        <meshStandardMaterial color={config.palette.foliageYellow} roughness={0.82} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={greenCanopyRef} args={[undefined, undefined, greenCanopyMatrices.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.86, 0]} />
        <meshStandardMaterial color={config.palette.foliageGreen} roughness={0.82} metalness={0.02} />
      </instancedMesh>
    </group>
  )
}
