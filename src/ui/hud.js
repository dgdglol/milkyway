import { spaceAudio } from '../audio/spaceAudio.js';

export function setupHUD({
  galaxy,
  dust,
  blackHole,
  lightPillar,
  landmarks,
  controls,
  composer,
  renderer,
  scene,
  camera
}) {
  // Elements
  const audioBtn = document.getElementById('btn-audio');
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const screenshotBtn = document.getElementById('btn-screenshot');
  const infoBtn = document.getElementById('btn-info');
  const closeInfoBtn = document.getElementById('btn-close-info');
  const infoModal = document.getElementById('info-modal');
  const tourBtn = document.getElementById('btn-tour');
  const tourToast = document.getElementById('tour-toast');
  const tourStepText = document.getElementById('tour-step-text');

  // Sliders & Controls
  const speedSlider = document.getElementById('slider-speed');
  const speedVal = document.getElementById('val-speed');
  const bloomSlider = document.getElementById('slider-bloom');
  const bloomVal = document.getElementById('val-bloom');
  const themeSelect = document.getElementById('select-theme');

  // Checkboxes
  const checkDust = document.getElementById('check-dust');
  const checkLabels = document.getElementById('check-labels');
  const checkJets = document.getElementById('check-jets');
  const checkPillar = document.getElementById('check-pillar');

  // Preset buttons
  const presetButtons = document.querySelectorAll('[data-preset]');
  const starButtons = document.querySelectorAll('[data-stars]');

  // Audio Toggle
  audioBtn.addEventListener('click', () => {
    const isPlaying = spaceAudio.toggle();
    audioBtn.classList.toggle('active', isPlaying);
    audioBtn.innerHTML = isPlaying
      ? `<span class="icon">🔊</span><span>Âm thanh: BẬT</span>`
      : `<span class="icon">🔇</span><span>Âm thanh: TẮT</span>`;
  });

  // Fullscreen Toggle
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(err);
      });
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.innerHTML = document.fullscreenElement
      ? `<span class="icon">🗗</span>`
      : `<span class="icon">⛶</span>`;
  });

  // Preset Navigation Buttons
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const presetName = btn.getAttribute('data-preset');
      controls.goToPreset(presetName);
      tourBtn.classList.remove('active');
      tourBtn.innerHTML = `<span class="icon">🛸</span><span>Cinematic Tour</span>`;
      tourToast.classList.remove('active');
    });
  });

  // Cinematic Tour Button
  tourBtn.addEventListener('click', () => {
    if (controls.isTouring()) {
      controls.stopTour();
      tourBtn.classList.remove('active');
      tourBtn.innerHTML = `<span class="icon">🛸</span><span>Cinematic Tour</span>`;
      tourToast.classList.remove('active');
    } else {
      tourBtn.classList.add('active');
      tourBtn.innerHTML = `<span class="icon">⏹</span><span>Dừng Tour</span>`;
      tourToast.classList.add('active');
      controls.startTour((stepName, stepNum, total) => {
        tourStepText.innerText = `[${stepNum}/${total}] ${stepName}`;
      });
    }
  });

  window.addEventListener('tour-stopped', () => {
    tourBtn.classList.remove('active');
    tourBtn.innerHTML = `<span class="icon">🛸</span><span>Cinematic Tour</span>`;
    tourToast.classList.remove('active');
  });

  // Color Theme Selector
  themeSelect.addEventListener('change', (e) => {
    const themeKey = e.target.value;
    galaxy.setTheme(themeKey);
    dust.setTheme(themeKey);
    spaceAudio.playPingSound(880, 0.4);
  });

  // Rotation Speed Slider
  speedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    speedVal.innerText = `${val.toFixed(2)}x`;
    galaxy.setSpeed(val);
    dust.setSpeed(val);
  });

  // Bloom Glow Slider
  bloomSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    bloomVal.innerText = val.toFixed(1);
    composer.setBloomStrength(val);
  });

  // Star Count Selection
  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      starButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const count = parseInt(btn.getAttribute('data-stars'), 10);
      galaxy.setStarCount(count);
      document.getElementById('stat-stars').innerText = count.toLocaleString('vi-VN');
      spaceAudio.playPingSound(1040, 0.3);
    });
  });

  // Toggles
  checkDust.addEventListener('change', (e) => {
    dust.toggle(e.target.checked);
  });

  checkLabels.addEventListener('change', (e) => {
    landmarks.toggle(e.target.checked);
  });

  checkJets.addEventListener('change', (e) => {
    blackHole.toggleJets(e.target.checked);
  });

  if (checkPillar && lightPillar) {
    checkPillar.addEventListener('change', (e) => {
      lightPillar.toggle(e.target.checked);
    });
  }

  // Screenshot Capture Button
  screenshotBtn.addEventListener('click', () => {
    spaceAudio.playPingSound(1200, 0.5);
    // Render high quality frame
    composer.composer.render();
    const dataURL = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `MilkyWay-Cosmos-${Date.now()}.png`;
    a.click();
  });

  // Info Modal
  infoBtn.addEventListener('click', () => {
    infoModal.classList.add('open');
  });
  closeInfoBtn.addEventListener('click', () => {
    infoModal.classList.remove('open');
  });
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
      infoModal.classList.remove('open');
    }
  });

  // Toggle Controls Drawer on Mobile/Desktop
  const togglePanelBtn = document.getElementById('btn-toggle-panel');
  const controlPanel = document.getElementById('control-panel');
  if (togglePanelBtn && controlPanel) {
    togglePanelBtn.addEventListener('click', () => {
      controlPanel.classList.toggle('collapsed');
      togglePanelBtn.innerHTML = controlPanel.classList.contains('collapsed')
        ? '⚙️ Bảng Điều Khiển'
        : '✕ Thu gọn';
    });
  }
}
