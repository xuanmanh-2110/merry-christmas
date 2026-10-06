/**
 * CHRISTMAS WONDERLAND - MAIN INTRO & HUB CONTROLLER (app.js)
 * Manages Intro Steps (Nơ -> Gấu -> Mèo -> Hub 4 Lựa Chọn Quà Tặng),
 * Navigation to Dedicated Pages (photobooth.html, bouquet.html, game.html, thiep.html),
 * and Direct Deep-linking via ?step=hub.
 */

(function () {
  'use strict';

  // 1. SOUND SYSTEM & SHARED UTILS
  const shared = window.XMAS_SHARED || {};
  const getAudioContext = shared.getAudioContext || function () {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  };
  const playJingleBellSound = shared.playJingleBellSound || function () { };
  const playGiftChime = shared.playGiftChime || function () { };

  function playCatMeowSound() {
    // Sound disabled per user request
    return;
  }

  // 2. SANTA SLEIGH FLY-BY
  let santaTimer = null;
  function triggerSantaSleigh() {
    const santaEl = document.getElementById('santa-sleigh');
    if (!santaEl) return;
    santaEl.classList.remove('active');
    void santaEl.offsetWidth; // force reflow
    santaEl.classList.add('active');
  }

  function initSantaScheduler() {
    const santaEl = document.getElementById('santa-sleigh');
    if (!santaEl) return;
    triggerSantaSleigh();
    santaTimer = setInterval(() => {
      triggerSantaSleigh();
    }, 28000);
  }

  // 3. INTRO STEPS & HUB NAVIGATION
  function initIntroFlow() {
    const introOverlay = document.getElementById('intro-overlay');
    if (!introOverlay) return;

    const step1 = document.getElementById('intro-step-1');
    const step2 = document.getElementById('intro-step-2');
    const step3 = document.getElementById('intro-step-3');
    const step4 = document.getElementById('intro-step-4');

    const btnClickHere = document.getElementById('btn-intro-click-here');
    const btnYes = document.getElementById('btn-intro-yes');
    const btnNo = document.getElementById('btn-intro-no');
    const btnTryAgain = document.getElementById('btn-intro-try-again');

    function switchStep(fromStep, toStep) {
      if (!fromStep || !toStep) return;

      fromStep.classList.remove('active');
      fromStep.classList.add('leaving');

      setTimeout(() => {
        fromStep.classList.remove('leaving');
        toStep.classList.add('active');
      }, 260);
    }

    // CHECK URL PARAMETER: ?step=hub or #hub
    const urlParams = new URLSearchParams(window.location.search);
    const isReturningToHub = urlParams.get('step') === 'hub' || window.location.hash === '#hub';

    if (isReturningToHub) {
      // Nhảy thẳng vào Bước 4 Hub nếu quay lại từ các trang riêng
      if (step1) step1.classList.remove('active');
      if (step2) step2.classList.remove('active');
      if (step3) step3.classList.remove('active');
      if (step4) step4.classList.add('active');
      introOverlay.style.display = 'flex';
      introOverlay.style.opacity = '1';
      introOverlay.style.pointerEvents = 'auto';
    }

    // 1. Nhấp "CLICK HERE" ở Bước 1 (Nơ Noel) -> Sang Bước 2 (Gấu Noel)
    if (btnClickHere) {
      btnClickHere.addEventListener('click', (e) => {
        e.stopPropagation();
        playJingleBellSound(1567.98);
        switchStep(step1, step2);
      });
    }

    // 2. Nhấp "NO, I NEED MORE HINTS" ở Bước 2 -> Sang Bước 3 (Mèo nài nỉ)
    if (btnNo) {
      btnNo.addEventListener('click', (e) => {
        e.stopPropagation();
        playCatMeowSound();
        switchStep(step2, step3);
      });
    }

    // 3. Nhấp "TRY AGAIN" ở Bước 3 -> Quay lại Bước 2 (Gấu Noel)
    if (btnTryAgain) {
      btnTryAgain.addEventListener('click', (e) => {
        e.stopPropagation();
        playJingleBellSound(1318.51);
        switchStep(step3, step2);
      });
    }

    // 4. Nhấp "YES I AM" ở Bước 2 -> Chuyển sang Bước 4 (Hub 4 Sự Lựa Chọn Quà Tặng)
    if (btnYes) {
      btnYes.addEventListener('click', (e) => {
        e.stopPropagation();
        playGiftChime();

        if (typeof confetti === 'function') {
          confetti({
            particleCount: 75,
            spread: 75,
            origin: { y: 0.55 },
            colors: ['#ef4444', '#f59e0b', '#10b981', '#fcd34d', '#ffffff']
          });
        }

        switchStep(step2, step4);
      });
    }

    // Âm thanh tương tác khi bấm vào 4 ô quà tặng
    const hubPhotobooth = document.getElementById('hub-opt-photobooth');
    const hubBouquet = document.getElementById('hub-opt-bouquet');
    const hubGame = document.getElementById('hub-opt-game');
    const hubLetter = document.getElementById('hub-opt-letter');

    if (hubPhotobooth) {
      hubPhotobooth.addEventListener('click', () => {
        playJingleBellSound(1567.98);
      });
    }

    if (hubBouquet) {
      hubBouquet.addEventListener('click', () => {
        playGiftChime();
      });
    }

    if (hubGame) {
      hubGame.addEventListener('click', () => {
        playJingleBellSound(1318.51);
      });
    }

    if (hubLetter) {
      hubLetter.addEventListener('click', () => {
        playGiftChime();
      });
    }
  }

  // 4. INITIALIZE
  document.addEventListener('DOMContentLoaded', () => {
    initSantaScheduler();
    initIntroFlow();

    // Khởi tạo AudioContext khi tương tác lần đầu
    document.body.addEventListener('click', () => {
      getAudioContext();
    }, { once: true });
  });

})();
