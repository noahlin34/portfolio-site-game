interface GroundBounceOptions {
  color?: [number, number, number]
  intensity?: number
  maxHeight?: number
}

interface ShaderLike {
  vertexShader: string
  fragmentShader: string
}

const formatVec3 = ([x, y, z]: [number, number, number]) =>
  `vec3(${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)})`

export const createGroundBounceCompiler = ({
  color = [1, 0.51, 0.25],
  intensity = 0.2,
  maxHeight = 3.8,
}: GroundBounceOptions = {}) => {
  const colorLiteral = formatVec3(color)
  const intensityLiteral = intensity.toFixed(4)
  const maxHeightLiteral = maxHeight.toFixed(4)

  return (shader: ShaderLike) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGroundBounceWorldPosition;
varying vec3 vGroundBounceWorldNormal;`,
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
vGroundBounceWorldPosition = worldPosition.xyz;
vGroundBounceWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGroundBounceWorldPosition;
varying vec3 vGroundBounceWorldNormal;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `float groundBounceHeight = clamp(1.0 - (vGroundBounceWorldPosition.y / ${maxHeightLiteral}), 0.0, 1.0);
float groundBounceFacing = clamp(-normalize(vGroundBounceWorldNormal).y, 0.0, 1.0);
gl_FragColor.rgb += ${colorLiteral} * (groundBounceHeight * groundBounceFacing * ${intensityLiteral});
#include <dithering_fragment>`,
      )
  }
}

export const createGroundBounceProgramKey = ({
  color = [1, 0.51, 0.25],
  intensity = 0.2,
  maxHeight = 3.8,
}: GroundBounceOptions = {}) =>
  `ground-bounce:${color.join(',')}:${intensity.toFixed(3)}:${maxHeight.toFixed(3)}`
