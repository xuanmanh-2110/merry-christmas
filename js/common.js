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
