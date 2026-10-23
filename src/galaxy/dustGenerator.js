import * as THREE from 'three';

// Cấu hình 4 nhánh xoắn ốc thực tế theo dữ liệu thiên văn học Milky Way:
// - Góc xuất phát KHÔNG CÁCH ĐỀU NHAU (bất đối xứng tự nhiên: 76.8°, 87.1°, 102.5°, 93.6°)
// - Độ rộng (width) biến thiên hữu cơ theo bán kính ("to nhỏ tùy hứng", cuộn phồng rồi thon lại)
// - Hệ số uốn lượn riêng biệt cho từng nhánh
export const ARM_PROFILES = [
  {
    name: 'Nhánh Perseus',
    baseAngle: 0.05,
    spinFactor: 1.0,
    width: (r, ratio) => 6.2 + Math.sin(r * 0.11) * 3.6 + ratio * 4.6,
    colors: [
      new THREE.Color('#caa25b'), // Vàng cát ấm
      new THREE.Color('#7893b8'), // Lam xám thiên văn
      new THREE.Color('#4d6a92')  // Denim trầm
    ]
  },
  {
    name: 'Nhánh Sagittarius-Carina',
    baseAngle: 1.34, // Góc lệch tự nhiên
    spinFactor: 1.05,
    width: (r, ratio) => 4.4 + Math.cos(r * 0.16) * 2.2 + ratio * 2.8,
    colors: [
      new THREE.Color('#d4a95d'), // Hổ phách ấm
      new THREE.Color('#a8864f'), // Topaz trầm
      new THREE.Color('#5a7499')  // Lam khói
    ]
  },
  {
    name: 'Nhánh Scutum-Centaurus',
    baseAngle: 2.86, // Nhánh chính khổng lồ, dải mây dày cuộn sóng
    spinFactor: 0.98,
    width: (r, ratio) => 8.8 + Math.sin(r * 0.09 + 0.5) * 4.8 + ratio * 5.4,
    colors: [
      new THREE.Color('#deb86e'), // Champagne ấm
      new THREE.Color('#b88b44'), // Vàng mật ong
      new THREE.Color('#6685ab'), // Lam thiên văn
      new THREE.Color('#466286')
    ]
  },
  {
    name: 'Nhánh Norma / Outer',
    baseAngle: 4.65, // Nhánh ngoại vi, mảnh ở trong và tỏa rộng ra viền ngoài
    spinFactor: 1.04,
    width: (r, ratio) => 4.0 + Math.pow(ratio, 1.3) * 8.8 + Math.sin(r * 0.13) * 2.4,
    colors: [
      new THREE.Color('#9e7e4e'), // Cát vàng sẫm
      new THREE.Color('#4d6585'), // Lam xám
      new THREE.Color('#384b66')
    ]
  }
];

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.barClouds = null;
    this.armClouds = null;
    this.interArmClouds = null;
    this.outerHaloClouds = null;
    this.spurClouds = null;
    this.hiiNebulae = null;

    this.materials = [];
    this.speed = 0.20;
    this.visible = true;

    this.init();
  }

  init() {
    this.generate();
    this.scene.add(this.group);
  }

  generate() {
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.group.remove(obj);
    }
    this.materials = [];

    // 1. MÂY Ở GIỮA: Vùng nhân & thanh chắn elip siêu dày dặn, màu vàng mật ong và champagne ấm
    this.createGoldenCoreBulge();

    // 2. MÂY MỜ GIỮA CÁC DẢI & KHẮP ĐĨA: Lớp sương mù vũ trụ dày đặc xóa tan mọi khoảng trống
    this.createInterArmDeepCarpet();

    // 3. MÂY DẢI XOẮN ỐC DÀY ĐẶC: Các dòng sông mây cuộn sóng bồng bềnh
    this.createDenseArmCloudRibbons();

    // 4. MÂY MỜ XUNG QUANH (Outer Halo Mist): Phủ rộng ra rìa ngoài đĩa thiên hà
    this.createOuterHaloMist();

    // 5. CÁC NHÁNH PHỤ CẦU NỐI (Spurs & Inter-Arm Bridges): Đan xen giữa các nhánh
    this.createSpurBridges();

    // 6. ĐỐM HỒNG NGỌC MỜ HII (Deep Red Nebulae)
    this.createDeepHIINebulae();
  }

  // 1. MÂY Ở GIỮA: Vùng nhân elip Sagittarius A* màu vàng ấm áp
  createGoldenCoreBulge() {
    const count = 28000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const coreGoldColors = [
      new THREE.Color('#d4a34b'), // Vàng mật ong ấm
      new THREE.Color('#b88330'), // Hổ phách dịu
      new THREE.Color('#e0b968'), // Vàng kem champagne
      new THREE.Color('#9e6b20')  // Nâu vàng trầm
    ];

    const barAngle = Math.PI * 0.19;
    const cosBar = Math.cos(barAngle);
    const sinBar = Math.sin(barAngle);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const u = (Math.random() - 0.5) * 2;
      const v = (Math.random() - 0.5) * 2;
      const lx = u * 19.0 * Math.sqrt(Math.max(0, 1 - (v * v) / 1.4));
      const lz = v * 7.2 * Math.sqrt(Math.max(0, 1 - (u * u) / 1.4));

      positions[i3] = lx * cosBar - lz * sinBar;
      positions[i3 + 1] = (Math.random() - 0.5) * 3.2;
      positions[i3 + 2] = lx * sinBar + lz * cosBar;

      const c = coreGoldColors[Math.floor(Math.random() * coreGoldColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 16.0 + Math.random() * 24.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        attribute float aScale;
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

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          vAlpha = 0.35 + sin(uTime * 0.6 + dist * 0.15) * 0.04;
          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 54.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.35);
          gl_FragColor = vec4(vColor * 0.50, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.barClouds = new THREE.Points(geo, mat);
    this.group.add(this.barClouds);
  }

  // 2. MÂY MỜ GIỮA CÁC DẢI & KHẮP ĐĨA: Siêu nhiều mây mờ mềm mại lấp đầy mọi khoảng trống
  createInterArmDeepCarpet() {
    const count = 65000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Bảng màu mây mờ: hổ phách khói và cát vàng ở trong, lam xám thiên văn ở ngoài
    const innerColors = [
      new THREE.Color('#423422'), // Hổ phách khói
      new THREE.Color('#382b1c'), // Cát vàng sẫm
      new THREE.Color('#4a3c26')  // Vàng nâu ấm
    ];

    const outerColors = [
      new THREE.Color('#222d3d'), // Lam xám thiên văn
      new THREE.Color('#2b384c'), // Slate blue tối
      new THREE.Color('#1e2838')  // Xám đêm sâu
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Phủ kín khắp đĩa từ r = 2.5 đến 128
      const r = 2.5 + Math.pow(Math.random(), 1.25) * 125.5;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * (2.4 + (r / 125.0) * 3.8);
      positions[i3 + 2] = Math.sin(angle) * r;

      const isInner = (r < 56.0) || (Math.random() < Math.max(0, 1 - r / 80.0));
      const pool = isInner ? innerColors : outerColors;
      const c = pool[Math.floor(Math.random() * pool.length)];

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Hạt mây mờ to rộng, hòa lẫn cực kỳ mượt mà
      scales[i] = 26.0 + Math.random() * 34.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        attribute float aScale;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          float dist = length(position.xz);
          float orbitSpeed = uTime * uSpeed * 0.10 * (1.0 / (1.0 + dist * 0.012));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float fade = 1.0 - smoothstep(45.0, 128.0, dist);
          vAlpha = (0.24 + sin(uTime * 0.35 + dist * 0.08) * 0.02) * fade;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 58.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.4);
          gl_FragColor = vec4(vColor * 0.45, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.interArmClouds = new THREE.Points(geo, mat);
    this.group.add(this.interArmClouds);
  }

  // 3. MÂY DẢI XOẮN ỐC DÀY ĐẶC (Dense Arm Cloud Ribbons: cuộn sóng bồng bềnh)
  createDenseArmCloudRibbons() {
    const count = 58000;
    const radius = 122;
    const baseSpin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const armIndex = i % ARM_PROFILES.length;
      const arm = ARM_PROFILES[armIndex];

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 6.5 + rRatio * radius;

      const spinAngle = r * baseSpin * arm.spinFactor * 0.054 + Math.sin(r * 0.08) * 0.12;
      const angle = arm.baseAngle + spinAngle;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(angle) * r;

      const armSpread = arm.width(r, rRatio);
      const randomRadial = (Math.pow(Math.random(), 1.4) - 0.5) * armSpread;
      const randomTangent = (Math.random() - 0.5) * armSpread * 0.65;
      const randomY = (Math.random() - 0.5) * (1.8 + rRatio * 2.6);

      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      randomnessArray[i3] = -sinA * randomRadial + cosA * randomTangent;
      randomnessArray[i3 + 1] = randomY;
      randomnessArray[i3 + 2] = cosA * randomRadial + sinA * randomTangent;

      const c = arm.colors[Math.floor(Math.random() * arm.colors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 16.0 + Math.random() * 26.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArray, 3));

    const mat = new THREE.ShaderMaterial({
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

          vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          vAlpha = 0.32 + sin(uTime * 0.5 + dist * 0.09) * 0.04;
          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 52.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.35);
          gl_FragColor = vec4(vColor * 0.50, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.armClouds = new THREE.Points(geo, mat);
    this.group.add(this.armClouds);
  }

  // 4. MÂY MỜ XUNG QUANH (Outer Halo Mist: Phủ rộng rìa ngoài đĩa)
  createOuterHaloMist() {
    const count = 22000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const haloColors = [
      new THREE.Color('#1c2533'),
      new THREE.Color('#222d3d'),
      new THREE.Color('#293444'),
      new THREE.Color('#18202c')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Bao phủ vùng rìa ngoài r = 60 đến 140
      const r = 60.0 + Math.pow(Math.random(), 1.1) * 80.0;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * (3.0 + (r / 140.0) * 4.5);
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = haloColors[Math.floor(Math.random() * haloColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 30.0 + Math.random() * 38.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        attribute float aScale;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          float dist = length(position.xz);
          float orbitSpeed = uTime * uSpeed * 0.08 * (1.0 / (1.0 + dist * 0.012));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float fade = 1.0 - smoothstep(80.0, 142.0, dist);
          vAlpha = (0.20 + sin(uTime * 0.3 + dist * 0.06) * 0.02) * fade;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 60.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.5);
          gl_FragColor = vec4(vColor * 0.40, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.outerHaloClouds = new THREE.Points(geo, mat);
    this.group.add(this.outerHaloClouds);
  }

  // 5. NHÁNH CẦU NỐI PHỤ (Spurs & Inter-Arm Bridges)
  createSpurBridges() {
    const count = 10000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const spurHues = [
      new THREE.Color('#b89154'), // Hổ phách
      new THREE.Color('#6480a4'), // Lam thiên văn
      new THREE.Color('#889eb8')  // Khói bạc
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const t = Math.random();
      const r = 28.0 + t * 62.0;
      const baseArm = ARM_PROFILES[i % ARM_PROFILES.length];
      const bridgeAngle = baseArm.baseAngle + r * 1.65 * 0.054 + (Math.random() * 0.45 + 0.15);

      positions[i3] = Math.cos(bridgeAngle) * r + (Math.random() - 0.5) * 4.8;
      positions[i3 + 1] = (Math.random() - 0.5) * 2.4;
      positions[i3 + 2] = Math.sin(bridgeAngle) * r + (Math.random() - 0.5) * 4.8;

      const c = spurHues[Math.floor(Math.random() * spurHues.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 14.0 + Math.random() * 22.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        attribute float aScale;
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

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          vAlpha = 0.24 + sin(uTime * 0.5 + dist * 0.1) * 0.03;
          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 44.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.4);
          gl_FragColor = vec4(vColor * 0.45, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.spurClouds = new THREE.Points(geo, mat);
    this.group.add(this.spurClouds);
  }

  // 6. VƯỜN ƯƠM SAO ĐỎ TRẦM HII (Deep Red Emission Nebulae)
  createDeepHIINebulae() {
    const count = 1200;
    const radius = 108;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const redHues = [
      new THREE.Color('#781e30'),
      new THREE.Color('#611624'),
      new THREE.Color('#8c263c'),
      new THREE.Color('#54101e')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const arm = ARM_PROFILES[i % ARM_PROFILES.length];
      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 9 + rRatio * radius;
      const spinAngle = r * 1.65 * arm.spinFactor * 0.054;
      const angle = arm.baseAngle + spinAngle;

      positions[i3] = Math.cos(angle) * r + (Math.random() - 0.5) * 3.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.4;
      positions[i3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 3.5;

      const c = redHues[Math.floor(Math.random() * redHues.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 10.0 + Math.random() * 16.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        attribute float aScale;
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

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          vAlpha = 0.26 + sin(uTime * 1.5 + dist * 0.3) * 0.05;
          gl_PointSize = aScale * (115.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 36.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.6);
          gl_FragColor = vec4(vColor * 0.45, strength * vAlpha);
        }
      `,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.hiiNebulae = new THREE.Points(geo, mat);
    this.group.add(this.hiiNebulae);
  }

  setSpeed(speed) {
    this.speed = speed;
    this.materials.forEach(mat => {
      if (mat.uniforms && mat.uniforms.uSpeed) {
        mat.uniforms.uSpeed.value = speed;
      }
    });
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
  }
}
