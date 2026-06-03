import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#scene");
const lapReadout = document.querySelector("#lapReadout");
const followToggle = document.querySelector("#followToggle");
const rainToggle = document.querySelector("#rainToggle");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x21182a, 0.018);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  280
);
camera.position.set(16, 10, 16);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 5;
controls.maxDistance = 72;

// Required light variety: ambient, hemisphere, directional, point, and spot.
const ambient = new THREE.AmbientLight(0xffd7a0, 0.42);
scene.add(ambient);

const hemisphere = new THREE.HemisphereLight(0xffa15c, 0x1d2840, 1.25);
scene.add(hemisphere);

const sunLight = new THREE.DirectionalLight(0xffb15d, 4.8);
sunLight.position.set(-14, 11, -18);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -32;
sunLight.shadow.camera.right = 32;
sunLight.shadow.camera.top = 32;
sunLight.shadow.camera.bottom = -32;
scene.add(sunLight);

const pitLamp = new THREE.PointLight(0xffd07b, 24, 24, 1.4);
pitLamp.position.set(6, 5, -10);
pitLamp.castShadow = true;
scene.add(pitLamp);

const towerSpot = new THREE.SpotLight(0xfff1c7, 30, 34, Math.PI / 7, 0.45, 1.1);
towerSpot.position.set(-9, 9, 6);
towerSpot.target.position.set(-1, 0, 0);
towerSpot.castShadow = true;
scene.add(towerSpot, towerSpot.target);

function makeCanvasTexture(width, height, draw) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = width;
  textureCanvas.height = height;
  const context = textureCanvas.getContext("2d");
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const asphaltTexture = makeCanvasTexture(256, 256, (ctx, width, height) => {
  ctx.fillStyle = "#272830";
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 1700; i += 1) {
    const shade = 34 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${shade},${shade},${shade + 4})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  for (let y = 0; y < height; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + 8);
    ctx.stroke();
  }
});
asphaltTexture.repeat.set(3, 2);

const grassTexture = makeCanvasTexture(256, 256, (ctx, width, height) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#405b30");
  gradient.addColorStop(1, "#22381f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? "#56713a" : "#2f4b29";
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 6);
  }
});
grassTexture.repeat.set(16, 16);

const checkTexture = makeCanvasTexture(128, 128, (ctx, width, height) => {
  const cell = 16;
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      ctx.fillStyle = (x / cell + y / cell) % 2 === 0 ? "#f6f0de" : "#15151a";
      ctx.fillRect(x, y, cell, cell);
    }
  }
});
checkTexture.repeat.set(2, 1);

function skyTexture(face) {
  return makeCanvasTexture(512, 512, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, face === "top" ? "#28215b" : "#40316f");
    gradient.addColorStop(0.5, "#d86f59");
    gradient.addColorStop(0.72, "#c94e4e");
    gradient.addColorStop(1, "#f2b544");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,235,184,0.8)";
    for (let i = 0; i < 36; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.42;
      ctx.fillRect(x, y, 2, 2);
    }
  });
}

const skybox = new THREE.Mesh(
  new THREE.BoxGeometry(210, 210, 210),
  ["right", "left", "top", "bottom", "front", "back"].map(
    (face) => new THREE.MeshBasicMaterial({ map: skyTexture(face), side: THREE.BackSide })
  )
);
scene.add(skybox);

