import * as THREE from 'three';

// Color themes for the galaxy
export const COLOR_THEMES = {
  cosmic: {
    name: 'Cosmic Violet & Cyan (Vũ trụ Huyền ảo)',
    core: '#fff2d6',
    innerArm: '#d946ef',
    outerArm: '#38bdf8',
    dust: '#9333ea'
  },
  andromeda: {
    name: 'Andromeda Cyan (Biển trời Ngân hà)',
    core: '#e0f2fe',
    innerArm: '#38bdf8',
    outerArm: '#6366f1',
    dust: '#0284c7'
  },
  golden: {
    name: 'Solar Gold (Vàng hoàng gia & Lửa sao)',
    core: '#fef08a',
    innerArm: '#f97316',
    outerArm: '#ea580c',
    dust: '#b45309'
  },
  neon: {
    name: 'Cyberpunk Neon (Hồng - Lam tương phản)',
    core: '#ffffff',
    innerArm: '#ff007f',
    outerArm: '#00f0ff',
    dust: '#7000ff'
  },
  realistic: {
    name: 'Astrophysical (Thực tế Thiên văn)',
    core: '#ffeedd',
    innerArm: '#a5c9eb',
    outerArm: '#7faadc',
    dust: '#3a2050'
  }
};

export class GalaxyGenerator {
  constructor(scene) {
    this.scene = scene;
    this.points = null;
    this.geometry = null;
    this.material = null;

    // Default parameters
    this.parameters = {
      count: 200000,
      size: 0.018,
      radius: 120,
      branches: 4,
      spin: 1.5,
      randomness: 0.45,
      power: 3.5,
      coreRadius: 18,
      currentTheme: 'cosmic',
      speed: 0.35
    };

    this.init();
  }

  init() {
    this.generate();
  }

  generate(customParams = {}) {
    Object.assign(this.parameters, customParams);

    // Clean up previous mesh
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
    const colorInner = new THREE.Color(theme.innerArm);
    const colorOuter = new THREE.Color(theme.outerArm);

    // Buffer attributes
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);
    const distanceRatios = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distance from center (power curve creates dense core with long sparse arms)
      const rRatio = Math.pow(Math.random(), power);
      const r = rRatio * radius;
      distanceRatios[i] = rRatio;

      // Branch angle for logarithmic spiral arms
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.05;

      // Random dispersion (thicker near center, flattens towards edges)
      // Disk height: thin disk model
      const heightDispersion = Math.max(0.1, (1.0 - rRatio * 0.75)) * randomness * 8.0;

      const randomX = Math.pow(Math.random(), 2.0) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.45;
      const randomY = (Math.random() - 0.5) * heightDispersion * (Math.random() * 2.0);
      const randomZ = Math.pow(Math.random(), 2.0) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.45;

      randomnessArray[i3] = randomX;
      randomnessArray[i3 + 1] = randomY;
      randomnessArray[i3 + 2] = randomZ;

      // Central Bulge has spherical/ellipsoid distribution
      if (r < coreRadius) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const coreDist = Math.cbrt(Math.random()) * coreRadius;

        positions[i3] = coreDist * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = coreDist * Math.sin(phi) * Math.sin(theta) * 0.55; // Slightly flattened
        positions[i3 + 2] = coreDist * Math.cos(phi);
      } else {
        positions[i3] = Math.cos(branchAngle + spinAngle) * r;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;
      }

      // Color interpolation: Core -> Inner Arm -> Outer Rim
      let mixedColor;
      if (r < coreRadius) {
        // Core: warm radiant gold/white
        const alpha = r / coreRadius;
        mixedColor = colorCore.clone().lerp(colorInner, alpha * 0.4);
      } else {
        // Spiral arms: blend from inner arm color to outer arm cyan/blue
        const alpha = (r - coreRadius) / (radius - coreRadius);
        mixedColor = colorInner.clone().lerp(colorOuter, alpha);
        // Add occasional blue-white massive star highlights
        if (Math.random() > 0.92) {
          mixedColor.lerp(new THREE.Color('#ffffff'), 0.75);
        }
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      // Particle scale (core stars smaller & denser, some giant foreground stars)
      const isGiantStar = Math.random() > 0.985;
      scales[i] = isGiantStar ? 2.5 + Math.random() * 3.0 : 0.8 + Math.random() * 1.4;

      // Twinkle speed
      twinkleSpeeds[i] = 1.0 + Math.random() * 4.0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArray, 3));
    this.geometry.setAttribute('aDistanceRatio', new THREE.BufferAttribute(distanceRatios, 1));
    this.geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    // Custom GLSL Shader for smooth antialiased circular particles with glow & twinkle
    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uSpeed;

        attribute float aScale;
        attribute vec3 aRandomness;
        attribute float aDistanceRatio;
        attribute float aTwinkleSpeed;

        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;

          // Differential orbital rotation (Keplerian-inspired flat rotation curve)
          // Stars closer to core complete revolution slightly faster
          float dist = length(position.xz);
          float orbitSpeed = uTime * uSpeed * 0.15 * (1.0 / (1.0 + dist * 0.015));

          // Rotate position in XZ plane
          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          // Add dispersion
          vec3 finalPos = rotatedPos + aRandomness;

          vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;

          // Particle twinkle effect
          float twinkle = sin(uTime * aTwinkleSpeed + finalPos.x * 0.5) * 0.25 + 0.75;
          vTwinkle = twinkle;

          // Size attenuation
          gl_PointSize = uSize * aScale * twinkle * (280.0 / -viewPosition.z);
          gl_PointSize = max(gl_PointSize, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          // Distance from particle center [0.0, 0.5]
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Soft exponential radial glow falloff
          float coreIntensity = exp(-dist * 9.0) * 1.4;
          float haloIntensity = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.6;
          float strength = coreIntensity + haloIntensity;

          // Final color with emissive vibrancy
          vec3 finalColor = vColor * strength * vTwinkle;

          // Extra bright center
          if (dist < 0.12) {
            finalColor += vec3(0.5, 0.5, 0.5) * (1.0 - dist / 0.12);
          }

          gl_FragColor = vec4(finalColor, strength);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 25.0 * window.devicePixelRatio },
        uSpeed: { value: this.parameters.speed }
      }
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  setTheme(themeKey) {
    if (COLOR_THEMES[themeKey]) {
      this.parameters.currentTheme = themeKey;
      this.generate();
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
  }
}
