import * as THREE from 'three';

export class LightPillar {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.visible = true;

    this.beamMesh = null;
    this.coreMesh = null;
    this.ringsGroup = null;
    this.sparkles = null;

    this.materials = [];

    this.init();
  }

  init() {
    // 1. Outer Volumetric Ethereal Pillar (Cylinder from Y: -85 to +85)
    const beamGeo = new THREE.CylinderGeometry(2.2, 4.8, 170, 32, 32, true);
    const beamMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          // Vertical distance from center (0.0 at top/bottom, 1.0 at center Y=0)
          float distCenter = 1.0 - abs(vUv.y - 0.5) * 2.0;
          float verticalFade = smoothstep(0.0, 0.35, distCenter);

          // Fresnel edge softness (more transparent when facing camera directly, glowing rim)
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 1.8);

          // Animated energy stream flowing along the pillar
          float flowUp = sin(vUv.y * 24.0 - uTime * 4.5);
          float flowDown = sin(vUv.y * 18.0 + uTime * 3.8);
          float stream = (flowUp + flowDown) * 0.15 + 0.85;

          // Color gradient: Electric Cyan center blending into Cosmic Violet/Magenta near edges
          vec3 cyan = vec3(0.0, 0.95, 1.0);
          vec3 magenta = vec3(0.85, 0.2, 0.95);
          vec3 color = mix(cyan, magenta, abs(vUv.y - 0.5) * 1.5);

          float alpha = verticalFade * (fresnel * 0.85 + 0.2) * stream * 0.65;

          gl_FragColor = vec4(color * 1.4, alpha);
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

    this.materials.push(beamMat);
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.group.add(this.beamMesh);

    // 2. Bright Concentrated Central Core Laser Line
    const coreGeo = new THREE.CylinderGeometry(0.5, 1.2, 160, 16, 16, true);
    const coreMat = new THREE.ShaderMaterial({
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
          float distCenter = 1.0 - abs(vUv.y - 0.5) * 2.0;
          float verticalFade = smoothstep(0.0, 0.45, distCenter);

          float pulse = sin(uTime * 3.0 + vUv.y * 10.0) * 0.15 + 0.85;

          vec3 coreColor = vec3(0.7, 0.95, 1.0); // Bright radiant cyan-white
          float alpha = verticalFade * pulse * 0.8;

          gl_FragColor = vec4(coreColor * 1.6, alpha);
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

    this.materials.push(coreMat);
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreMesh);

    // 3. Pulsing Cosmic Energy Rings around the Pillar
    this.ringsGroup = new THREE.Group();
    const ringCount = 8;
    this.ringMeshes = [];

    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(2.5, 4.2, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f5ff : 0xd946ef,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.userData = {
        baseY: (i - ringCount / 2) * 16 + 8,
        speed: 1.2 + (i % 3) * 0.4,
        phase: i * 0.8
      };
      this.ringsGroup.add(ring);
      this.ringMeshes.push(ring);
    }
    this.group.add(this.ringsGroup);

    // 4. Sparkles / Photons streaming along the pillar
    const sparkCount = 600;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkColors = new Float32Array(sparkCount * 3);
    const sparkScales = new Float32Array(sparkCount);
    const sparkSpeeds = new Float32Array(sparkCount);
    const sparkDirs = new Float32Array(sparkCount);

    const cCyan = new THREE.Color('#00f5ff');
    const cViolet = new THREE.Color('#d946ef');

    for (let i = 0; i < sparkCount; i++) {
      const i3 = i * 3;
      const dir = i % 2 === 0 ? 1 : -1;
      sparkDirs[i] = dir;

      const angle = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 2.8;
      const y = (Math.random() - 0.5) * 150;

      sparkPos[i3] = Math.cos(angle) * r;
      sparkPos[i3 + 1] = y;
      sparkPos[i3 + 2] = Math.sin(angle) * r;

      const c = Math.random() > 0.5 ? cCyan : cViolet;
      sparkColors[i3] = c.r;
      sparkColors[i3 + 1] = c.g;
      sparkColors[i3 + 2] = c.b;

      sparkScales[i] = 1.2 + Math.random() * 2.2;
      sparkSpeeds[i] = 18.0 + Math.random() * 24.0;
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));
    sparkGeo.setAttribute('aScale', new THREE.BufferAttribute(sparkScales, 1));
    sparkGeo.setAttribute('aSpeed', new THREE.BufferAttribute(sparkSpeeds, 1));
    sparkGeo.setAttribute('aDir', new THREE.BufferAttribute(sparkDirs, 1));

    this.sparkMat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        attribute float aSpeed;
        attribute float aDir;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          vec3 p = position;
          // Animate streaming upward and downward
          float currentY = p.y + uTime * aSpeed * aDir;
          float wrappedY = mod(currentY + 75.0, 150.0) - 75.0;
          p.y = wrappedY;

          // Spiral motion around beam
          float dist = length(p.xz);
          float angle = uTime * 2.0 * aDir;
          p.x = cos(angle) * p.x - sin(angle) * p.z;
          p.z = sin(angle) * p.x + cos(angle) * p.z;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPos;

          // Fade out near top/bottom
          float normY = 1.0 - abs(wrappedY) / 75.0;
          vAlpha = smoothstep(0.0, 0.25, normY) * 0.9;

          gl_PointSize = aScale * (110.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 24.0);
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

    this.materials.push(this.sparkMat);
    this.sparkles = new THREE.Points(sparkGeo, this.sparkMat);
    this.group.add(this.sparkles);

    this.scene.add(this.group);
  }

  toggle(visible) {
    this.visible = visible;
    this.group.visible = visible;
  }

  update(elapsedTime) {
    if (!this.visible) return;

    this.materials.forEach(mat => {
      if (mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = elapsedTime;
      }
    });

    // Animate energy rings expanding and pulsing up and down
    if (this.ringMeshes) {
      this.ringMeshes.forEach(ring => {
        const { baseY, speed, phase } = ring.userData;
        ring.position.y = baseY + Math.sin(elapsedTime * speed + phase) * 4.0;
        const scale = 1.0 + Math.sin(elapsedTime * 2.5 + phase) * 0.25;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity = 0.35 + Math.sin(elapsedTime * 2.0 + phase) * 0.25;
      });
    }

    // Slow rotation of outer beam
    if (this.beamMesh) {
      this.beamMesh.rotation.y = elapsedTime * 0.15;
    }
  }
}
