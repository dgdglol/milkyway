import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Render pass for base 3D scene
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal Bloom Pass for celestial glow
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.55,  // strength
    0.85,  // radius
    0.08   // threshold
  );

  composer.addPass(bloomPass);

  function resize(width, height) {
    composer.setSize(width, height);
    bloomPass.resolution.set(width, height);
  }

  function setBloomStrength(val) {
    bloomPass.strength = val;
  }

  function setBloomRadius(val) {
    bloomPass.radius = val;
  }

  return { composer, bloomPass, resize, setBloomStrength, setBloomRadius };
}