const rainCount = 720;
const rainPositions = new Float32Array(rainCount * 2 * 3);
const rainDrops = [];
const rainMaterial = new THREE.LineBasicMaterial({
  color: 0xb7dcff,
  transparent: true,
  opacity: 0.58,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const rainGeometry = new THREE.BufferGeometry();
rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
const rain = new THREE.LineSegments(rainGeometry, rainMaterial);
rain.visible = false;
scene.add(rain);

function resetRainDrop(index, startHigh = false) {
  const drop = rainDrops[index] || {};
  drop.x = (Math.random() - 0.5) * 58;
  drop.y = startHigh ? 9 + Math.random() * 18 : Math.random() * 24;
  drop.z = (Math.random() - 0.5) * 58;
  drop.speed = 12 + Math.random() * 8;
  drop.length = 0.65 + Math.random() * 0.42;
  rainDrops[index] = drop;
}

function writeRainDrop(index) {
  const drop = rainDrops[index];
  const offset = index * 6;
  rainPositions[offset] = drop.x;
  rainPositions[offset + 1] = drop.y;
  rainPositions[offset + 2] = drop.z;
  rainPositions[offset + 3] = drop.x - 0.12;
  rainPositions[offset + 4] = drop.y - drop.length;
  rainPositions[offset + 5] = drop.z + 0.08;
}

for (let i = 0; i < rainCount; i += 1) {
  resetRainDrop(i);
  writeRainDrop(i);
}

function updateRain(delta) {
  if (!rain.visible) return;
  for (let i = 0; i < rainCount; i += 1) {
    const drop = rainDrops[i];
    drop.y -= drop.speed * delta;
    drop.x -= 1.1 * delta;
    drop.z += 0.7 * delta;
    if (drop.y < -0.3) {
      resetRainDrop(i, true);
    }
    writeRainDrop(i);
  }
  rainGeometry.attributes.position.needsUpdate = true;
}

const world = new THREE.Group();
scene.add(world);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(96, 96),
  new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.96 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

const TRACK_WIDTH = 3.7;
const TRACK_HALF_WIDTH = TRACK_WIDTH / 2;
const LANE_OFFSET = 0.72;
const TRACK_Y = 0.045;

const trackCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-1.8, 0, -7.75),
    new THREE.Vector3(3.7, 0, -7.75),
    new THREE.Vector3(7.2, 0, -6.25),
    new THREE.Vector3(9.55, 0, -3.05),
    new THREE.Vector3(9.1, 0, -0.15),
    new THREE.Vector3(6.1, 0, 1.55),
    new THREE.Vector3(4.55, 0, 3.55),
    new THREE.Vector3(3.0, 0, 6.15),
    new THREE.Vector3(-1.6, 0, 7.05),
    new THREE.Vector3(-7.6, 0, 6.8),
    new THREE.Vector3(-11.15, 0, 5.15),
    new THREE.Vector3(-12.55, 0, 2.1),
    new THREE.Vector3(-12.1, 0, -0.75),
    new THREE.Vector3(-9.8, 0, -2.45),
    new THREE.Vector3(-6.35, 0, -2.55),
    new THREE.Vector3(-4.25, 0, -2.35),
    new THREE.Vector3(-2.65, 0, -3.8),
    new THREE.Vector3(-2.08, 0, -6.15)
  ],
  true,
  "centripetal",
  0.34
);
trackCurve.arcLengthDivisions = 720;

function getTrackTangent(t) {
  return trackCurve.getTangentAt((t + 1) % 1).setY(0).normalize();
}

function getTrackNormal(t) {
  const tangent = getTrackTangent(t);
  return new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
}

function getTrackPoint(t, laneOffset = 0, y = TRACK_Y) {
  const position = trackCurve.getPointAt((t + 1) % 1);
  position.add(getTrackNormal(t).multiplyScalar(laneOffset));
  position.y = y;
  return position;
}

function getEvenOffsetSamples(count, laneOffset, y, phase = 0, resolution = 900) {
  const points = [];
  const distances = [0];

  for (let i = 0; i <= resolution; i += 1) {
    const t = i / resolution;
    points.push(getTrackPoint(t, laneOffset, y));
    if (i > 0) {
      distances[i] = distances[i - 1] + points[i].distanceTo(points[i - 1]);
    }
  }

  const total = distances[resolution];
  const samples = [];
  for (let i = 0; i < count; i += 1) {
    const target = (((i + phase) / count) % 1) * total;
    let index = 1;
    while (index < distances.length - 1 && distances[index] < target) {
      index += 1;
    }

    const startDistance = distances[index - 1];
    const segmentDistance = Math.max(distances[index] - startDistance, 0.0001);
    const alpha = (target - startDistance) / segmentDistance;
    const previous = points[index - 1];
    const next = points[index];
    const position = previous.clone().lerp(next, alpha);
    const tangent = next.clone().sub(previous).setY(0).normalize();
    samples.push({ position, tangent });
  }

  return samples;
}

