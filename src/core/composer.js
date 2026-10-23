import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Render pass for base 3D scene
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal Bloom Pass tinh chỉnh màu tối, dịu mắt chuẩn ảnh thiên văn:
  // Threshold cao (0.55) và Strength thấp (0.28) để loại bỏ hoàn toàn hiện tượng chói mắt,
  // giữ nền đen sâu thẳm và dải mây màu trầm tối huyền bí
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.52,  // strength vừa vặn làm nổi bật dải mây
    0.55,  // radius
    0.35   // threshold phù hợp cho dải mây phát sáng dịu
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
