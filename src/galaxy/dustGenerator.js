import * as THREE from 'three';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Hệ thống mây sao chân thật theo chuẩn Cosmoscope / Thiên văn học thực tế:
    // 1. Mây sao thanh chắn & nhân trung tâm màu vàng hổ phách ấm áp (Golden Core Star Clouds)
    // 2. Dải mây sao xoắn ốc màu kem vàng & xanh xám thiên văn (Creamy-Gold & Slate Arm Clouds)
    // 3. Sương mù mây sao bao phủ toàn bộ đĩa thiên hà (Continuous Disk Star Cloud Envelope)
    // 4. Dải bụi tối màu nâu espresso đặc trưng của Ngân Hà (Dark Extinction Dust Lanes)
    // 5. Vườn ươm sao đỏ trầm HII (Deep Red Emission Nebulae)
    this.barClouds = null;
    this.armClouds = null;
    this.envelopeClouds = null;
    this.darkDust = null;
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

    // Tạo các lớp mây sao bao phủ chân thật
    this.createDiskCloudEnvelope();
    this.createGoldenCoreClouds();
    this.createRealisticArmClouds();
    this.createDarkExtinctionDust();
    this.createDeepHIINebulae();
  }

  // 1. MÂY SAO BAO PHỦ TOÀN BỘ ĐĨA THIÊN HÀ (Continuous Disk Star Cloud Envelope)
  createDiskCloudEnvelope() {
    const count = 38000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Bảng màu mây bao phủ: vàng cát kem, hổ phách dịu, xám xanh thiên văn trầm
    const envelopePalette = [
      new THREE.Color('#3d3224'), // Vàng nâu trầm ấm
      new THREE.Color('#2d2820'), // Khói hổ phách sẫm
      new THREE.Color('#263242'), // Xám xanh thiên văn
      new THREE.Color('#383020')  // Cát vàng sẫm
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Phân bố đều khắp đĩa từ tâm ra bán kính 125
      const r = 6 + Math.pow(Math.random(), 1.35) * 120;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * 3.8;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = envelopePalette[Math.floor(Math.random() * envelopePalette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 26.0 + Math.random() * 32.0;
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

          // Mây bao phủ mờ mịn, êm ái
          float fade = 1.0 - smoothstep(30.0, 126.0, dist);
          vAlpha = (0.22 + sin(uTime * 0.4 + dist * 0.08) * 0.02) * fade;

          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 56.0);
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
    this.envelopeClouds = new THREE.Points(geo, mat);
    this.group.add(this.envelopeClouds);
  }

  // 2. MÂY SAO THANH CHẮN TRUNG TÂM MÀU VÀNG HỔ PHÁCH ẤM ÁP (Golden Core Star Clouds)
  createGoldenCoreClouds() {
    const count = 18000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Tông màu vàng ấm áp chân thật như ảnh thiên văn thực tế của Cosmoscope
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
      const lx = u * 16.5 * Math.sqrt(Math.max(0, 1 - (v * v) / 1.4));
      const lz = v * 5.8 * Math.sqrt(Math.max(0, 1 - (u * u) / 1.4));

      positions[i3] = lx * cosBar - lz * sinBar;
      positions[i3 + 1] = (Math.random() - 0.5) * 2.6;
      positions[i3 + 2] = lx * sinBar + lz * cosBar;

      const c = coreGoldColors[Math.floor(Math.random() * coreGoldColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 16.0 + Math.random() * 20.0;
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

          // Thanh chắn vàng hiện rõ rệt, màu ấm êm dịu không chói mắt
          vAlpha = 0.36 + sin(uTime * 0.6 + dist * 0.15) * 0.04;
          gl_PointSize = aScale * (130.0 / -mvPos.z);
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
          gl_FragColor = vec4(vColor * 0.55, strength * vAlpha);
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

  // 3. DẢI MÂY SAO XOẮN ỐC MÀU VÀNG KEM & XANH KHÓI THIÊN VĂN (Realistic Arm Clouds)
  createRealisticArmClouds() {
    const count = 52000;
    const radius = 118;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    // Màu dải mây theo đúng thiên văn học: vàng kem nhạt dần chuyển sang xanh lam xám thiên văn
    const armCloudHues = [
      new THREE.Color('#c29f62'), // Vàng kem nhạt
      new THREE.Color('#947b4d'), // Hổ phách dịu
      new THREE.Color('#4d6b94'), // Xanh lam xám thiên văn
      new THREE.Color('#3b557a'), // Xanh đêm dịu
      new THREE.Color('#5e7696')  // Periwinkle trầm
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.65);
      const r = 7 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

      const spread = (0.7 + rRatio * 0.45) * 5.6;
      randomnessArray[i3] = (Math.random() - 0.5) * spread;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * 2.5;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = armCloudHues[Math.floor(Math.random() * armCloudHues.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 18.0 + Math.random() * 24.0;
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

          // Độ đục rõ ràng, dải mây cuộn xoắn bồng bềnh
          vAlpha = 0.32 + sin(uTime * 0.5 + dist * 0.1) * 0.04;

          gl_PointSize = aScale * (130.0 / -mvPos.z);
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

          gl_FragColor = vec4(vColor * 0.5, strength * vAlpha);
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

  // 4. DẢI BỤI TỐI NÂU ESPRESSO (Dark Extinction Dust Lanes)
  createDarkExtinctionDust() {
    const count = 18000;
    const radius = 110;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const dustPalette = [
      new THREE.Color('#1a0c03'),
      new THREE.Color('#281305'),
      new THREE.Color('#100602'),
      new THREE.Color('#22071a')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 9 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;
      const innerOffset = -0.20;

      positions[i3] = Math.cos(branchAngle + spinAngle + innerOffset) * r + (Math.random() - 0.5) * 2.8;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.8;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle + innerOffset) * r + (Math.random() - 0.5) * 2.8;

      const c = dustPalette[Math.floor(Math.random() * dustPalette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 14.0 + Math.random() * 18.0;
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

          gl_PointSize = aScale * (115.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 38.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.38;
          gl_FragColor = vec4(vColor, strength);
        }
      `,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.darkDust = new THREE.Points(geo, mat);
    this.group.add(this.darkDust);
  }

  // 5. VƯỜN ƯƠM SAO ĐỎ TRẦM HII (Deep Red Emission Nebulae)
  createDeepHIINebulae() {
    const count = 900;
    const radius = 105;
    const branches = 4;
    const spin = 1.65;

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

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 10 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.0;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.0;

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

          vAlpha = 0.28 + sin(uTime * 1.5 + dist * 0.3) * 0.06;
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
          gl_FragColor = vec4(vColor * 0.5, strength * vAlpha);
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
