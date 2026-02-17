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
        '#include <begin_vertex>',
        `#include <begin_vertex>
vec4 groundBounceLocalPosition = vec4(transformed, 1.0);
vec3 groundBounceLocalNormal = normal;
#ifdef USE_INSTANCING
groundBounceLocalPosition = instanceMatrix * groundBounceLocalPosition;
groundBounceLocalNormal = mat3(instanceMatrix) * groundBounceLocalNormal;
#endif
vec4 groundBounceWorldPosition = modelMatrix * groundBounceLocalPosition;
vGroundBounceWorldPosition = groundBounceWorldPosition.xyz;
vGroundBounceWorldNormal = normalize(mat3(modelMatrix) * groundBounceLocalNormal);`,
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
