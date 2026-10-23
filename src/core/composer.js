import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Render pass for base 3D scene
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal Bloom Pass: Giảm tối đa (strength 0.08, threshold 0.75)
  // Loại bỏ triệt để hiện tượng chói lóa mắt theo đúng phong cách "100,000 Stars" của Google Chrome Experiments
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.08,  // Cực kỳ dịu nhẹ, không bị chói sáng
    0.35,  // radius gọn gàng
    0.75   // threshold cao, chỉ hạt nhân cực nhỏ mới có ánh hào quang mờ ảo
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
