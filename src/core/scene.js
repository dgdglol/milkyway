import * as THREE from 'three';

export function createScene(canvas) {
  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020208, 0.0012);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2500
  );
  // Default majestic isometric view of the galaxy
  camera.position.set(0, 110, 170);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    powerPreference: 'high-performance',
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true // Required for high-res screenshot capture
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Add distant background cosmic starfield (15,000 deep space stars)
  const bgStarGeo = new THREE.BufferGeometry();
  const bgCount = 15000;
  const bgPositions = new Float32Array(bgCount * 3);
  const bgColors = new Float32Array(bgCount * 3);

  for (let i = 0; i < bgCount; i++) {
    // Distribute on a large sphere radius 800 - 1800
    const r = 800 + Math.random() * 1000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bgPositions[i * 3 + 2] = r * Math.cos(phi);

    // Subtle star colors (blueish white, soft cyan, faint reddish)
    const colorType = Math.random();
    if (colorType > 0.8) {
      bgColors[i * 3] = 0.7; bgColors[i * 3 + 1] = 0.85; bgColors[i * 3 + 2] = 1.0;
    } else if (colorType > 0.6) {
      bgColors[i * 3] = 1.0; bgColors[i * 3 + 1] = 0.85; bgColors[i * 3 + 2] = 0.7;
    } else {
      bgColors[i * 3] = 0.85; bgColors[i * 3 + 1] = 0.9; bgColors[i * 3 + 2] = 1.0;
    }
  }

  bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

  const bgStarMat = new THREE.PointsMaterial({
    size: 1.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true
  });

  const bgStars = new THREE.Points(bgStarGeo, bgStarMat);
  scene.add(bgStars);

  return { scene, camera, renderer, bgStars };
}
