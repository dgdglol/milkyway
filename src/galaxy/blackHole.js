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
    // 1. Event Horizon (Shadow of the black hole)
    // Pure pitch-black sphere absorbing all light
    const horizonGeo = new THREE.SphereGeometry(2.4, 64, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.group.add(this.eventHorizon);

    // 2. Photon Ring (Ultra-bright razor-thin ring hugging the event horizon)
    const ringGeo = new THREE.RingGeometry(2.42, 2.7, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfff4db,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.photonRing = new THREE.Mesh(ringGeo, ringMat);
    this.photonRing.rotation.x = Math.PI / 2;
    this.group.add(this.photonRing);

    // 3. Relativistic Accretion Disk (Swirling glowing plasma with Doppler beaming)
    const diskGeo = new THREE.RingGeometry(2.8, 14.5, 128, 32);
    // Custom shader for relativistic Doppler beaming & swirling turbulence
    this.diskMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          // Normalize radius from inner (2.8) to outer (14.5)
          vec2 centered = vUv - vec2(0.5);
          float dist = length(centered) * 2.0;

          if (dist < 0.22 || dist > 1.0) discard;

          // Polar angle
          float angle = atan(centered.y, centered.x);

          // Swirling plasma streaks
          float spiral = sin(angle * 6.0 + uTime * 4.0 - dist * 12.0);
          float fineStreaks = sin(angle * 18.0 - uTime * 8.0 + dist * 24.0) * 0.5 + 0.5;

          // Relativistic Doppler beaming: approaching side (X < 0) is much brighter & hotter
          float dopplerFactor = clamp(sin(angle + 1.2) * 0.45 + 0.55, 0.2, 1.2);

          // Radial temperature gradient: extremely hot white/gold near horizon, cooling to red/orange at rim
          vec3 hotColor = vec3(1.0, 0.95, 0.85); // White-yellow
          vec3 midColor = vec3(1.0, 0.55, 0.15); // Vibrant orange
          vec3 coolColor = vec3(0.85, 0.15, 0.05); // Deep red

          float innerAlpha = smoothstep(0.22, 0.35, dist);
          float outerAlpha = 1.0 - smoothstep(0.75, 1.0, dist);
          float radialFade = innerAlpha * outerAlpha;

          vec3 plasmaColor = mix(hotColor, midColor, smoothstep(0.22, 0.55, dist));
          plasmaColor = mix(plasmaColor, coolColor, smoothstep(0.55, 1.0, dist));

          // Apply turbulence and doppler beaming
          float brightness = (0.7 + spiral * 0.2 + fineStreaks * 0.25) * dopplerFactor;
          vec3 finalColor = plasmaColor * brightness * 1.8;

          float alpha = radialFade * (0.65 + fineStreaks * 0.35) * dopplerFactor;

          gl_FragColor = vec4(finalColor, alpha);
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
    // Slight tilt to give the iconic cinematic aesthetic
    this.accretionDisk.rotation.x = Math.PI * 0.46;
    this.accretionDisk.rotation.z = Math.PI * 0.08;
    this.group.add(this.accretionDisk);

    // 4. Relativistic Jets (Collimated plasma beams shooting from poles)
    this.createAstrophysicalJets();

    this.scene.add(this.group);
  }

  createAstrophysicalJets() {
    const jetCount = 2000;
    const jetGeo = new THREE.BufferGeometry();
    const jetPositions = new Float32Array(jetCount * 3);
    const jetColors = new Float32Array(jetCount * 3);
    const jetScales = new Float32Array(jetCount);
    const jetDirections = new Float32Array(jetCount);

    const jetColorTop = new THREE.Color('#38bdf8'); // Brilliant cyan beam
    const jetColorCore = new THREE.Color('#ffffff'); // White core

    for (let i = 0; i < jetCount; i++) {
      const i3 = i * 3;
      const isTop = i % 2 === 0;
      const dir = isTop ? 1 : -1;
      jetDirections[i] = dir;

      // Distance along beam from 2 to 38
      const h = 2.5 + Math.pow(Math.random(), 1.5) * 36;
      // Collimated narrow cylinder spreading slightly
      const radiusAtH = 0.25 + (h / 38) * 1.8;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radiusAtH;

      jetPositions[i3] = Math.cos(angle) * r;
      jetPositions[i3 + 1] = h * dir;
      jetPositions[i3 + 2] = Math.sin(angle) * r;

      const alpha = h / 38;
      const c = jetColorCore.clone().lerp(jetColorTop, alpha);
      jetColors[i3] = c.r;
      jetColors[i3 + 1] = c.g;
      jetColors[i3 + 2] = c.b;

      jetScales[i] = (1.0 - alpha * 0.5) * (1.2 + Math.random() * 2.0);
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

          // Animate plasma shooting outward at relativistic speed
          vec3 p = position;
          float speed = 28.0;
          float cycleLength = 36.0;
          float currentH = abs(p.y) + uTime * speed;
          float wrappedH = 2.5 + mod(currentH, cycleLength);
          p.y = wrappedH * aDir;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float progress = wrappedH / cycleLength;
          vAlpha = (1.0 - progress) * 0.85;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = max(gl_PointSize, 1.0);
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
      this.accretionDisk.rotation.z += 0.002;
    }
  }
}
