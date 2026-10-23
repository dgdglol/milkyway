import * as THREE from 'three';
import { COLOR_THEMES } from './galaxyGenerator.js';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.points = null;
    this.geometry = null;
    this.material = null;

    this.parameters = {
      count: 35000,
      radius: 110,
      branches: 4,
      spin: 1.5,
      randomness: 0.65,
      power: 2.8,
      currentTheme: 'cosmic',
      speed: 0.35,
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

    const { count, radius, branches, spin, randomness, power, currentTheme } = this.parameters;
    const theme = COLOR_THEMES[currentTheme] || COLOR_THEMES.cosmic;
    const dustBaseColor = new THREE.Color(theme.dust);
    const secondaryColor = new THREE.Color(theme.innerArm);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Dust concentrates primarily in the mid-disk and spiral arms
      const rRatio = Math.pow(Math.random(), power);
      const r = 8 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.05;

      // Slight offset from the main star lane to create the real "interstellar dust lanes"
      const laneOffset = 0.25;

      positions[i3] = Math.cos(branchAngle + spinAngle + laneOffset) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle + laneOffset) * r;

      // Vertical fluffiness
      const height = (1.0 - rRatio * 0.5) * randomness * 12.0;
      randomnessArray[i3] = (Math.random() - 0.5) * randomness * r * 0.45;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * height;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * randomness * r * 0.45;

      // Subtle color gradient
      const mixedColor = dustBaseColor.clone().lerp(secondaryColor, Math.random() * 0.7);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      // Much larger particle sizes for cloudy volumetric look
      scales[i] = 18.0 + Math.random() * 24.0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArray, 3));

    // Custom Cloud/Gas Shader
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
          float orbitSpeed = uTime * uSpeed * 0.15 * (1.0 / (1.0 + dist * 0.015));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec3 finalPos = rotatedPos + aRandomness;

          vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          gl_Position = projectionMatrix * viewPosition;

          // Gas cloud pulsation
          float pulse = sin(uTime * 0.5 + dist * 0.1) * 0.15 + 0.85;
          vAlpha = 0.22 * pulse;

          gl_PointSize = aScale * (140.0 / -viewPosition.z);
          gl_PointSize = max(gl_PointSize, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Soft volumetric gaussian falloff
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 2.2);

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
