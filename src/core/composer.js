import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Render pass for base 3D scene
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal Bloom Pass tuned for high contrast:
  // Higher threshold (0.32) ensures background remains deep void black and colors stay rich & saturated
  // Strength (0.95) provides magical celestial aura without blowing out the galaxy into pure white
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.95,  // strength (vừa phải, sắc nét, không bị chói lóa)
    0.65,  // radius
    0.32   // threshold (chỉ phần nhân cực sáng mới phát hào quang, giữ rõ các nhánh xoắn)
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