function makeTrackGeometry(curve, width, samples = 256) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const halfWidth = width / 2;

  for (let i = 0; i < samples; i += 1) {
    const t = i / samples;
    const center = curve.getPointAt(t);
    const normal = getTrackNormal(t);
    const left = center.clone().add(normal.clone().multiplyScalar(halfWidth));
    const right = center.clone().add(normal.clone().multiplyScalar(-halfWidth));
    left.y = TRACK_Y;
    right.y = TRACK_Y;

    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push((i / samples) * 18, 0, (i / samples) * 18, 1);
  }

  for (let i = 0; i < samples; i += 1) {
    const next = (i + 1) % samples;
    const a = i * 2;
    const b = a + 1;
    const c = next * 2;
    const d = c + 1;
    indices.push(a, b, c, b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

const track = new THREE.Mesh(
  makeTrackGeometry(trackCurve, TRACK_WIDTH),
  new THREE.MeshStandardMaterial({
    map: asphaltTexture,
    roughness: 0.86,
    metalness: 0.02
  })
);
track.receiveShadow = true;
world.add(track);

const finishLine = new THREE.Mesh(
  new THREE.PlaneGeometry(1.05, TRACK_WIDTH),
  new THREE.MeshStandardMaterial({ map: checkTexture, roughness: 0.7 })
);
finishLine.rotation.x = -Math.PI / 2;
finishLine.position.copy(getTrackPoint(0.018, 0, 0.07));
finishLine.receiveShadow = true;
world.add(finishLine);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(5.2, 48, 24),
  new THREE.MeshBasicMaterial({ color: 0xff7a3d })
);
sun.position.set(-34, 12, -48);
scene.add(sun);

const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(7.2, 48, 24),
  new THREE.MeshBasicMaterial({
    color: 0xff6f4f,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);
sunGlow.position.copy(sun.position);
scene.add(sunGlow);

const paintMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f1dc, roughness: 0.6 });
for (let i = 0; i < 36; i += 1) {
  const t = i / 36;
  const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.78), paintMaterial);
  dash.position.copy(getTrackPoint(t, 0, 0.09));
  const tangent = getTrackTangent(t);
  dash.rotation.y = Math.atan2(tangent.x, tangent.z);
  dash.receiveShadow = true;
  world.add(dash);
}

const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x161719, roughness: 0.88 });
getEvenOffsetSamples(44, TRACK_HALF_WIDTH + 0.38, 0.25, 0.12).forEach(({ position, tangent }) => {
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 18), tireMaterial);
  tire.position.copy(position);
  tire.rotation.z = Math.PI / 2;
  tire.rotation.y = Math.atan2(tangent.x, tangent.z);
  tire.castShadow = true;
  tire.receiveShadow = true;
  world.add(tire);
});

function makeTireStack(x, z, count, scale = 1) {
  const stack = new THREE.Group();
  const tireGeometry = new THREE.TorusGeometry(0.25 * scale, 0.075 * scale, 10, 24);
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x34363a, metalness: 0.2, roughness: 0.52 });

  for (let i = 0; i < count; i += 1) {
    const tire = new THREE.Mesh(tireGeometry, tireMaterial);
    tire.rotation.x = Math.PI / 2;
    tire.position.y = 0.12 * scale + i * 0.15 * scale;
    tire.castShadow = true;
    tire.receiveShadow = true;
    stack.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.035 * scale, 16), rimMaterial);
    rim.position.y = tire.position.y;
    rim.castShadow = true;
    rim.receiveShadow = true;
    stack.add(rim);
  }

  stack.position.set(x, 0.04, z);
  world.add(stack);
}

[
  [-2.3, 0.25, 4, 1],
  [0.15, 0.95, 5, 0.9],
  [2.2, -0.3, 3, 1.05],
  [-0.9, -1.15, 4, 0.82]
].forEach(([x, z, count, scale]) => makeTireStack(x, z, count, scale));

