import * as THREE from 'three';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Hệ thống mây & sương mù thiên văn học NASA:
    // 1. Dải mây chính bao quanh sao (Arm Clouds)
    // 2. Thanh chắn trung tâm màu vàng cát (Central Golden Bar)
    // 3. Sương mù mờ mờ khuếch tán giữa các nhánh (Inter-arm Diffuse Mist)
    // 4. Quầng sương mờ mờ bao quanh toàn bộ rìa thiên hà (Galactic Halo & Outer Haze)
    // 5. Dải bụi tối nâu đỏ viền trong (Dark Dust Lanes)
    // 6. Vườn ươm sao đỏ hồng (HII Nebulae)
    this.armClouds = null;
    this.barClouds = null;
    this.interArmMist = null;
    this.outerHalo = null;
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
    // Clear existing
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.group.remove(obj);
    }
    this.materials = [];

    // Tạo các lớp theo thứ tự từ nền sương mù mờ mờ đến dải mây chính
    this.createOuterHalo();
    this.createInterArmMist();
    this.createArmClouds();
    this.createCentralBarClouds();
    this.createDarkDustLanes();
    this.createHIINebulae();
  }

  // 1. Sương mờ mờ bao quanh toàn bộ rìa thiên hà (Outer Diffuse Halo)
  createOuterHalo() {
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Sắc màu xám khói xanh lam rất dịu và trầm
    const haloColors = [
      new THREE.Color('#1e2e45'),
      new THREE.Color('#162234'),
      new THREE.Color('#253852'),
      new THREE.Color('#1a2432')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Phân bố bán kính từ tâm ra tận 135
      const r = 12 + Math.sqrt(Math.random()) * 125;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * 4.5;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = haloColors[Math.floor(Math.random() * haloColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Hạt sương thể tích cực lớn để tạo hiệu ứng mờ mịn
      scales[i] = 32.0 + Math.random() * 38.0;
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
          float orbitSpeed = uTime * uSpeed * 0.08 * (1.0 / (1.0 + dist * 0.01));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          // Độ trong suốt mờ mờ dịu nhẹ ở rìa, giảm dần về mép ngoài
          float fade = 1.0 - smoothstep(40.0, 135.0, dist);
          vAlpha = (0.045 + sin(uTime * 0.4 + dist * 0.05) * 0.01) * fade;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
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
        uSpeed: { value: this.speed }
      }
    });

    this.materials.push(mat);
    this.outerHalo = new THREE.Points(geo, mat);
    this.group.add(this.outerHalo);
  }

  // 2. Sương mù mờ mờ nằm giữa các dải mây (Inter-Arm Diffuse Gas)
  createInterArmMist() {
    const count = 22000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Sắc xanh khói denim mềm mại nằm giữa các nhánh
    const mistColors = [
      new THREE.Color('#334e75'),
      new THREE.Color('#283e5e'),
      new THREE.Color('#223450'),
      new THREE.Color('#3d4e68')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Phân bố đều khắp đĩa ngân hà nối liền các nhánh xoắn
      const r = 10 + Math.pow(Math.random(), 1.4) * 110;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * 3.2;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = mistColors[Math.floor(Math.random() * mistColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // Hạt mờ sương thể tích trung bình - lớn
      scales[i] = 24.0 + Math.random() * 28.0;
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
          float orbitSpeed = uTime * uSpeed * 0.11 * (1.0 / (1.0 + dist * 0.012));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          // Làn sương êm dịu làm cầu nối giữa các dải mây
          float fade = 1.0 - smoothstep(30.0, 120.0, dist);
          vAlpha = (0.055 + sin(uTime * 0.5 + dist * 0.08) * 0.012) * fade;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 52.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
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
    this.interArmMist = new THREE.Points(geo, mat);
    this.group.add(this.interArmMist);
  }

  // 3. Dải mây xanh lam/periwinkle chính bao quanh các nhánh sao
  createArmClouds() {
    const count = 42000;
    const radius = 115;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    const cloudPalettes = [
      new THREE.Color('#4c6e9e'),
      new THREE.Color('#385682'),
      new THREE.Color('#2d466e'),
      new THREE.Color('#58688a')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.7);
      const r = 8 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

      const spread = (0.8 + rRatio * 0.4) * 5.2;
      randomnessArray[i3] = (Math.random() - 0.5) * spread;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * 2.8;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = cloudPalettes[Math.floor(Math.random() * cloudPalettes.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

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

  // 4. Mây vàng thanh chắn trung tâm (Central Galactic Bar)
  createCentralBarClouds() {
    const count = 9000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const barColors = [
      new THREE.Color('#d4b476'),
      new THREE.Color('#b89045'),
      new THREE.Color('#c99d52'),
      new THREE.Color('#9e7530')
    ];

    const barAngle = Math.PI * 0.19;
    const cosBar = Math.cos(barAngle);
    const sinBar = Math.sin(barAngle);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

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

  // 5. Dải bụi tối nâu đỏ viền trong các nhánh xoắn ốc (Dark Dust Lanes)
  createDarkDustLanes() {
    const count = 12000;
    const radius = 105;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const dustPalette = [
      new THREE.Color('#381504'),
      new THREE.Color('#5a280c'),
      new THREE.Color('#2b054a'),
      new THREE.Color('#140b03')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 10 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;
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

  // 6. Các đốm vườn ươm sao đỏ hồng (HII Emission Regions)
  createHIINebulae() {
    const count = 900;
    const radius = 100;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const redHues = [
      new THREE.Color('#c23854'),
      new THREE.Color('#a82844'),
      new THREE.Color('#d94d6e'),
      new THREE.Color('#8e1e36')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const rRatio = Math.pow(Math.random(), 1.6);
      const r = 12 + rRatio * radius;

      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin * 0.055;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + (Math.random() - 0.5) * 4.0;
      positions[i3 + 1] = (Math.random() - 0.5) * 1.4;
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

          vAlpha = 0.35 + sin(uTime * 1.5 + dist * 0.3) * 0.1;
          gl_PointSize = aScale * (110.0 / -mvPos.z);
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
          strength = pow(strength, 1.8);
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
