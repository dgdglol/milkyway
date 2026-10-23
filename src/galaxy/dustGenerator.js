import * as THREE from 'three';

export class DustGenerator {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Hệ thống mây thiên văn tông màu tối trầm (Dark & Moody NASA / Google Data Arts Style):
    // 1. Dải mây xoắn ốc xanh lam khói trầm (Dark Smoky Arm Clouds)
    // 2. Thanh chắn trung tâm màu đồng cổ / hổ phách trầm (Antique Bronze & Amber Bar)
    // 3. Màn sương nối mờ dịu sâu thẳm (Deep Space Inter-arm Haze)
    // 4. Dải bụi tối đen tuyền viền trong (Espresso Dust Filaments)
    // 5. Đốm hồng ngọc HII trầm (Deep Ruby Nebulae)
    this.armClouds = null;
    this.barClouds = null;
    this.interArmMist = null;
    this.darkDust = null;
    this.hiiNebulae = null;

    this.materials = [];
    this.speed = 0.22;
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

    this.createDeepInterArmMist();
    this.createDarkSmokyArmClouds();
    this.createAntiqueBronzeBar();
    this.createEspressoDustLanes();
    this.createDeepRubyHIINebulae();
  }

  // 1. DẢI MÂY XOẮN ỐC XANH LAM KHÓI TRẦM (Dark Smoky Arm Clouds)
  createDarkSmokyArmClouds() {
    const count = 48000;
    const radius = 118;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArray = new Float32Array(count * 3);

    // Bảng màu xanh lam khói đậm, xanh denim sẫm, không bị chói sáng
    const cloudPalettes = [
      new THREE.Color('#253d63'), // Xanh lam khói đậm
      new THREE.Color('#1c2e4a'), // Xanh đêm sâu
      new THREE.Color('#152338'), // Xanh navy sẫm
      new THREE.Color('#2f4870')  // Xanh denim dịu
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

      const spread = (0.7 + rRatio * 0.45) * 5.5;
      randomnessArray[i3] = (Math.random() - 0.5) * spread;
      randomnessArray[i3 + 1] = (Math.random() - 0.5) * 2.5;
      randomnessArray[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = cloudPalettes[Math.floor(Math.random() * cloudPalettes.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      scales[i] = 20.0 + Math.random() * 24.0;
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

          // Độ đục êm dịu (0.24) giúp mây hiện rõ khối mà không bị sáng lóa
          vAlpha = 0.24 + sin(uTime * 0.5 + dist * 0.1) * 0.03;

          gl_PointSize = aScale * (125.0 / -mvPos.z);
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
          strength = pow(strength, 1.5);

          // Nhân hệ số 0.45 để kiểm soát tuyệt đối không bao giờ bị chói trắng
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
    this.armClouds = new THREE.Points(geo, mat);
    this.group.add(this.armClouds);
  }

  // 2. THANH CHẮN TRUNG TÂM MÀU ĐỒNG CỔ / HỔ PHÁCH TRẦM (Antique Bronze Bar)
  createAntiqueBronzeBar() {
    const count = 14000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Sắc màu vàng đồng cổ, hổ phách dịu trầm, không chói mắt
    const barColors = [
      new THREE.Color('#8a6525'), // Vàng đồng cổ
      new THREE.Color('#6e4f1a'), // Hổ phách trầm
      new THREE.Color('#9c7530'), // Cát vàng sẫm
      new THREE.Color('#583e12')  // Nâu đồng dịu
    ];

    const barAngle = Math.PI * 0.19;
    const cosBar = Math.cos(barAngle);
    const sinBar = Math.sin(barAngle);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const u = (Math.random() - 0.5) * 2;
      const v = (Math.random() - 0.5) * 2;
      const lx = u * 16.0 * Math.sqrt(Math.max(0, 1 - (v * v) / 1.4));
      const lz = v * 5.5 * Math.sqrt(Math.max(0, 1 - (u * u) / 1.4));

      positions[i3] = lx * cosBar - lz * sinBar;
      positions[i3 + 1] = (Math.random() - 0.5) * 2.2;
      positions[i3 + 2] = lx * sinBar + lz * cosBar;

      const c = barColors[Math.floor(Math.random() * barColors.length)];
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

          vAlpha = 0.28 + sin(uTime * 0.6 + dist * 0.15) * 0.03;
          gl_PointSize = aScale * (125.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);
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
    this.barClouds = new THREE.Points(geo, mat);
    this.group.add(this.barClouds);
  }

  // 3. MÀN SƯƠNG NỐI MỜ DỊU SÂU THẲM (Deep Space Inter-arm Haze)
  createDeepInterArmMist() {
    const count = 30000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const mistColors = [
      new THREE.Color('#1c2e47'),
      new THREE.Color('#152336'),
      new THREE.Color('#0f1b2b'),
      new THREE.Color('#223652')
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const r = 8 + Math.pow(Math.random(), 1.35) * 120;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (Math.random() - 0.5) * 3.4;
      positions[i3 + 2] = Math.sin(angle) * r;

      const c = mistColors[Math.floor(Math.random() * mistColors.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

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
          float orbitSpeed = uTime * uSpeed * 0.10 * (1.0 / (1.0 + dist * 0.012));

          float cosA = cos(orbitSpeed);
          float sinA = sin(orbitSpeed);
          vec3 rotatedPos = position;
          rotatedPos.x = position.x * cosA - position.z * sinA;
          rotatedPos.z = position.x * sinA + position.z * cosA;

          vec4 mvPos = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float fade = 1.0 - smoothstep(35.0, 125.0, dist);
          vAlpha = (0.15 + sin(uTime * 0.5 + dist * 0.08) * 0.02) * fade;

          gl_PointSize = aScale * (120.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);
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
          gl_FragColor = vec4(vColor * 0.35, strength * vAlpha);
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

  // 4. DẢI BỤI TỐI ĐEN TUYỀN VIỀN TRONG (Espresso Dust Filaments)
  createEspressoDustLanes() {
    const count = 18000;
    const radius = 110;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const dustPalette = [
      new THREE.Color('#1c0a02'),
      new THREE.Color('#2b1004'),
      new THREE.Color('#120501'),
      new THREE.Color('#20052c')
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

  // 5. ĐỐM HỒNG NGỌC HII TRẦM (Deep Ruby Nebulae)
  createDeepRubyHIINebulae() {
    const count = 1000;
    const radius = 105;
    const branches = 4;
    const spin = 1.65;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const redHues = [
      new THREE.Color('#801c32'),
      new THREE.Color('#6b1427'),
      new THREE.Color('#94243b'),
      new THREE.Color('#5c0f20')
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

          vAlpha = 0.32 + sin(uTime * 1.5 + dist * 0.3) * 0.08;
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
