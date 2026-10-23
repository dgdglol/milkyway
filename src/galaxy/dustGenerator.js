import * as THREE from 'three';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 4 Layers of cosmic clouds matching the NASA reference image:
    // 1. Luminous celestial blue spiral arm cloud bands (dải mây xanh bao quanh sao)
    // 2. Central warm golden galactic bar (thanh chắn trung tâm màu vàng mật ong)
    // 3. Interstellar dark reddish-brown dust lanes (dải bụi tối viền trong các nhánh)
    // 4. HII glowing ruby/coral star-forming nebulae (các đốm vườn ươm sao đỏ hồng)
    this.armClouds = null;
    this.barClouds = null;
    this.darkDust = null;
    this.hiiNebulae = null;

    this.materials = [];
    this.speed = 0.28;
    this.visible = true;

    this.init();
  }

  init() {
    this.generate();
    this.scene.add(this.group);
  }

  generate() {
    // Clear existing
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.group.remove(obj);
    }
    this.materials = [];

    this.createArmClouds();
    this.createCentralBarClouds();
    this.createDarkDustLanes();
    this.createHIINebulae();
  }

  // 1. Dải mây xanh lam/periwinkle bao quanh các sao dọc theo 4 nhánh xoắn ốc
  createArmClouds() {
    const count = 42000;
    const radius = 115;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    // Bảng màu mây xanh lam khói thiên văn học trầm tối, dịu mắt chuẩn ảnh NASA
    const cloudPalettes = [
      new THREE.Color('#4c6e9e'), // Mây xanh lam khói
      new THREE.Color('#385682'), // Xanh denim trầm
      new THREE.Color('#2d466e'), // Xanh đêm sâu
      new THREE.Color('#58688a')  // Xám khói periwinkle
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.7);
      const r = 8 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      // Đặt dải mây chạy trọn vẹn theo trục nhánh xoắn ốc
      positions[i3] = Math.cos(branchAngle + spinAngle) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

      // Độ phồng mây mềm mại bao bọc các vì sao
      const spread = (0.8 + rRatio * 0.4) * 5.2;
      randomnessArray[i3] = (Math.random() - 0.5) * spread;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * 2.8;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = cloudPalettes[Math.floor(Math.random() * cloudPalettes.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Hạt mây thể tích lớn mềm mại
      scales[i] = 16.0 + Math.random() * 22.0;
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

          // Mây bềnh bồng nhẹ nhàng, độ trong suốt êm dịu không gắt
          vAlpha = 0.11 + sin(uTime * 0.5 + dist * 0.1) * 0.02;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 48.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Mây khuếch tán Gaussian mượt mà không có viền cứng
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
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.armClouds = new THREE.Points(geo, mat);
    this.group.add(this.armClouds);
  }

  // 2. Mây vàng thanh chắn trung tâm (Central Galactic Bar)
  createCentralBarClouds() {
    const count = 9000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Màu vàng cát, hổ phách dịu trầm chuẩn ảnh thiên văn học
    const barColors = [
      new THREE.Color('#d4b476'), // Vàng cát trầm
      new THREE.Color('#b89045'), // Hổ phách dịu
      new THREE.Color('#c99d52'), // Champagne cổ điển
      new THREE.Color('#9e7530')  // Nâu vàng dịu
    ];

    // Thanh chắn elip nghiêng ~35 độ giống hệt ảnh mẫu
    const barAngle = Math.PI * 0.19;
    const cosBar = Math.cos(barAngle);
    const sinBar = Math.sin(barAngle);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Elip thanh chắn: chiều dài bán kính 16, chiều rộng bán kính 5.5
      const u = (Math.random() - 0.5) * 2;
      const v = (Math.random() - 0.5) * 2;
      const lx = u * 15.0 * Math.sqrt(Math.max(0, 1 - (v * v) / 1.5));
      const lz = v * 5.0 * Math.sqrt(Math.max(0, 1 - (u * u) / 1.5));

      positions[i3] = lx * cosBar - lz * sinBar;
      positions[i3 + 1] = (Math.random() - 0.5) * 2.2;
      positions[i3 + 2] = lx * sinBar + lz * cosBar;

      const c = barColors[Math.floor(Math.random() * barColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 14.0 + Math.random() * 20.0;
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

          vAlpha = 0.12 + sin(uTime * 0.7 + dist * 0.2) * 0.02;
          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 44.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 2.0);
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
    this.barClouds = new THREE.Points(geo, mat);
    this.group.add(this.barClouds);
  }

  // 3. Dải bụi tối nâu đỏ viền trong các nhánh xoắn ốc (Dark Dust Lanes)
  createDarkDustLanes() {
    const count = 12000;
    const radius = 105;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Màu nâu đỏ sẫm của bụi liên sao (Interstellar dust)
    const dustPalette = [
      new THREE.Color('#451a03'),
      new THREE.Color('#78350f'),
      new THREE.Color('#3b0764'),
      new THREE.Color('#1f1005')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 10 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      // Độ lệch mép trong của nhánh xoắn ốc tạo thành dải bụi tối
      const innerOffset = -0.22;

      positions[i3] = Math.cos(branchAngle + spinAngle + innerOffset) * r + (Math.random() - 0.5) * 2.5;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.6;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle + innerOffset) * r + (Math.random() - 0.5) * 2.5;

      const c = dustPalette[Math.floor(Math.random() * dustPalette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 12.0 + Math.random() * 16.0;
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

          gl_PointSize = aScale * (110.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 36.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.28;
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

  // 4. Các đốm vườn ươm sao đỏ hồng (HII Emission Regions)
  createHIINebulae() {
    const count = 900;
    const radius = 100;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Màu hồng ngọc, đỏ san hô rực rỡ như trong ảnh mẫu
    const redHues = [
      new THREE.Color('#f43f5e'), // Ruby pink
      new THREE.Color('#fb7185'), // Coral
      new THREE.Color('#fda4af'), // Pastel pink
      new THREE.Color('#e11d48')  // Crimson
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 12 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      // Điểm xuyết rải rác dọc theo nhánh xoắn ốc
      positions[i3] = Math.cos(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.0;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.4;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.0;

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

          vAlpha = 0.45 + sin(uTime * 1.5 + dist * 0.3) * 0.15;
          gl_PointSize = aScale * (110.0 / -mvPos.z);
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
          strength = pow(strength, 1.8);
          gl_FragColor = vec4(vColor * 1.2, strength * vAlpha);
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
