import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { spaceAudio } from '../audio/spaceAudio.js';

export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.minDistance = 4;
  controls.maxDistance = 650;
  controls.maxPolarAngle = Math.PI - 0.05; // Prevent flipping beneath the pole

  let activeTween = null;
  let isTouring = false;
  let tourTimeline = null;

  // Camera presets
  const presets = {
    overview: {
      position: new THREE.Vector3(0, 120, 180),
      target: new THREE.Vector3(0, 0, 0),
      duration: 2.5
    },
    topdown: {
      position: new THREE.Vector3(0, 240, 0.1),
      target: new THREE.Vector3(0, 0, 0),
      duration: 2.2
    },
    blackhole: {
      position: new THREE.Vector3(0, 7, 24),
      target: new THREE.Vector3(0, 0, 0),
      duration: 2.8
    },
    solarsystem: {
      position: new THREE.Vector3(56, 16, -42),
      target: new THREE.Vector3(48, 0, -42),
      duration: 2.6
    },
    edgeon: {
      position: new THREE.Vector3(200, 3, 0),
      target: new THREE.Vector3(0, 0, 0),
      duration: 2.4
    }
  };

  // Fly to target with cinematic smooth bezier interpolation
  function flyTo(targetPos, targetLookAt, duration = 2.2, onComplete = null) {
    stopTour();

    if (activeTween) {
      activeTween.kill();
    }

    spaceAudio.playWarpSound();

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const progressObj = { t: 0 };

    activeTween = gsap.to(progressObj, {
      t: 1,
      duration: duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(startPos, targetPos, progressObj.t);
        controls.target.lerpVectors(startTarget, targetLookAt, progressObj.t);
        controls.update();
      },
      onComplete: () => {
        activeTween = null;
        if (onComplete) onComplete();
      }
    });
  }

  function goToPreset(name) {
    const p = presets[name];
    if (p) {
      flyTo(p.position, p.target, p.duration);
    }
  }

  // Cinematic Auto-Pilot Tour
  function startTour(onTourStep = null) {
    stopTour();
    isTouring = true;

    const tourSteps = [
      { name: 'Toàn cảnh Dải Ngân Hà', preset: 'overview', wait: 5 },
      { name: 'Nhân Thiên Hà & Lỗ đen Sagittarius A*', preset: 'blackhole', wait: 6 },
      { name: 'Hệ Mặt Trời & Trái Đất (Orion Spur)', preset: 'solarsystem', wait: 6 },
      { name: 'Góc nghiêng đĩa Thiên Hà', preset: 'edgeon', wait: 5 },
      { name: 'Bản đồ xoắn ốc nhìn từ trên cao', preset: 'topdown', wait: 5 }
    ];

    let currentStep = 0;

    function runStep() {
      if (!isTouring) return;
      const step = tourSteps[currentStep];
      if (onTourStep) onTourStep(step.name, currentStep + 1, tourSteps.length);

      const p = presets[step.preset];
      flyTo(p.position, p.target, 3.0, () => {
        if (!isTouring) return;
        // Slow orbit during wait time
        const waitTimeout = setTimeout(() => {
          if (!isTouring) return;
          currentStep = (currentStep + 1) % tourSteps.length;
          runStep();
        }, step.wait * 1000);
        tourTimeline = { kill: () => clearTimeout(waitTimeout) };
      });
    }

    runStep();
  }

  function stopTour() {
    if (tourTimeline) {
      tourTimeline.kill();
      tourTimeline = null;
    }
    isTouring = false;
  }

  // Intercept user interaction to interrupt auto tour
  domElement.addEventListener('pointerdown', () => {
    if (isTouring) {
      stopTour();
      window.dispatchEvent(new CustomEvent('tour-stopped'));
    }
  });

  return {
    controls,
    flyTo,
    goToPreset,
    startTour,
    stopTour,
    isTouring: () => isTouring,
    presets
  };
}
