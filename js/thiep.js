/**
 * THIỆP GIÁNG SINH - JAVASCRIPT CONTROLLER (thiep.js)
 * Manages 3D Envelope, Greeting Card, Last Christmas BGM, Interactive Tree,
 * Fortune Gift Boxes, Snowman, Lantern, and Weather.
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

  function playCrackSound() {
    // Sound disabled per user request
    return;
  }

  function playSnowmanSound() {
    // Sound disabled per user request
    return;
  }

  function playLanternChime() {
    // Sound disabled per user request
    return;
  }

  // Âm gõ bàn phím / máy tính nhẹ nhàng cho hiệu ứng Typewriter
  function playKeySound() {
    // Sound disabled per user request
    return;
  }

  // 2. BACKGROUND MUSIC & SYNTH FALLBACK
  const bgmAudio = document.getElementById('bgm-audio');
  let isMusicPlaying = false;

  const MUSIC_BOX = {
    timerId: null,
    stepIndex: 0,
    melody: [
      [587.33, 1.5], [587.33, 0.5], [493.88, 1], [440.00, 1], [369.99, 1], [440.00, 1], [587.33, 2],
      [587.33, 1], [587.33, 0.5], [659.25, 0.5], [659.25, 1], [587.33, 1], [554.37, 1], [493.88, 1], [440.00, 2],
      [739.99, 1.5], [739.99, 0.5], [659.25, 1], [587.33, 1], [493.88, 1], [587.33, 1], [659.25, 2],
      [659.25, 0.5], [739.99, 0.5], [659.25, 1], [587.33, 1], [493.88, 1], [440.00, 1], [587.33, 2.5],
      [739.99, 0.5], [880.00, 0.5], [739.99, 1], [587.33, 1], [493.88, 1.5],
      [659.25, 0.5], [739.99, 0.5], [659.25, 1], [554.37, 1], [440.00, 2],
      [0, 1]
    ],
    tempo: 165,

    playNote(freq, durationMs) {
      if (!freq || freq <= 0) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000) * 0.95);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationMs / 1000);
    },

    step() {
      const [freq, beats] = this.melody[this.stepIndex];
      const beatMs = 60000 / this.tempo;
      const durationMs = beats * beatMs;
      this.playNote(freq, durationMs);
      this.stepIndex = (this.stepIndex + 1) % this.melody.length;
      this.timerId = setTimeout(() => this.step(), durationMs);
    },

    start() {
      this.stop();
      this.stepIndex = 0;
      this.step();
    },

    stop() {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }
  };

  function playChristmasMusic() {
    if (isMusicPlaying) return;
    isMusicPlaying = true;

    if (bgmAudio) {
      bgmAudio.currentTime = 0;
      bgmAudio.volume = 0.85;
      const playPromise = bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to synth if audio fails
          MUSIC_BOX.start();
        });
      }
    } else {
      MUSIC_BOX.start();
    }
  }

  function pauseChristmasMusic() {
    isMusicPlaying = false;
    if (bgmAudio) {
      bgmAudio.pause();
    }
    MUSIC_BOX.stop();
  }

  function stopChristmasMusic() {
    isMusicPlaying = false;
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    }
    MUSIC_BOX.stop();
  }

  // 3. SANTA SLEIGH FLY-BY
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
    }, 35000);
  }

  // 4. CONFETTI BURST
  function fireChristmasConfetti() {
    if (typeof confetti !== 'function') return;
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ffffff']
    });
  }

  // 5. ENVELOPE & GREETING CARD INTERACTION
  const envelopeBox = document.getElementById('envelope-box');
  const waxSeal = document.getElementById('wax-seal');
  const cardWrapper = document.getElementById('card-wrapper');
  const bottomActionBar = document.getElementById('bottom-action-bar');
  const envelopeNavBar = document.getElementById('envelope-nav-bar');
  const openHintBadge = document.getElementById('open-hint-badge');
  const btnFoldCard = document.getElementById('btn-fold-card');
  const btnDownloadCard = document.getElementById('btn-download-card');

  let isCardOpened = false;

  // Tải sẵn nội dung embedded-fonts.css để nhúng trực tiếp dạng inline style vào clone khi html2canvas xuất ảnh
  let cachedEmbeddedFontsCss = '';
  try {
    fetch('css/embedded-fonts.css?v=10.0')
      .then(r => r.text())
      .then(t => { cachedEmbeddedFontsCss = t; })
      .catch(() => {});
  } catch (_) {}

  function openEnvelope() {
    if (isCardOpened) return;
    isCardOpened = true;

    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    // Đảm bảo toàn bộ chữ cái ở trạng thái ẩn sẵn sàng (is-untyped) ngay từ đầu
    // Khung thư giữ nguyên 100% kích thước, không bị chớp hiện chữ trước
    stopTypewriter(false);

    playCrackSound();
    playGiftChime();

    // Bước 1: vỡ con dấu sáp + lật nắp phong bì
    if (waxSeal) waxSeal.classList.add('shatter');
    if (envelopeBox) envelopeBox.classList.add('is-opened');
    if (openHintBadge) openHintBadge.style.display = 'none';
    if (envelopeNavBar) {
      envelopeNavBar.style.opacity = '0';
      envelopeNavBar.style.pointerEvents = 'none';
      setTimeout(() => {
        envelopeNavBar.style.display = 'none';
      }, 350);
    }

    // Bước 2: phong bì trượt xuống & mờ dần
    setTimeout(() => {
      if (envelopeBox) envelopeBox.classList.add('is-leaving');
    }, 900);

    // Bước 3: ẩn phong bì + hiện thư cùng lúc (không bị giật layout)
    setTimeout(() => {
      if (envelopeBox) envelopeBox.classList.add('is-folded-away');
      if (cardWrapper) cardWrapper.classList.add('full-view');
      document.body.classList.add('card-opened-mode');
      document.documentElement.classList.add('card-opened-mode');

      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainEl) mainEl.scrollTop = 0;
      if (bottomActionBar) bottomActionBar.classList.remove('hidden');
      fireChristmasConfetti();
      playChristmasMusic();
      // Bắt đầu hiệu ứng gõ chữ ngay khi lá thư bắt đầu trồi lên
      setTimeout(() => {
        startTypewriter();
      }, 250);
    }, 1350);
  }

  let isFolding = false;

  function foldCardBack() {
    if (!isCardOpened || isFolding) return;
    isFolding = true;
    stopTypewriter(false);

    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    playGiftChime();
    stopChristmasMusic();
    if (bottomActionBar) bottomActionBar.classList.add('hidden');

    // Bước 1: thư chìm xuống & mờ dần
    if (cardWrapper) cardWrapper.classList.add('is-folding');

    // Bước 2: ẩn thư, phong bì (đang mở) hiện lại cùng lúc
    setTimeout(() => {
      if (cardWrapper) cardWrapper.classList.remove('full-view', 'is-folding');
      if (envelopeBox) {
        envelopeBox.classList.remove('is-folded-away', 'is-leaving');
        envelopeBox.classList.add('is-returning');
      }

      // Chỉ gỡ bỏ chế độ xem thư khi thư đã gập xong hoàn toàn
      document.body.classList.remove('card-opened-mode');
      document.documentElement.classList.remove('card-opened-mode');
    }, 500);

    // Bước 3: nắp phong bì gập lại + con dấu sáp hiện ra + nút & hint badge hiện đồng bộ
    setTimeout(() => {
      if (envelopeBox) envelopeBox.classList.remove('is-opened');
      if (waxSeal) waxSeal.classList.remove('shatter');
      if (openHintBadge) openHintBadge.style.display = '';
      if (envelopeNavBar) {
        envelopeNavBar.style.display = 'flex';
        envelopeNavBar.style.pointerEvents = 'auto';
        void envelopeNavBar.offsetWidth;
        envelopeNavBar.style.opacity = '1';
      }
    }, 1100);

    // Bước 4: hoàn tất, trả về trạng thái ban đầu
    setTimeout(() => {
      if (envelopeBox) envelopeBox.classList.remove('is-returning');
      isCardOpened = false;
      isFolding = false;
    }, 1500);
  }

  // 5b. TYPEWRITER EFFECT CONTROLLER (Giữ nguyên kích thước khung thư 100%, gõ từng chữ mượt mà)
  let typewriterTimer = null;
  let isTyping = false;
  let typewriterCursor = null;

  function getTypewriterCursor() {
    if (!typewriterCursor || !typewriterCursor.isConnected) {
      typewriterCursor = document.createElement('span');
      typewriterCursor.className = 'typewriter-cursor';
      typewriterCursor.setAttribute('aria-hidden', 'true');
    }
    return typewriterCursor;
  }

  function initTypewriterDom() {
    if (typewriterTimer) {
      clearTimeout(typewriterTimer);
      typewriterTimer = null;
    }
    isTyping = false;
    const cursor = getTypewriterCursor();
    if (cursor.isConnected) cursor.remove();

    const bodyParagraphIds = Array.from(document.querySelectorAll('.letter-body p'))
      .map(p => p.id)
      .filter(Boolean);

    const sections = [
      'card-recipient-name',
      ...(bodyParagraphIds.length > 0 ? bodyParagraphIds : [
        'card-message-text',
        'card-message-text-p3',
        'card-message-text-p4'
      ]),
      'card-sender-name'
    ];

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      // Lưu trữ văn bản gốc thuần túy
      let rawText = el.getAttribute('data-raw-text');
      if (!rawText) {
        rawText = el.textContent.trim();
        el.setAttribute('data-raw-text', rawText);
      }

      el.innerHTML = '';
      for (let i = 0; i < rawText.length; i++) {
        const span = document.createElement('span');
        span.className = 'tw-char is-untyped';
        span.textContent = rawText[i];
        el.appendChild(span);
      }
    });
  }

  function stopTypewriter(showFull = true) {
    if (typewriterTimer) {
      clearTimeout(typewriterTimer);
      typewriterTimer = null;
    }
    isTyping = false;
    const cursor = getTypewriterCursor();
    if (cursor.isConnected) cursor.remove();

    const allSpans = document.querySelectorAll('.tw-char');
    if (allSpans.length === 0) return;

    if (showFull) {
      allSpans.forEach(span => {
        span.classList.remove('is-untyped');
        span.classList.add('is-typed');
      });
    } else {
      allSpans.forEach(span => {
        span.classList.remove('is-typed');
        span.classList.add('is-untyped');
      });
    }
  }

  function startTypewriter() {
    stopTypewriter(false);
    isTyping = true;

    // Đảm bảo DOM đã được chia thành các thẻ tw-char
    let allSpans = document.querySelectorAll('.tw-char');
    if (allSpans.length === 0) {
      initTypewriterDom();
      allSpans = document.querySelectorAll('.tw-char');
    }

    const cursor = getTypewriterCursor();
    const recipientEl = document.getElementById('card-recipient-name');
    if (recipientEl && recipientEl.firstChild) {
      recipientEl.insertBefore(cursor, recipientEl.firstChild);
    }

    const spanList = Array.from(allSpans);
    let index = 0;

    function typeNext() {
      if (!isTyping) return;
      if (index >= spanList.length) {
        isTyping = false;
        // Giữ con trỏ nhấp nháy 1.5s ở cuối chữ ký rồi ẩn nhẹ
        setTimeout(() => {
          if (!isTyping && cursor.isConnected) cursor.remove();
        }, 1500);
        return;
      }

      const currentSpan = spanList[index];
      currentSpan.classList.remove('is-untyped');
      currentSpan.classList.add('is-typed');
      currentSpan.after(cursor);

      const ch = currentSpan.textContent;
      if (ch !== ' ' && ch !== '\n') {
        playKeySound();
      }

      // Xác định tốc độ gõ tùy theo phần tử và dấu câu
      const parentId = currentSpan.parentElement?.id;
      const isHeading = parentId === 'card-recipient-name' || parentId === 'card-sender-name';
      let delay = (isHeading ? 42 : 18) + Math.floor(Math.random() * 8);

      if (ch === '.' || ch === '!' || ch === '?') {
        delay += 140;
      } else if (ch === ',' || ch === ';') {
        delay += 70;
      }

      // Dừng nghỉ tự nhiên giữa các đoạn
      const isLastInParent = currentSpan === currentSpan.parentElement?.lastElementChild;
      if (isLastInParent && index < spanList.length - 1) {
        delay += parentId === 'card-recipient-name' ? 240 : 280;
      }

      index++;
      typewriterTimer = setTimeout(typeNext, delay);
    }

    typeNext();
  }

  // 6. INTERACTIVE CHRISTMAS TREE (Color Palettes)
  const treeContainer = document.getElementById('interactive-tree');
  const TREE_PALETTES = [
    { name: 'Vàng Kim & Đỏ Thắm', baubles: '#ffd700', bulbs: '#ffffff', glow: 'rgba(255, 215, 0, 0.7)' },
    { name: 'Băng Tuyết Mùa Đông', baubles: '#38bdf8', bulbs: '#e0f2fe', glow: 'rgba(56, 189, 248, 0.8)' },
    { name: 'Xanh Lục Hoàng Gia', baubles: '#10b981', bulbs: '#fef08a', glow: 'rgba(16, 185, 129, 0.8)' },
    { name: 'Tím Huyền Bí', baubles: '#c084fc', bulbs: '#fdf4ff', glow: 'rgba(192, 132, 252, 0.8)' },
    { name: 'Hồng Kẹo Ngọt', baubles: '#f472b6', bulbs: '#fff1f2', glow: 'rgba(244, 114, 182, 0.8)' }
  ];
  let currentTreePaletteIndex = 0;

  function applyTreePalette(palette) {
    if (!treeContainer) return;
    const baubles = treeContainer.querySelectorAll('.bauble');
    const bulbs = treeContainer.querySelectorAll('.tree-light-bulb');

    baubles.forEach(b => {
      b.setAttribute('fill', palette.baubles);
      b.style.transition = 'fill 0.4s ease';
    });

    bulbs.forEach(b => {
      b.setAttribute('fill', palette.bulbs);
      b.style.transition = 'fill 0.4s ease';
    });
  }

  function changeTreePalette() {
    currentTreePaletteIndex = (currentTreePaletteIndex + 1) % TREE_PALETTES.length;
    const palette = TREE_PALETTES[currentTreePaletteIndex];
    applyTreePalette(palette);
    playJingleBellSound(1567.98);
    showToast(`🎄 Cây thông: ${palette.name}`);
  }

  // 7. DOWNLOAD GREETING CARD (Chỉ tải bức thư đứng thẳng, không kèm phong bì/nơ phía sau)
  async function downloadGreetingCard() {
    const letterEl = document.getElementById('greeting-card') || document.getElementById('card-scene');
    if (!letterEl || typeof html2canvas !== 'function') {
      showToast('⚠️ Không thể chụp ảnh thiệp lúc này');
      return;
    }

    showToast('📸 Đang lưu ảnh thiệp...');
    try {
      // 1. Chờ tất cả font chữ hệ thống & thư pháp hoàn tất nạp vào bộ nhớ
      if (document.fonts) {
        try {
          await Promise.all([
            document.fonts.load('700 36px "Alex Brush"'),
            document.fonts.load('400 36px "Alex Brush"'),
            document.fonts.load('400 24px "Dancing Script"'),
            document.fonts.load('600 24px "Dancing Script"'),
            document.fonts.load('700 24px "Dancing Script"'),
            document.fonts.ready
          ]);
        } catch (fontErr) {
          console.warn('Lỗi kiểm tra fonts.ready', fontErr);
        }
      }

      // Đảm bảo cachedEmbeddedFontsCss có dữ liệu nếu chưa nạp kịp
      if (!cachedEmbeddedFontsCss) {
        try {
          const res = await fetch('css/embedded-fonts.css?v=10.0');
          cachedEmbeddedFontsCss = await res.text();
        } catch (_) {}
      }

      // 2. Chụp riêng bức thư với html2canvas chất lượng cao, ép nền thiệp đỏ trầm đồng điệu
      const isMobile = window.innerWidth < 640 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const canvas = await html2canvas(letterEl, {
        scale: isMobile ? 3 : 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#590918', // Nền đỏ rượu trầm sang trọng đồng điệu tấm thiệp
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        onclone: async (clonedDoc) => {
          // Nhúng toàn bộ font nhúng trực tiếp dạng style inline vào head của clone
          if (cachedEmbeddedFontsCss) {
            const fontTag = clonedDoc.createElement('style');
            fontTag.id = 'inline-cloned-fonts';
            fontTag.textContent = cachedEmbeddedFontsCss;
            clonedDoc.head.appendChild(fontTag);
          }

          // Khóa chặt các quy tắc kiểu font bằng style inline trực tiếp
          const forceRuleStyle = clonedDoc.createElement('style');
          forceRuleStyle.id = 'export-force-font-rules';
          forceRuleStyle.textContent = `
            #greeting-card,
            .letter-sheet,
            body.thiep-page.card-opened-mode .letter-sheet,
            body .letter-sheet {
              border-radius: 0px !important;
              border: none !important;
              border-top: none !important;
              border-bottom: none !important;
              border-left: none !important;
              border-right: none !important;
              outline: none !important;
              box-shadow: none !important;
              -webkit-box-shadow: none !important;
              filter: none !important;
            }
            #greeting-card,
            #greeting-card .letter-body,
            #greeting-card .letter-body p {
              font-family: 'Dancing Script', cursive !important;
            }
            #greeting-card #card-recipient-name,
            #greeting-card .letter-salutation,
            #greeting-card #card-sender-name,
            #greeting-card .letter-signature,
            #greeting-card .polaroid-caption {
              font-family: 'Alex Brush', cursive !important;
            }
          `;
          clonedDoc.head.appendChild(forceRuleStyle);

          // Thừa hưởng font từ document chính vào iframe clone
          if (document.fonts && clonedDoc.fonts) {
            document.fonts.forEach(f => {
              try { clonedDoc.fonts.add(f); } catch (e) {}
            });
            try { await clonedDoc.fonts.ready; } catch (e) {}
          }

          // Vô hiệu hóa CSS animations và transitions trong clone
          clonedDoc.querySelectorAll('*').forEach(el => {
            el.style.animation = 'none';
            el.style.transition = 'none';
          });

          // Tắt triệt để phong bì và nơ phía sau (phần ảnh 2 không tải về)
          const env = clonedDoc.querySelector('.envelope-backdrop');
          if (env) env.style.display = 'none';
          const bow = clonedDoc.querySelector('.envelope-bow-decor');
          if (bow) bow.style.display = 'none';

          // Cho bức thiệp đỏ nằm thẳng 100% (không nghiêng), 4 góc vuông vức và không có viền vàng
          const sheet = clonedDoc.getElementById('greeting-card') || clonedDoc.querySelector('.letter-sheet');
          if (sheet) {
            sheet.style.setProperty('transform', 'none', 'important');
            sheet.style.setProperty('rotate', '0deg', 'important');
            sheet.style.setProperty('background', 'radial-gradient(ellipse at 50% 12%, #851227 0%, #590918 55%, #38040e 100%)', 'important');
            sheet.style.backgroundColor = '#590918';
            sheet.style.setProperty('margin', '0 auto', 'important');
            sheet.style.margin = '0 auto';
            sheet.style.opacity = '1';
            sheet.style.setProperty('box-shadow', 'none', 'important');
            sheet.style.boxShadow = 'none';
            sheet.style.setProperty('border-radius', '0px', 'important');
            sheet.style.borderRadius = '0px';
            sheet.style.setProperty('border', 'none', 'important');
            sheet.style.setProperty('border-top', 'none', 'important');
            sheet.style.setProperty('border-bottom', 'none', 'important');
            sheet.style.setProperty('border-left', 'none', 'important');
            sheet.style.setProperty('border-right', 'none', 'important');
            sheet.style.setProperty('outline', 'none', 'important');
            sheet.style.border = 'none';
            sheet.style.borderTop = 'none';
            sheet.style.outline = 'none';
            sheet.style.overflow = 'hidden';
            sheet.style.maxHeight = 'none';
            sheet.style.boxSizing = 'border-box';
            if (isMobile) {
              sheet.style.setProperty('padding', '16px 18px 22px 18px', 'important');
              sheet.style.setProperty('width', '350px', 'important');
              sheet.style.setProperty('min-width', '350px', 'important');
              sheet.style.setProperty('max-width', '350px', 'important');
            } else {
              sheet.style.setProperty('padding', '24px 28px 24px 28px', 'important');
              sheet.style.setProperty('width', '600px', 'important');
              sheet.style.minWidth = '600px';
              sheet.style.maxWidth = '600px';
            }
          }

          // Hiện nơ ruy băng vẽ tay trên đầu thiệp
          const ribbon = clonedDoc.querySelector('.letter-ribbon-header');
          if (ribbon) {
            ribbon.style.display = 'flex';
            ribbon.style.justifyContent = 'center';
            ribbon.style.marginBottom = isMobile ? '4px' : '6px';
            if (isMobile) {
              ribbon.style.maxWidth = '180px';
            }
          }

          // Ẩn nút đóng góc trên trong ảnh tải về
          const closeBtn = clonedDoc.querySelector('.letter-close-btn') || clonedDoc.getElementById('btn-close-card-corner');
          if (closeBtn) closeBtn.style.display = 'none';

          // Ẩn con trỏ gõ chữ
          clonedDoc.querySelectorAll('.typewriter-cursor').forEach(c => c.remove());

          // Khóa chặt font chữ Alex Brush cho lời chào (màu vàng kim rạng rỡ)
          const recipientEl = clonedDoc.getElementById('card-recipient-name') || clonedDoc.querySelector('.letter-salutation');
          if (recipientEl) {
            const rawRecipient = recipientEl.getAttribute('data-raw-text') || recipientEl.textContent;
            recipientEl.innerHTML = '';
            recipientEl.textContent = rawRecipient.replace(/\s+/g, ' ').trim();
            recipientEl.style.fontFamily = "'Alex Brush', cursive";
            recipientEl.style.fontWeight = '400';
            recipientEl.style.fontSize = isMobile ? '26px' : '38px';
            recipientEl.style.color = '#fef08a';
            recipientEl.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7), 0 0 14px rgba(254, 240, 138, 0.5)';
            recipientEl.style.marginBottom = isMobile ? '8px' : '12px';
            recipientEl.style.lineHeight = isMobile ? '1.2' : '1.25';
            recipientEl.style.textAlign = 'center';
            recipientEl.style.display = 'block';
          }

          // FLATTEN toàn bộ thẻ tw-char về văn bản liền mạch và ép font Dancing Script màu vàng kem ấm áp
          clonedDoc.querySelectorAll('.letter-body p').forEach(p => {
            const rawText = p.getAttribute('data-raw-text') || p.textContent;
            p.innerHTML = '';
            p.textContent = rawText.replace(/\s+/g, ' ').trim();
            p.style.fontFamily = "'Dancing Script', cursive";
            p.style.fontWeight = '700';
            p.style.fontSize = isMobile ? '14.5px' : '17.5px';
            p.style.lineHeight = isMobile ? '1.46' : '1.58';
            p.style.color = '#fef3c7';
            p.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7)';
            p.style.letterSpacing = isMobile ? '0.05px' : '0.15px';
            p.style.textAlign = 'justify';
            p.style.margin = isMobile ? '0 0 6px 0' : '0 0 8px 0';
          });

          const senderEl = clonedDoc.getElementById('card-sender-name') || clonedDoc.querySelector('.letter-signature');
          if (senderEl) {
            const rawSender = senderEl.getAttribute('data-raw-text') || senderEl.textContent;
            senderEl.innerHTML = '';
            senderEl.textContent = rawSender.replace(/\s+/g, ' ').trim();
            senderEl.style.fontFamily = "'Alex Brush', cursive";
            senderEl.style.fontWeight = '400';
            senderEl.style.fontSize = isMobile ? '22px' : '28px';
            senderEl.style.color = '#fde047';
            senderEl.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7), 0 0 16px rgba(253, 224, 71, 0.55)';
            senderEl.style.whiteSpace = 'nowrap';
          }

          const bodyEl = clonedDoc.querySelector('.letter-body');
          if (bodyEl) {
            bodyEl.style.fontFamily = "'Dancing Script', cursive";
            bodyEl.style.fontWeight = '700';
            bodyEl.style.fontSize = isMobile ? '14.5px' : '17.5px';
            bodyEl.style.lineHeight = isMobile ? '1.46' : '1.58';
            bodyEl.style.color = '#fef3c7';
            bodyEl.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7)';
          }

          // Bỏ hoàn toàn 2 miếng dán băng dính trên Polaroid theo yêu cầu người dùng
          clonedDoc.querySelectorAll('.washi-tape-top, .washi-tape-bottom').forEach(tape => tape.remove());

          // Căn chỉnh Polaroid nhẹ nhàng
          const polaroid = clonedDoc.querySelector('.polaroid-frame');
          if (polaroid) {
            if (isMobile) {
              polaroid.style.setProperty('width', '64px', 'important');
              polaroid.style.setProperty('padding', '3px 3px 18px 3px', 'important');
              polaroid.style.setProperty('transform', 'rotate(-3deg) translateY(0px)', 'important');
            } else {
              polaroid.style.setProperty('width', '95px', 'important');
              polaroid.style.setProperty('padding', '5px 5px 18px 5px', 'important');
              polaroid.style.setProperty('transform', 'rotate(-4deg) translateY(2px) translateX(-4px)', 'important');
            }
            polaroid.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)';
            polaroid.style.border = '1px solid rgba(212, 175, 55, 0.45)';
          }

          // Ẩn huy hiệu camera đổi ảnh để bức thư xuất xịn sò như bưu thiếp gửi tặng
          const camBadge = clonedDoc.querySelector('.polaroid-hint-badge');
          if (camBadge) camBadge.style.display = 'none';
          const changeBtn = clonedDoc.querySelector('.polaroid-change-btn');
          if (changeBtn) changeBtn.style.display = 'none';

          const capEl = clonedDoc.querySelector('.polaroid-caption');
          if (capEl) {
            capEl.textContent = 'Sweet Memories';
            capEl.style.fontFamily = "'Alex Brush', cursive";
            capEl.style.fontWeight = '400';
            capEl.style.fontSize = isMobile ? '13px' : '14px';
            capEl.style.color = '#781023';
            capEl.style.setProperty('bottom', isMobile ? '3px' : '4px', 'important');
            capEl.style.textAlign = 'center';
            capEl.style.lineHeight = '1';
          }

          // Giãn cách phần đuôi thư (ảnh Polaroid & chữ ký)
          const footerEl = clonedDoc.querySelector('.letter-footer');
          if (footerEl) {
            footerEl.style.marginTop = isMobile ? '12px' : '18px';
            footerEl.style.display = 'flex';
            footerEl.style.alignItems = 'flex-end';
            footerEl.style.justifyContent = 'space-between';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      window.__lastDownloadedDataUrl = dataUrl;

      // 1. Kích hoạt tải file trực tiếp xuống máy
      function triggerDownload(url) {
        const link = document.createElement('a');
        link.download = `Merry_Christmas_Letter_${Date.now()}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 1000);
      }

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            triggerDownload(blobUrl);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
          } else {
            triggerDownload(dataUrl);
          }
        }, 'image/png');
      } else {
        triggerDownload(dataUrl);
      }

      showToast('🎉 Đã tải ảnh thiệp Giáng Sinh thành công!');
    } catch (e) {
      console.error(e);
      showToast('⚠️ Lỗi khi tải ảnh thiệp');
    }
  }

  // 7b. MODAL XEM TRƯỚC VÀ LƯU ẢNH THIỆP
  function initDownloadModal() {
    const modal = document.getElementById('card-download-modal');
    const btnClose = document.getElementById('btn-close-download-modal');
    const btnDone = document.getElementById('btn-modal-close');
    if (!modal) return;
    const hide = () => modal.classList.add('hidden');
    if (btnClose) btnClose.addEventListener('click', hide);
    if (btnDone) btnDone.addEventListener('click', hide);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hide();
    });
  }

  // 7b. CUSTOM POLAROID PHOTO UPLOAD & LOCALSTORAGE
  const DEFAULT_LETTER_PHOTO = 'assets/letter_girl_default.jpg';

  function initPolaroidPhoto() {
    const polaroidBox = document.getElementById('polaroid-frame-box');
    const fileInput = document.getElementById('polaroid-file-input');
    const photoImg = document.getElementById('polaroid-img-el');
    const btnChangePhoto = document.getElementById('btn-change-photo');

    // 1. Load saved custom photo from localStorage if present, otherwise fallback to new default
    try {
      const savedPhoto = localStorage.getItem('custom_letter_photo_v2');
      if (savedPhoto && photoImg) {
        photoImg.src = savedPhoto;
      } else if (photoImg) {
        photoImg.src = DEFAULT_LETTER_PHOTO;
      }
    } catch (e) {
      console.warn('Cannot read localStorage', e);
    }

    // 2. Trigger file input on click
    if (polaroidBox && fileInput) {
      polaroidBox.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (btnChangePhoto && fileInput) {
      btnChangePhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    // 3. Handle file selection & check if square (1:1)
    if (fileInput && photoImg) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          showToast('⚠️ Vui lòng chọn tệp hình ảnh hợp lệ!');
          return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
          const dataUrl = evt.target.result;
          const testImg = new Image();
          testImg.onload = function () {
            const w = testImg.naturalWidth;
            const h = testImg.naturalHeight;
            // Kiểm tra xem ảnh có phải là hình vuông không (dung sai 2%)
            const isSquare = Math.abs(w - h) / Math.max(w, h) <= 0.02;

            if (isSquare) {
              // Đã là hình vuông -> Áp dụng ngay
              photoImg.src = dataUrl;
              try {
                localStorage.setItem('custom_letter_photo_v2', dataUrl);
              } catch (err) {
                console.warn('Storage quota exceeded, photo will remain in memory for this session');
              }
              playGiftChime();
              showToast('📸 Đã cập nhật ảnh kỷ niệm của bạn!');
              fileInput.value = '';
            } else {
              // Ảnh không phải hình vuông -> Mở công cụ cắt ảnh vuông 1:1
              openCropModal(dataUrl);
            }
          };
          testImg.onerror = function () {
            showToast('⚠️ Không thể tải ảnh, vui lòng thử lại!');
          };
          testImg.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    initCropModal();
  }

  // 7c. QUẢN LÝ CẮT ẢNH VUÔNG 1:1 (CROPPER.JS) CHO KHUNG POLAROID
  let cropperInstance = null;

  function openCropModal(imageUrl) {
    const modal = document.getElementById('image-crop-modal');
    const cropImg = document.getElementById('crop-target-img');
    if (!modal || !cropImg) return;

    // Hiển thị modal trước để tính toán chính xác kích thước container
    modal.classList.remove('hidden');

    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }

    // Đợi ảnh nạp xong để khởi tạo Cropper.js
    cropImg.onload = function () {
      if (typeof Cropper === 'undefined') {
        console.error('Cropper.js chưa được nạp!');
        return;
      }
      cropperInstance = new Cropper(cropImg, {
        aspectRatio: 1, // Khóa chặt tỷ lệ hình vuông 1:1
        viewMode: 1, // Vùng cắt không vượt ra khỏi phạm vi ảnh
        dragMode: 'move', // Cho phép kéo di chuyển ảnh
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        responsive: true,
        checkOrientation: false
      });
    };

    cropImg.src = imageUrl;
  }

  function closeCropModal() {
    const modal = document.getElementById('image-crop-modal');
    if (modal) modal.classList.add('hidden');
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    const fileInput = document.getElementById('polaroid-file-input');
    if (fileInput) fileInput.value = '';
  }

  function initCropModal() {
    const modal = document.getElementById('image-crop-modal');
    const btnClose = document.getElementById('btn-close-crop-modal');
    const btnCancel = document.getElementById('btn-crop-cancel');
    const btnApply = document.getElementById('btn-crop-apply');
    const btnZoomIn = document.getElementById('btn-crop-zoom-in');
    const btnZoomOut = document.getElementById('btn-crop-zoom-out');
    const btnRotateLeft = document.getElementById('btn-crop-rotate-left');
    const btnRotateRight = document.getElementById('btn-crop-rotate-right');
    const btnReset = document.getElementById('btn-crop-reset');
    const photoImg = document.getElementById('polaroid-img-el');

    if (btnClose) btnClose.addEventListener('click', closeCropModal);
    if (btnCancel) btnCancel.addEventListener('click', closeCropModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCropModal();
      });
    }

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        if (cropperInstance) cropperInstance.zoom(0.1);
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        if (cropperInstance) cropperInstance.zoom(-0.1);
      });
    }
    if (btnRotateLeft) {
      btnRotateLeft.addEventListener('click', () => {
        if (cropperInstance) cropperInstance.rotate(-90);
      });
    }
    if (btnRotateRight) {
      btnRotateRight.addEventListener('click', () => {
        if (cropperInstance) cropperInstance.rotate(90);
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (cropperInstance) cropperInstance.reset();
      });
    }

    if (btnApply) {
      btnApply.addEventListener('click', () => {
        if (!cropperInstance) return;
        // Xuất ảnh cắt vuông 1:1 chuẩn chất lượng cao (800x800px)
        const canvas = cropperInstance.getCroppedCanvas({
          width: 800,
          height: 800,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high'
        });

        if (!canvas) {
          showToast('⚠️ Không thể cắt ảnh, vui lòng thử lại!');
          return;
        }

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        if (photoImg) {
          photoImg.src = croppedDataUrl;
        }

        try {
          localStorage.setItem('custom_letter_photo_v2', croppedDataUrl);
        } catch (err) {
          console.warn('Storage quota exceeded, photo stored for this session');
        }

        playGiftChime();
        showToast('✨ Đã cắt & cập nhật ảnh vuông thành công!');
        closeCropModal();
      });
    }
  }

  // 8. FORTUNE SLIPS & GIFT BOXES
  const FORTUNES_DATA = {
    red: {
      type: "Hộp Quà May Mắn Đỏ ❤️ (Tình Duyên & Gia Đạo)",
      icon: "🎁",
      fortunes: [
        {
          title: "Hạnh Phúc Ngập Tràn ✨",
          quote: "Giáng Sinh này, trái tim bạn sẽ được sưởi ấm bởi tình yêu chân thành và những cái ôm dịu dàng nhất từ người bạn yêu quý!",
          number: "99",
          color: "Đỏ Rượu & Vàng Champagne"
        },
        {
          title: "Vạn Sự Viên Mãn 🌸",
          quote: "Mọi khúc mắc sẽ tan biến như bông tuyết mùa đông, nhường chỗ cho sự thấu hiểu, gắn kết bền chặt và nụ cười rạng rỡ!",
          number: "52",
          color: "Hồng San Hô & Trắng Tuyết"
        },
        {
          title: "Tình Thân Ấm Áp 🏡",
          quote: "Gia đình luôn là bến đỗ an yên nhất. Chúc bạn và gia đình một mùa Noel sum vầy, dạt dào niềm vui và tiếng cười rộn rã!",
          number: "26",
          color: "Đỏ Ruby & Vàng Ánh Kim"
        }
      ]
    },
    gold: {
      type: "Hộp Quà Tài Lộc Vàng 🌟 (Tài Vận & Sự Nghiệp)",
      icon: "⭐",
      fortunes: [
        {
          title: "Tài Lộc Rực Rỡ 💰",
          quote: "Năm mới 2026 mở ra cánh cửa đại cát đại lợi, công việc thăng hoa, tài lộc gõ cửa rộn ràng như cỗ xe Santa chở đầy phước lành!",
          number: "88",
          color: "Vàng Kim & Hổ Phách"
        },
        {
          title: "Cơ Hội Vàng Khởi Sắc 🚀",
          quote: "Những ấp ủ bấy lâu sẽ đơm hoa kết trái, mang lại thành quả vang dội và những bước đột phá vượt xa mong đợi trong năm 2026!",
          number: "18",
          color: "Vàng Đồng & Xanh Hoàng Gia"
        },
        {
          title: "Vạn Sự Hanh Thông 👑",
          quote: "Mọi nỗ lực bền bỉ của bạn đều sẽ được vũ trụ hồi đáp xứng đáng, danh tiếng vang xa và vị thế vững vàng!",
          number: "68",
          color: "Vàng Hoàng Kim & Đỏ Mận"
        }
      ]
    },
    green: {
      type: "Hộp Quà Bình An Xanh 🌲 (Sức Khỏe & Tĩnh Lặng)",
      icon: "🌿",
      fortunes: [
        {
          title: "Tâm Hồn An Yên 🕊️",
          quote: "Gạt đi những lo toan muộn phiền, tâm bạn sẽ thanh thản tự tại như rừng thông phủ tuyết êm đềm, ngập tràn năng lượng tươi mới!",
          number: "25",
          color: "Xanh Lục Bảo & Bạc Sáng"
        },
        {
          title: "Thân Tâm Khỏe Mạnh 🍃",
          quote: "Sức sống dồi dào, thân thể tráng kiện, tinh thần lạc quan sẽ là điểm tựa vững chãi để bạn chinh phục mọi đỉnh cao năm 2026!",
          number: "12",
          color: "Xanh Thông & Vàng Nhạt"
        },
        {
          title: "Bình An Vô Sự 🍀",
          quote: "Bình an là phúc lành lớn nhất trần gian. Chúc bạn mỗi sớm mai thức dậy đều thấy lòng nhẹ nhõm, yêu đời và bình yên!",
          number: "07",
          color: "Xanh Ngọc Bích & Trắng Sữa"
        }
      ]
    }
  };

  let currentActiveBoxKey = 'red';

  function openFortuneModal(boxKey) {
    currentActiveBoxKey = boxKey;
    const boxConfig = FORTUNES_DATA[boxKey] || FORTUNES_DATA.red;
    const list = boxConfig.fortunes;
    const fortune = list[Math.floor(Math.random() * list.length)];

    const modal = document.getElementById('fortune-modal');
    const boxTypeEl = document.getElementById('fortune-box-type');
    const titleEl = document.getElementById('fortune-title');
    const quoteEl = document.getElementById('fortune-quote');
    const numEl = document.getElementById('fortune-number');
    const colorEl = document.getElementById('fortune-color');
    const iconEl = document.getElementById('fortune-gift-icon');

    if (boxTypeEl) boxTypeEl.textContent = boxConfig.type;
    if (titleEl) titleEl.textContent = fortune.title;
    if (quoteEl) quoteEl.textContent = `"${fortune.quote}"`;
    if (numEl) numEl.textContent = fortune.number;
    if (colorEl) colorEl.textContent = fortune.color;
    if (iconEl) iconEl.textContent = boxConfig.icon;

    playGiftChime();
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
    }
  }

  function rerollFortune() {
    const boxConfig = FORTUNES_DATA[currentActiveBoxKey] || FORTUNES_DATA.red;
    const list = boxConfig.fortunes;
    const fortune = list[Math.floor(Math.random() * list.length)];

    const titleEl = document.getElementById('fortune-title');
    const quoteEl = document.getElementById('fortune-quote');
    const numEl = document.getElementById('fortune-number');
    const colorEl = document.getElementById('fortune-color');

    if (titleEl) titleEl.textContent = fortune.title;
    if (quoteEl) quoteEl.textContent = `"${fortune.quote}"`;
    if (numEl) numEl.textContent = fortune.number;
    if (colorEl) colorEl.textContent = fortune.color;

    playJingleBellSound(1760);
    showToast("✨ Đã rút một quẻ may mắn mới!");
  }

  function closeFortuneModal() {
    const modal = document.getElementById('fortune-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.add('hidden');
    }
  }

  function initGiftBoxes() {
    ['red', 'gold', 'green'].forEach(key => {
      const svgBox = document.getElementById(`gift-box-${key}`);
      if (svgBox) {
        svgBox.addEventListener('click', (e) => {
          e.stopPropagation();
          openFortuneModal(key);
        });
      }
    });

    const quickBtns = document.querySelectorAll('.gift-quick-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = btn.getAttribute('data-gift-color') || 'red';
        openFortuneModal(color);
      });
    });

    const btnClose = document.getElementById('btn-close-fortune');
    const btnAccept = document.getElementById('btn-accept-fortune');
    const btnReroll = document.getElementById('btn-reroll-fortune');

    if (btnClose) btnClose.addEventListener('click', closeFortuneModal);
    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        closeFortuneModal();
        showToast('🎁 Chúc bạn nhận trọn may mắn!');
      });
    }
    if (btnReroll) btnReroll.addEventListener('click', rerollFortune);

    const modal = document.getElementById('fortune-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFortuneModal();
      });
    }
  }

  // 9. INTERACTIVE SNOWMAN
  const SNOWMAN_QUOTES = [
    "Chúc bạn Giáng Sinh 2026 ấm áp, an lành và hạnh phúc! ⛄❄️",
    "Brrr... Tuyết ngoài này lạnh lắm nhưng có bạn là thấy ấm áp ngay! ❤️",
    "Bạn đã ước một điều ước đêm Noel chưa? Tôi tin điều ước sẽ thành sự thật! ✨",
    "Hát cùng tôi một bài Giáng Sinh nhé! Jingle bells, jingle bells... 🎶",
    "Chúc bạn năm 2026 luôn rạng rỡ và tràn ngập niềm vui như nụ cười của tôi! 🥕"
  ];
  let quoteIndex = 0;

  function initSnowmanInteraction() {
    const snowman = document.getElementById('scenery-snowman');
    const bubble = document.getElementById('snowman-bubble');
    const textEl = document.getElementById('snowman-speech-text');
    if (!snowman || !bubble || !textEl) return;

    snowman.addEventListener('click', () => {
      playSnowmanSound();
      quoteIndex = (quoteIndex + 1) % SNOWMAN_QUOTES.length;
      textEl.textContent = SNOWMAN_QUOTES[quoteIndex];

      bubble.classList.add('active');
      snowman.style.transform = 'scale(1.15) rotate(5deg)';
      setTimeout(() => {
        snowman.style.transform = '';
      }, 350);

      clearTimeout(snowman._hideTimer);
      snowman._hideTimer = setTimeout(() => {
        bubble.classList.remove('active');
      }, 5000);
    });
  }

  // 10. INTERACTIVE LANTERN
  function initLanternInteraction() {
    const lantern = document.getElementById('scenery-lantern');
    if (!lantern) return;

    lantern.addEventListener('click', () => {
      playLanternChime();
      lantern.style.filter = 'drop-shadow(0 0 45px rgba(255,215,0,1)) scale(1.1)';
      showToast('🏮 Ngọn đèn bão thắp sáng nguyện ước đêm Noel!');

      setTimeout(() => {
        lantern.style.filter = '';
      }, 1200);
    });
  }

  // 11. REAL-TIME WEATHER (Open-Meteo API)
  async function initWeather() {
    const weatherBadge = document.getElementById('weather-badge');
    const weatherIcon = document.getElementById('weather-icon-el');
    const weatherText = document.getElementById('weather-text');
    if (!weatherBadge || !weatherText) return;

    if (!navigator.geolocation) {
      weatherText.textContent = "Bắc Cực • -5°C ❄️";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
          const res = await fetch(url);
          const data = await res.json();

          if (data && data.current) {
            const temp = Math.round(data.current.temperature_2m);
            const code = data.current.weather_code;
            let iconClass = "fa-solid fa-cloud-sun text-amber-300";
            let desc = "Mát mẻ";

            if (code === 0) {
              iconClass = "fa-solid fa-sun text-amber-400";
              desc = "Trời quang";
            } else if (code >= 1 && code <= 3) {
              iconClass = "fa-solid fa-cloud-sun text-amber-300";
              desc = "Có mây";
            } else if (code >= 51 && code <= 67) {
              iconClass = "fa-solid fa-cloud-rain text-blue-300";
              desc = "Có mưa";
            } else if (code >= 71 && code <= 77) {
              iconClass = "fa-solid fa-snowflake text-cyan-200";
              desc = "Có tuyết";
            }

            if (weatherIcon) weatherIcon.className = iconClass;
            weatherText.textContent = `${temp}°C • ${desc}`;
          }
        } catch (e) {
          weatherText.textContent = "Bắc Cực • -5°C ❄️";
        }
      },
      () => {
        weatherText.textContent = "Bắc Cực • -5°C ❄️";
      },
      { timeout: 7000 }
    );
  }

  // 12. TOAST HELPER
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const textEl = document.getElementById('toast-text');
    if (!toast || !textEl) return;
    textEl.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 13. URL PARAMETERS (Custom recipient & sender)
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    const from = params.get('from');
    const msg = params.get('msg');
    const step = params.get('step');
    const opened = params.get('opened');

    const toEl = document.getElementById('card-recipient-name');
    const fromEl = document.getElementById('card-sender-name');
    const msgEl = document.getElementById('card-message-text');

    if (to && toEl) {
      toEl.textContent = to.endsWith('à,') || to.endsWith(',') ? to : `${to} à,`;
    }
    if (from && fromEl) {
      fromEl.textContent = from;
    }
    if (msg && msgEl) {
      msgEl.textContent = msg;
      const otherParas = document.querySelectorAll('.letter-body p:not(#card-message-text)');
      otherParas.forEach(p => p.remove());
    }

    initTypewriterDom();

    if (step === 'opened' || opened === '1' || opened === 'true') {
      setTimeout(() => {
        openEnvelope();
      }, 300);
    }
  }

  // 14. INITIALIZE ALL
  document.addEventListener('DOMContentLoaded', () => {
    parseUrlParams();
    initTypewriterDom();
    initSantaScheduler();
    initGiftBoxes();
    initSnowmanInteraction();
    initLanternInteraction();
    initWeather();
    initPolaroidPhoto();
    initDownloadModal();

    // Envelope open triggers
    if (waxSeal) waxSeal.addEventListener('click', openEnvelope);
    if (envelopeBox) {
      envelopeBox.addEventListener('click', (e) => {
        if (!isCardOpened) openEnvelope();
      });
    }

    // Fold & Download (gấp thiệp bằng nút rõ ràng, tránh bấm nhầm khi đang vuốt cuộn màn hình)
    if (btnFoldCard) btnFoldCard.addEventListener('click', foldCardBack);
    const btnCloseCardCorner = document.getElementById('btn-close-card-corner');
    if (btnCloseCardCorner) btnCloseCardCorner.addEventListener('click', foldCardBack);

    if (btnDownloadCard) btnDownloadCard.addEventListener('click', downloadGreetingCard);

    // Chạm/click vào thiệp để hiện nhanh toàn bộ nội dung (skip typewriter)
    const greetingCardEl = document.getElementById('greeting-card');
    if (greetingCardEl) {
      greetingCardEl.addEventListener('click', (e) => {
        if (e.target.closest('#polaroid-frame-box') || e.target.closest('button') || e.target.closest('input')) return;
        stopTypewriter(true);
      });
    }

    // Interactive tree fallback
    if (treeContainer) treeContainer.addEventListener('click', changeTreePalette);
  });

})();
