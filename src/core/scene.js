import * as THREE from 'three';

export function createScene(canvas) {
  // Scene with deep midnight cosmos background
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x01020a, 0.001);

  // Camera angled across the swirling disc like the reference photo
  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    2500
  );
  camera.position.set(0, 85, 140);

  // High performance WebGL renderer
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
  renderer.toneMappingExposure = 1.05; // Balanced exposure to prevent white blowout
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Background deep space stars (10,000 faint stars)
  const bgStarGeo = new THREE.BufferGeometry();
  const bgCount = 10000;
  const bgPositions = new Float32Array(bgCount * 3);
  const bgColors = new Float32Array(bgCount * 3);

  for (let i = 0; i < bgCount; i++) {
    const r = 900 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bgPositions[i * 3 + 2] = r * Math.cos(phi);

    // Deep blue and cyan faint stars
    const rand = Math.random();
    if (rand > 0.7) {
      bgColors[i * 3] = 0.2; bgColors[i * 3 + 1] = 0.6; bgColors[i * 3 + 2] = 1.0;
    } else {
      bgColors[i * 3] = 0.5; bgColors[i * 3 + 1] = 0.7; bgColors[i * 3 + 2] = 0.9;
    }
  }

  bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

  const bgStarMat = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true
  });

  const bgStars = new THREE.Points(bgStarGeo, bgStarMat);
  scene.add(bgStars);

  return { scene, camera, renderer, bgStars };
}
