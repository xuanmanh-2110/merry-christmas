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
   * SNOW ENGINE (Canvas 60fps)
   * -------------------------------------------------------------------------- */
  class SnowEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.flakes = [];
      this.flakeCount = window.innerWidth < 480 ? 55 : (window.innerWidth < 768 ? 85 : 140);
      this.isRunning = true;
      this.rafId = null;
      this.wind = 0;
      this.windTarget = 0;

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      for (let i = 0; i < this.flakeCount; i++) {
        this.flakes.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 2.8 + 0.8,
          density: Math.random() * this.flakeCount,
          opacity: Math.random() * 0.7 + 0.3,
          speedY: Math.random() * 1.6 + 0.7,
          swingSpeed: Math.random() * 0.02 + 0.01,
          swingAngle: Math.random() * Math.PI * 2
        });
      }

      setInterval(() => {
        this.windTarget = (Math.random() - 0.5) * 1.2;
      }, 3500);

      this.loop = this.loop.bind(this);
      this.loop();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    loop() {
      if (!this.isRunning || !this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.wind += (this.windTarget - this.wind) * 0.02;

      this.ctx.fillStyle = '#ffffff';
      for (let i = 0; i < this.flakes.length; i++) {
        const f = this.flakes[i];
        f.swingAngle += f.swingSpeed;
        const swingX = Math.sin(f.swingAngle) * 0.8;

        f.y += f.speedY;
        f.x += this.wind + swingX;

        if (f.y > this.canvas.height + 5) {
          f.y = -5;
          f.x = Math.random() * this.canvas.width;
        }
        if (f.x > this.canvas.width + 5) f.x = -5;
        else if (f.x < -5) f.x = this.canvas.width + 5;

        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        this.ctx.fill();
      }

      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  window.XMAS_SHARED.SnowEngine = SnowEngine;

  /* --------------------------------------------------------------------------
   * MAGIC TRAIL ENGINE (Bụi sao thần tiên theo con trỏ chuột / cảm ứng)
   * -------------------------------------------------------------------------- */
  class MagicTrailEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.sparks = [];
      this.isRunning = true;
      this.isLooping = false;

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      const addPointer = (x, y) => {
        for (let i = 0; i < 2; i++) {
          this.sparks.push({
            x: x + (Math.random() - 0.5) * 14,
            y: y + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            size: Math.random() * 3.5 + 1.2,
            opacity: 1,
            color: ['#fef08a', '#ffd700', '#ffffff', '#fbcfe8'][Math.floor(Math.random() * 4)],
            life: 1
          });
        }
        if (!this.isLooping && this.isRunning) {
          this.isLooping = true;
          this.loop();
        }
      };

      window.addEventListener('pointermove', (e) => addPointer(e.clientX, e.clientY), { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          addPointer(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      this.loop = this.loop.bind(this);
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    loop() {
      if (!this.isRunning || !this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.sparks.length === 0) {
        this.isLooping = false;
        return;
      }

      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.035;
        s.size *= 0.96;

        if (s.life <= 0 || s.size <= 0.4) {
          this.sparks.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, s.life);
        this.ctx.fillStyle = s.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = s.color;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      requestAnimationFrame(this.loop);
    }
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
