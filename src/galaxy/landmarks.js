import * as THREE from 'three';
import { spaceAudio } from '../audio/spaceAudio.js';

export class LandmarksManager {
  constructor(scene, camera, overlayContainer, onSelectLandmark) {
    this.scene = scene;
    this.camera = camera;
    this.container = overlayContainer;
    this.onSelectLandmark = onSelectLandmark;

    this.group = new THREE.Group();
    this.landmarks = [];
    this.visible = true;

    this.init();
  }

  init() {
    // 1. Solar System (Hệ Mặt Trời / Bạn đang ở đây)
    // Coords in Orion Spur: x: 48, y: 0.6, z: -42
    const sunPos = new THREE.Vector3(48, 0.6, -42);
    this.createSolarSystemMarker(sunPos);

    // 2. Sagittarius A* (Galactic Center)
    const sagPos = new THREE.Vector3(0, 0, 0);

    // 3. Perseus Arm
    const perseusPos = new THREE.Vector3(-68, 0, 34);

    // 4. Scutum-Centaurus Arm
    const scutumPos = new THREE.Vector3(45, 0, 64);

    // List of landmarks
    this.landmarkData = [
      {
        id: 'solarsystem',
        title: 'Hệ Mặt Trời (Bạn đang ở đây)',
        subtitle: 'Khoảng cách tâm: ~26.000 năm ánh sáng (Orion Spur)',
        position: sunPos,
        cameraPreset: 'solarsystem',
        highlight: true
      },
      {
        id: 'blackhole',
        title: 'Sagittarius A* (Nhân Ngân Hà)',
        subtitle: 'Lỗ đen siêu khối lượng ~4.3 triệu lần Mặt Trời',
        position: sagPos,
        cameraPreset: 'blackhole',
        highlight: false
      },
      {
        id: 'perseus',
        title: 'Nhánh Perseus',
        subtitle: 'Một trong hai nhánh xoắn ốc khổng lồ chính',
        position: perseusPos,
        cameraPreset: null,
        targetPos: new THREE.Vector3(-75, 40, 50),
        highlight: false
      },
      {
        id: 'scutum',
        title: 'Nhánh Scutum-Centaurus',
        subtitle: 'Vườn ươm sao khổng lồ của Ngân Hà',
        position: scutumPos,
        cameraPreset: null,
        targetPos: new THREE.Vector3(55, 40, 80),
        highlight: false
      }
    ];

    // Create DOM element markers
    this.landmarkData.forEach(item => {
      const el = document.createElement('div');
      el.className = `landmark-badge ${item.highlight ? 'highlight-pulse' : ''}`;
      el.innerHTML = `
        <div class="badge-dot"></div>
        <div class="badge-card">
          <div class="badge-title">${item.title}</div>
          <div class="badge-sub">${item.subtitle}</div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        spaceAudio.playPingSound(920, 0.6);
        if (this.onSelectLandmark) {
          this.onSelectLandmark(item);
        }
      });

      this.container.appendChild(el);
      this.landmarks.push({ ...item, el });
    });

    this.scene.add(this.group);
  }

  createSolarSystemMarker(pos) {
    // 3D Sun mesh
    const sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffd700
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.copy(pos);
    this.group.add(sunMesh);

    // Glowing sun corona ring
    const coronaGeo = new THREE.RingGeometry(1.25, 2.6, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.rotation.x = Math.PI / 2;
    corona.position.copy(pos);
    this.group.add(corona);

    // Animated beacon pulse waves on the galactic plane
    const waveGeo = new THREE.RingGeometry(0.5, 1.2, 48);
    const waveMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          float pulse = fract(uTime * 0.45);
          float ringDist = abs(dist - pulse);
          float alpha = smoothstep(0.12, 0.0, ringDist) * (1.0 - pulse);
          gl_FragColor = vec4(0.22, 0.74, 1.0, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 }
      }
    });

    this.beaconWaveMat = waveMat;
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = Math.PI / 2;
    wave.position.copy(pos);
    wave.scale.set(14, 14, 14);
    this.group.add(wave);

    // Vertical pointer line to make locating it intuitive from any angle
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      pos,
      new THREE.Vector3(pos.x, pos.y + 12, pos.z)
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.2,
      gapSize: 0.8,
      transparent: true,
      opacity: 0.7
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    this.group.add(line);
  }

  toggle(visible) {
    this.visible = visible;
    this.group.visible = visible;
    this.container.style.display = visible ? 'block' : 'none';
  }

  update(elapsedTime) {
    if (this.beaconWaveMat) {
      this.beaconWaveMat.uniforms.uTime.value = elapsedTime;
    }

    if (!this.visible) return;

    // Project 3D coordinates to 2D screen pixels for DOM badges
    const tempV = new THREE.Vector3();
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    this.landmarks.forEach(lm => {
      // Offset position slightly above marker
      tempV.copy(lm.position);
      if (lm.id === 'solarsystem') {
        tempV.y += 12;
      } else {
        tempV.y += 6;
      }

      tempV.project(this.camera);

      // Check if behind camera
      if (tempV.z > 1.0) {
        lm.el.style.opacity = '0';
        lm.el.style.pointerEvents = 'none';
        return;
      }

      const x = (tempV.x * halfW) + halfW;
      const y = -(tempV.y * halfH) + halfH;

      // Distance fade out when zoomed extremely far
      const dist = this.camera.position.distanceTo(lm.position);
      const alpha = THREE.MathUtils.clamp((500 - dist) / 350, 0.2, 1.0);

      lm.el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
      lm.el.style.opacity = `${alpha}`;
      lm.el.style.pointerEvents = 'auto';
    });
  }
}
