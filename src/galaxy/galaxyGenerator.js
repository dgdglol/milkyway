import * as THREE from 'three';
import { ARM_PROFILES } from './dustGenerator.js';

export const COLOR_THEMES = {
  cosmic: {
    name: 'NASA / Cosmoscope (Chuẩn ảnh thực tế)',
    core: '#e8d5a2',
    coreGlow: '#d4af4e',
    innerArm: '#caa25c',
    outerArm: '#52729c',
    accentArm: '#8a4b62',
    dust: '#02040a'
  },
  andromeda: {
    name: 'Andromeda Cyan (Biển trời Ngân hà)',
    core: '#c8e2f8',
    coreGlow: '#2980b9',
    innerArm: '#1f618d',
    outerArm: '#154360',
    accentArm: '#6c5ce7',
    dust: '#010408'
  },
  golden: {
    name: 'Solar Gold (Vàng hổ phách hoàng gia)',
    core: '#f5cba7',
    coreGlow: '#d35400',
    innerArm: '#b9770e',
    outerArm: '#7e5109',
    accentArm: '#922b21',
    dust: '#0a0502'
  },
  neon: {
    name: 'Cyberpunk Neon (Tương phản nhẹ)',
    core: '#f5eeea',
    coreGlow: '#e84393',
    innerArm: '#0984e3',
    outerArm: '#6c5ce7',
    accentArm: '#fd79a8',
    dust: '#080012'
  },
  realistic: {
    name: 'Astrophysical (Thực tế Thiên văn học)',
    core: '#e2d4bc',
    coreGlow: '#85929e',
    innerArm: '#5d6d7e',
    outerArm: '#283747',
    accentArm: '#78281f',
    dust: '#020408'
  }
};

