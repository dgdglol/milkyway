import * as THREE from 'three';

// Color themes with default tuned exactly to the reference image:
// Deep Electric Blue, Neon Cyan, Turquoise, and Magenta/Violet swirls with rich contrast
export const COLOR_THEMES = {
  cosmic: {
    name: 'Electric Blue & Cyan (Giống ảnh mẫu)',
    core: '#ffffff',
    coreGlow: '#00f5ff',
    innerArm: '#0088ff',
    outerArm: '#1044ff',
    accentArm: '#d946ef',
    dust: '#0f172a'
  },
  neon: {
    name: 'Cyberpunk Neon (Hồng & Lam tương phản)',
    core: '#ffffff',
    coreGlow: '#ff007f',
    innerArm: '#00f0ff',
    outerArm: '#7000ff',
    accentArm: '#ff00aa',
    dust: '#180033'
  },
  andromeda: {
    name: 'Andromeda Cyan (Biển trời Ngân hà)',
    core: '#e0f2fe',
    coreGlow: '#38bdf8',
    innerArm: '#0284c7',
    outerArm: '#1e3a8a',
    accentArm: '#818cf8',
    dust: '#030712'
  },
  golden: {
    name: 'Solar Gold (Vàng hoàng gia & Lửa sao)',
    core: '#ffffff',
    coreGlow: '#fef08a',
    innerArm: '#f59e0b',
    outerArm: '#b45309',
    accentArm: '#ea580c',
    dust: '#1c1917'
  },
  realistic: {
    name: 'Astrophysical (Thực tế Thiên văn)',
    core: '#ffeedd',
    coreGlow: '#dbeafe',
    innerArm: '#60a5fa',
    outerArm: '#1e40af',
    accentArm: '#93c5fd',
    dust: '#020617'
  }
};

export class GalaxyGenerator {
  constructor(scene) {
    this.scene = scene;
    this.points = null;
    this.geometry = null;
    this.material = null;

    // Bokeh orbs mesh
    this.bokehMesh = null;
    this.bokehGeo = null;
    this.bokehMat = null;

    this.parameters = {
      count: 120000,
      size: 0.014,
      radius: 125,
      branches: 4,
      spin: 1.6,
      randomness: 0.32,
      power: 3.2,
      coreRadius: 14,
      currentTheme: 'cosmic',
      speed: 0.28
    };

    this.init();
  }

  init() {
    this.generate();
    this.generateBokehOrbs();
  }

  generate(customParams = {}) {
    Object.assign(this.parameters, customParams);

    if (this.points !== null) {
      this.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.points);
    }

    const {
      count,
      radius,
      branches,
      spin,
      randomness,
      power,
      coreRadius,
      currentTheme
    } = this.parameters;

