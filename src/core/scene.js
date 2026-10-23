import * as THREE from 'three';

export function createScene(canvas) {
  // Scene with deep pitch black cosmic void
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000104, 0.0008);

  // Camera looking at galaxy
  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    2500
  );
  camera.position.set(0, 95, 145);

  // High performance WebGL renderer with dark, moody tone mapping
  const renderer = new THREE.WebGLRenderer({
    canvas,
    powerPreference: 'high-performance',
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82; // Tone trầm tối, dịu mắt chuẩn ảnh thiên văn học
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Background deep space stars (nhẹ nhàng, mờ ảo xa xôi)
  const bgStarGeo = new THREE.BufferGeometry();
  const bgCount = 8000;
  const bgPositions = new Float32Array(bgCount * 3);
  const bgColors = new Float32Array(bgCount * 3);

  for (let i = 0; i < bgCount; i++) {
    const r = 900 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bgPositions[i * 3 + 2] = r * Math.cos(phi);

    bgColors[i * 3] = 0.35;
    bgColors[i * 3 + 1] = 0.45;
    bgColors[i * 3 + 2] = 0.65;
  }

  bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

  const bgStarMat = new THREE.PointsMaterial({
    size: 1.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true
  });

  const bgStars = new THREE.Points(bgStarGeo, bgStarMat);
  scene.add(bgStars);

  return { scene, camera, renderer, bgStars };
}
