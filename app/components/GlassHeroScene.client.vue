<script setup lang="ts">
import {
  BackSide, CanvasTexture, FrontSide, Group, HalfFloatType,
  LinearFilter, Mesh, PerspectiveCamera, PlaneGeometry, Quaternion, Scene,
  ShaderMaterial, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const props = defineProps<{ lines: string[] }>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const dragging = ref(false)
const CAMERA_DISTANCE = 10
const ICE_EDGE_LENGTH = 1
const ICE_CORNER_RADIUS = .09
const ICE_CORNER_SEGMENTS = 12
let spinRemaining = 0
const velocity = new Vector2()
let releaseTime = -2
let redraw = () => {}
let disposeScene = () => {}

function rotate(direction: number) {
  velocity.set(0, 0)
  spinRemaining = direction * Math.PI / 2
}
defineExpose({ rotate })
watch(() => props.lines, () => redraw())

onMounted(async () => {
  await nextTick()
  const element = canvas.value!
  const renderer = new WebGLRenderer({ canvas: element, antialias: true, alpha: false })
  renderer.setClearColor(0x000000)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.autoClear = false
  const camera = new PerspectiveCamera(30, 1, .1, 100)
  camera.position.z = CAMERA_DISTANCE
  const scene = new Scene()
  const backgroundScene = new Scene()
  const pivot = new Group()
  const spinner = new Group()
  spinner.rotation.set(-.42, .62, .18)
  pivot.add(spinner)
  scene.add(pivot)
  const headline = document.createElement('canvas')
  const context = headline.getContext('2d')!
  const texture = new CanvasTexture(headline)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  const backgroundMaterial = new ShaderMaterial({
    uniforms: { uTex: { value: texture } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(uTex, vUv);
        #include <colorspace_fragment>
      }
    `,
    depthTest: false,
    depthWrite: false,
  })
  const plane = new Mesh(new PlaneGeometry(2, 2), backgroundMaterial)
  plane.frustumCulled = false
  backgroundScene.add(plane)
  const targetBack = new WebGLRenderTarget(1, 1, { type: HalfFloatType })
  const targetFront = new WebGLRenderTarget(1, 1, { type: HalfFloatType })
  const resolution = new Vector2()
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vEye;
    varying vec3 vIcePosition;
    varying vec3 vViewPosition;
    varying float vIceScale;
    void main() {
      const float MELT_DEPTH = 0.02;
      const float RIPPLE_DEPTH = 0.008;
      const float FOLD_DEPTH = 0.003;
      float melt = dot(position, vec3(9.0, 3.0, 7.0)) + 0.8 * sin(position.y * 11.0);
      float ripple = dot(position, vec3(-13.0, 17.0, 5.0)) + 0.45 * sin(position.z * 15.0);
      float fold = dot(position, vec3(23.0, -7.0, 19.0));
      float relief = MELT_DEPTH * sin(melt) + RIPPLE_DEPTH * sin(ripple) + FOLD_DEPTH * sin(fold);
      vec3 gradient = MELT_DEPTH * cos(melt) * vec3(9.0, 3.0 + 8.8 * cos(position.y * 11.0), 7.0)
        + RIPPLE_DEPTH * cos(ripple) * vec3(-13.0, 17.0, 5.0 + 6.75 * cos(position.z * 15.0))
        + FOLD_DEPTH * cos(fold) * vec3(23.0, -7.0, 19.0);
      vec3 iceNormal = normalize(normal - gradient + normal * dot(gradient, normal));
      vec3 icePosition = position + normal * relief;
      vec4 worldPos = modelMatrix * vec4(icePosition, 1.0);
      vec4 mvPos = viewMatrix * worldPos;
      vNormal = normalize(normalMatrix * iceNormal);
      vEye = normalize(mvPos.xyz);
      vIcePosition = icePosition;
      vViewPosition = mvPos.xyz;
      vIceScale = length(modelMatrix[0].xyz);
      gl_Position = projectionMatrix * mvPos;
    }
  `
  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uBackside;
    uniform float uRefractPower;
    varying vec3 vNormal;
    varying vec3 vEye;
    varying vec3 vIcePosition;
    varying vec3 vViewPosition;
    varying float vIceScale;
    float iceHash(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    }
    float iceNoise(vec3 p) {
      vec3 cell = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(iceHash(cell), iceHash(cell + vec3(1, 0, 0)), f.x),
            mix(iceHash(cell + vec3(0, 1, 0)), iceHash(cell + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(iceHash(cell + vec3(0, 0, 1)), iceHash(cell + vec3(1, 0, 1)), f.x),
            mix(iceHash(cell + vec3(0, 1, 1)), iceHash(cell + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    vec3 iceSurfaceNormal(vec3 n, float height) {
      vec3 dx = dFdx(vViewPosition);
      vec3 dy = dFdy(vViewPosition);
      vec3 tangentX = cross(dy, n);
      vec3 tangentY = cross(n, dx);
      float determinant = dot(dx, tangentX);
      vec3 gradient = sign(determinant) * (dFdx(height) * tangentX + dFdy(height) * tangentY);
      return normalize(abs(determinant) * n - gradient);
    }
    float specular(vec3 light, vec3 n, vec3 eye, float shininess, float diffuseness) {
      vec3 lightVec = normalize(-light);
      vec3 halfVec = normalize(lightVec - eye);
      return pow(max(dot(n, halfVec), 0.0), shininess) + max(dot(n, lightVec), 0.0) * diffuseness;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      const float WRINKLE_DEPTH = 0.0038;
      const float GRAIN_DEPTH = 0.0009;
      vec3 icePoint = vIcePosition + 0.13 * sin(vIcePosition.yzx * 5.0 + vec3(1.3, 4.2, 2.7));
      float folds = iceNoise(icePoint * vec3(5.5, 7.0, 6.0));
      float grain = iceNoise(icePoint * vec3(16.0, 22.0, 18.0));
      vec3 facePosition = abs(vIcePosition);
      float edgeDistance = max(min(facePosition.x, facePosition.y),
        max(min(facePosition.y, facePosition.z), min(facePosition.z, facePosition.x)));
      float edgeTexture = smoothstep(0.25, 0.47, edgeDistance);
      float iceHeight = (WRINKLE_DEPTH * sin(folds * 12.0) + GRAIN_DEPTH * grain)
        * (0.6 + edgeTexture);
      vec3 n = iceSurfaceNormal(normalize(vNormal), iceHeight * vIceScale);
      if (uBackside > 0.5) n = -n;
      vec3 eye = normalize(vEye);
      vec3 color = vec3(0.0);
      vec3 refrR = refract(eye, n, 1.0 / 1.15);
      vec3 refrY = refract(eye, n, 1.0 / 1.16);
      vec3 refrG = refract(eye, n, 1.0 / 1.18);
      vec3 refrC = refract(eye, n, 1.0 / 1.22);
      vec3 refrB = refract(eye, n, 1.0 / 1.22);
      vec3 refrP = refract(eye, n, 1.0 / 1.22);
      for (int i = 0; i < 16; i++) {
        float slide = float(i) / 16.0 * 0.045;
        vec3 texR = texture2D(uTexture, uv + refrR.xy * (uRefractPower + slide) * 0.5).rgb;
        vec3 texY = texture2D(uTexture, uv + refrY.xy * (uRefractPower + slide) * 0.5).rgb;
        vec3 texG = texture2D(uTexture, uv + refrG.xy * (uRefractPower + slide * 2.0) * 0.5).rgb;
        vec3 texC = texture2D(uTexture, uv + refrC.xy * (uRefractPower + slide * 2.5) * 0.5).rgb;
        vec3 texB = texture2D(uTexture, uv + refrB.xy * (uRefractPower + slide * 3.0) * 0.5).rgb;
        vec3 texP = texture2D(uTexture, uv + refrP.xy * (uRefractPower + slide) * 0.5).rgb;
        float r = texR.r * 0.5;
        float y = (texY.r * 2.0 + texY.g * 2.0 - texY.b) / 6.0;
        float g = texG.g * 0.5;
        float c = (texC.g * 2.0 + texC.b * 2.0 - texC.r) / 6.0;
        float b = texB.b * 0.5;
        float p = (texP.b * 2.0 + texP.r * 2.0 - texP.g) / 6.0;
        color += vec3(r + (2.0*p + 2.0*y - c)/3.0, g + (2.0*y + 2.0*c - p)/3.0, b + (2.0*c + 2.0*p - y)/3.0);
      }
      color /= 16.0;
      color = mix(vec3(dot(color, vec3(0.2125, 0.7154, 0.0721))), color, 1.08);
      float spec = specular(vec3(-1.0, 1.0, 1.0), n, eye, 90.0, 0.02)
        + 0.6 * specular(vec3(1.0, 1.0, -1.0), n, eye, 54.0, 0.01);
      color += spec * (uBackside > 0.5 ? 0.35 : 1.0);
      float fresnel = pow(1.0 + dot(eye, n), 5.0);
      color = mix(color, vec3(1.0), fresnel * (uBackside > 0.5 ? 0.25 : 0.55));
      vec3 reflected = reflect(eye, n);
      float keyLight = pow(max(dot(reflected, normalize(vec3(-0.8, 0.9, 0.65))), 0.0), 18.0);
      float sideLight = pow(max(dot(reflected, normalize(vec3(0.9, 0.2, 0.5))), 0.0), 36.0);
      float stripLight = pow(max(1.0 - abs(reflected.x + 0.35) * 2.8, 0.0), 20.0)
        * smoothstep(-0.65, 0.3, reflected.y);
      float rimLight = pow(1.0 - abs(dot(eye, n)), 2.5);
      color += vec3(keyLight * 0.65 + sideLight * 0.9 + stripLight * 0.35 + rimLight * 0.22)
        * (uBackside > 0.5 ? 0.3 : 1.0);
      float iceVeins = 1.0 - smoothstep(0.004, 0.022, abs(folds - 0.5));
      float frost = smoothstep(0.7, 0.95, grain);
      color = mix(color, vec3(0.76, 0.84, 0.88), iceVeins * (0.025 + edgeTexture * 0.04) + frost * 0.04);
      color += vec3(0.006, 0.008, 0.01);
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }
  `
  const backMaterial = new ShaderMaterial({ vertexShader, fragmentShader, side: BackSide, uniforms: {
    uTexture: { value: targetBack.texture }, uResolution: { value: resolution },
    uBackside: { value: 1 }, uRefractPower: { value: .22 },
  } })
  const frontMaterial = new ShaderMaterial({ vertexShader, fragmentShader, side: FrontSide, uniforms: {
    uTexture: { value: targetFront.texture }, uResolution: { value: resolution },
    uBackside: { value: 0 }, uRefractPower: { value: .30 },
  } })
  const cube = new Mesh(new RoundedBoxGeometry(
    ICE_EDGE_LENGTH, ICE_EDGE_LENGTH, ICE_EDGE_LENGTH, ICE_CORNER_SEGMENTS, ICE_CORNER_RADIUS,
  ), frontMaterial)
  spinner.add(cube)
  let disposed = false
  let frame = 0
  let previousTime = performance.now()
  const axisX = new Vector3(1, 0, 0)
  const axisY = new Vector3(0, 1, 0)
  const rotation = new Quaternion()
  const pointer = new Vector2()
  let pointerTime = 0
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  function applyRotation(dx: number, dy: number) {
    spinner.quaternion.premultiply(rotation.setFromAxisAngle(axisY, dx))
    spinner.quaternion.premultiply(rotation.setFromAxisAngle(axisX, dy))
  }
  function layout() {
    const width = element.clientWidth
    const height = element.clientHeight
    const dpr = renderer.getPixelRatio()
    const mobile = width < 768 || width / height < 1
    renderer.setSize(width, height, false)
    renderer.getDrawingBufferSize(resolution)
    targetBack.setSize(resolution.x, resolution.y)
    targetFront.setSize(resolution.x, resolution.y)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    const visibleHeight = 2 * Math.tan(camera.fov * Math.PI / 360) * CAMERA_DISTANCE
    const visibleWidth = visibleHeight * camera.aspect
    pivot.position.set(((mobile ? .5 : .517) - .5) * visibleWidth, (.5 - (mobile ? .45 : .488)) * visibleHeight, 0)
    const pixels = Math.min(height * .44, width * (mobile ? .45 : .29))
    pivot.scale.setScalar(pixels / height * visibleHeight)
    const headlineWidth = Math.round(width * dpr)
    const headlineHeight = Math.round(height * dpr)
    if (headline.width !== headlineWidth || headline.height !== headlineHeight) texture.dispose()
    headline.width = headlineWidth
    headline.height = headlineHeight
    context.scale(dpr, dpr)
    context.fillStyle = '#000'
    context.fillRect(0, 0, width, height)
    let fontSize = Math.min(height * .21, width * (mobile ? .21 : .118))
    context.font = `800 ${fontSize}px Poppins, "PingFang SC", sans-serif`
    const widest = Math.max(...props.lines.map(line => context.measureText(line).width))
    const maxWidth = width * (mobile ? .86 : .58)
    fontSize *= Math.min(1, maxWidth / widest)
    context.font = `800 ${fontSize}px Poppins, "PingFang SC", sans-serif`
    context.fillStyle = '#e9e9e9'
    context.textAlign = 'center'
    context.textBaseline = 'alphabetic'
    const centerX = width * (mobile ? .5 : .505)
    const centerY = height * (mobile ? .45 : .468)
    props.lines.forEach((line, index) => context.fillText(line, centerX, centerY + fontSize * .35 + (index - (props.lines.length - 1) / 2) * fontSize * 1.07))
    texture.needsUpdate = true
  }
  redraw = layout
  const resizeObserver = new ResizeObserver(layout)
  resizeObserver.observe(element)
  document.fonts.addEventListener('loadingdone', layout)

  function pointerDown(event: PointerEvent) {
    if (!event.isPrimary) return
    element.setPointerCapture(event.pointerId)
    dragging.value = true
    pointer.set(event.clientX, event.clientY)
    pointerTime = event.timeStamp
    spinRemaining = 0
    velocity.set(0, 0)
  }
  function pointerMove(event: PointerEvent) {
    if (!dragging.value || !event.isPrimary) return
    const dx = (event.clientX - pointer.x) * .008
    const dy = (event.clientY - pointer.y) * .008
    applyRotation(dx, dy)
    const frameScale = 16.67 / Math.max(event.timeStamp - pointerTime, 1)
    velocity.set(dx * frameScale, dy * frameScale)
    pointer.set(event.clientX, event.clientY)
    pointerTime = event.timeStamp
  }
  function pointerEnd() {
    dragging.value = false
    releaseTime = performance.now() / 1000
  }
  element.addEventListener('pointerdown', pointerDown)
  element.addEventListener('pointermove', pointerMove)
  element.addEventListener('pointerup', pointerEnd)
  element.addEventListener('pointercancel', pointerEnd)
  element.addEventListener('lostpointercapture', pointerEnd)

  function render(now: number) {
    const dt = Math.min((now - previousTime) / 1000, .05)
    previousTime = now
    if (!dragging.value) {
      if (Math.abs(spinRemaining) > .0005) {
        const step = spinRemaining * Math.min(1, .09 * dt * 60)
        applyRotation(step, 0)
        spinRemaining -= step
        releaseTime = now / 1000
      } else if (!reducedMotion.matches) {
        applyRotation(velocity.x * dt * 60, velocity.y * dt * 60)
        velocity.multiplyScalar(.94 ** (dt * 60))
        const drift = Math.min(1, Math.max(0, now / 1000 - releaseTime - .6))
        applyRotation(.0035 * drift * dt * 60, .0012 * drift * dt * 60)
      }
    }
    renderer.setRenderTarget(targetBack)
    renderer.clear()
    renderer.render(backgroundScene, camera)
    renderer.setRenderTarget(targetFront)
    renderer.clear()
    renderer.render(backgroundScene, camera)
    renderer.clearDepth()
    cube.material = backMaterial
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.clear()
    renderer.render(backgroundScene, camera)
    renderer.clearDepth()
    cube.material = frontMaterial
    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }

  disposeScene = () => {
    disposed = true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    document.fonts.removeEventListener('loadingdone', layout)
    element.removeEventListener('pointerdown', pointerDown)
    element.removeEventListener('pointermove', pointerMove)
    element.removeEventListener('pointerup', pointerEnd)
    element.removeEventListener('pointercancel', pointerEnd)
    element.removeEventListener('lostpointercapture', pointerEnd)
    plane.geometry.dispose()
    backgroundMaterial.dispose()
    texture.dispose()
    cube.geometry.dispose()
    backMaterial.dispose()
    frontMaterial.dispose()
    targetBack.dispose()
    targetFront.dispose()
    renderer.dispose()
  }

  await Promise.race([
    Promise.all([document.fonts.load('800 100px Poppins'), document.fonts.ready]),
    new Promise(resolve => window.setTimeout(resolve, 2500)),
  ])
  if (disposed) return
  layout()
  frame = requestAnimationFrame(render)
})
onBeforeUnmount(() => disposeScene())
</script>

<template>
  <div class="glass-scene">
    <canvas ref="canvas" :class="{ dragging }" aria-label="可旋转的透明冰块，拖拽改变视角" />
  </div>
</template>

<style scoped>
.glass-scene { position: absolute; inset: 0; }
canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: pan-y; }
canvas.dragging { cursor: grabbing; }
</style>
