import * as THREE from './vendor/three.module.js';

const TAU = Math.PI * 2;
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

function roundedRect(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function guitarBody() {
  const s = new THREE.Shape();
  s.moveTo(-1.72, 0.02);
  s.bezierCurveTo(-1.75, 0.84, -1.16, 1.33, -0.61, 1.28);
  s.bezierCurveTo(-0.19, 1.27, 0.07, 0.93, 0.42, 0.91);
  s.bezierCurveTo(0.76, 0.87, 1.26, 1.34, 1.53, 1.27);
  s.bezierCurveTo(1.68, 1.2, 1.38, 0.96, 1.18, 0.79);
  s.bezierCurveTo(0.95, 0.58, 0.81, 0.35, 1.07, 0.23);
  s.lineTo(1.22, 0.21);
  s.lineTo(1.22, -0.2);
  s.bezierCurveTo(0.79, -0.24, 0.76, -0.45, 1.07, -0.64);
  s.bezierCurveTo(1.52, -0.85, 1.59, -1.02, 1.35, -1.1);
  s.bezierCurveTo(1.02, -1.18, 0.56, -0.83, 0.23, -0.89);
  s.bezierCurveTo(-0.17, -0.92, -0.31, -1.28, -0.87, -1.29);
  s.bezierCurveTo(-1.4, -1.29, -1.75, -0.65, -1.72, 0.02);
  return s;
}

function pickguard() {
  const s = new THREE.Shape();
  s.moveTo(-1.25, 0.28);
  s.bezierCurveTo(-1.23, 0.79, -0.86, 1.03, -0.55, 0.97);
  s.bezierCurveTo(-0.12, 0.92, 0.34, 0.56, 0.8, 0.73);
  s.bezierCurveTo(1.18, 0.94, 1.17, 0.9, 1.04, 0.75);
  s.bezierCurveTo(0.76, 0.49, 0.75, 0.29, 0.95, 0.18);
  s.lineTo(0.99, -0.2);
  s.bezierCurveTo(0.6, -0.26, 0.43, -0.31, 0.73, -0.65);
  s.bezierCurveTo(0.82, -0.79, 0.72, -0.83, 0.56, -0.76);
  s.bezierCurveTo(0.11, -0.55, -0.26, -0.47, -0.76, -0.52);
  s.bezierCurveTo(-1.11, -0.55, -1.32, -0.22, -1.25, 0.28);
  return s;
}

function headstock() {
  const s = new THREE.Shape();
  s.moveTo(3.58, -0.16);
  s.bezierCurveTo(3.85, -0.17, 4.1, -0.33, 4.37, -0.23);
  s.bezierCurveTo(4.49, -0.18, 4.49, -0.04, 4.41, 0.02);
  s.bezierCurveTo(4.3, 0.07, 4.51, 0.23, 4.46, 0.36);
  s.bezierCurveTo(4.41, 0.5, 4.28, 0.47, 4.15, 0.42);
  s.lineTo(3.72, 0.22);
  s.quadraticCurveTo(3.66, 0.17, 3.58, 0.16);
  s.closePath();
  return s;
}

function screenPainter(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  const gradient = ctx.createRadialGradient(
    w * 0.46,
    h * 0.4,
    2,
    w * 0.5,
    h * 0.5,
    w * 0.69,
  );
  gradient.addColorStop(0, '#173f3d');
  gradient.addColorStop(0.75, '#113332');
  gradient.addColorStop(1, '#091d26');
  let last = '';
  return (s, pitch, beat) => {
    const { cols, rows, body, food } = s;
    const sig = [
      cols,
      rows,
      food.x,
      food.y,
      pitch,
      beat,
      ...body.map((p) => p.x + p.y * cols),
    ].join(',');
    if (sig === last) return false;
    last = sig;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    const unit = Math.min((w - 42) / cols, (h - 46) / rows);
    const left = (w - cols * unit) / 2,
      top = (h - rows * unit) / 2 + 5;
    ctx.fillStyle = '#34524b';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillRect(
          left + (x + 0.5) * unit,
          top + (y + 0.5) * unit,
          1.45,
          1.45,
        );
      }
    }
    const size = unit * 0.81;
    for (let i = body.length - 1; i >= 0; i--) {
      const p = body[i],
        x = left + p.x * unit + (unit - size) / 2,
        y = top + p.y * unit + (unit - size) / 2;
      ctx.fillStyle = !i ? '#ebffcc' : i < 3 ? '#b3fad0' : '#79eaae';
      ctx.shadowColor = '#3aff9e';
      ctx.shadowBlur = !i ? 10 : 4;
      ctx.fillRect(x, y, size, size);
      ctx.shadowBlur = 0;
      if (body[i + 1]) {
        const dx = body[i + 1].x - p.x,
          dy = body[i + 1].y - p.y;
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          ctx.fillRect(
            x + dx * unit * 0.48 + size * 0.17,
            y + dy * unit * 0.48 + size * 0.17,
            size * 0.67,
            size * 0.67,
          );
        }
      }
    }
    const fx = left + (food.x + 0.5) * unit,
      fy = top + (food.y + 0.5) * unit;
    const a = size * (0.44 + beat * 0.07);
    ctx.shadowColor = '#ff724c';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffb073';
    ctx.beginPath();
    ctx.moveTo(fx, fy - a);
    ctx.lineTo(fx + a, fy);
    ctx.lineTo(fx, fy + a);
    ctx.lineTo(fx - a, fy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i === pitch ? '#f4c887' : '#37655b';
      ctx.fillRect(17 + i * 8, 12, 5, 3);
    }
    ctx.fillStyle = 'rgba(3,7,18,.10)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    return true;
  };
}