function makeGrandstand(x, z, rot) {
  const stand = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x4f5662, roughness: 0.72 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xc84f4f, roughness: 0.62 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd7a579, roughness: 0.68 });
  const shirtColors = [0x4ea1ff, 0xffcf5a, 0x77d36f, 0xff7a7a, 0xc58cff, 0xf4f1df];
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.6, 1.25), baseMat);
  base.position.y = 0.35;
  base.castShadow = true;
  base.receiveShadow = true;
  stand.add(base);
  for (let row = 0; row < 3; row += 1) {
    const seats = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 0.34), seatMat);
    seats.position.set(0, 0.76 + row * 0.32, -0.32 + row * 0.34);
    seats.castShadow = true;
    stand.add(seats);
  }

  const spectatorPositions = [
    [-1.85, 0, 0],
    [-1.2, 1, 1],
    [-0.55, 2, 2],
    [0.15, 0, 3],
    [0.85, 1, 4],
    [1.55, 2, 5],
    [2.0, 0, 2]
  ];

  spectatorPositions.forEach(([seatX, row, colorIndex]) => {
    const person = new THREE.Group();
    const shirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.13, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: shirtColors[colorIndex], roughness: 0.7 })
    );
    shirt.position.y = 0.13;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), skinMat);
    head.position.y = 0.34;
    person.add(shirt, head);
    person.position.set(seatX, 0.98 + row * 0.32, -0.48 + row * 0.34);
    person.rotation.x = -0.08;
    person.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    stand.add(person);
  });

  stand.position.set(x, 0, z);
  stand.rotation.y = rot;
  world.add(stand);
}

makeGrandstand(-9.4, 10.5, -0.18);
makeGrandstand(-2.8, 11.2, -0.05);
makeGrandstand(5.1, 10.45, 0.18);

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4a2d, roughness: 0.88 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2e6b3d, roughness: 0.78 });
  const leafDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x1f5132, roughness: 0.82 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 1.25 * scale, 12), trunkMaterial);
  trunk.position.y = 0.62 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const lowerLeaves = new THREE.Mesh(new THREE.ConeGeometry(0.78 * scale, 1.15 * scale, 16), leafDarkMaterial);
  lowerLeaves.position.y = 1.45 * scale;
  lowerLeaves.castShadow = true;
  lowerLeaves.receiveShadow = true;
  tree.add(lowerLeaves);

  const upperLeaves = new THREE.Mesh(new THREE.ConeGeometry(0.58 * scale, 0.95 * scale, 16), leafMaterial);
  upperLeaves.position.y = 2.05 * scale;
  upperLeaves.castShadow = true;
  upperLeaves.receiveShadow = true;
  tree.add(upperLeaves);

  tree.position.set(x, 0, z);
  world.add(tree);
}

[
  [-17, -8, 1.05],
  [-16, 2, 0.92],
  [-13.5, 12, 1.1],
  [-6, 15, 0.86],
  [4, 14.5, 1],
  [12.5, 11, 0.95],
  [16, 3.8, 1.08],
  [15.5, -8.5, 0.9],
  [4.2, -15, 1.06],
  [-8.5, -14, 0.98]
].forEach(([x, z, scale]) => makeTree(x, z, scale));

function makeLightPole(position) {
  const pole = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x59606a, metalness: 0.45, roughness: 0.32 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffd392 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 16), metal);
  shaft.position.y = 2.2;
  shaft.castShadow = true;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 8), glow);
  lamp.position.set(0, 4.45, 0);
  pole.add(shaft, lamp);
  const light = new THREE.PointLight(0xffc878, 4.2, 8.5, 1.8);
  light.position.copy(lamp.position);
  pole.add(light);
  pole.position.copy(position);
  world.add(pole);
}

[
  getTrackPoint(0.1, TRACK_HALF_WIDTH + 1.2, 0),
  getTrackPoint(0.33, TRACK_HALF_WIDTH + 1.2, 0),
  getTrackPoint(0.55, TRACK_HALF_WIDTH + 1.2, 0),
  getTrackPoint(0.78, TRACK_HALF_WIDTH + 1.2, 0)
].forEach((position) => makeLightPole(position));

const pitWall = new THREE.Mesh(
  new THREE.BoxGeometry(5.4, 0.55, 0.28),
  new THREE.MeshStandardMaterial({ color: 0xb9aa83, roughness: 0.82 })
);
const pitWallT = 0.07;
pitWall.position.copy(getTrackPoint(pitWallT, TRACK_HALF_WIDTH + 1.25, 0.34));
const pitWallTangent = getTrackTangent(pitWallT);
pitWall.rotation.y = Math.atan2(pitWallTangent.x, pitWallTangent.z) + Math.PI / 2;
pitWall.castShadow = true;
pitWall.receiveShadow = true;
world.add(pitWall);

