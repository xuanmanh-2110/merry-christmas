/**
 * BOUQUET SCRIPT - Standalone Page
 * HIỆU ỨNG VÒI PHUN HOA & BIỂN HOA RƠI PHỦ TOÀN BỘ MÀN HÌNH
 * - Kích thước: Hoa to hơn 1 chút, thấy rõ từng cánh hoa lộng lẫy
 * - Mật độ: Số lượng hoa vừa phải (cho ít hoa lại), không bị quá nghẹt
 * - Vùng phủ: Trải đều khắp chiều ngang (trái sang phải) và chiều dọc (từ đỉnh xuống đáy màn hình)
 * - Chuyển động: Vòi phun uốn cong parabol -> thác hoa rơi từ từ lắc lư hình sin êm đềm
 * Canvas 2D Engine tối ưu 60 FPS
 */
document.addEventListener('DOMContentLoaded', () => {
  const btnHugBouquet = document.getElementById('btn-hug-bouquet');
  const bouquetInteractiveTarget = document.getElementById('bouquet-interactive-target');
  const bouquetImg = document.getElementById('bouquet-img');
  const btnSpotifySong = document.getElementById('btn-spotify-song');
  const btnYoutubeSong = document.getElementById('btn-youtube-song');
  const btnMovieXmas = document.getElementById('btn-movie-xmas');
  const burstCanvas = document.getElementById('flower-burst-canvas');

  // Preload hình ảnh hoa thật chất lượng cao
  const FLOWER_ASSETS = [
    'assets/flowers/flower_light_blue_rose_thumb.png',
    'assets/flowers/flower_purple_rose_thumb.png',
    'assets/flowers/flower_purple_dahlia_thumb.png',
    'assets/flowers/flower_blue_iris_thumb.png',
    'assets/flowers/flower_light_purple_lily_thumb.png',
    'assets/flowers/flower_light_pink_rose_thumb.png'
  ];

  const flowerImages = [];
  FLOWER_ASSETS.forEach(src => {
    const img = new Image();
    img.src = src;
    flowerImages.push(img);
  });

  const SPARKLE_COLORS = ['#fde047', '#ffd700', '#ffffff', '#fef08a'];

  let animFrameId = null;
  let isAnimationRunning = false;

  function easeOutQuad(t) { return t * (2 - t); }

  /**
   * HỆ THỐNG VÒI PHUN HOA & THÁC HOA PHỦ KÍN MÀN HÌNH
   */
  function launchDenseFlowerBlanket() {
    if (!burstCanvas) return;
    const ctx = burstCanvas.getContext('2d');
    if (!ctx) return;

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    isAnimationRunning = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    burstCanvas.width = W * dpr;
    burstCanvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Điểm xuất phát từ bó hoa ở giữa
    const bouquet = bouquetImg || bouquetInteractiveTarget;
    const rect = bouquet ? bouquet.getBoundingClientRect() : {
      left: W / 2 - 50,
      top: H * 0.45,
      width: 100,
      height: 100
    };
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height * 0.42;

    const isMobile = W < 640;

    // =========================================================================
    // 1. VÒI PHUN HOA (Giai đoạn 0.2s - 1.2s):
    // =========================================================================
    // 1. VÒI PHUN HOA (Giai đoạn 0.2s - 1.2s):
    // Giảm bớt số lượng hoa, tăng kích thước hoa to đẹp, bắn theo hình vòi phun
    // =========================================================================
    const fountainCount = isMobile ? 8 : 12;
    const fountainParticles = [];

    for (let i = 0; i < fountainCount; i++) {
      let launchAngleDeg;
      const r = Math.random();
      if (r < 0.45) {
        // Vòm cong sang trái: 112° - 148°
        launchAngleDeg = 112 + Math.random() * 36;
      } else if (r < 0.90) {
        // Vòm cong sang phải: 32° - 68°
        launchAngleDeg = 32 + Math.random() * 36;
      } else {
        // Vòm trung tâm bay cao: 78° - 102°
        launchAngleDeg = 78 + Math.random() * 24;
      }

      const launchAngleRad = (launchAngleDeg * Math.PI) / 180;
      // Vận tốc phóng chậm rãi, mềm mại
      const speed = (isMobile ? 7.0 : 10.0) + Math.random() * (isMobile ? 3.0 : 4.5);
      const vx0 = Math.cos(launchAngleRad) * speed;
      const vy0 = -Math.sin(launchAngleRad) * speed;

      // KÍCH THƯỚC HOA VÒI PHUN TO ĐẸP:
      // Mobile: 100 - 150px | Desktop: 160 - 230px
      const size = Math.floor((isMobile ? 100 : 160) + Math.random() * (isMobile ? 50 : 70));

      fountainParticles.push({
        img: flowerImages[Math.floor(Math.random() * flowerImages.length)],
        startX: originX,
        startY: originY,
        vx: vx0,
        vy: vy0,
        gravity: 0.16 + Math.random() * 0.04,
        size: size,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.035,
        spawnDelay: Math.random() * 0.65,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: 1.1 + Math.random() * 0.8,
        swayAmp: 18 + Math.random() * 24
      });
    }

    // =========================================================================
    // 2. BIỂN HOA PHỦ KÍN TOÀN BỘ MÀN HÌNH - BỎ BỚT HOA NHƯNG VẪN LẤP ĐẦY
    // =========================================================================
    // Bỏ bớt thêm số lượng hoa, tăng kích thước hoa to lớn (260px - 380px)
    // Tự động đan xen khép kín 100% toàn màn hình mà cực kỳ nhẹ nhàng, không hề lag
    const fallingParticles = [];

    // Kích thước ô lưới phủ nền thoáng hơn (giảm thêm số lượng phần tử vẽ)
    const stepX = isMobile ? 72 : 110;
    const stepY = isMobile ? 72 : 110;
    const cols = Math.ceil((W + 240) / stepX) + 2;
    const rows = Math.ceil((H + 240) / stepY) + 2;

    // KÍCH THƯỚC HOA TO LỚN VƯỢT TRỘI (Đường kính gấp 2.4 - 3.6 lần ô lưới => đan xen kín 100%):
    // Mobile: 185px - 280px | Desktop: 270px - 400px
    const minSize = isMobile ? 185 : 270;
    const maxSize = isMobile ? 280 : 400;

    // 1. Tạo các điểm phủ kín toàn bộ màn hình từ mép trái sang phải, từ đỉnh xuống đáy
    const gridPositions = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const jitterX = (Math.random() - 0.5) * stepX * 0.60;
        const jitterY = (Math.random() - 0.5) * stepY * 0.60;
        const targetX = -90 + c * stepX + jitterX;
        const targetY = -90 + r * stepY + jitterY;
        gridPositions.push({ targetX, targetY, r, c });
      }
    }

    // Xáo trộn ngẫu nhiên để hoa rơi tự nhiên, không bị xuất hiện theo thứ tự máy móc
    for (let i = gridPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = gridPositions[i];
      gridPositions[i] = gridPositions[j];
      gridPositions[j] = temp;
    }

    const totalGrid = gridPositions.length;
    for (let i = 0; i < totalGrid; i++) {
      const pos = gridPositions[i];
      // Thời điểm xuất hiện rải từ 0.4s đến 2.7s
      const spawnTime = 0.40 + (i / totalGrid) * 2.30 + (Math.random() * 0.25 - 0.12);
      const startY = -(Math.random() * 120 + 90);
      const size = Math.floor(minSize + Math.random() * (maxSize - minSize));
      // Thời gian rơi chậm rãi, nhẹ nhàng bồng bềnh: 1.8s đến 2.7s
      const travelTime = 1.8 + Math.random() * 0.9;

      fallingParticles.push({
        img: flowerImages[Math.floor(Math.random() * flowerImages.length)],
        baseX: pos.targetX,
        startY: startY,
        targetSettlingY: pos.targetY,
        travelTime: travelTime,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: 0.8 + Math.random() * 1.0,
        swayAmp: 16 + Math.random() * 24,
        size: size,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        spawnTime: Math.max(0.35, spawnTime),
        alpha: 0
      });
    }

    // 2. Thêm các bông hoa Hero cực lớn ở tiền cảnh (360px - 460px desktop)
    const heroCount = isMobile ? 4 : 8;
    for (let i = 0; i < heroCount; i++) {
      const targetX = Math.random() * (W + 60) - 30;
      const targetY = Math.random() * (H + 60) - 30;
      const spawnTime = 0.6 + Math.random() * 2.0;
      const heroSize = Math.floor((isMobile ? 250 : 360) + Math.random() * (isMobile ? 60 : 100));

      fallingParticles.push({
        img: flowerImages[Math.floor(Math.random() * flowerImages.length)],
        baseX: targetX,
        startY: -(Math.random() * 140 + 90),
        targetSettlingY: targetY,
        travelTime: 1.9 + Math.random() * 1.0,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: 0.7 + Math.random() * 0.9,
        swayAmp: 18 + Math.random() * 28,
        size: heroSize,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        spawnTime: spawnTime,
        alpha: 0
      });
    }

    // Sparkles lấp lánh vàng điểm xuyết thanh lịch
    const sparkles = [];
    const sparkleCount = isMobile ? 16 : 24;
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 8 + Math.random() * 12,
        color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
        spawnTime: 0.6 + Math.random() * 2.6,
        phase: Math.random() * Math.PI * 2
      });
    }

    const startTime = performance.now();
    const TOTAL_DURATION = 7400; // 7.4s (thời gian chậm rãi, êm đềm)

    function render(now) {
      const elapsed = (now - startTime) / 1000; // Giây
      ctx.clearRect(0, 0, W, H);

      // Fade out nhẹ nhàng từ 5.5s đến 7.2s
      let globalFade = 1;
      if (elapsed > 5.5) {
        globalFade = Math.max(0, 1 - (elapsed - 5.5) / (7.2 - 5.5));
      }

      // =======================================================================
      // 1. RENDER VÒI PHUN NƯỚC BẰNG HOA (Giai đoạn đầu)
      // =======================================================================
      for (let i = 0; i < fountainParticles.length; i++) {
        const p = fountainParticles[i];
        if (elapsed < p.spawnDelay) continue;

        const age = elapsed - p.spawnDelay;
        const frames = age * 60;

        let curX = p.startX + p.vx * frames;
        let curY = p.startY + p.vy * frames + 0.5 * p.gravity * Math.pow(frames, 1.8) * 0.06;

        if (frames > 35) {
          const swayTime = (frames - 35) / 60;
          curX += Math.sin(swayTime * p.swayFreq + p.swayPhase) * p.swayAmp * 0.35;
          curY += swayTime * 16;
        }

        // Hiệu ứng hoa vòi phun nở bung to dần khi bắn lên
        let fBloomScale = 1;
        if (age < 0.45) {
          const t = age / 0.45;
          fBloomScale = 0.45 + 0.55 * Math.sin(t * Math.PI * 0.5);
        }
        const curSize = p.size * fBloomScale;
        p.rotation += p.rotSpeed;

        let alpha = Math.min(1, age * 3.5) * globalFade;
        if (alpha <= 0.005) continue;

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;

        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
          ctx.drawImage(p.img, -curSize / 2, -curSize / 2, curSize, curSize);
        }
        ctx.restore();
      }

      // =======================================================================
      // 2. RENDER THÁC HOA RƠI: PHỦ ĐỀU KHẮP MÀN HÌNH TỪ TRÊN XUỐNG DƯỚI
      // =======================================================================
      for (let i = 0; i < fallingParticles.length; i++) {
        const p = fallingParticles[i];
        if (elapsed < p.spawnTime) continue;

        const age = elapsed - p.spawnTime;

        // Tiến trình rơi từ startY xuống targetSettlingY:
        const fallProg = Math.min(1, age / p.travelTime);
        const easeProg = easeOutQuad(fallProg);
        let curY = p.startY + (p.targetSettlingY - p.startY) * easeProg;

        // Khi đã chạm vị trí targetSettlingY, hoa trôi cực chậm và bồng bềnh
        if (fallProg >= 1) {
          curY += (age - p.travelTime) * 6; // trôi chậm 6px/giây bồng bềnh
        }

        // Chuyển động lắc lư hình sin tự nhiên
        const curX = p.baseX + Math.sin(age * p.swayFreq + p.swayPhase) * p.swayAmp;

        p.rotation += p.rotSpeed;

        p.alpha = Math.min(1, age * 3.0) * globalFade;
        if (p.alpha <= 0.005) continue;

        // Hiệu ứng hoa tự to dần khi rơi ("hoa tự to lên che màn hình")
        let bloomScale = 1;
        if (age < 0.6) {
          const t = age / 0.6;
          bloomScale = 0.45 + 0.55 * Math.sin(t * Math.PI * 0.5);
        }
        const renderedSize = p.size * bloomScale;

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;

        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
          ctx.drawImage(p.img, -renderedSize / 2, -renderedSize / 2, renderedSize, renderedSize);
        }
        ctx.restore();
      }

      // =======================================================================
      // 3. RENDER SPARKLES VÀNG
      // =======================================================================
      for (let i = 0; i < sparkles.length; i++) {
        const sp = sparkles[i];
        if (elapsed < sp.spawnTime) continue;

        const age = elapsed - sp.spawnTime;
        const twinkle = Math.sin(age * 5 + sp.phase);
        if (twinkle <= 0) continue;

        const alpha = twinkle * 0.85 * globalFade;

        ctx.save();
        ctx.translate(sp.x, sp.y + Math.sin(age * 1.5) * 12);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sp.color;

        const s = sp.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < TOTAL_DURATION / 1000 && globalFade > 0.005) {
        animFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, W, H);
        animFrameId = null;
        isAnimationRunning = false;
      }
    }

    animFrameId = requestAnimationFrame(render);
  }

  /**
   * XỬ LÝ SỰ KIỆN CLICK "NHẬN BÓ HOA YÊU THƯƠNG 💗"
   */
  function handleReceiveBouquet(e) {
    if (e) e.stopPropagation();

    // 1. Nút phát sáng click nhẹ
    if (btnHugBouquet) {
      btnHugBouquet.classList.remove('btn-hug-glowing');
      void btnHugBouquet.offsetWidth;
      btnHugBouquet.classList.add('btn-hug-glowing');
      btnHugBouquet.innerHTML = '<span>Xem hoa ✨</span>';
      setTimeout(() => {
        btnHugBouquet.classList.remove('btn-hug-glowing');
        btnHugBouquet.innerHTML = '<span>Xem hoa</span>';
      }, 1000);
    }

    // 2. Bó hoa rung / scale nhẹ 0.2s tích tụ năng lượng
    if (bouquetImg) {
      bouquetImg.classList.remove('is-charging-burst');
      void bouquetImg.offsetWidth;
      bouquetImg.classList.add('is-charging-burst');
      setTimeout(() => {
        bouquetImg.classList.remove('is-charging-burst');
      }, 850);
    }

    // 3. Đúng 0.2s: Âm thanh quà tặng & Bắt đầu vòi phun hoa + thác hoa rơi phủ kín màn hình
    setTimeout(() => {
      if (window.XMAS_SHARED && window.XMAS_SHARED.playGiftChime) {
        window.XMAS_SHARED.playGiftChime();
      } else if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
        window.XMAS_SHARED.playJingleBellSound(1046.5);
      }

      launchDenseFlowerBlanket();
    }, 200);
  }

  // Gắn sự kiện click vào nút và bó hoa
  if (btnHugBouquet) {
    btnHugBouquet.addEventListener('click', handleReceiveBouquet);
  }

  if (bouquetInteractiveTarget) {
    bouquetInteractiveTarget.addEventListener('click', handleReceiveBouquet);
  }

  // Chạm vào màn hình để tắt nhanh nếu muốn
  if (burstCanvas) {
    burstCanvas.addEventListener('click', () => {
      if (isAnimationRunning) {
        const ctx = burstCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;
        isAnimationRunning = false;
      }
    });
  }

  // Quà tặng âm nhạc & phim (giữ nguyên hoạt động không bị ảnh hưởng)
  if (btnSpotifySong) {
    btnSpotifySong.addEventListener('click', () => {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.68 },
          colors: ['#1ed760', '#22c55e', '#ffffff', '#ffd700'],
          ticks: 180,
          gravity: 0.9
        });
      }
    });
  }

  if (btnYoutubeSong) {
    btnYoutubeSong.addEventListener('click', () => {
      if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
        window.XMAS_SHARED.playJingleBellSound(1046.5);
      }
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.68 },
          colors: ['#ef4444', '#ffd700', '#ffffff', '#f43f5e'],
          ticks: 180,
          gravity: 0.9
        });
      }
    });
  }

  if (btnMovieXmas) {
    btnMovieXmas.addEventListener('click', () => {
      if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
        window.XMAS_SHARED.playJingleBellSound(1318.5);
      }
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.68 },
          colors: ['#f59e0b', '#ffd700', '#ffffff', '#ef4444'],
          ticks: 180,
          gravity: 0.9
        });
      }
    });
  }
});