export function createScene(canvas) {
  const capturing = new URLSearchParams(window.location.search).has('capture');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: capturing,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-7.3, 7.3, 3.25, -3.25, 0.1, 65);
  const resources = new Set();
  const keep = (item) => {
    resources.add(item);
    return item;
  };
  function paint(color, roughness = 0.55, metalness = 0.12) {
    return keep(
      new THREE.MeshStandardMaterial({ color, roughness, metalness }),
    );
  }
  const flat = (color) => keep(new THREE.MeshBasicMaterial({ color }));
  const ink = paint('#171b31'),
    charcoal = paint('#292c43'),
    enamel = paint('#f34e29', 0.34, 0.16);
  const cream = paint('#ffdfa4', 0.48),
    parchment = paint('#d5c597', 0.54);
  const shell = paint('#e0c8aa', 0.53),
    edge = paint('#9e867f', 0.59),
    darkWood = paint('#40273a');
  const brass = paint('#ddb16f', 0.37, 0.38),
    chrome = paint('#a7bdc8', 0.35, 0.54);
  const red = paint('#f16b43', 0.42),
    midnight = paint('#242341');
  const mintLight = flat('#a2ffce'),
    apricotLight = flat('#ffc785');
  const dot = keep(new THREE.SphereGeometry(1, 12, 7));
  const unitBox = keep(new THREE.BoxGeometry(1, 1, 1));
  const unitPeg = keep(new THREE.CylinderGeometry(1, 1, 1, 24));
  function mesh(parent, geom, material, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(geom, material);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  }
  function box(parent, material, x, y, z, w, h, d) {
    const o = mesh(parent, unitBox, material, x, y, z);
    o.scale.set(w, h, d);
    return o;
  }
  function peg(parent, material, x, y, z, radius, depth) {
    const o = mesh(parent, unitPeg, material, x, y, z);
    o.rotation.x = Math.PI / 2;
    o.scale.set(radius, depth, radius);
    return o;
  }
  function relief(parent, shape, material, depth, bevel, z = 0, x = 0, y = 0) {
    const g = keep(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3,
        curveSegments: 18,
      }),
    );
    return mesh(parent, g, material, x, y, z);
  }
  function slab(parent, material, x, y, z, w, h, depth, r, bevel = 0.035) {
    return relief(
      parent,
      roundedRect(-w / 2, -h / 2, w, h, r),
      material,
      depth,
      bevel,
      z,
      x,
      y,
    );
  }
  function filament(parent, pts, width, material) {
    const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const g = keep(
      new THREE.TubeGeometry(
        path,
        Math.max(18, pts.length * 9),
        width,
        7,
        false,
      ),
    );
    mesh(parent, g, material);
    return path;
  }
  function group(parent, x = 0, y = 0, z = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  function batchBoxes(parent, material, cubes) {
    if (!cubes.length) return;
    const o = new THREE.InstancedMesh(unitBox, material, cubes.length);
    const pose = new THREE.Object3D();
    cubes.forEach(([x, y, z, w, h, d, angle = 0], i) => {
      pose.position.set(x, y, z);
      pose.rotation.set(0, 0, angle);
      pose.scale.set(w, h, d);
      pose.updateMatrix();
      o.setMatrixAt(i, pose.matrix);
    });
    parent.add(o);
    keep(o);
  }

  // A screen-printed field behind the objects stays continuous under camera parallax.
  const backdrop = keep(
    new THREE.ShaderMaterial({
      depthWrite: false,
      vertexShader:
        'varying vec2 p; void main(){ p=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `
      varying vec2 p;
      float grain(vec2 n){return fract(sin(dot(n,vec2(12.9898,78.233)))*43758.5453);}
      void main(){
        vec3 c=vec3(.048,.052,.105);
        c+=vec3(.125,.049,.070)*exp(-dot((p-vec2(-4.,.4))*vec2(.23,.44),(p-vec2(-4.,.4))*vec2(.23,.44)));
        c+=vec3(.050,.064,.137)*exp(-dot((p-vec2(3.6,.2))*vec2(.23,.38),(p-vec2(3.6,.2))*vec2(.23,.38)));
        vec2 cell=fract((p+vec2(.1,.07))/.24)-.5;
        c+=vec3(.055,.048,.071)*(1.-smoothstep(.022,.054,length(cell)));
        c+=(grain(floor(p*220.))-.5)*.017;
        gl_FragColor=vec4(c,1.);
      }`,
    }),
  );
  mesh(scene, keep(new THREE.PlaneGeometry(80, 60)), backdrop, 0, 0, -3.5);
  scene.add(new THREE.HemisphereLight(0xffe7d5, 0x6c5c9c, 2.25));
  function sun(color, intensity, x, y, z) {
    const l = new THREE.DirectionalLight(color, intensity);
    l.position.set(x, y, z);
    scene.add(l);
  }
  sun(0xffd9b9, 2.15, -4, 7, 7);
  sun(0x80a6ff, 1.12, 5, -1, -3);

  // Classic offset body, layered pickguard, frets and individually strummable strings.
  const guitar = group(scene, -4.89, -0.12, 0.3);
  guitar.rotation.set(-0.28, -0.08, 0.23);
  guitar.scale.setScalar(1.17);
  relief(guitar, guitarBody(), paint('#b72e2c', 0.33), 0.22, 0.08, -0.21);
  relief(guitar, guitarBody(), enamel, 0.08, 0.075, 0.02);
  relief(guitar, pickguard(), ink, 0.034, 0.023, 0.169);
  relief(guitar, pickguard(), cream, 0.017, 0.013, 0.205);
  slab(guitar, brass, 2.19, 0, 0.055, 2.91, 0.41, 0.13, 0.06, 0.018);
  const fretboard = new THREE.Shape();
  fretboard.moveTo(0.72, -0.205);
  fretboard.lineTo(3.64, -0.154);
  fretboard.lineTo(3.64, 0.154);
  fretboard.lineTo(0.72, 0.205);
  fretboard.closePath();
  relief(guitar, fretboard, darkWood, 0.036, 0.012, 0.202);
  relief(guitar, headstock(), brass, 0.14, 0.032, 0.057);
  const frets = [],
    markers = [];
  for (let i = 1; i <= 20; i++) {
    const x = 3.61 - 4.14 * (1 - 2 ** (-i / 12));
    const halfWidth = 0.154 + (0.052 * (3.61 - x)) / 2.9;
    frets.push([x, 0, 0.251, 0.018, halfWidth * 2, 0.017]);
    if ([3, 5, 7, 9, 12, 15, 17, 19].includes(i)) {
      const mid = x + (4.14 * (2 ** (-(i - 1) / 12) - 2 ** (-i / 12))) / 2;
      const ys = i === 12 ? [-0.073, 0.073] : [0];
      for (const y of ys)
        markers.push([mid, y, 0.252, 0.04, 0.04, 0.009, Math.PI / 4]);
    }
  }
  batchBoxes(guitar, chrome, frets);
  batchBoxes(guitar, cream, markers);
  slab(guitar, charcoal, -0.91, 0, 0.224, 0.3, 0.58, 0.051, 0.038, 0.01);
  const pickupPoles = [],
    screws = [];
  for (const x of [-0.44, 0.12, 0.63]) {
    slab(guitar, ink, x, 0, 0.223, 0.155, 0.52, 0.043, 0.05, 0.012);
    for (let i = 0; i < 6; i++)
      pickupPoles.push([x, 0.154 - i * 0.061, 0.275, 0.039, 0.03, 0.014]);
  }
  for (const [x, y] of [
    [-1.12, 0.42],
    [-0.52, 0.87],
    [0.64, 0.66],
    [0.44, -0.54],
    [-0.8, -0.42],
  ])
    screws.push([x, y, 0.235, 0.032, 0.032, 0.01, Math.PI / 4]);
  batchBoxes(guitar, chrome, pickupPoles.concat(screws));
  for (const [x, y] of [
    [0.08, -0.67],
    [-0.37, -0.79],
  ]) {
    peg(guitar, darkWood, x, y, 0.16, 0.118, 0.052);
    peg(guitar, brass, x, y, 0.207, 0.1, 0.069);
    box(guitar, ink, x, y + 0.052, 0.248, 0.019, 0.047, 0.006);
  }
  const strings = [],
    sGeometry = keep(new THREE.CylinderGeometry(1, 1, 1, 6));
  for (let i = 0; i < 6; i++) {
    const y = 0.16 - i * 0.064,
      nutY = y * 0.78,
      endX = 3.73 + 0.129 * i,
      endY = 0.117 + 0.049 * i;
    const g = keep(new THREE.BufferGeometry());
    const a = new Float32Array(49 * 3);
    const attr = new THREE.BufferAttribute(a, 3);
    g.setAttribute('position', attr);
    const l = new THREE.Line(
      g,
      keep(
        new THREE.LineBasicMaterial({ color: i < 3 ? '#f4c28e' : '#d9eef0' }),
      ),
    );
    guitar.add(l);
    // A thin physical wire remains legible on GPU implementations limited to 1px lines.
    const start = V(-1.02, y, 0.29),
      end = V(3.61, nutY, 0.29);
    const core = mesh(guitar, sGeometry, i < 3 ? brass : chrome);
    core.position.copy(start).lerp(end, 0.5);
    core.quaternion.setFromUnitVectors(
      V(0, 1, 0),
      end.clone().sub(start).normalize(),
    );
    core.scale.set(
      0.008 - i * 0.0006,
      start.distanceTo(end),
      0.008 - i * 0.0006,
    );
    strings.push({ a, attr, y, nutY, l });
    filament(guitar, [end, V(endX, endY, 0.249)], 0.008, chrome);
    peg(guitar, chrome, endX, endY, 0.25, 0.043, 0.031);
    box(guitar, chrome, endX, endY + 0.104, 0.155, 0.032, 0.21, 0.04);
    slab(
      guitar,
      cream,
      endX,
      endY + 0.217,
      0.126,
      0.09,
      0.108,
      0.068,
      0.032,
      0.008,
    );
    box(guitar, chrome, -1.015, y, 0.273, 0.15, 0.036, 0.04);
  }
  box(guitar, cream, 3.606, 0, 0.254, 0.038, 0.34, 0.043);

  // Six patch leads enter a small, visible inference network; every pulse has a route.
  const cables = [],
    outgoing = [],
    layers = [];
  const cableMats = [paint('#a9513b'), paint('#43776c'), paint('#9270af')];
  const signalInk = [
    '#ffc38f',
    '#99ffcd',
    '#ddb4ff',
    '#ffc38f',
    '#99ffcd',
    '#ddb4ff',
  ].map((c) => new THREE.Color(c));
  const network = group(scene, 0, -0.19, 0.07);
  const xs = [-1.53, -0.65, 0.28, 1.22],
    ys = [
      [-0.37, -0.08, 0.21],
      [-0.72, -0.29, 0.14, 0.57],
      [-0.52, -0.04, 0.44],
      [-0.27, 0.15],
    ];
  const nodeBase = keep(new THREE.IcosahedronGeometry(1, 1));
  for (let col = 0; col < xs.length; col++) {
    const nodes = [];
    for (let j = 0; j < ys[col].length; j++) {
      const pos = V(xs[col], ys[col][j], 0.13 + ((j + col) % 2) * 0.14);
      const m = flat('#94ddbb');
      const bulb = mesh(network, nodeBase, m, pos.x, pos.y, pos.z);
      bulb.scale.setScalar(0.054);
      nodes.push({ pos, bulb, col, j });
    }
    layers.push(nodes);
  }
  const links = [];
  for (let col = 0; col < layers.length - 1; col++) {
    for (const a of layers[col])
      for (const b of layers[col + 1]) {
        const p1 = a.pos,
          p2 = b.pos;
        const g = keep(new THREE.BufferGeometry().setFromPoints([p1, p2]));
        const mat = keep(
          new THREE.LineBasicMaterial({
            color: '#416365',
            transparent: true,
            opacity: 0.64,
          }),
        );
        network.add(new THREE.Line(g, mat));
        links.push({ a, b, mat });
      }
  }
  for (let i = 0; i < 6; i++) {
    const startX = -4.64 + i * 0.036;
    const dest = layers[0][Math.floor(i / 2)].pos;
    const cable = filament(
      scene,
      [
        V(startX, -0.94, 0.21),
        V(startX + 0.28, -1.52 - i * 0.085, 0.05),
        V(-3.32 + i * 0.03, -1.83 - i * 0.088, -0.18),
        V(-2.52 + i * 0.043, -1.61 - i * 0.055, -0.09),
        V(-2.02, -0.72 - i * 0.063, -0.025),
        V(dest.x, dest.y - 0.19, dest.z + 0.07),
      ],
      0.018,
      cableMats[i % 3],
    );
    cables.push(cable);
    const outStart = layers[3][i % 2].pos;
    const out = filament(
      scene,
      [
        V(outStart.x, outStart.y - 0.19, outStart.z + 0.07),
        V(1.72, -0.67 + i * 0.054, 0.15),
        V(2.22, -0.93 + i * 0.076, -0.02),
        V(2.62, -0.7 + i * 0.052, -0.2),
      ],
      0.018,
      cableMats[i % 3],
    );
    outgoing.push(out);
  }
  const idle = new THREE.Color('#6aaca1'),
    linkIdle = new THREE.Color('#749994');
  const haloMap = document.createElement('canvas');
  haloMap.width = haloMap.height = 96;
  const hc = haloMap.getContext('2d');
  const radial = hc.createRadialGradient(48, 48, 0, 48, 48, 48);
  radial.addColorStop(0, 'rgba(255,255,255,1)');
  radial.addColorStop(0.1, 'rgba(255,255,255,.81)');
  radial.addColorStop(0.24, 'rgba(255,255,255,.32)');
  radial.addColorStop(0.49, 'rgba(255,255,255,.091)');
  radial.addColorStop(1, 'rgba(255,255,255,0)');
  hc.fillStyle = radial;
  hc.fillRect(0, 0, 96, 96);
  const glowTex = keep(new THREE.CanvasTexture(haloMap));
  function halo(parent) {
    const m = keep(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const o = new THREE.Sprite(m);
    parent.add(o);
    return o;
  }
  const trail = Array.from({ length: 12 }, () => halo(scene));
  const impulse = mesh(scene, dot, flat('#fff5cb'));
  const nodeFlares = layers.map((nodes) =>
    nodes.map((n) => {
      const f = halo(network);
      f.position.copy(n.pos);
      return f;
    }),
  );
  function nodeFor(pitch, col) {
    return layers[col][
      col === 0 ? Math.floor(pitch / 2) : pitch % layers[col].length
    ];
  }
  function routePoint(fraction, pitch, out) {
    if (fraction < 0.47) return cables[pitch].getPointAt(fraction / 0.47, out);
    if (fraction >= 0.8)
      return outgoing[pitch].getPointAt((fraction - 0.8) / 0.2, out);
    const pos = ((fraction - 0.47) * 3) / 0.33,
      col = Math.min(2, Math.floor(pos));
    return out
      .copy(nodeFor(pitch, col).pos)
      .lerp(nodeFor(pitch, col + 1).pos, pos - col)
      .add(network.position);
  }

  // A chunky, beveled service terminal with a recessed, phosphor-tinted glass face.
  const crt = group(scene, 4.07, 0.17, 0.12);
  crt.rotation.set(-0.075, -0.32, -0.025);
  slab(crt, midnight, 0, -1.52, -0.42, 2.76, 0.3, 0.85, 0.12, 0.06);
  slab(crt, edge, 0, 0.04, -1.01, 3.46, 2.51, 1.3, 0.27, 0.12);
  slab(crt, shell, 0, 0.04, -0.4, 3.97, 2.93, 0.72, 0.22, 0.095);
  slab(crt, parchment, 0, 0.04, 0.28, 3.87, 2.84, 0.088, 0.2, 0.045);
  slab(crt, edge, -0.18, 0.12, 0.379, 3.26, 2.38, 0.045, 0.22, 0.06);
  slab(crt, ink, -0.18, 0.12, 0.425, 3.1, 2.25, 0.047, 0.22, 0.04);
  const display = document.createElement('canvas');
  display.width = 480;
  display.height = 320;
  const drawDisplay = screenPainter(display);
  const texture = keep(new THREE.CanvasTexture(display));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  const sw = 2.995,
    sh = 2.134;
  const face = keep(
    new THREE.ShapeGeometry(roundedRect(-sw / 2, -sh / 2, sw, sh, 0.21), 20),
  );
  const pos = face.getAttribute('position'),
    uv = face.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, pos.getX(i) / sw + 0.5, pos.getY(i) / sh + 0.5);
  const glassMat = keep(new THREE.MeshBasicMaterial({ map: texture }));
  const glassZ = 0.54;
  mesh(crt, face, glassMat, -0.18, 0.12, glassZ);
  const ventRects = [];
  for (let i = 0; i < 7; i++)
    ventRects.push([1.64, 0.84 - i * 0.073, 0.424, 0.28, 0.024, 0.019]);
  for (let i = 0; i < 15; i++)
    ventRects.push([-0.96 + i * 0.124, -1.21, 0.423, 0.067, 0.026, 0.013]);
  batchBoxes(crt, charcoal, ventRects);
  peg(crt, edge, 1.64, -0.27, 0.41, 0.192, 0.05);
  peg(crt, charcoal, 1.64, -0.27, 0.453, 0.153, 0.081);
  box(crt, cream, 1.665, -0.204, 0.5, 0.025, 0.084, 0.009).rotation.z = -0.32;
  slab(crt, ink, 1.64, -0.855, 0.4, 0.215, 0.106, 0.03, 0.02, 0.01);
  box(crt, mintLight, 1.64, -0.853, 0.443, 0.108, 0.029, 0.014);
  const sideVents = [];
  for (let i = 0; i < 9; i++)
    sideVents.push([1.98, 0.77 - i * 0.13, -0.058, 0.018, 0.045, 0.42]);
  batchBoxes(crt, edge, sideVents);
  const keyboard = group(crt, -0.13, -1.84, 1.0);
  keyboard.rotation.x = -0.87;
  slab(keyboard, edge, 0, 0, -0.14, 3.25, 0.72, 0.14, 0.12, 0.048);
  slab(keyboard, shell, 0, 0, -0.018, 3.21, 0.7, 0.055, 0.1, 0.028);
  const keys = [],
    darkKeys = [],
    hotKeys = [];
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 12; k++) {
      if (row === 2 && k > 2 && k < 8) continue;
      const w = row === 2 && k === 2 ? 1.44 : 0.222;
      const x = -1.37 + k * 0.25 + (w - 0.222) / 2;
      (k === 11 && row === 0
        ? hotKeys
        : k > 9 || k === 0
          ? darkKeys
          : keys
      ).push([x, 0.22 - row * 0.215, 0.076, w, 0.168, 0.093]);
    }
  }
  batchBoxes(keyboard, parchment, keys);
  batchBoxes(keyboard, edge, darkKeys);
  batchBoxes(keyboard, red, hotKeys);

  const attractRoute = [];
  for (let x = 3; x <= 15; x++) attractRoute.push({ x, y: 3 });
  for (let y = 4; y <= 8; y++) attractRoute.push({ x: 15, y });
  for (let x = 14; x >= 9; x--) attractRoute.push({ x, y: 8 });
  for (let y = 9; y <= 11; y++) attractRoute.push({ x: 9, y });
  for (let x = 8; x >= 3; x--) attractRoute.push({ x, y: 11 });
  for (let y = 10; y >= 4; y--) attractRoute.push({ x: 3, y });
  const pointAtStep = (step) =>
    attractRoute[(step + attractRoute.length) % attractRoute.length];
  const fallback = { cols: 19, rows: 14, body: [], food: { x: 12, y: 5 } };
  const overviewTarget = V(-0.26, -0.16, 0),
    focusTarget = V(-0.18, 0.12, glassZ),
    viewTarget = new THREE.Vector3();
  crt.updateWorldMatrix(true, false);
  focusTarget.applyMatrix4(crt.matrixWorld);
  const focusEye = V(0, 0, 1)
    .transformDirection(crt.matrixWorld)
    .multiplyScalar(17)
    .add(focusTarget);
  let fullHeight = 3.2,
    focusHeight = 1.66;
  const ray = new THREE.Raycaster(),
    hit = new THREE.Vector3(),
    plane = new THREE.Plane(),
    normal = V(0, 0, 1),
    location = new THREE.Vector3();
  function pickString(xNDC, yNDC) {
    guitar.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    normal.set(0, 0, 1).transformDirection(guitar.matrixWorld);
    location.set(0, 0, 0.29).applyMatrix4(guitar.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal, location);
    ray.setFromCamera({ x: xNDC, y: yNDC }, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return null;
    guitar.worldToLocal(hit);
    if (
      hit.x < -1.3 ||
      hit.x > 3.64 ||
      Math.abs(hit.y) > (hit.x < 0.75 ? 0.71 : 0.35)
    )
      return null;
    const u = THREE.MathUtils.clamp((hit.x + 1.02) / 4.63, 0, 1);
    const halfWidth = 0.16 * (1 - 0.22 * u);
    return Math.round(
      THREE.MathUtils.clamp((halfWidth - hit.y) / (2 * halfWidth), 0, 1) * 5,
    );
  }
  function resize(width, height) {
    if (!(width > 0 && height > 0)) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfHeight = Math.max(2.37, 6.99 / aspect);
    fullHeight = halfHeight;
    focusHeight = Math.max(1.6, 2.12 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.bottom = -halfHeight;
    camera.top = halfHeight;
    camera.updateProjectionMatrix();
  }
  function render(t = 0, opts = {}) {
    const phase = (((t % 6) + 6) % 6) / 6;
    const p = opts.reducedMotion ? 0 : phase;
    const pitch = Number.isInteger(opts.pitch)
      ? THREE.MathUtils.clamp(opts.pitch, 0, 5)
      : Math.floor(p * 6) % 6;
    const pluck = opts.reducedMotion
      ? 0
      : THREE.MathUtils.clamp(opts.pluck ?? Math.exp(-5 * ((p * 6) % 1)), 0, 1);
    const age = opts.noteAge ?? -Math.log(Math.max(pluck, 0.00001)) / 5;
    const flight = age / 0.91;
    const px = opts.reducedMotion ? 0 : opts.pointerX || 0,
      py = opts.reducedMotion ? 0 : opts.pointerY || 0;
    const focus = THREE.MathUtils.clamp(opts.focus || 0, 0, 1);
    camera.position
      .set(-0.18 + px * 0.54, 1.7 + py * 0.44, 17)
      .lerp(focusEye, focus);
    camera.lookAt(viewTarget.copy(overviewTarget).lerp(focusTarget, focus));
    const zoom =
      fullHeight / THREE.MathUtils.lerp(fullHeight, focusHeight, focus);
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
    for (let i = 0; i < 6; i++) {
      const s = strings[i],
        energy = opts.reducedMotion
          ? 0
          : (i === pitch ? pluck : 0) +
            (opts.demo === false
              ? 0
              : 0.24 * Math.exp(-6 * ((p * 6 - i + 6) % 6)));
      for (let j = 0; j < 49; j++) {
        const u = j / 48,
          n = j * 3;
        s.a[n] = -1.02 + 4.63 * u;
        s.a[n + 1] =
          s.y * (1 - u) +
          s.nutY * u +
          Math.sin(Math.PI * u) *
            Math.sin(TAU * (p * 24 + u * 3)) *
            energy *
            0.094;
        s.a[n + 2] = 0.297;
      }
      s.attr.needsUpdate = true;
      s.l.material.color.set(
        i === pitch && pluck > 0.32 ? '#fffedc' : i < 3 ? '#f4c28e' : '#d9eef0',
      );
    }
    const currentInk = signalInk[pitch];
    for (let n = 0; n < trail.length; n++) {
      const f = flight - n * 0.009,
        fade = 1 - n / trail.length,
        spark = trail[n];
      spark.visible = !opts.reducedMotion && f >= 0 && f <= 1;
      if (spark.visible) {
        routePoint(f, pitch, spark.position);
        spark.position.z += 0.065;
        spark.material.color.copy(currentInk);
        spark.material.opacity = fade * 0.95;
        spark.scale.setScalar(n === 0 ? 0.78 : 0.16 + 0.33 * fade);
      }
    }
    impulse.visible = trail[0].visible;
    if (impulse.visible) {
      impulse.position.copy(trail[0].position);
      impulse.scale.setScalar(0.075);
    }
    for (const nodes of layers)
      for (const n of nodes) {
        const fired = flight - (0.47 + n.col * 0.11);
        const intensity =
          !opts.reducedMotion && nodeFor(pitch, n.col) === n && fired >= 0
            ? Math.exp(-9 * fired)
            : 0;
        n.bulb.material.color.copy(idle).lerp(currentInk, intensity);
        n.bulb.scale.setScalar(0.055 + 0.083 * intensity);
        const flare = nodeFlares[n.col][n.j];
        flare.material.color.copy(currentInk);
        flare.material.opacity = intensity * 0.87;
        flare.scale.setScalar(0.37 + 0.63 * intensity);
        flare.visible = intensity > 0.012;
      }
    for (const e of links) {
      const fired = flight - (0.47 + e.a.col * 0.11);
      const isRoute =
        nodeFor(pitch, e.a.col) === e.a && nodeFor(pitch, e.b.col) === e.b;
      const intensity =
        !opts.reducedMotion && isRoute && fired >= 0
          ? Math.exp(-5 * Math.max(0, fired - 0.11))
          : 0;
      e.mat.opacity = 0.47 + 0.53 * intensity;
      e.mat.color.copy(linkIdle).lerp(currentInk, intensity);
    }
    const tick = Math.floor(p * attractRoute.length);
    fallback.body = Array.from({ length: 12 }, (_, i) => pointAtStep(tick - i));
    if (
      drawDisplay(
        opts.snake?.body?.length ? opts.snake : fallback,
        pitch,
        Math.round(2 * (0.5 + 0.5 * Math.cos(TAU * p * 6))),
      )
    )
      texture.needsUpdate = true;
    renderer.render(scene, camera);
  }
  resize(canvas.clientWidth || 780, canvas.clientHeight || 350);
  render(0);
  return {
    resize,
    render,
    pickString,
    dispose() {
      for (const item of resources) item.dispose?.();
      renderer.dispose();
    },
  };
}