function makeFlagMarshal() {
  const marshal = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd59a6f, roughness: 0.7 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2f6fb1, roughness: 0.72 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x202735, roughness: 0.76 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xf2e2b8, roughness: 0.62 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.55 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.28, 0.78, 18), shirt);
  body.position.y = 0.86;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), skin);
  head.position.y = 1.36;
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.045, 22), hatMat);
  hatBrim.position.y = 1.56;
  const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 22), hatMat);
  hatTop.position.y = 1.67;

  [-0.12, 0.12].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.58, 14), pants);
    leg.position.set(x, 0.31, 0);
    leg.castShadow = true;
    marshal.add(leg);
  });

  const stillArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.54, 12), skin);
  stillArm.position.set(-0.32, 0.95, 0);
  stillArm.rotation.z = -0.55;

  const wavingArm = new THREE.Group();
  wavingArm.position.set(0.23, 1.08, 0);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.58, 12), skin);
  arm.rotation.z = Math.PI / 2;
  arm.position.x = 0.28;
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.78, 10), poleMat);
  flagPole.rotation.z = Math.PI / 2;
  flagPole.position.x = 0.68;
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.36),
    new THREE.MeshStandardMaterial({ map: checkTexture, side: THREE.DoubleSide, roughness: 0.55 })
  );
  flag.position.set(0.98, 0.08, 0);
  wavingArm.add(arm, flagPole, flag);

  marshal.add(body, head, hatBrim, hatTop, stillArm, wavingArm);
  marshal.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const marshalT = 0.035;
  marshal.position.copy(getTrackPoint(marshalT, TRACK_HALF_WIDTH + 1.08, 0));
  const faceTrack = getTrackNormal(marshalT).multiplyScalar(-1);
  marshal.rotation.y = Math.atan2(faceTrack.x, faceTrack.z);
  marshal.userData.wavingArm = wavingArm;
  return marshal;
}

const flagMarshal = makeFlagMarshal();
world.add(flagMarshal);

function makeCar(color, accent) {
  const car = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.15 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.38 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8dd3ff,
    roughness: 0.08,
    metalness: 0.08,
    transparent: true,
    opacity: 0.7
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 1.75), bodyMaterial);
  body.position.y = 0.36;
  body.castShadow = true;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.58), accentMaterial);
  nose.position.set(0, 0.31, 0.83);
  nose.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.62), glassMaterial);
  cabin.position.set(0, 0.62, -0.15);
  cabin.castShadow = true;
  car.add(body, nose, cabin);

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.7 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xdedbd0, metalness: 0.5, roughness: 0.25 });
  const wheels = [];
  [
    [-0.68, 0.18, -0.58],
    [0.68, 0.18, -0.58],
    [-0.68, 0.18, 0.62],
    [0.68, 0.18, 0.62]
  ].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 24), wheelMaterial);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.19, 18), rimMaterial);
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);
    wheels.push(wheel);
    car.add(wheel);
  });

  const headlightTarget = new THREE.Object3D();
  const headlights = new THREE.SpotLight(0xfff7d6, 18, 9, Math.PI / 8, 0.42, 1.6);
  headlights.position.set(0, 0.47, 1.05);
  headlights.target = headlightTarget;
  car.add(headlights, headlightTarget);
  scene.add(headlightTarget);

  return { group: car, wheels, headlightTarget };
}

const redCar = makeCar(0xcc2f3b, 0xf3d55b);
const tealCar = makeCar(0x159a9c, 0xf0f4f8);
world.add(redCar.group, tealCar.group);

