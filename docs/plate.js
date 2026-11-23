import * as THREE from './vendor/three.module.js';

// Inverse sampling keeps every mark on the plate continuous as the fold bends.
// Both modes have fixed boundaries. The higher mode lags the fundamental.
const fragmentShader = `
  uniform sampler2D print;
  uniform vec2 scale;
  uniform vec2 cropOrigin;
  uniform float drive;
  uniform float follower;
  uniform float seconds;
  uniform float moving;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * scale + cropOrigin;
    if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float rim = smoothstep(0.0, 0.15, p.x) * smoothstep(0.0, 0.15, 1.0 - p.x)
              * smoothstep(0.0, 0.16, p.y) * smoothstep(0.0, 0.16, 1.0 - p.y);
    float axis = p.x + 0.12 * (p.y - 0.5);
    float bend = sin(6.28318 * axis - 0.62 + drive * 0.77);
    float harmonic = sin(12.56637 * axis + p.y * 1.8 - follower * 1.35);
    float lag = drive - follower;
    float breath = sin(seconds * 0.48) * moving;
    float beat = sin(seconds * 1.85 + axis * 7.0) * moving;
    vec2 offset = vec2(
      (0.015 * (p.y - 0.5) + 0.010 * harmonic) * drive + 0.009 * lag,
      0.088 * bend * drive + 0.035 * harmonic * lag +
      0.0024 * breath * bend + 0.006 * beat * abs(drive)
    );
    gl_FragColor = texture2D(print, clamp(p - rim * offset, 0.0, 1.0));
  }
`;

export async function createPlate(canvas, image) {
  // A responsive DOM image's width tracks its CSS layout. WebGL allocates
  // from that property, so upload the cached print at its intrinsic size.
  const source = new Image(image.naturalWidth, image.naturalHeight);
  source.src = image.currentSrc || image.src;
  await source.decode();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const texture = new THREE.Texture(source);
  // This is a photographic plate, not a lit surface. Filtering the original
  // sRGB samples directly matches the HTML print and preserves the black wires.
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;

  const uniforms = {
    print: { value: texture },
    scale: { value: new THREE.Vector2(1, 1) },
    cropOrigin: { value: new THREE.Vector2() },
    drive: { value: 0 },
    follower: { value: 0 },
    seconds: { value: 0 },
    moving: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const imageAspect = image.naturalWidth / image.naturalHeight;

  return {
    resize(width, height) {
      if (!width || !height) return;
      const aspect = width / height;
      const style = getComputedStyle(image);
      const crop = style.objectFit === 'cover';
      const bound = crop ? Math.min : Math.max;
      const sx = bound(1, aspect / imageAspect);
      const sy = bound(1, imageAspect / aspect);
      const [x, y] = style.objectPosition
        .split(' ')
        .map((v) => parseFloat(v) / 100);
      uniforms.scale.value.set(sx, sy);
      // DOM object-position runs from the top; texture UVs run from the bottom.
      uniforms.cropOrigin.value.set((1 - sx) * x, (1 - sy) * (1 - y));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    },
    draw(time, drive, follower, moving) {
      // Leave an entirely still, unison print to the browser's native image
      // rasterizer. This also preserves its exact subpixel sampling on phones.
      canvas.style.opacity = !moving && drive === 0 ? '0' : '';
      uniforms.drive.value = drive;
      uniforms.follower.value = follower;
      uniforms.seconds.value = time;
      uniforms.moving.value = moving ? 1 : 0;
      renderer.render(scene, camera);
    },
  };
}
