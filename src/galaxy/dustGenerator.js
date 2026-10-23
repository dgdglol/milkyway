import * as THREE from 'three';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 5 Lớp mây dày đặc, rõ nét chuẩn ảnh minh họa NASA:
    // 1. Dải mây xoắn ốc chính dày dặn, rõ ràng (Thick Arm Clouds)
    // 2. Thanh chắn trung tâm màu vàng mật ong đậm đà (Dense Golden Bar)
    // 3. Sương mù mờ ảo phủ khắp đĩa nối liền các nhánh (Inter-arm Connecting Haze)
    // 4. Dải bụi tối nâu đỏ viền trong các nhánh (Deep Dark Dust Filaments)
    // 5. Đốm hồng ngọc vườn ươm sao HII rực rỡ (Ruby HII Nebulae)
    this.armClouds = null;
    this.barClouds = null;
    this.interArmMist = null;
    this.darkDust = null;
    this.hiiNebulae = null;

    this.materials = [];
    this.speed = 0.24;
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

    // Tạo các tầng mây theo đúng cấu trúc ảnh NASA
    this.createInterArmConnectingMist();
    this.createThickArmClouds();
    this.createDenseCentralBar();
    this.createDeepDarkDustLanes();
    this.createRubyHIINebulae();
  }

  // 1. DẢI MÂY XOẮN ỐC CHÍNH DÀY DẶN & RÕ NÉT (Thick Arm Clouds)
  createThickArmClouds() {
    const count = 55000;
    const radius = 118;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    // Bảng màu mây xanh lam sữa, xanh thiên thanh và periwinkle sáng rõ như ảnh NASA
    const cloudPalettes = [
      new THREE.Color('#93c5fd'), // Xanh lam sáng rõ
      new THREE.Color('#bfdbfe'), // Xanh sữa băng tuyết
      new THREE.Color('#7aa2db'), // Xanh thiên thanh
      new THREE.Color('#a5b4fc'), // Tím nhạt Periwinkle
      new THREE.Color('#60a5fa')  // Xanh lam ngọc
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

      // Độ rộng dải mây ôm trọn các nhánh
      const spread = (0.7 + rRatio * 0.45) * 5.8;
      randomnessArray[i3] = (Math.random() - 0.5) * spread;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * 2.5;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = cloudPalettes[Math.floor(Math.random() * cloudPalettes.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Hạt mây lớn, phủ dày tạo thành khối mây liền mạch không bị đứt đoạn
      scales[i] = 22.0 + Math.random() * 26.0;
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

          // Độ đục tăng cao (0.42) để mây hiện rõ ràng, sắc nét và bồng bềnh
          vAlpha = 0.42 + sin(uTime * 0.5 + dist * 0.1) * 0.05;

          gl_PointSize = aScale * (135.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 56.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Mây bồng bềnh dày dặn với đường cong falloff mềm 1.3
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.3);

          gl_FragColor = vec4(vColor * 1.1, strength * vAlpha);
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

  // 2. THANH CHẮN TRUNG TÂM VÀNG MẬT ONG DÀY DẶN & RÕ NÉT (Dense Golden Bar)
  createDenseCentralBar() {
    const count = 16000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Sắc vàng mật ong, vàng kem champagne đậm đà chuẩn ảnh NASA
    const barColors = [
      new THREE.Color('#fde68a'), // Vàng kem champagne
      new THREE.Color('#fcd34d'), // Vàng hổ phách
      new THREE.Color('#f59e0b'), // Vàng cam ấm
      new THREE.Color('#fbbf24')  // Vàng mật ong
    ];

    const barAngle = Math.PI * 0.19;
    const cosBar = Math.cos(barAngle);
    const sinBar = Math.sin(barAngle);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Khối elip thanh chắn dày dặn
      const u = (Math.random() - 0.5) * 2;
      const v = (Math.random() - 0.5) * 2;
      const lx = u * 16.5 * Math.sqrt(Math.max(0, 1 - (v * v) / 1.4));
      const lz = v * 5.8 * Math.sqrt(Math.max(0, 1 - (u * u) / 1.4));

      positions[i3] = lx * cosBar - lz * sinBar;
      positions[i3 + 1] = (Math.random() - 0.5) * 2.5;
      positions[i3 + 2] = lx * sinBar + lz * cosBar;

      const c = barColors[Math.floor(Math.random() * barColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 18.0 + Math.random() * 22.0;
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

          // Thanh chắn vàng hiện rõ nét đậm đà (0.50)
          vAlpha = 0.50 + sin(uTime * 0.6 + dist * 0.15) * 0.05;
          gl_PointSize = aScale * (135.0 / -mvPos.z);
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
          strength = pow(strength, 1.3);
          gl_FragColor = vec4(vColor * 1.15, strength * vAlpha);
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

  // 3. SƯƠNG MÙ NỐI LIỀN GIỮA CÁC DẢI MÂY VÀ BAO QUANH ĐĨA (Inter-arm Connecting Haze)
  createInterArmConnectingMist() {
    const count = 35000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Mây sương xanh lam khói nhẹ nhàng làm nền nối các nhánh
    const mistColors = [
      new THREE.Color('#4a6fa5'),
      new THREE.Color('#3b5987'),
      new THREE.Color('#2e476e'),
      new THREE.Color('#5b7ba8')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const r = 8 + Math.pow(Math.random(), 1.35) * 122;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * 3.6;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = mistColors[Math.floor(Math.random() * mistColors.length)];
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

          // Màn sương rõ ràng (0.22) nối liền giữa các dải mây
          float fade = 1.0 - smoothstep(35.0, 130.0, dist);
          vAlpha = (0.22 + sin(uTime * 0.5 + dist * 0.08) * 0.03) * fade;

          gl_PointSize = aScale * (130.0 / -mvPos.z);
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
          gl_FragColor = vec4(vColor, strength * vAlpha);
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
    this.interArmMist = new THREE.Points(geo, mat);
    this.group.add(this.interArmMist);
  }

  // 4. DẢI BỤI TỐI NÂU ĐỎ VIỀN TRONG CÁC NHÁNH (Deep Dark Dust Filaments)
  createDeepDarkDustLanes() {
    const count = 18000;
    const radius = 110;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const dustPalette = [
      new THREE.Color('#2e1104'),
      new THREE.Color('#451a03'),
      new THREE.Color('#1c0902'),
      new THREE.Color('#38094d')
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

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 42.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.42;
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

  // 5. ĐỐM HỒNG NGỌC VƯỜN ƯƠM SAO HII RỰC RỠ (Ruby HII Nebulae)
  createRubyHIINebulae() {
    const count = 1200;
    const radius = 105;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const redHues = [
      new THREE.Color('#f43f5e'), // Ruby pink rõ nét
      new THREE.Color('#fb7185'), // Coral
      new THREE.Color('#fda4af'), // Pastel rose
      new THREE.Color('#e11d48')  // Crimson
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 10 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.2;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.2;

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

          vAlpha = 0.55 + sin(uTime * 1.5 + dist * 0.3) * 0.15;
          gl_PointSize = aScale * (120.0 / -mvPos.z);
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
          strength = pow(strength, 1.6);
          gl_FragColor = vec4(vColor * 1.25, strength * vAlpha);
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