const exhaustPuffs = [];
const exhaustGeometry = new THREE.SphereGeometry(0.12, 12, 8);
for (let i = 0; i < 34; i += 1) {
  const puff = new THREE.Mesh(
    exhaustGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xbfc0bd,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  puff.visible = false;
  puff.userData.life = 0;
  puff.userData.velocity = new THREE.Vector3();
  exhaustPuffs.push(puff);
  world.add(puff);
}

function emitExhaust(car, t, laneOffset) {
  const puff = exhaustPuffs.find((item) => item.userData.life <= 0);
  if (!puff) return;

  const tangent = getTrackTangent(t);
  const rear = getTrackPoint(t, laneOffset, TRACK_Y)
    .add(tangent.clone().multiplyScalar(-1.05))
    .add(new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.34, (Math.random() - 0.5) * 0.1));

  puff.position.copy(rear);
  puff.scale.setScalar(0.45 + Math.random() * 0.15);
  puff.material.opacity = 0.34;
  puff.visible = true;
  puff.userData.life = 1;
  puff.userData.velocity.copy(tangent).multiplyScalar(-0.035);
  puff.userData.velocity.y = 0.018;
}

function updateExhaust(delta) {
  exhaustPuffs.forEach((puff) => {
    if (puff.userData.life <= 0) return;
    puff.userData.life -= delta * 1.25;
    puff.position.addScaledVector(puff.userData.velocity, delta * 60);
    puff.scale.multiplyScalar(1 + delta * 1.25);
    puff.material.opacity = Math.max(puff.userData.life, 0) * 0.34;
    if (puff.userData.life <= 0) {
      puff.visible = false;
    }
  });
}

const loader = new GLTFLoader();
loader.load(
  "./assets/speedway-sign.gltf",
  (gltf) => {
    const model = gltf.scene;
    model.position.set(-9.8, 0.05, -6.9);
    model.rotation.y = Math.PI * 0.15;
    model.scale.setScalar(1.45);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    world.add(model);
  },
  undefined,
  (error) => {
    console.error("The required textured GLTF model did not load.", error);
  }
);

let followMode = false;
followToggle.addEventListener("click", () => {
  followMode = !followMode;
  followToggle.setAttribute("aria-pressed", String(followMode));
});

rainToggle.addEventListener("click", () => {
  rain.visible = !rain.visible;
  rainToggle.setAttribute("aria-pressed", String(rain.visible));
  rainToggle.textContent = rain.visible ? "Rain On" : "Rain Off";
});

const clock = new THREE.Clock();
let redLap = 0;
let tealLap = 0;
let redLast = 0;
let tealLast = 0;
let exhaustTimer = 0;

function placeCar(car, t, laneOffset, speed) {
  const position = getTrackPoint(t, laneOffset, TRACK_Y);
  const tangent = getTrackTangent(t);
  car.group.position.copy(position);
  car.group.rotation.y = Math.atan2(tangent.x, tangent.z);
  car.wheels.forEach((wheel) => {
    wheel.rotation.x -= speed * 0.09;
  });

  const forward = tangent.clone().multiplyScalar(5.25);
  car.headlightTarget.position.copy(position.clone().add(forward).setY(0.41));
}

function updateLap(current, previous, laps) {
  return current < previous ? laps + 1 : laps;
}

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  const redT = (elapsed * 0.065) % 1;
  const tealT = (elapsed * 0.081 + 0.42) % 1;

  redLap = updateLap(redT, redLast, redLap);
  tealLap = updateLap(tealT, tealLast, tealLap);
  redLast = redT;
  tealLast = tealT;

  placeCar(redCar, redT, LANE_OFFSET, 1.2);
  placeCar(tealCar, tealT, -LANE_OFFSET, 1.45);

  exhaustTimer += delta;
  if (exhaustTimer > 0.09) {
    emitExhaust(redCar, redT, LANE_OFFSET);
    emitExhaust(tealCar, tealT, -LANE_OFFSET);
    exhaustTimer = 0;
  }
  updateExhaust(delta);
  updateRain(delta);

  flagMarshal.userData.wavingArm.rotation.z = 0.45 + Math.sin(elapsed * 5.2) * 0.42;

  lapReadout.textContent = `Red laps: ${redLap} | Teal laps: ${tealLap}`;

  skybox.position.copy(camera.position);

  if (followMode) {
    const forward = getTrackTangent(redT);
    const desiredPosition = redCar.group.position
      .clone()
      .add(forward.clone().multiplyScalar(-4.3))
      .add(new THREE.Vector3(0, 2.4, 0));
    camera.position.lerp(desiredPosition, 0.075);
    controls.target.lerp(redCar.group.position.clone().add(forward.multiplyScalar(2.1)), 0.1);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