    const theme = COLOR_THEMES[currentTheme] || COLOR_THEMES.cosmic;
    const colorCore = new THREE.Color(theme.core);
    const colorCoreGlow = new THREE.Color(theme.coreGlow);
    const colorInner = new THREE.Color(theme.innerArm);
    const colorOuter = new THREE.Color(theme.outerArm);
    const colorAccent = new THREE.Color(theme.accentArm);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);
    const twinkleSpeeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distance from center
      const rRatio = Math.pow(Math.random(), power);
      const r = rRatio * radius;

      // Logarithmic spiral arms
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      // Flatter, cleaner disk so arms stand out crisp and clear without milky fog
      const heightDispersion = Math.max(0.08, (1.0 - rRatio * 0.82)) * randomness * 4.5;

      const randomX = Math.pow(Math.random(), 2.2) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.35;
      const randomY = (Math.random() - 0.5) * heightDispersion;
      const randomZ = Math.pow(Math.random(), 2.2) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.35;

      randomnessArray[i3] = randomX;
      randomnessArray[i3 + 1] = randomY;
      randomnessArray[i3 + 2] = randomZ;

      if (r < coreRadius) {
        // Tight, compact core
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const coreDist = Math.cbrt(Math.random()) * coreRadius;

        positions[i3] = coreDist * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = coreDist * Math.sin(phi) * Math.sin(theta) * 0.35;
        positions[i3 + 2] = coreDist * Math.cos(phi);

        // Core colors: tiny bright white center quickly transitioning into brilliant cyan and magenta halo
        const normDist = coreDist / coreRadius;
        let c;
        if (normDist < 0.25) {
          c = colorCore.clone().lerp(colorCoreGlow, normDist / 0.25);
        } else {
          c = colorCoreGlow.clone().lerp(colorAccent, (normDist - 0.25) / 0.75);
        }
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      } else {
        // Spiral arms
        positions[i3] = Math.cos(branchAngle + spinAngle) * r;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

        // Rich, high-contrast arm gradient matching reference image:
        // Cyan-blue -> Royal Blue -> Deep Electric Blue with frequent Magenta/Violet accents
        const alpha = (r - coreRadius) / (radius - coreRadius);
        let c = colorInner.clone().lerp(colorOuter, alpha);

        // 25% of stars along the spiral arms are vibrant magenta / violet / turquoise highlights
        const rand = Math.random();
        if (rand > 0.82) {
          c = colorAccent.clone();
        } else if (rand > 0.68) {
          c = colorCoreGlow.clone(); // Cyan highlight
        }

        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }

      // Star sizes: fine, controlled, not overly large
      scales[i] = 0.65 + Math.random() * 1.1;
      twinkleSpeeds[i] = 1.2 + Math.random() * 3.5;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArray, 3));
    this.geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    // Custom GLSL Shader that preserves saturated colors without blowing out to white
    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uSpeed;

        attribute float aScale;
        attribute vec3 aRandomness;
        attribute float aTwinkleSpeed;

        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;

          float dist = length(position.xz);
          // Rotation speed curve
          float orbitSpeed = uTime * uSpeed * 0.12 * (1.0 / (1.0 + dist * 0.012));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec3 finalPos = rotatedPos + aRandomness;

          vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          gl_Position = projectionMatrix * viewPosition;

          // Twinkle pulse
          float twinkle = sin(uTime * aTwinkleSpeed + finalPos.x * 0.4 + finalPos.z * 0.4) * 0.22 + 0.78;
          vTwinkle = twinkle;

          // Controlled point size to keep galaxy structure sharp and clean
          gl_PointSize = uSize * aScale * twinkle * (210.0 / -viewPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 16.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vTwinkle;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Crisp, soft star with glowing core
          float intensity = exp(-dist * 10.0) * 1.3;
          float halo = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.5;
          float strength = intensity + halo;

          // Keep colors deeply saturated, do NOT force white!
          vec3 finalColor = vColor * strength * vTwinkle;

          gl_FragColor = vec4(finalColor, strength);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 16.0 * window.devicePixelRatio },
        uSpeed: { value: this.parameters.speed }
      }
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  // Floating Dreamy Bokeh Orbs (exactly matching the large soft circles in the reference photo)
  generateBokehOrbs() {
    if (this.bokehMesh !== null) {
      this.bokehGeo.dispose();
      this.bokehMat.dispose();
      this.scene.remove(this.bokehMesh);
    }

    const bokehCount = 1200;
    const positions = new Float32Array(bokehCount * 3);
    const colors = new Float32Array(bokehCount * 3);
    const scales = new Float32Array(bokehCount);
    const phases = new Float32Array(bokehCount);

    const bokehPalettes = [
      new THREE.Color('#38bdf8'), // Cyan
      new THREE.Color('#00f5ff'), // Neon Aqua
      new THREE.Color('#3b82f6'), // Electric Blue
      new THREE.Color('#818cf8'), // Soft Lavender
      new THREE.Color('#c084fc'), // Orchid Pink
      new THREE.Color('#34d399')  // Turquoise / Mint
    ];

    for (let i = 0; i < bokehCount; i++) {
      const i3 = i * 3;

      // Distribute along the spiral disk
      const r = 8 + Math.pow(Math.random(), 1.8) * 115;
      const angle = Math.random() * Math.PI * 2;

      // Float gently above and below the galactic plane
      const h = (Math.random() - 0.5) * 22.0;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = h;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = bokehPalettes[Math.floor(Math.random() * bokehPalettes.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Large bokeh orb scale
      scales[i] = 16.0 + Math.random() * 32.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    this.bokehGeo = new THREE.BufferGeometry();
    this.bokehGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.bokehGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.bokehGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.bokehGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    // Custom Bokeh Shader: creates translucent optical circle with soft rim
    this.bokehMat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        attribute float aPhase;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          vec3 p = position;
          // Slow floating drift in Y axis
          p.y += sin(uTime * 0.8 + aPhase) * 1.5;

          // Slow rotation around galaxy center
          float dist = length(p.xz);
          float angle = uTime * 0.035;
          float cosA = cos(angle);
          float sinA = sin(angle);
          float nx = p.x * cosA - p.z * sinA;
          float nz = p.x * sinA + p.z * cosA;
          p.x = nx;
          p.z = nz;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPos;

          // Soft breathing opacity
          vAlpha = 0.35 + sin(uTime * 1.2 + aPhase) * 0.12;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 48.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Camera lens bokeh appearance: soft edge with luminous circular rim
          float edge = smoothstep(0.5, 0.42, dist);
          float rim = smoothstep(0.25, 0.46, dist) * 0.6;
          float body = (1.0 - smoothstep(0.0, 0.45, dist)) * 0.4;
          float bokeh = (edge * 0.35 + rim + body);

          gl_FragColor = vec4(vColor, bokeh * vAlpha);
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

    this.bokehMesh = new THREE.Points(this.bokehGeo, this.bokehMat);
    this.scene.add(this.bokehMesh);
  }

  setTheme(themeKey) {
    if (COLOR_THEMES[themeKey]) {
      this.parameters.currentTheme = themeKey;
      this.generate();
      this.generateBokehOrbs();
    }
  }

  setStarCount(count) {
    this.parameters.count = count;
    this.generate();
  }

  setSpeed(speed) {
    this.parameters.speed = speed;
    if (this.material && this.material.uniforms.uSpeed) {
      this.material.uniforms.uSpeed.value = speed;
    }
  }

  update(elapsedTime) {
    if (this.material && this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = elapsedTime;
    }
    if (this.bokehMat && this.bokehMat.uniforms.uTime) {
      this.bokehMat.uniforms.uTime.value = elapsedTime;
    }
  }
}
