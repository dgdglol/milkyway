import * as THREE from 'three';

export class SagittariusA {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.eventHorizon = null;
    this.accretionDisk = null;
    this.photonRing = null;
    this.jets = null;
    this.jetMaterial = null;

    this.init();
  }

  init() {
    // 1. Compact Event Horizon
    const horizonGeo = new THREE.SphereGeometry(1.6, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000208
    });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.group.add(this.eventHorizon);

    // 2. Photon Ring (Cyan-White glow ring)
    const ringGeo = new THREE.RingGeometry(1.62, 1.88, 72);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfff2cc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.photonRing = new THREE.Mesh(ringGeo, ringMat);
    this.photonRing.rotation.x = Math.PI / 2;
    this.group.add(this.photonRing);

    // 3. Accretion Disk styled with Cyan, Aqua & Magenta swirl
    const diskGeo = new THREE.RingGeometry(1.9, 9.2, 96, 24);
    this.diskMaterial = new THREE.ShaderMaterial({
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
          vec2 centered = vUv - vec2(0.5);
          float dist = length(centered) * 2.0;

          if (dist < 0.22 || dist > 1.0) discard;

          float angle = atan(centered.y, centered.x);

          // Swirling spiral bands
          float swirl = sin(angle * 4.0 + uTime * 3.5 - dist * 8.0);

          // Sắc vàng mật ong, hổ phách và champagne ấm áp hài hòa với thanh chắn ngân hà
          vec3 coreWhiteGold = vec3(1.0, 0.95, 0.75);
          vec3 midGold = vec3(1.0, 0.75, 0.2);
          vec3 outerAmber = vec3(0.9, 0.45, 0.1);

          float innerAlpha = smoothstep(0.22, 0.32, dist);
          float outerAlpha = 1.0 - smoothstep(0.7, 1.0, dist);
          float fade = innerAlpha * outerAlpha;

          vec3 plasmaColor = mix(coreWhiteGold, midGold, smoothstep(0.22, 0.55, dist));
          plasmaColor = mix(plasmaColor, outerAmber, smoothstep(0.55, 1.0, dist));

          float brightness = 0.8 + swirl * 0.25;
          gl_FragColor = vec4(plasmaColor * brightness, fade * 0.65);
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

    this.accretionDisk = new THREE.Mesh(diskGeo, this.diskMaterial);
    this.accretionDisk.rotation.x = Math.PI * 0.48;
    this.group.add(this.accretionDisk);

    // 4. Subtle Relativistic Jets
    this.createAstrophysicalJets();

    this.scene.add(this.group);
  }

  createAstrophysicalJets() {
    const jetCount = 1200;
    const jetGeo = new THREE.BufferGeometry();
    const jetPositions = new Float32Array(jetCount * 3);
    const jetColors = new Float32Array(jetCount * 3);
    const jetScales = new Float32Array(jetCount);
    const jetDirections = new Float32Array(jetCount);

    const jetColorTop = new THREE.Color('#38bdf8');
    const jetColorCore = new THREE.Color('#00f0ff');

    for (let i = 0; i < jetCount; i++) {
      const i3 = i * 3;
      const isTop = i % 2 === 0;
      const dir = isTop ? 1 : -1;
      jetDirections[i] = dir;

      const h = 2.0 + Math.pow(Math.random(), 1.5) * 28;
      const radiusAtH = 0.2 + (h / 28) * 1.4;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radiusAtH;

      jetPositions[i3] = Math.cos(angle) * r;
      jetPositions[i3 + 1] = h * dir;
      jetPositions[i3 + 2] = Math.sin(angle) * r;

      const alpha = h / 28;
      const c = jetColorCore.clone().lerp(jetColorTop, alpha);
      jetColors[i3] = c.r;
      jetColors[i3 + 1] = c.g;
      jetColors[i3 + 2] = c.b;

      jetScales[i] = (1.0 - alpha * 0.5) * (1.0 + Math.random() * 1.5);
    }

    jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
    jetGeo.setAttribute('color', new THREE.BufferAttribute(jetColors, 3));
    jetGeo.setAttribute('aScale', new THREE.BufferAttribute(jetScales, 1));
    jetGeo.setAttribute('aDir', new THREE.BufferAttribute(jetDirections, 1));

    this.jetMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        attribute float aDir;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          vec3 p = position;
          float speed = 24.0;
          float cycleLength = 28.0;
          float currentH = abs(p.y) + uTime * speed;
          float wrappedH = 2.0 + mod(currentH, cycleLength);
          p.y = wrappedH * aDir;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float progress = wrappedH / cycleLength;
          vAlpha = (1.0 - progress) * 0.7;

          gl_PointSize = aScale * (100.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 16.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 }
      }
    });

    this.jets = new THREE.Points(jetGeo, this.jetMaterial);
    this.group.add(this.jets);
  }

  toggleJets(visible) {
    if (this.jets) {
      this.jets.visible = visible;
    }
  }

  update(elapsedTime) {
    if (this.diskMaterial && this.diskMaterial.uniforms.uTime) {
      this.diskMaterial.uniforms.uTime.value = elapsedTime;
    }
    if (this.jetMaterial && this.jetMaterial.uniforms.uTime) {
      this.jetMaterial.uniforms.uTime.value = elapsedTime;
    }
    if (this.accretionDisk) {
      this.accretionDisk.rotation.z += 0.0015;
    }
  }
}
