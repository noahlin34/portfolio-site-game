import { useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Matrix4 } from 'three'
import type { ArtDirectionConfig } from '../config/artDirection'
import { composeMatrix, createRng, randomRange } from '../utils/random'
import { isPathArea, isPlayableArea } from './layout'

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
  const bushRef = useRef<InstancedMesh>(null)
  const trunkRef = useRef<InstancedMesh>(null)
  const pinkCanopyRef = useRef<InstancedMesh>(null)
  const yellowCanopyRef = useRef<InstancedMesh>(null)
  const greenCanopyRef = useRef<InstancedMesh>(null)

  const { grassMatrices, bushMatrices, trees } = useMemo(() => {
    const rng = createRng(config.world.seed + 101)
    const half = config.world.size * 0.5

    const grassMatricesData: Matrix4[] = []
    const bushMatricesData: Matrix4[] = []
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
      bushMatrices: bushMatricesData,
      trees: treeData,
    }
  }, [config.density.bushes, config.density.grassTufts, config.density.trees, config.world.seed, config.world.size])

  const trunkMatrices = useMemo(() => trees.map((tree) => tree.trunk), [trees])
  const pinkCanopyMatrices = useMemo(() => trees.filter((tree) => tree.color === 'pink').map((tree) => tree.canopy), [trees])
  const yellowCanopyMatrices = useMemo(() => trees.filter((tree) => tree.color === 'yellow').map((tree) => tree.canopy), [trees])
  const greenCanopyMatrices = useMemo(() => trees.filter((tree) => tree.color === 'green').map((tree) => tree.canopy), [trees])

  useLayoutEffect(() => {
    applyMatrices(grassRef.current, grassMatrices)
    applyMatrices(bushRef.current, bushMatrices)
    applyMatrices(trunkRef.current, trunkMatrices)
    applyMatrices(pinkCanopyRef.current, pinkCanopyMatrices)
    applyMatrices(yellowCanopyRef.current, yellowCanopyMatrices)
    applyMatrices(greenCanopyRef.current, greenCanopyMatrices)
  }, [grassMatrices, bushMatrices, trunkMatrices, pinkCanopyMatrices, yellowCanopyMatrices, greenCanopyMatrices])

  return (
    <group>
      <instancedMesh ref={grassRef} args={[undefined, undefined, grassMatrices.length]} castShadow receiveShadow>
        <coneGeometry args={[0.42, 1.2, 5]} />
        <meshStandardMaterial color={config.palette.grassA} roughness={0.96} metalness={0.01} />
      </instancedMesh>

      <instancedMesh ref={bushRef} args={[undefined, undefined, bushMatrices.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color={config.palette.grassB} roughness={0.88} metalness={0.02} />
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