export class GalaxyGenerator {
  constructor(scene) {
    this.scene = scene;
    this.points = null;
    this.geometry = null;
    this.material = null;

    // Biển sao 200.000 hạt: lấp kín mọi mảng đen, phủ dày đặc khắp thiên hà
    this.parameters = {
      count: 200000,     // Biển sao dày đặc tối đa, không để lọt mảng đen
      size: 0.0068,      // Hạt cát kim cương siêu mịn
      radius: 126,
      spin: 1.65,
      power: 1.50,
      coreRadius: 9.5,
      currentTheme: 'cosmic',
      speed: 0.22
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

    const {
      count,
      radius,
      spin,
      power,
      coreRadius
    } = this.parameters;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);
    const twinkleSpeeds = new Float32Array(count);

    // Bảng màu sao theo ảnh chụp thực tế:
    // - Vùng tâm: vàng kem champagne, hổ phách ấm sáng dịu
    const coreStarHues = [
      new THREE.Color('#edd9a6'), // Champagne sáng
      new THREE.Color('#d9b468'), // Vàng hổ phách
      new THREE.Color('#e8c682'), // Mật ong ấm
      new THREE.Color('#f2e3bc')  // Kem ngà
    ];

    // - Vùng dải xoắn ốc: vàng cát ở trong, chuyển dần sang lam ánh xám và bạc xanh ở ngoài
    const armStarHues = [
      new THREE.Color('#deb56c'), // Vàng cát ấm
      new THREE.Color('#789ac7'), // Lam thiên văn
      new THREE.Color('#5879a8'), // Denim trầm
      new THREE.Color('#a4bbdc'), // Bạc ánh xanh
      new THREE.Color('#c25c74')  // Điểm xuyết hồng ngọc mờ (vùng HII)
    ];

    // - Vùng đĩa bao phủ toàn bộ (ở giữa các dải và xung quanh): sao lùn vàng G/K và sao F/A dịu nhẹ
    const diskStarHues = [
      new THREE.Color('#caa05a'), // Sao lùn vàng như Mặt Trời
      new THREE.Color('#ad884c'), // Sao lùn cam
      new THREE.Color('#7a96be'), // Lam xám mờ
      new THREE.Color('#9bb2d2'), // Bạc ánh xanh mờ
      new THREE.Color('#e0ceaa')  // Kem trầm
    ];

    // Phân bổ 3 lớp sao dày đặc:
    // 1. Sao ở giữa (Nhân & thanh chắn elip, ~10%): ~20.000 hạt tạo khối lõi phát sáng mịn
    // 2. Sao dải xoắn ốc (~25%): ~50.000 hạt làm các nhánh dày dặn, bồng bềnh
    // 3. Sao ở giữa các dải và phủ kín khắp đĩa (~65%): ~130.000 hạt xóa sổ hoàn toàn mọi mảng đen
    const coreCount = Math.floor(count * 0.10);
    const armCount = Math.floor(count * 0.25);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      if (i < coreCount) {
        // 1. Sao vùng nhân elip ở giữa
        const theta = Math.random() * Math.PI * 2;
        const coreDist = Math.sqrt(Math.random()) * coreRadius;

        const barAngle = Math.PI * 0.19;
        const cosB = Math.cos(barAngle);
        const sinB = Math.sin(barAngle);
        const bx = coreDist * Math.cos(theta) * 1.8;
        const bz = coreDist * Math.sin(theta) * 0.92;

        positions[i3] = bx * cosB - bz * sinB;
        positions[i3 + 1] = (Math.random() - 0.5) * 2.0;
        positions[i3 + 2] = bx * sinB + bz * cosB;

        randomnessArray[i3] = (Math.random() - 0.5) * 0.6;
        randomnessArray[i3 + 1] = (Math.random() - 0.5) * 0.5;
        randomnessArray[i3 + 2] = (Math.random() - 0.5) * 0.6;

        const c = coreStarHues[Math.floor(Math.random() * coreStarHues.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        scales[i] = 0.45 + Math.random() * 0.55;
        twinkleSpeeds[i] = 0.8 + Math.random() * 2.2;
      } else if (i < coreCount + armCount) {
        // 2. Sao tập trung trên các dải xoắn ốc (dày dặn nổi bật)
        const armIdx = (i - coreCount) % ARM_PROFILES.length;
        const arm = ARM_PROFILES[armIdx];

        const rRatio = Math.pow(Math.random(), power);
        const r = coreRadius * 0.7 + rRatio * (radius - coreRadius * 0.7);

        const spinAngle = r * spin * arm.spinFactor * 0.054 + Math.sin(r * 0.08) * 0.12;
        const angle = arm.baseAngle + spinAngle;

        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(angle) * r;

        // Xòe theo độ rộng to nhỏ tùy hứng của từng dải
        const armSpread = arm.width(r, rRatio) * 0.95;
        const randRad = (Math.pow(Math.random(), 1.4) - 0.5) * armSpread;
        const randTan = (Math.random() - 0.5) * armSpread * 0.65;
        const sinA = Math.sin(angle);
        const cosA = Math.cos(angle);

        randomnessArray[i3] = -sinA * randRad + cosA * randTan;
        randomnessArray[i3 + 1] = (Math.random() - 0.5) * (1.4 + rRatio * 2.6);
        randomnessArray[i3 + 2] = cosA * randRad + sinA * randTan;

        const c = armStarHues[Math.floor(Math.random() * armStarHues.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        scales[i] = 0.40 + Math.random() * 0.60;
        twinkleSpeeds[i] = 0.8 + Math.random() * 2.2;
      } else {
        // 3. Sao ở giữa các dải và phủ kín khắp đĩa (hơn 130.000 sao)
        const rRatio = Math.pow(Math.random(), 1.25);
        const r = 2.0 + rRatio * (radius - 2.0);
        const angle = Math.random() * Math.PI * 2;

        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(angle) * r;

        randomnessArray[i3] = (Math.random() - 0.5) * 4.0;
        randomnessArray[i3 + 1] = (Math.random() - 0.5) * (1.5 + (r / radius) * 3.2);
        randomnessArray[i3 + 2] = (Math.random() - 0.5) * 4.0;

        const c = diskStarHues[Math.floor(Math.random() * diskStarHues.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        scales[i] = 0.35 + Math.random() * 0.50;
        twinkleSpeeds[i] = 0.6 + Math.random() * 1.8;
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArray, 3));
    this.geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

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

          float twinkle = sin(uTime * aTwinkleSpeed + finalPos.x * 0.35 + finalPos.z * 0.35) * 0.18 + 0.82;
          vTwinkle = twinkle;

          // Hạt sao siêu nhỏ mịn li ti chuẩn tấm thảm sao vũ trụ
          gl_PointSize = uSize * aScale * twinkle * (115.0 / -viewPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.75, 2.9);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Đốm sao li ti dịu nhẹ ẩn hiện trong biển mây sao
          float intensity = (1.0 - smoothstep(0.0, 0.5, dist));
          intensity = pow(intensity, 1.7);

          vec3 finalColor = vColor * intensity * vTwinkle * 0.25;

          gl_FragColor = vec4(finalColor, intensity * 0.40);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.8 * window.devicePixelRatio },
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
