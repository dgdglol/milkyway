import * as THREE from 'three';
import { COLOR_THEMES } from './galaxyGenerator.js';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.points = null;
    this.geometry = null;
    this.material = null;

    this.parameters = {
      count: 20000,
      radius: 110,
      branches: 4,
      spin: 1.6,
      randomness: 0.45,
      power: 2.8,
      currentTheme: 'cosmic',
      speed: 0.28,
      visible: true
    };

    this.init();
  }

  init() {
    this.generate();
  }

  generate(customParams = {}) {
    Object.assign(this.parameters, customParams);

    if (this.points !== null) {
      this.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.points);
    }

    if (!this.parameters.visible) return;

    const { count, radius, branches, spin, randomness, power } = this.parameters;

    // Deep, dark interstellar nebula dust: adds rich color depth without milky white washing
    const dustColors = [
      new THREE.Color('#0033aa'), // Deep royal blue
      new THREE.Color('#002266'), // Midnight blue
      new THREE.Color('#380066'), // Deep violet
      new THREE.Color('#005577')  // Dark cyan
    ];

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), power);
      const r = 12 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;
      const laneOffset = 0.22;

      positions[i3] = Math.cos(branchAngle + spinAngle + laneOffset) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle + laneOffset) * r;

      const height = (1.0 - rRatio * 0.6) * randomness * 6.0;
      randomnessArray[i3] = (Math.random() - 0.5) * randomness * r * 0.35;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * height;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * randomness * r * 0.35;

      const c = dustColors[Math.floor(Math.random() * dustColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 12.0 + Math.random() * 16.0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArray, 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;

        attribute float aScale;
        attribute vec3 aRandomness;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          float dist = length(position.xz);
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

          // Low subtle opacity to prevent white washing
          vAlpha = 0.09 + sin(uTime * 0.4 + dist * 0.1) * 0.02;

          gl_PointSize = aScale * (120.0 / -viewPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 32.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 2.5);

          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.parameters.speed }
      }
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  setTheme(themeKey) {
    this.parameters.currentTheme = themeKey;
    this.generate();
  }

  setSpeed(speed) {
    this.parameters.speed = speed;
    if (this.material && this.material.uniforms.uSpeed) {
      this.material.uniforms.uSpeed.value = speed;
    }
  }

  toggle(visible) {
    this.parameters.visible = visible;
    if (this.points) {
      this.points.visible = visible;
    } else if (visible) {
      this.generate();
    }
  }

  update(elapsedTime) {
    if (this.material && this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = elapsedTime;
    }
  }
}
