import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createComposer } from './core/composer.js';
import { createControls } from './core/controls.js';
import { GalaxyGenerator } from './galaxy/galaxyGenerator.js';
import { DustGenerator } from './galaxy/dustGenerator.js';
import { SagittariusA } from './galaxy/blackHole.js';
import { LightPillar } from './galaxy/lightPillar.js';
import { LandmarksManager } from './galaxy/landmarks.js';
import { setupHUD } from './ui/hud.js';

// Entrypoint
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl');
  const landmarksContainer = document.getElementById('landmarks-container');

  // 1. Core Three.js Scene, Camera, Renderer
  const { scene, camera, renderer, bgStars } = createScene(canvas);

  // 2. Post-processing UnrealBloomPass & EffectComposer
  const composer = createComposer(renderer, scene, camera);

  // 3. OrbitControls & Camera FlyTo
  const controls = createControls(camera, renderer.domElement);

  // 4. Spiral Galaxy Stars Generator (Chế độ ít sao thanh thoát)
  const galaxy = new GalaxyGenerator(scene);

  // 5. Interstellar Dust & Emission Nebulae
  const dust = new DustGenerator(scene);

  // 6. Central Black Hole
  const blackHole = new SagittariusA(scene);

  // 7. Cột ánh sáng vũ trụ xuyên qua tâm Dải Ngân Hà
  const lightPillar = new LightPillar(scene);

  // 8. 3D Celestial Landmarks & Solar System Beacon
  const landmarks = new LandmarksManager(scene, camera, landmarksContainer, (item) => {
    if (item.cameraPreset) {
      controls.goToPreset(item.cameraPreset);
    } else if (item.targetPos) {
      controls.flyTo(item.targetPos, item.position);
    }
  });

  // 9. Connect HUD & UI Event Listeners
  setupHUD({
    galaxy,
    dust,
    blackHole,
    lightPillar,
    landmarks,
    controls,
    composer,
    renderer,
    scene,
    camera
  });

  // 10. Resize Handling
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    composer.resize(width, height);
  });

  // 11. FPS Counter & Telemetry
  let frameCount = 0;
  let lastTime = performance.now();
  const fpsElement = document.getElementById('stat-fps');

  // 12. Main Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Rotate distant background stars slowly
    if (bgStars) {
      bgStars.rotation.y = elapsedTime * 0.002;
    }

    // Update galaxy shader uniforms
    galaxy.update(elapsedTime);

    // Update interstellar dust clouds
    dust.update(elapsedTime);

    // Update black hole accretion disk & relativistic jets
    blackHole.update(elapsedTime);

    // Update cosmic light pillar
    lightPillar.update(elapsedTime);

    // Update landmarks
    landmarks.update(elapsedTime);

    // Update smooth damping controls
    controls.controls.update();

    // Render post-processed scene with bloom
    composer.composer.render();

    // FPS Telemetry update (every 500ms)
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      if (fpsElement) {
        fpsElement.innerText = fps;
      }
      frameCount = 0;
      lastTime = now;
    }
  }

  animate();
});
