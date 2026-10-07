/**
 * CHRISTMAS WONDERLAND - COMMON UTILITIES & ENGINES
 * Shared Snow Engine, Magic Trail, and Sound Synthesizer across all pages
 */

(function () {
  'use strict';

  window.XMAS_SHARED = window.XMAS_SHARED || {};

  // Audio Context State
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.XMAS_SHARED.getAudioContext = getAudioContext;

  // Jingle Bell Sound (Đã tắt tiếng âm thanh click theo yêu cầu người dùng)
  function playJingleBellSound(baseFreq) {
    // Sound disabled per user request
    return;
  }

  window.XMAS_SHARED.playJingleBellSound = playJingleBellSound;

  // Sparkling Gift Chime (Đã tắt tiếng âm thanh click theo yêu cầu người dùng)
  function playGiftChime() {
    // Sound disabled per user request
    return;
  }

  window.XMAS_SHARED.playGiftChime = playGiftChime;

  /* --------------------------------------------------------------------------
   * SNOW ENGINE (Tối ưu hóa: Throttling FPS trên mobile, gom nhóm batch draw, tạm dừng khi ẩn)
   * -------------------------------------------------------------------------- */
  class SnowEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.flakes = [];
      const isMobile = window.innerWidth < 768;
      this.isMobile = isMobile;
      // Tối ưu RAM & CPU trên điện thoại: Giảm mật độ hạt xuống mức vừa đủ đẹp, siêu mượt
      this.flakeCount = window.innerWidth < 480 ? 18 : (isMobile ? 24 : 60);
      this.isRunning = true;
      this.rafId = null;
      this.wind = 0;
      this.windTarget = 0;
      // Khống chế FPS: 30 FPS trên mobile (tiết kiệm GPU/pin tối đa), 60 FPS trên desktop
      this.targetInterval = isMobile ? 1000 / 30 : 1000 / 60;
      this.lastTime = 0;

      this.init();
    }

    init() {
      this.resize();
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.resize(), 150);
      }, { passive: true });

      // Tạm dừng chạy canvas khi người dùng tắt màn hình, chuyển tab hoặc ẩn ứng dụng
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isRunning = false;
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        } else {
          this.isRunning = true;
          this.lastTime = performance.now();
          this.loop(this.lastTime);
        }
      });

      // Phân bổ các hạt tuyết vào 3 nhóm độ mờ (opacity) để gom nhóm vẽ 1 lần (batch drawing)
      const opacityTiers = [0.4, 0.7, 0.95];
      for (let i = 0; i < this.flakeCount; i++) {
        const tier = opacityTiers[i % 3];
        this.flakes.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 2.4 + 0.8,
          opacity: tier,
          tierIndex: i % 3,
          speedY: Math.random() * 1.4 + 0.6,
          swingSpeed: Math.random() * 0.02 + 0.01,
          swingAngle: Math.random() * Math.PI * 2
        });
      }

      setInterval(() => {
        if (this.isRunning) {
          this.windTarget = (Math.random() - 0.5) * 1.0;
        }
      }, 4000);

      this.loop = this.loop.bind(this);
      this.rafId = requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    loop(currentTime = performance.now()) {
      if (!this.isRunning || !this.ctx) return;

      const elapsed = currentTime - this.lastTime;
      if (elapsed < this.targetInterval) {
        this.rafId = requestAnimationFrame(this.loop);
        return;
      }
      this.lastTime = currentTime - (elapsed % this.targetInterval);

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.wind += (this.windTarget - this.wind) * 0.02;

      // Nhóm các hạt vào 3 mảng để vẽ trong 3 lần gọi path duy nhất thay vì 50+ lần
      const groups = [[], [], []];
      const W = this.canvas.width;
      const H = this.canvas.height;

      for (let i = 0; i < this.flakes.length; i++) {
        const f = this.flakes[i];
        f.swingAngle += f.swingSpeed;
        const swingX = Math.sin(f.swingAngle) * 0.7;

        f.y += f.speedY;
        f.x += this.wind + swingX;

        if (f.y > H + 5) {
          f.y = -5;
          f.x = Math.random() * W;
        }
        if (f.x > W + 5) f.x = -5;
        else if (f.x < -5) f.x = W + 5;

        groups[f.tierIndex].push(f);
      }

      // Batch render 3 mức mờ
      const styles = ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.95)'];
      for (let g = 0; g < 3; g++) {
        const list = groups[g];
        if (list.length === 0) continue;
        this.ctx.fillStyle = styles[g];
        this.ctx.beginPath();
        for (let j = 0; j < list.length; j++) {
          const f = list[j];
          this.ctx.moveTo(f.x + f.radius, f.y);
          this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        }
        this.ctx.fill();
      }

      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  window.XMAS_SHARED.SnowEngine = SnowEngine;

  /* --------------------------------------------------------------------------
   * MAGIC TRAIL ENGINE (Bụi sao thần tiên - Đã tắt theo yêu cầu người dùng)
   * -------------------------------------------------------------------------- */
  class MagicTrailEngine {
    constructor() {
      // Disabled per user request
    }
    init() {}
    loop() {}
  }

  window.XMAS_SHARED.MagicTrailEngine = MagicTrailEngine;

  // Auto initialize Canvas effects on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('snow-canvas')) {
      new SnowEngine('snow-canvas');
    }
    if (document.getElementById('magic-trail-canvas')) {
      new MagicTrailEngine('magic-trail-canvas');
    }

    document.body.addEventListener('click', () => {
      getAudioContext();
    }, { once: true });
  });

})();
