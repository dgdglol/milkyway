import * as THREE from 'three';

export const COLOR_THEMES = {
  cosmic: {
    name: 'NASA Milky Way (Tối & Dịu mắt)',
    core: '#e8d5a3',
    coreGlow: '#d4af37',
    innerArm: '#5a82c4',
    outerArm: '#2c4a87',
    accentArm: '#b83258',
    dust: '#02040d'
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
    name: 'Solar Gold (Vàng hổ phách cổ điển)',
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

    // Chế độ tối, thanh thoát, sao nhỏ li ti dịu nhẹ như ảnh thiên văn NASA
    this.parameters = {
      count: 36000,      // Số lượng sao vừa đủ, không bị dày đặc
      size: 0.009,       // Kích thước sao siêu nhỏ li ti
      radius: 120,
      branches: 4,
      spin: 1.65,
      randomness: 0.28,
      power: 1.9,
      coreRadius: 6.0,
      currentTheme: 'cosmic',
      speed: 0.24
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
      branches,
      spin,
      randomness,
      power,
      coreRadius
    } = this.parameters;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);
    const twinkleSpeeds = new Float32Array(count);

    // Bảng màu sao trầm, dịu, không gắt
    const goldBarStars = [
      new THREE.Color('#d4b476'), // Vàng cát trầm
      new THREE.Color('#c99d52'), // Hổ phách dịu
      new THREE.Color('#e0caa0')  // Kem champagne trầm
    ];

    const armStarPalette = [
      new THREE.Color('#789ac7'), // Xanh lam dịu
      new THREE.Color('#5878ab'), // Xanh denim trầm
      new THREE.Color('#9bb6dc'), // Bạc xanh
      new THREE.Color('#c2546e')  // Đốm hồng ngọc nhỏ
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), power);
      const r = rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      const heightDispersion = Math.max(0.05, (1.0 - rRatio * 0.8)) * randomness * 3.2;

      const randomX = Math.pow(Math.random(), 2.2) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.3;
      const randomY = (Math.random() - 0.5) * heightDispersion;
      const randomZ = Math.pow(Math.random(), 2.2) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.3;

      randomnessArray[i3] = randomX;
      randomnessArray[i3 + 1] = randomY;
      randomnessArray[i3 + 2] = randomZ;

      if (r < coreRadius) {
        // Sao vùng thanh chắn trung tâm: sắc vàng cát dịu nhẹ
        const theta = Math.random() * Math.PI * 2;
        const coreDist = Math.sqrt(Math.random()) * coreRadius;

        const barAngle = Math.PI * 0.19;
        const cosB = Math.cos(barAngle);
        const sinB = Math.sin(barAngle);
        const bx = coreDist * Math.cos(theta) * 1.5;
        const bz = coreDist * Math.sin(theta) * 0.7;

        positions[i3] = bx * cosB - bz * sinB;
        positions[i3 + 1] = (Math.random() - 0.5) * 1.0;
        positions[i3 + 2] = bx * sinB + bz * cosB;

        const c = goldBarStars[Math.floor(Math.random() * goldBarStars.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      } else {
        // Sao dọc nhánh: nhỏ li ti điểm xuyết nhẹ nhàng trong dải mây
        positions[i3] = Math.cos(branchAngle + spinAngle) * r;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

        const c = armStarPalette[Math.floor(Math.random() * armStarPalette.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }

      // Kích thước hạt sao nhỏ gọn như hạt bụi kim cương li ti
      scales[i] = 0.4 + Math.random() * 0.6;
      twinkleSpeeds[i] = 0.8 + Math.random() * 2.2;
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

          // Hạt sao nhỏ thanh mảnh, không chói
          gl_PointSize = uSize * aScale * twinkle * (170.0 / -viewPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 8.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Đốm sao thanh mảnh, độ sáng 0.42 dịu mắt
          float intensity = (1.0 - smoothstep(0.0, 0.5, dist));
          intensity = pow(intensity, 2.0);

          vec3 finalColor = vColor * intensity * vTwinkle * 0.55;

          gl_FragColor = vec4(finalColor, intensity * 0.65);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 5.5 * window.devicePixelRatio },
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
