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
    width: (r, ratio) => 7.5 + Math.sin(r * 0.11) * 4.2 + ratio * 5.5,
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
    width: (r, ratio) => 5.6 + Math.cos(r * 0.16) * 2.8 + ratio * 3.6,
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
    width: (r, ratio) => 10.5 + Math.sin(r * 0.09 + 0.5) * 5.4 + ratio * 6.5,
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
    width: (r, ratio) => 5.2 + Math.pow(ratio, 1.3) * 10.5 + Math.sin(r * 0.13) * 3.0,
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

    // 1. MÂY Ở GIỮA: Vùng nhân & thanh chắn elip cực dày, vàng ấm mịn màng
    this.createGoldenCoreBulge();

    // 2. MÂY PHỦ KÍN TOÀN ĐĨA (Inter-Arm Deep Carpet): Xóa sạch mọi mảng đen bên trong thiên hà
    this.createInterArmDeepCarpet();

    // 3. MÂY DẢI XOẮN ỐC DÀY ĐẶC (Dense Arm Ribbons): Cuộn sóng dày dặn, bồng bềnh
    this.createDenseArmCloudRibbons();

    // 4. MÂY MỜ XUNG QUANH (Outer Halo Mist): Phủ rộng viền ngoài, triệt tiêu mảng đen ngoại vi
    this.createOuterHaloMist();

    // 5. CÁC NHÁNH PHỤ CẦU NỐI (Spurs & Inter-Arm Bridges)
    this.createSpurBridges();

    // 6. ĐỐM HỒNG NGỌC MỜ HII (Deep Red Nebulae)
    this.createDeepHIINebulae();
  }

  // 1. MÂY Ở GIỮA: Vùng nhân elip Sagittarius A* màu vàng kem champagne ấm dịu
  createGoldenCoreBulge() {
    const count = 35000;
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
      const lx = u * 21.0 * Math.sqrt(Math.max(0, 1 - (v * v) / 1.4));
      const lz = v * 8.2 * Math.sqrt(Math.max(0, 1 - (u * u) / 1.4));

      positions[i3] = lx * cosBar - lz * sinBar;
      positions[i3 + 1] = (Math.random() - 0.5) * 3.6;
      positions[i3 + 2] = lx * sinBar + lz * cosBar;

      const c = coreGoldColors[Math.floor(Math.random() * coreGoldColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Hạt mây to rộng, che phủ kín tuyệt đối
      scales[i] = 20.0 + Math.random() * 28.0;
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

          vAlpha = 0.42 + sin(uTime * 0.6 + dist * 0.15) * 0.04;
          gl_PointSize = aScale * (130.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 4.0, 72.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.2);
          gl_FragColor = vec4(vColor * 0.52, strength * vAlpha);
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

  // 2. MÂY PHỦ KÍN TOÀN ĐĨA: Triệt tiêu mọi mảng đen giữa các nhánh và đĩa thiên hà
  createInterArmDeepCarpet() {
    const count = 85000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Chuyển sắc từ vàng cát / hổ phách ấm ở trong sang lam xám thiên văn ở ngoài
    const innerColors = [
      new THREE.Color('#463824'), // Hổ phách khói
      new THREE.Color('#3c2f1e'), // Cát vàng sẫm
      new THREE.Color('#504028')  // Vàng nâu ấm
    ];

    const outerColors = [
      new THREE.Color('#253244'), // Lam xám thiên văn
      new THREE.Color('#2e3d52'), // Slate blue tối
      new THREE.Color('#222d3d')  // Xám đêm sâu
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Phủ kín tuyệt đối từ tâm r = 1.0 đến r = 130
      const r = 1.0 + Math.pow(Math.random(), 1.2) * 129.0;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * (2.8 + (r / 128.0) * 4.2);
      positions[i3 + 2] = Math.sin(angle) * r;

      const isInner = (r < 58.0) || (Math.random() < Math.max(0, 1 - r / 85.0));
      const pool = isInner ? innerColors : outerColors;
      const c = pool[Math.floor(Math.random() * pool.length)];

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Kích thước hạt cực rộng để các hạt chồng lấn liên tục, không để lọt mảng đen
      scales[i] = 34.0 + Math.random() * 42.0;
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

          // Mây phủ dày đằm, triệt tiêu mảng đen
          float fade = 1.0 - smoothstep(50.0, 132.0, dist);
          vAlpha = (0.36 + sin(uTime * 0.35 + dist * 0.08) * 0.03) * fade;

          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 5.0, 95.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          // Độ suy giảm hình chuông mềm, kết nối liền mạch giữa các hạt
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.15);
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
    this.interArmClouds = new THREE.Points(geo, mat);
    this.group.add(this.interArmClouds);
  }

  // 3. MÂY DẢI XOẮN ỐC DÀY ĐẶC (Dense Arm Ribbons)
  createDenseArmCloudRibbons() {
    const count = 68000;
    const radius = 124;
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
      const r = 5.5 + rRatio * radius;

      const spinAngle = r * baseSpin * arm.spinFactor * 0.054 + Math.sin(r * 0.08) * 0.12;
      const angle = arm.baseAngle + spinAngle;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(angle) * r;

      const armSpread = arm.width(r, rRatio) * 1.15;
      const randomRadial = (Math.pow(Math.random(), 1.4) - 0.5) * armSpread;
      const randomTangent = (Math.random() - 0.5) * armSpread * 0.7;
      const randomY = (Math.random() - 0.5) * (2.0 + rRatio * 2.8);

      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      randomnessArray[i3] = -sinA * randomRadial + cosA * randomTangent;
      randomnessArray[i3 + 1] = randomY;
      randomnessArray[i3 + 2] = cosA * randomRadial + sinA * randomTangent;

      const c = arm.colors[Math.floor(Math.random() * arm.colors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 20.0 + Math.random() * 30.0;
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

          vAlpha = 0.40 + sin(uTime * 0.5 + dist * 0.09) * 0.04;
          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 4.0, 75.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.25);
          gl_FragColor = vec4(vColor * 0.52, strength * vAlpha);
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

  // 4. MÂY MỜ XUNG QUANH (Outer Halo Mist: Phủ kín rìa ngoài)
  createOuterHaloMist() {
    const count = 30000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const haloColors = [
      new THREE.Color('#202b3a'),
      new THREE.Color('#263446'),
      new THREE.Color('#2d3c4e'),
      new THREE.Color('#1c2636')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Phủ đều khắp rìa ngoài r = 45 đến 142
      const r = 45.0 + Math.pow(Math.random(), 1.1) * 97.0;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * (3.2 + (r / 140.0) * 4.8);
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = haloColors[Math.floor(Math.random() * haloColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 36.0 + Math.random() * 45.0;
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

          float fade = 1.0 - smoothstep(75.0, 144.0, dist);
          vAlpha = (0.28 + sin(uTime * 0.3 + dist * 0.06) * 0.02) * fade;

          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 4.0, 85.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.3);
          gl_FragColor = vec4(vColor * 0.44, strength * vAlpha);
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
    const count = 12000;
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
      const r = 25.0 + t * 68.0;
      const baseArm = ARM_PROFILES[i % ARM_PROFILES.length];
      const bridgeAngle = baseArm.baseAngle + r * 1.65 * 0.054 + (Math.random() * 0.45 + 0.15);

      positions[i3] = Math.cos(bridgeAngle) * r + (Math.random() - 0.5) * 5.2;
      positions[i3 + 1] = (Math.random() - 0.5) * 2.6;
      positions[i3 + 2] = Math.sin(bridgeAngle) * r + (Math.random() - 0.5) * 5.2;

      const c = spurHues[Math.floor(Math.random() * spurHues.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 16.0 + Math.random() * 26.0;
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

          vAlpha = 0.30 + sin(uTime * 0.5 + dist * 0.1) * 0.03;
          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 3.0, 50.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.3);
          gl_FragColor = vec4(vColor * 0.48, strength * vAlpha);
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
    const count = 1500;
    const radius = 112;

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
      const r = 8 + rRatio * radius;
      const spinAngle = r * 1.65 * arm.spinFactor * 0.054;
      const angle = arm.baseAngle + spinAngle;

      positions[i3] = Math.cos(angle) * r + (Math.random() - 0.5) * 3.8;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 3.8;

      const c = redHues[Math.floor(Math.random() * redHues.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 12.0 + Math.random() * 18.0;
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

          vAlpha = 0.28 + sin(uTime * 1.5 + dist * 0.3) * 0.05;
          gl_PointSize = aScale * (115.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 42.0);
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
          gl_FragColor = vec4(vColor * 0.48, strength * vAlpha);
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
