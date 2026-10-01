/**
 * とにーの じこしょうかい - すくりぷと (script.js)
 * にほんの びと みにまるな でざいん
 */

(function () {
  'use strict';

  // 要素の取得
  const scrollContainer = document.getElementById('scroll-container');
  const scenes = document.querySelectorAll('.scene');
  const navDots = document.querySelectorAll('.nav-item');
  const navProgressBar = document.getElementById('nav-progress-bar');
  const scrollHint = document.getElementById('scroll-hint');
  const restartBtn = document.getElementById('restart-btn');
  const soundBtn = document.getElementById('sound-btn');
  const soundLabel = document.getElementById('sound-label');
  const orbitalDotsGroup = document.getElementById('orbital-dots-group');

  let currentSceneIndex = 0;
  let isSoundEnabled = false;
  let audioCtx = null;
  let hasScrolledOnce = false;

  // ========================================================
  // 1. さくらのはなびら きゃんばす (Sakura Petals Particle Engine)
  // ========================================================
  const canvas = document.getElementById('sakura-canvas');
  const ctx = canvas.getContext('2d');
  let petals = [];
  const PETAL_COUNT = 38;
  const FINALE_PETAL_COUNT = 80;
  let targetPetalCount = PETAL_COUNT;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -30;
      this.size = 10 + Math.random() * 14;
      this.speedX = -0.5 + Math.random() * 1.5;
      this.speedY = 1.0 + Math.random() * 1.8;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.035;
      this.flip = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.015 + Math.random() * 0.03;
      this.opacity = 0.4 + Math.random() * 0.45;
      this.color = Math.random() > 0.35 ? '#f4acb7' : '#f7cad0';
    }

    update() {
      this.x += this.speedX + Math.sin(this.flip) * 0.8;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      this.flip += this.flipSpeed;

      if (this.y > canvas.height + 40 || this.x > canvas.width + 40 || this.x < -40) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(Math.cos(this.flip), 1);
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;

      // 桜の花びらの曲線
      const s = this.size;
      ctx.moveTo(0, -s * 0.7);
      ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.7, s * 0.3, 0, s);
      ctx.bezierCurveTo(-s * 0.7, s * 0.3, -s * 0.5, -s * 0.7, 0, -s * 0.7);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new Petal());
  }

  function animateSakura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 花びら数の動的調整 (フィナーレシーンでの桜吹雪)
    if (petals.length < targetPetalCount) {
      petals.push(new Petal());
    } else if (petals.length > targetPetalCount) {
      petals.pop();
    }

    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(animateSakura);
  }
  animateSakura();

  // ========================================================
  // 2. 28さいの きらめく 28この ひかり (Scene 04 Orbital Dots)
  // ========================================================
  if (orbitalDotsGroup) {
    const totalDots = 28;
    const radius = 230;
    const centerX = 400;
    const centerY = 300;

    for (let i = 0; i < totalDots; i++) {
      const angle = (i / totalDots) * (Math.PI * 2);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toFixed(2));
      circle.setAttribute('cy', y.toFixed(2));
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#c53d33');
      circle.setAttribute('opacity', '0.45');
      orbitalDotsGroup.appendChild(circle);
    }
  }

  // ========================================================
  // 3. なびげーしょん & すくろーる かんし (Intersection Observer)
  // ========================================================
  const observerOptions = {
    root: scrollContainer,
    threshold: 0.55
  };

  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sceneIndex = parseInt(entry.target.getAttribute('data-scene'), 10) - 1;
        setActiveScene(sceneIndex);
      }
    });
  }, observerOptions);

  scenes.forEach((scene) => sceneObserver.observe(scene));

  function setActiveScene(index) {
    if (currentSceneIndex !== index && isSoundEnabled) {
      playZenChime(index);
    }
    currentSceneIndex = index;

    // 各シーンのアクティブクラス切り替え
    scenes.forEach((sc, idx) => {
      if (idx === index) {
        sc.classList.add('active');
      } else {
        sc.classList.remove('active');
      }
    });

    // 右側ナビゲーションのドット切り替え
    navDots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // プログレスバーの更新
    const progress = (index / (scenes.length - 1)) * 100;
    if (navProgressBar) {
      navProgressBar.style.height = `${progress}%`;
    }

    // スクロール案内の非表示
    if (index > 0 && scrollHint) {
      scrollHint.classList.add('hidden');
    }

    // 最終シーンでは桜吹雪を増量
    if (index === 12) {
      targetPetalCount = FINALE_PETAL_COUNT;
    } else {
      targetPetalCount = PETAL_COUNT;
    }
  }

  // ナビゲーションクリックで該当シーンへスムーズ移動
  navDots.forEach((item) => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-index'), 10);
      scenes[idx].scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 初めへ戻るボタン
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      scenes[0].scrollIntoView({ behavior: 'smooth' });
    });
  }

  // スクロール開始の検知
  scrollContainer.addEventListener('scroll', () => {
    if (!hasScrolledOnce) {
      hasScrolledOnce = true;
      if (scrollHint) {
        scrollHint.classList.add('hidden');
      }
    }
  }, { passive: true });

  // ========================================================
  // 4. きーぼーど そうさ (Keyboard Navigation)
  // ========================================================
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (currentSceneIndex < scenes.length - 1) {
        scenes[currentSceneIndex + 1].scrollIntoView({ behavior: 'smooth' });
      }
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (currentSceneIndex > 0) {
        scenes[currentSceneIndex - 1].scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      scenes[0].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      scenes[scenes.length - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ========================================================
  // 5. たっち・すわいぷ そうさ (Mobile Touch Swipe)
  // ========================================================
  let touchStartY = 0;
  let touchEndY = 0;

  scrollContainer.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  scrollContainer.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diff = touchStartY - touchEndY;
    const threshold = 60;

    if (diff > threshold && currentSceneIndex < scenes.length - 1) {
      // 下へスワイプ (次のシーン)
      scenes[currentSceneIndex + 1].scrollIntoView({ behavior: 'smooth' });
    } else if (diff < -threshold && currentSceneIndex > 0) {
      // 上へスワイプ (前のシーン)
      scenes[currentSceneIndex - 1].scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ========================================================
  // 6. わふうの ねいろ (Web Audio API Synthesizer)
  // ========================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 和風の五音階 (Yo scale: D, F, G, A, C)
  const yoNotes = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46];

  function playZenChime(sceneIndex = 0) {
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const note = yoNotes[sceneIndex % yoNotes.length];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      // 優しい音の減衰 (水滴・風鈴のような響き)
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch (e) {
      // 静かに無視
    }
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      initAudio();
      isSoundEnabled = !isSoundEnabled;

      if (isSoundEnabled) {
        soundBtn.classList.add('active');
        soundLabel.textContent = 'おと：おん';
        playZenChime(currentSceneIndex);
      } else {
        soundBtn.classList.remove('active');
        soundLabel.textContent = 'おと：おふ';
      }
    });
  }

  // 初回ロード時の初期化
  setActiveScene(0);

})();
