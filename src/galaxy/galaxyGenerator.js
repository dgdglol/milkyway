import * as THREE from 'three';

export const COLOR_THEMES = {
  cosmic: {
    name: 'Electric Blue & Cyan (Chuẩn ảnh mẫu)',
    core: '#e0faff',
    coreGlow: '#00f5ff',
    innerArm: '#0077ff',
    outerArm: '#1033ee',
    accentArm: '#d946ef',
    dust: '#050a1f'
  },
  neon: {
    name: 'Cyberpunk Neon (Hồng & Lam tương phản)',
    core: '#ffffff',
    coreGlow: '#ff007f',
    innerArm: '#00f0ff',
    outerArm: '#6000e0',
    accentArm: '#ff00b7',
    dust: '#120024'
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

    this.bokehMesh = null;
    this.bokehGeo = null;
    this.bokehMat = null;

    // Chế độ thanh thoát mặc định (ít sao, gọn gàng, tâm không bị to hay trắng xóa)
    this.parameters = {
      count: 45000,
      size: 0.013,
      radius: 120,
      branches: 4,
      spin: 1.65,
      randomness: 0.28,
      power: 1.9,       // Tỉ lệ đều khắp đĩa xoắn ốc, không bị dồn cục ở giữa
      coreRadius: 6.0,   // Tâm nhỏ gọn, tinh tế
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

      // Phân bố đều dọc theo toàn bộ các nhánh xoắn ốc
      const rRatio = Math.pow(Math.random(), power);
      const r = rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      // Đĩa ngân hà phẳng và mỏng gọn, không bị phình to
      const heightDispersion = Math.max(0.06, (1.0 - rRatio * 0.8)) * randomness * 3.8;

      const randomX = Math.pow(Math.random(), 2.2) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.32;
      const randomY = (Math.random() - 0.5) * heightDispersion;
      const randomZ = Math.pow(Math.random(), 2.2) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.32;

      randomnessArray[i3] = randomX;
      randomnessArray[i3 + 1] = randomY;
      randomnessArray[i3 + 2] = randomZ;

      if (r < coreRadius) {
        // Sao vùng thanh chắn trung tâm: mang sắc vàng mật ong và kem champagne ấm áp
        const theta = Math.random() * Math.PI * 2;
        const coreDist = Math.sqrt(Math.random()) * coreRadius;

        // Thanh chắn kéo nhẹ theo chiều nghiêng
        const barAngle = Math.PI * 0.19;
        const cosB = Math.cos(barAngle);
        const sinB = Math.sin(barAngle);
        const bx = coreDist * Math.cos(theta) * 1.5;
        const bz = coreDist * Math.sin(theta) * 0.7;

        positions[i3] = bx * cosB - bz * sinB;
        positions[i3 + 1] = (Math.random() - 0.5) * 1.2;
        positions[i3 + 2] = bx * sinB + bz * cosB;

        // Màu vàng kem, vàng mật ong ấm áp hài hòa với dải mây thanh chắn
        const goldColors = [
          new THREE.Color('#fef08a'),
          new THREE.Color('#fcd34d'),
          new THREE.Color('#fbbf24')
        ];
        const c = goldColors[Math.floor(Math.random() * goldColors.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      } else {
        // Sao dọc các nhánh xoắn ốc: nằm gọn gàng bên trong dải mây xanh lam
        positions[i3] = Math.cos(branchAngle + spinAngle) * r;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

        // Màu sao xanh lam sáng, kim cương trắng xanh và điểm xuyết đỏ hồng HII
        const rand = Math.random();
        let c;
        if (rand > 0.88) {
          c = new THREE.Color('#f43f5e'); // Đốm hồng ngọc vườn ươm sao
        } else if (rand > 0.65) {
          c = new THREE.Color('#e0f2fe'); // Sao kim cương trắng xanh
        } else if (rand > 0.35) {
          c = new THREE.Color('#93c5fd'); // Xanh lam mềm mại
        } else {
          c = new THREE.Color('#60a5fa'); // Xanh thiên thanh
        }

        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }

      // Kích thước hạt sao nhỏ gọn, sắc sảo
      scales[i] = 0.55 + Math.random() * 0.95;
      twinkleSpeeds[i] = 1.0 + Math.random() * 3.0;
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

          float twinkle = sin(uTime * aTwinkleSpeed + finalPos.x * 0.35 + finalPos.z * 0.35) * 0.2 + 0.8;
          vTwinkle = twinkle;

          gl_PointSize = uSize * aScale * twinkle * (200.0 / -viewPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 14.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float intensity = exp(-dist * 11.0) * 1.3;
          float halo = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.45;
          float strength = intensity + halo;

          // Màu sắc giữ nguyên độ bão hòa rực rỡ, không bị chói trắng
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
        uSize: { value: 14.0 * window.devicePixelRatio },
        uSpeed: { value: this.parameters.speed }
      }
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  // 800 Hạt Bokeh quang học mộng mơ
  generateBokehOrbs() {
    if (this.bokehMesh !== null) {
      this.bokehGeo.dispose();
      this.bokehMat.dispose();
      this.scene.remove(this.bokehMesh);
    }

    const bokehCount = 800;
    const positions = new Float32Array(bokehCount * 3);
    const colors = new Float32Array(bokehCount * 3);
    const scales = new Float32Array(bokehCount);
    const phases = new Float32Array(bokehCount);

    const bokehPalettes = [
      new THREE.Color('#00f5ff'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#3b82f6'),
      new THREE.Color('#818cf8'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#34d399')
    ];

    for (let i = 0; i < bokehCount; i++) {
      const i3 = i * 3;

      const r = 10 + Math.pow(Math.random(), 1.7) * 110;
      const angle = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * 18.0;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = h;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = bokehPalettes[Math.floor(Math.random() * bokehPalettes.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 14.0 + Math.random() * 26.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    this.bokehGeo = new THREE.BufferGeometry();
    this.bokehGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.bokehGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.bokehGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.bokehGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

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
          p.y += sin(uTime * 0.7 + aPhase) * 1.2;

          float angle = uTime * 0.03;
          float cosA = cos(angle);
          float sinA = sin(angle);
          float nx = p.x * cosA - p.z * sinA;
          float nz = p.x * sinA + p.z * cosA;
          p.x = nx;
          p.z = nz;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPos;

          vAlpha = 0.32 + sin(uTime * 1.1 + aPhase) * 0.1;

          gl_PointSize = aScale * (110.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 42.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float edge = smoothstep(0.5, 0.42, dist);
          float rim = smoothstep(0.25, 0.46, dist) * 0.55;
          float body = (1.0 - smoothstep(0.0, 0.45, dist)) * 0.35;
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
