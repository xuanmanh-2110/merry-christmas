/**
 * PHOTOBOOTH SCRIPT - Giáng Sinh 6 Ô (2 Cột × 3 Hàng)
 * Đạt chuẩn: Mở camera -> Chụp ảnh 1 -> Xem lại -> [Chụp lại/Dùng ảnh] -> ... -> Ảnh 6 -> Ghép khung Canvas -> Tải xuống
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. STATE MANAGEMENT
  let currentPhotoIndex = 0; // 0..5
  const photos = [null, null, null, null, null, null]; // Chứa dataURL của 6 ảnh đã xác nhận
  let capturedPhoto = null; // Ảnh tạm thời vừa chụp để xem lại
  let videoStream = null;
  let isCountingDown = false;
  let countdownTimer = null;
  let selectedCountdown = 3; // 0, 3, 5, 10 giây hẹn giờ
  let currentState = 'IDLE'; // 'IDLE' | 'CAMERA' | 'COUNTDOWN' | 'PHOTO_REVIEW' | 'FINAL_RESULT'
  let cropperInstance = null; // Đối tượng Cropper.js
  let uncroppedUploadUrl = null; // Lưu ảnh gốc trước khi cắt để người dùng có thể cắt lại bất kỳ lúc nào
  let previousStateBeforeCrop = 'IDLE'; // Lưu trạng thái trước khi mở modal cắt ảnh

  // BỘ LỌC MÀU GIÁNG SINH & NÂNG TÔNG DA (FILTER PRESETS)
  const PHOTOBOOTH_FILTERS = {
    rosy: {
      id: 'rosy',
      name: 'Trắng hồng',
      badge: '🌸 Nâng tông da',
      css: 'brightness(1.08) contrast(1.04) saturate(1.12) hue-rotate(-2deg)',
      canvas: 'brightness(1.08) contrast(1.04) saturate(1.12) hue-rotate(-2deg)'
    },
    warm: {
      id: 'warm',
      name: 'Ấm áp',
      badge: '🎄 Giáng Sinh ấm cúng',
      css: 'sepia(0.18) brightness(1.05) contrast(1.03) saturate(1.15)',
      canvas: 'sepia(0.18) brightness(1.05) contrast(1.03) saturate(1.15)'
    },
    snow: {
      id: 'snow',
      name: 'Băng tuyết',
      badge: '❄️ Trong veo mát mắt',
      css: 'brightness(1.12) contrast(1.05) saturate(0.95) hue-rotate(4deg)',
      canvas: 'brightness(1.12) contrast(1.05) saturate(0.95) hue-rotate(4deg)'
    },
    vintage: {
      id: 'vintage',
      name: 'Cổ điển',
      badge: '🎞️ Màu phim hoài niệm',
      css: 'sepia(0.28) contrast(0.96) brightness(1.02) saturate(1.05)',
      canvas: 'sepia(0.28) contrast(0.96) brightness(1.02) saturate(1.05)'
    },
    bw: {
      id: 'bw',
      name: 'Trắng đen',
      badge: '🖤 Nghệ thuật cổ điển',
      css: 'grayscale(1) contrast(1.16) brightness(1.06)',
      canvas: 'grayscale(1) contrast(1.16) brightness(1.06)'
    },
    none: {
      id: 'none',
      name: 'Tự nhiên',
      badge: '✨ Ảnh gốc',
      css: 'none',
      canvas: 'none'
    }
  };

  let currentFilter = 'rosy'; // Mặc định nâng tông da trắng hồng
  let currentFacingMode = 'user'; // 'user' (selfie trước) | 'environment' (sau)
  const rawCaptureCanvas = document.createElement('canvas'); // Lưu ảnh gốc nguyên bản trước khi áp bộ lọc

  // 1. CẤU HÌNH CÁC MẪU KHUNG PHOTOBOOTH GIÁNG SINH (576 x 1024 px)
  const FRAME_CONFIGS = {
    6: {
      red: {
        id: '6_red',
        name: 'Đỏ Noel 6 Ô',
        src: 'assets/frame_6_red.png',
        slots: [
          { x: 62, y: 138, width: 215, height: 240 },
          { x: 299, y: 138, width: 215, height: 240 },
          { x: 62, y: 399, width: 215, height: 243 },
          { x: 299, y: 399, width: 215, height: 243 },
          { x: 62, y: 664, width: 215, height: 240 },
          { x: 299, y: 664, width: 215, height: 240 }
        ]
      },
      green: {
        id: '6_green',
        name: 'Xanh Thông 6 Ô',
        src: 'assets/frame_6_green.png',
        slots: [
          { x: 62, y: 138, width: 215, height: 240 },
          { x: 299, y: 138, width: 215, height: 240 },
          { x: 62, y: 399, width: 215, height: 243 },
          { x: 299, y: 399, width: 215, height: 243 },
          { x: 62, y: 664, width: 215, height: 240 },
          { x: 299, y: 664, width: 215, height: 240 }
        ]
      },
      blue: {
        id: '6_blue',
        name: 'Xanh Đêm 6 Ô',
        src: 'assets/frame_6_blue.png',
        slots: [
          { x: 62, y: 137, width: 216, height: 242 },
          { x: 299, y: 137, width: 216, height: 242 },
          { x: 62, y: 399, width: 216, height: 244 },
          { x: 299, y: 399, width: 216, height: 244 },
          { x: 62, y: 663, width: 216, height: 242 },
          { x: 299, y: 663, width: 216, height: 242 }
        ]
      },
      snow: {
        id: '6_snow',
        name: 'Xanh Tuyết 6 Ô',
        src: 'assets/frame_6_snow.png',
        slots: [
          { x: 63, y: 138, width: 216, height: 239 },
          { x: 296, y: 138, width: 217, height: 239 },
          { x: 63, y: 400, width: 216, height: 240 },
          { x: 296, y: 400, width: 217, height: 240 },
          { x: 63, y: 664, width: 216, height: 239 },
          { x: 296, y: 664, width: 217, height: 239 }
        ]
      }
    },
    3: {
      red: {
        id: '3_red',
        name: 'Đỏ Noel 3 Ô',
        src: 'assets/frame_3_red.png',
        slots: [
          { x: 62, y: 138, width: 452, height: 240 },
          { x: 62, y: 399, width: 452, height: 243 },
          { x: 62, y: 664, width: 452, height: 240 }
        ]
      },
      green: {
        id: '3_green',
        name: 'Xanh Thông 3 Ô',
        src: 'assets/frame_3_green.png',
        slots: [
          { x: 62, y: 138, width: 452, height: 240 },
          { x: 62, y: 399, width: 452, height: 243 },
          { x: 62, y: 664, width: 452, height: 240 }
        ]
      },
      blue: {
        id: '3_blue',
        name: 'Xanh Đêm 3 Ô',
        src: 'assets/frame_3_blue.png',
        slots: [
          { x: 62, y: 137, width: 452, height: 242 },
          { x: 62, y: 399, width: 452, height: 244 },
          { x: 62, y: 663, width: 452, height: 242 }
        ]
      },
      snow: {
        id: '3_snow',
        name: 'Xanh Tuyết 3 Ô',
        src: 'assets/frame_3_snow.png',
        slots: [
          { x: 62, y: 137, width: 452, height: 241 },
          { x: 62, y: 405, width: 452, height: 236 },
          { x: 62, y: 670, width: 452, height: 234 }
        ]
      }
    },
    2: {
      red: {
        id: '2_red',
        name: 'Đỏ Noel 2 Ô',
        src: 'assets/frame_2_red.png',
        slots: [
          { x: 62, y: 138, width: 452, height: 373 }, // Ô 1 trên
          { x: 62, y: 531, width: 452, height: 373 }  // Ô 2 dưới
        ]
      },
      green: {
        id: '2_green',
        name: 'Xanh Thông 2 Ô',
        src: 'assets/frame_2_green.png',
        slots: [
          { x: 62, y: 138, width: 452, height: 373 },
          { x: 62, y: 531, width: 452, height: 373 }
        ]
      },
      blue: {
        id: '2_blue',
        name: 'Xanh Đêm 2 Ô',
        src: 'assets/frame_2_blue.png',
        slots: [
          { x: 61, y: 137, width: 455, height: 374 },
          { x: 61, y: 531, width: 455, height: 374 }
        ]
      },
      snow: {
        id: '2_snow',
        name: 'Xanh Tuyết 2 Ô',
        src: 'assets/frame_2_snow.png',
        slots: [
          { x: 62, y: 138, width: 452, height: 373 },
          { x: 62, y: 531, width: 452, height: 373 }
        ]
      }
    }
  };

  let currentLayout = '6'; // '6' | '3' | '2'
  let currentColor = 'red'; // 'red' | 'green' | 'blue' | 'snow'

  function getMaxSlots() {
    if (currentLayout === '2') return 2;
    if (currentLayout === '3') return 3;
    return 6;
  }

  // Nạp sẵn toàn bộ các mẫu ảnh khung chất lượng cao
  const preloadedFrames = {};
  for (const layout of ['6', '3', '2']) {
    for (const color of Object.keys(FRAME_CONFIGS[layout])) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = FRAME_CONFIGS[layout][color].src;
      preloadedFrames[`${layout}_${color}`] = img;
    }
  }

  const HINTS = [
    'Nụ cười rạng rỡ chào Giáng Sinh! 🎄',
    'Tạo dáng chữ V hay bắn tim nhé! ✌️',
    'Nghiêng đầu duyên dáng đón tuyết rơi! ❄️',
    'Biểu cảm bất ngờ nhận quà Noel! 🎁',
    'Tạo dáng cùng chiếc mũ Giáng Sinh! 🎅',
    'Khoảnh khắc tỏa sáng khép lại khung hình! ✨'
  ];

  // 2. DOM ELEMENTS
  const photoboothVideo = document.getElementById('photobooth-video');
  const photoboothReviewImg = document.getElementById('photobooth-review-img');
  const photoboothPlaceholder = document.getElementById('photobooth-placeholder');
  const photoboothCountdownOverlay = document.getElementById('photobooth-countdown-overlay');
  const photoboothCountdownNum = document.getElementById('photobooth-countdown-num');
  const photoboothFlash = document.getElementById('photobooth-flash');
  const photoboothCaptureCanvas = document.getElementById('photobooth-capture-canvas');
  const photoboothFrameOverlay = document.getElementById('photobooth-frame-overlay');
  const photoboothStripContainer = document.getElementById('photobooth-strip-container');
  const photoboothViewport = document.getElementById('photobooth-viewport') || document.querySelector('.photobooth-viewport');
  const layoutOptBtns = document.querySelectorAll('.pb-layout-opt-btn');
  const frameOptBtns = document.querySelectorAll('.pb-frame-opt-btn');

  // Panels
  const controlsIdle = document.getElementById('controls-idle');
  const controlsCamera = document.getElementById('controls-camera');
  const controlsReview = document.getElementById('controls-review');
  const controlsCompleted = document.getElementById('controls-completed');
  const pbFinalActions = document.getElementById('pb-final-actions');

  // Buttons & Inputs
  const btnStartCamera = document.getElementById('btn-start-camera');
  const btnSnapPhoto = document.getElementById('btn-snap-photo');
  const btnSnapLabel = document.getElementById('btn-snap-label');
  const btnCountdownSnapNow = document.getElementById('btn-countdown-snap-now');
  const timerBtns = document.querySelectorAll('.pb-timer-btn');
  const btnRetakePhoto = document.getElementById('btn-retake-photo');
  const btnAcceptPhoto = document.getElementById('btn-accept-photo');
  const btnRetakeAll = document.getElementById('btn-retake-all');
  const btnDownloadFinal = document.getElementById('btn-download-final');
  const btnDownloadStrip = document.getElementById('btn-download-strip');
  const inputUploadPhoto = document.getElementById('input-upload-photo');
  const inputUploadPhotoSlot = document.getElementById('input-upload-photo-slot');

  // Cropper Modal Elements
  const imageCropModal = document.getElementById('image-crop-modal');
  const cropTargetImg = document.getElementById('crop-target-img');
  const cropModalTitle = document.getElementById('crop-modal-title');
  const btnCropZoomIn = document.getElementById('btn-crop-zoom-in');
  const btnCropZoomOut = document.getElementById('btn-crop-zoom-out');
  const btnCropRotateLeft = document.getElementById('btn-crop-rotate-left');
  const btnCropRotateRight = document.getElementById('btn-crop-rotate-right');
  const btnCropReset = document.getElementById('btn-crop-reset');
  const btnCropCancel = document.getElementById('btn-crop-cancel');
  const btnCropApply = document.getElementById('btn-crop-apply');
  const btnCloseCropModal = document.getElementById('btn-close-crop-modal');
  const btnCropCurrentPhoto = document.getElementById('btn-crop-current-photo');

  // Step Indicators
  const pbStepCounter = document.getElementById('pb-step-counter');
  const pbStepBadge = document.getElementById('pb-step-badge');
  const pbStepHint = document.getElementById('pb-step-hint');
  const thumbSlots = document.querySelectorAll('.pb-thumb-slot');
  const stripSlots = document.querySelectorAll('.photobooth-slot');

  const pbPlaceholderTitle = document.getElementById('pb-placeholder-title');
  const pbPlaceholderDesc = document.getElementById('pb-placeholder-desc');

  // Camera Flip & Color Filter Bar Elements
  const btnFlipCamera = document.getElementById('btn-flip-camera');
  const filterPillBtns = document.querySelectorAll('.pb-filter-pill');
  const currentFilterNameEl = document.getElementById('pb-current-filter-name');

  // Hàm tái xuất ảnh từ rawCaptureCanvas với bộ lọc màu đã chọn
  function updateCapturedPhotoFromRaw() {
    if (!rawCaptureCanvas || rawCaptureCanvas.width === 0) return;
    const filterCfg = PHOTOBOOTH_FILTERS[currentFilter] || PHOTOBOOTH_FILTERS.none;
    photoboothCaptureCanvas.width = rawCaptureCanvas.width;
    photoboothCaptureCanvas.height = rawCaptureCanvas.height;
    const ctx = photoboothCaptureCanvas.getContext('2d');
    ctx.clearRect(0, 0, photoboothCaptureCanvas.width, photoboothCaptureCanvas.height);
    ctx.save();
    if (filterCfg.canvas && filterCfg.canvas !== 'none' && 'filter' in ctx) {
      ctx.filter = filterCfg.canvas;
    } else {
      ctx.filter = 'none';
    }
    ctx.drawImage(rawCaptureCanvas, 0, 0);
    ctx.restore();

    capturedPhoto = photoboothCaptureCanvas.toDataURL('image/jpeg', 0.95);
    if (photoboothReviewImg) {
      photoboothReviewImg.src = capturedPhoto;
      photoboothReviewImg.style.filter = filterCfg.css;
    }
  }

  // Chọn bộ lọc màu
  function selectFilter(filterKey) {
    if (!PHOTOBOOTH_FILTERS[filterKey]) return;
    currentFilter = filterKey;
    const filterCfg = PHOTOBOOTH_FILTERS[currentFilter];

    if (currentFilterNameEl) {
      currentFilterNameEl.textContent = `${filterCfg.badge}`;
    }

    filterPillBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });

    if (photoboothVideo) {
      photoboothVideo.style.filter = filterCfg.css;
    }

    if (currentState === 'PHOTO_REVIEW' && rawCaptureCanvas && rawCaptureCanvas.width > 0) {
      updateCapturedPhotoFromRaw();
    }
  }

  // Hàm cập nhật hiển thị khung và giao diện khi chọn bố cục / màu
  function updateFrameVisuals() {
    if (!FRAME_CONFIGS[currentLayout][currentColor]) {
      currentColor = 'red';
    }
    const cfg = FRAME_CONFIGS[currentLayout][currentColor];
    if (photoboothFrameOverlay) {
      photoboothFrameOverlay.src = cfg.src;
    }
    if (photoboothStripContainer) {
      photoboothStripContainer.classList.remove('layout-6', 'layout-3', 'layout-2');
      photoboothStripContainer.classList.add(`layout-${currentLayout}`);
      photoboothStripContainer.dataset.color = currentColor;
    }
    if (photoboothViewport) {
      photoboothViewport.classList.remove('layout-6', 'layout-3', 'layout-2');
      photoboothViewport.classList.add(`layout-${currentLayout}`);
    }
    if (pbPlaceholderTitle) {
      pbPlaceholderTitle.textContent = currentLayout === '2'
        ? 'Photobooth Giáng Sinh 2 Ô'
        : (currentLayout === '3' ? 'Photobooth Giáng Sinh 3 Ô' : 'Photobooth Giáng Sinh 6 Ô');
    }
    if (pbPlaceholderDesc) {
      const maxSlots = getMaxSlots();
      pbPlaceholderDesc.textContent = `Bấm "Mở Camera" hoặc "Tải ảnh từ máy" để chụp lần lượt ${maxSlots} khoảnh khắc kỷ niệm đáng yêu!`;
    }
    layoutOptBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layout === currentLayout);
    });
    frameOptBtns.forEach(btn => {
      const color = btn.dataset.frame;
      const isAvailable = Boolean(FRAME_CONFIGS[currentLayout][color]);
      btn.style.display = isAvailable ? '' : 'none';
      btn.classList.toggle('active', color === currentColor);
    });
    updateProgressUI();
  }

  function selectLayout(layout) {
    if (layout !== '6' && layout !== '3' && layout !== '2') return;
    currentLayout = layout;
    if (!FRAME_CONFIGS[currentLayout][currentColor]) {
      currentColor = 'red';
    }
    const maxSlots = getMaxSlots();
    if (currentPhotoIndex >= maxSlots) {
      currentPhotoIndex = 0;
    }
    updateFrameVisuals();
  }

  function selectColor(color) {
    if (!FRAME_CONFIGS[currentLayout] || !FRAME_CONFIGS[currentLayout][color]) return;
    currentColor = color;
    updateFrameVisuals();
  }

  function selectFrame(color) {
    selectColor(color);
  }

  // 3. UI STATE CONTROL
  function setUiState(newState) {
    currentState = newState;

    // Ẩn tất cả các panel điều khiển
    if (controlsIdle) controlsIdle.classList.add('hidden');
    if (controlsCamera) controlsCamera.classList.add('hidden');
    if (controlsReview) controlsReview.classList.add('hidden');
    if (controlsCompleted) controlsCompleted.classList.add('hidden');
    if (pbFinalActions) pbFinalActions.classList.add('hidden');
    document.body.classList.toggle('pb-state-final', newState === 'FINAL_RESULT');

    switch (newState) {
      case 'IDLE':
        if (controlsIdle) controlsIdle.classList.remove('hidden');
        if (photoboothPlaceholder) photoboothPlaceholder.classList.remove('hidden');
        if (photoboothVideo) photoboothVideo.classList.add('hidden');
        if (photoboothReviewImg) photoboothReviewImg.classList.add('hidden');
        break;

      case 'CAMERA':
        if (controlsCamera) controlsCamera.classList.remove('hidden');
        if (photoboothPlaceholder) photoboothPlaceholder.classList.add('hidden');
        if (photoboothReviewImg) photoboothReviewImg.classList.add('hidden');
        if (photoboothVideo) photoboothVideo.classList.remove('hidden');
        break;

      case 'COUNTDOWN':
        // Trong countdown: giữ video hiển thị nhưng vô hiệu hóa nút chụp
        if (controlsCamera) controlsCamera.classList.remove('hidden');
        if (btnSnapPhoto) btnSnapPhoto.disabled = true;
        break;

      case 'PHOTO_REVIEW':
        if (controlsReview) controlsReview.classList.remove('hidden');
        if (photoboothPlaceholder) photoboothPlaceholder.classList.add('hidden');
        if (photoboothVideo) photoboothVideo.classList.add('hidden');
        if (photoboothReviewImg) photoboothReviewImg.classList.remove('hidden');
        break;

      case 'FINAL_RESULT':
        if (controlsCompleted) controlsCompleted.classList.remove('hidden');
        if (pbFinalActions) pbFinalActions.classList.remove('hidden');
        if (photoboothPlaceholder) photoboothPlaceholder.classList.add('hidden');
        if (photoboothVideo) photoboothVideo.classList.add('hidden');
        if (photoboothReviewImg) photoboothReviewImg.classList.remove('hidden');
        break;
    }

    if (btnFlipCamera) {
      if (newState === 'CAMERA') {
        btnFlipCamera.classList.remove('hidden');
      } else {
        btnFlipCamera.classList.add('hidden');
      }
    }

    if (btnSnapPhoto) btnSnapPhoto.disabled = (newState !== 'CAMERA');
    updateSnapButtonLabel();
    updateProgressUI();
  }

  function updateSnapButtonLabel() {
    if (btnSnapLabel) {
      if (selectedCountdown === 0) {
        btnSnapLabel.textContent = 'Chụp ngay';
      } else {
        btnSnapLabel.textContent = `Chụp ảnh (${selectedCountdown}s)`;
      }
    }
  }

  // Cập nhật thanh tiến trình (6 ô, 3 ô hoặc 2 ô) và thông điệp
  function updateProgressUI() {
    const maxSlots = getMaxSlots();
    if (pbStepCounter) {
      pbStepCounter.textContent = `Ảnh ${currentPhotoIndex + 1}/${maxSlots}`;
    }

    if (pbStepBadge) {
      if (currentState === 'FINAL_RESULT') {
        pbStepBadge.textContent = 'Hoàn thành';
        pbStepBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 font-semibold';
      } else if (currentState === 'PHOTO_REVIEW') {
        pbStepBadge.textContent = 'Xem lại ảnh';
        pbStepBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40 font-semibold';
      } else {
        pbStepBadge.textContent = 'Đang chụp';
        pbStepBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-red-500/25 text-red-300 border border-red-400/40 font-semibold';
      }
    }

    if (pbStepHint) {
      pbStepHint.textContent = HINTS[currentPhotoIndex] || 'Lưu giữ khoảnh khắc đẹp nhất! ✨';
    }

    // Cập nhật thumbnail tiến trình (ẩn các ô thừa nếu ở chế độ 2 ô hoặc 3 ô)
    thumbSlots.forEach((slotEl, idx) => {
      if (idx >= maxSlots) {
        slotEl.classList.add('hidden');
        return;
      }
      slotEl.classList.remove('hidden');

      const numSpan = slotEl.querySelector('.slot-number');
      const thumbImg = slotEl.querySelector('.slot-thumb-img');
      const checkIcon = slotEl.querySelector('.slot-check');

      // Highlight ô hiện tại
      if (idx === currentPhotoIndex && currentState !== 'FINAL_RESULT') {
        slotEl.classList.add('active');
      } else {
        slotEl.classList.remove('active');
      }

      // Ô đã có ảnh
      if (photos[idx]) {
        slotEl.classList.add('confirmed');
        slotEl.title = `Ảnh ô ${idx + 1}: Bấm vào để xem lại (giữ lại ảnh, xóa hoặc chụp lại)`;
        if (thumbImg) {
          thumbImg.src = photos[idx];
          thumbImg.classList.remove('hidden');
        }
        if (checkIcon) checkIcon.classList.remove('hidden');
        if (numSpan) numSpan.classList.add('hidden');
      } else {
        slotEl.classList.remove('confirmed');
        slotEl.title = `Ô ${idx + 1}: Bấm vào để chụp ảnh`;
        if (thumbImg) thumbImg.classList.add('hidden');
        if (checkIcon) checkIcon.classList.add('hidden');
        if (numSpan) numSpan.classList.remove('hidden');
      }
    });

    const pbProgressBar = document.getElementById('pb-progress-bar');
    if (pbProgressBar) {
      if (currentLayout === '2') {
        pbProgressBar.className = 'grid grid-cols-2 gap-2 w-full max-w-[140px] mx-auto';
      } else if (currentLayout === '3') {
        pbProgressBar.className = 'grid grid-cols-3 gap-2 w-full max-w-[210px] mx-auto';
      } else {
        pbProgressBar.className = 'grid grid-cols-6 gap-1.5 w-full';
      }
    }
  }

  // Cập nhật ô tương ứng trên khung Photobooth Strip (Cố định hiển thị ảnh, không thao tác trên khung)
  function updateStripSlot(index) {
    const slotEl = document.querySelector(`.photobooth-slot[data-index="${index}"]`);
    const imgEl = document.getElementById(`pb-slot-img-${index}`);
    const emptyEl = slotEl ? slotEl.querySelector('.photobooth-slot-empty') : null;

    if (photos[index]) {
      if (imgEl) {
        imgEl.src = photos[index];
        imgEl.classList.remove('hidden');
      }
      if (emptyEl) emptyEl.classList.add('hidden');
      if (slotEl) {
        slotEl.classList.add('has-photo');
        slotEl.removeAttribute('title');
      }
    } else {
      if (imgEl) imgEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (slotEl) {
        slotEl.classList.remove('has-photo');
        slotEl.removeAttribute('title');
      }
    }
  }

  // 4. CAMERA LIFECYCLE
  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
    if (photoboothVideo) {
      photoboothVideo.srcObject = null;
    }
  }

  async function startCamera() {
    try {
      stopCamera();
      const constraints = {
        video: {
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      videoStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (photoboothVideo) {
        photoboothVideo.srcObject = videoStream;
        if (currentFacingMode === 'user') {
          photoboothVideo.classList.add('-scale-x-100');
        } else {
          photoboothVideo.classList.remove('-scale-x-100');
        }
        const filterCfg = PHOTOBOOTH_FILTERS[currentFilter] || PHOTOBOOTH_FILTERS.none;
        photoboothVideo.style.filter = filterCfg.css;
        await photoboothVideo.play();
      }

      setUiState('CAMERA');
    } catch (err) {
      console.warn('Camera access denied or failed:', err);
      alert('Không thể truy cập camera. Vui lòng cấp quyền camera trong trình duyệt hoặc sử dụng chức năng "Tải ảnh từ máy" nhé!');
      setUiState('IDLE');
    }
  }

  async function flipCamera() {
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    if (btnFlipCamera) {
      btnFlipCamera.style.transform = 'scale(0.9) rotate(180deg)';
      setTimeout(() => {
        btnFlipCamera.style.transform = '';
      }, 300);
    }
    await startCamera();
    showToast(`Đã chuyển sang Camera ${currentFacingMode === 'user' ? 'Trước (Selfie)' : 'Sau'}`);
  }

  // 5. CHỤP ẢNH & ĐẾM NGƯỢC (COUNTDOWN THEO GIỜ HẸN HOẶC CHỤP NGAY)
  function triggerCapture(forceInstant = false) {
    if (!videoStream) {
      startCamera();
      return;
    }

    // Nếu forceInstant (người dùng bấm "Chụp luôn") hoặc hẹn giờ 0s -> Chụp ngay lập tức
    if (forceInstant || selectedCountdown === 0) {
      if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
      }
      isCountingDown = false;
      executeSnap();
      return;
    }

    if (isCountingDown) return;
    isCountingDown = true;
    setUiState('COUNTDOWN');

    if (photoboothCountdownOverlay && photoboothCountdownNum) {
      photoboothCountdownOverlay.classList.remove('hidden');
      let count = selectedCountdown;

      function stepCountdown() {
        if (!isCountingDown) return; // Nếu đã bị cancel bởi chụp luôn
        photoboothCountdownNum.textContent = count;
        // Kích hoạt lại animation pop cho số đếm
        photoboothCountdownNum.style.animation = 'none';
        void photoboothCountdownNum.offsetWidth; // trigger reflow
        photoboothCountdownNum.style.animation = 'countdownPop 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';

        if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
          window.XMAS_SHARED.playJingleBellSound(600 + count * 150);
        }

        if (count > 1) {
          count--;
          countdownTimer = setTimeout(stepCountdown, 1000);
        } else {
          countdownTimer = setTimeout(() => {
            executeSnap();
          }, 1000);
        }
      }

      stepCountdown();
    } else {
      executeSnap();
    }
  }

  function executeSnap() {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }

    if (photoboothCountdownOverlay) {
      photoboothCountdownOverlay.classList.add('hidden');
    }

    // Hiệu ứng flash chớp sáng
    if (photoboothFlash) {
      photoboothFlash.classList.remove('hidden');
      photoboothFlash.style.animation = 'none';
      void photoboothFlash.offsetWidth;
      photoboothFlash.style.animation = 'cameraFlashAnim 0.28s ease-out forwards';
      setTimeout(() => photoboothFlash.classList.add('hidden'), 300);
    }

    // Âm thanh chụp ảnh
    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1567.98);
    }

    // Lấy frame từ video và vẽ vào canvas (cắt theo chuẩn tỉ lệ ô ảnh của bố cục đang chọn và lật gương ngang)
    if (photoboothVideo && photoboothCaptureCanvas) {
      const vWidth = photoboothVideo.videoWidth || 1280;
      const vHeight = photoboothVideo.videoHeight || 720;

      // Tỉ lệ ô ảnh tương ứng với layout đang chọn:
      // Layout 2: 452 / 373 (~1.2118) | Layout 3: 450 / 238 (~1.8908) | Layout 6: 215 / 240 (~0.8958)
      let targetRatio = 215 / 240;
      if (currentLayout === '2') {
        targetRatio = 452 / 373;
      } else if (currentLayout === '3') {
        targetRatio = 450 / 238;
      }
      const videoRatio = vWidth / vHeight;

      let sWidth, sHeight, sx, sy;
      if (videoRatio > targetRatio) {
        // Video rộng hơn tỉ lệ mục tiêu -> cắt 2 bên trái phải (canh giữa)
        sHeight = vHeight;
        sWidth = Math.round(vHeight * targetRatio);
        sx = Math.round((vWidth - sWidth) / 2);
        sy = 0;
      } else {
        // Video cao hơn tỉ lệ mục tiêu -> cắt trên dưới (canh giữa)
        sWidth = vWidth;
        sHeight = Math.round(vWidth / targetRatio);
        sx = 0;
        sy = Math.round((vHeight - sHeight) / 2);
      }

      // Lưu frame video vào rawCaptureCanvas để có thể đổi filter linh hoạt bất kỳ lúc nào
      rawCaptureCanvas.width = sWidth;
      rawCaptureCanvas.height = sHeight;
      const rawCtx = rawCaptureCanvas.getContext('2d');
      rawCtx.clearRect(0, 0, sWidth, sHeight);
      rawCtx.save();
      // Lật gương ngang nếu là camera trước (selfie) để khớp với video preview
      if (currentFacingMode === 'user') {
        rawCtx.translate(sWidth, 0);
        rawCtx.scale(-1, 1);
      }
      rawCtx.drawImage(photoboothVideo, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
      rawCtx.restore();

      // Xuất ảnh áp dụng bộ lọc màu đã chọn
      updateCapturedPhotoFromRaw();
    }

    isCountingDown = false;
    setUiState('PHOTO_REVIEW');
  }

  // 6. XỬ LÝ CHỤP LẠI (RETAKE) & DÙNG ẢNH (ACCEPT)
  function handleRetakeCurrent() {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
    isCountingDown = false;
    capturedPhoto = null;
    uncroppedUploadUrl = null;
    if (inputUploadPhoto) inputUploadPhoto.value = '';
    if (inputUploadPhotoSlot) inputUploadPhotoSlot.value = '';
    // Quay lại camera chụp lại cùng vị trí ảnh hiện tại
    if (videoStream) {
      setUiState('CAMERA');
    } else {
      startCamera();
    }
  }

  function handleAcceptCurrent() {
    if (!capturedPhoto) return;

    // Lưu ảnh vào mảng và cập nhật khung
    photos[currentPhotoIndex] = capturedPhoto;
    updateStripSlot(currentPhotoIndex);
    capturedPhoto = null;
    uncroppedUploadUrl = null;
    if (inputUploadPhoto) inputUploadPhoto.value = '';
    if (inputUploadPhotoSlot) inputUploadPhotoSlot.value = '';

    if (window.XMAS_SHARED && window.XMAS_SHARED.playGiftChime) {
      window.XMAS_SHARED.playGiftChime();
    }

    // Kiểm tra xem đã đủ số ảnh cần thiết theo layout hiện tại chưa (6 ô, 3 ô hoặc 2 ô)
    const maxSlots = getMaxSlots();
    const isAllCompleted = photos.slice(0, maxSlots).every(p => p !== null);

    if (isAllCompleted) {
      // Đã đủ ảnh -> Chuyển sang màn hình kết quả
      handleFinishSession();
    } else {
      // Tìm ô tiếp theo chưa có ảnh trong phạm vi maxSlots
      let nextIndex = (currentPhotoIndex + 1) % maxSlots;
      while (photos[nextIndex] !== null && !isAllCompleted) {
        nextIndex = (nextIndex + 1) % maxSlots;
      }
      currentPhotoIndex = nextIndex;

      // Tiếp tục chụp ô tiếp theo
      if (videoStream) {
        setUiState('CAMERA');
      } else {
        startCamera();
      }
    }
  }

  // 7. HOÀN THÀNH 6 ẢNH (FINAL RESULT)
  function handleFinishSession() {
    stopCamera();
    setUiState('FINAL_RESULT');

    // Hiển thị ảnh ô đầu tiên hoặc ảnh vừa chụp lên màn hình review
    if (photoboothReviewImg && photos[0]) {
      photoboothReviewImg.src = photos[0];
    }

    // Hiệu ứng pháo tuyết rực rỡ chào mừng
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#f5cf68', '#dc2626', '#16a34a', '#ffffff']
        });
      } catch (e) {}
    }

    // Lưu ảnh kỷ niệm nếu cần dùng cho thiệp Polaroid
    try {
      if (photos[0]) {
        localStorage.setItem('photobooth_photo', photos[0]);
      }
    } catch (e) {}
  }

  // Chụp lại từ đầu
  function handleRetakeAll() {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
    isCountingDown = false;
    photos.fill(null);
    currentPhotoIndex = 0;
    capturedPhoto = null;
    uncroppedUploadUrl = null;
    if (inputUploadPhoto) inputUploadPhoto.value = '';
    if (inputUploadPhotoSlot) inputUploadPhotoSlot.value = '';

    // Reset lại 6 ô trên khung strip
    for (let i = 0; i < 6; i++) {
      updateStripSlot(i);
    }
    clearAllStickers();

    updateProgressUI();
    startCamera();
  }

  // 7b. XEM LẠI, QUẢN LÝ VÀ XÓA ẢNH TỪNG Ô (PHOTO INSPECTION & DELETE CONTROLLER)
  let activeInspectSlotIndex = -1;

  function showToast(message) {
    // Đã tắt các thông báo pop-up nổi để đảm bảo giao diện gọn gàng, không che khuất màn hình
  }

  function openPhotoInspectModal(slotIdx) {
    if (!photos[slotIdx]) return;
    activeInspectSlotIndex = slotIdx;

    const modal = document.getElementById('pb-photo-inspect-modal');
    const titleEl = document.getElementById('pb-inspect-title');
    const imgEl = document.getElementById('pb-inspect-img');

    if (titleEl) {
      titleEl.innerHTML = `<span>🎄</span> <span>Xem Lại Ảnh Ô ${slotIdx + 1}</span>`;
    }
    if (imgEl) {
      imgEl.src = photos[slotIdx];
    }
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function closePhotoInspectModal() {
    const modal = document.getElementById('pb-photo-inspect-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    activeInspectSlotIndex = -1;
  }

  function deletePhotoAtSlot(slotIdx) {
    const maxSlots = getMaxSlots();
    if (slotIdx < 0 || slotIdx >= maxSlots) return;
    photos[slotIdx] = null;
    updateStripSlot(slotIdx);
    currentPhotoIndex = slotIdx;
    updateProgressUI();
    closePhotoInspectModal();

    // Nếu đang ở màn hình kết quả hoàn thành thì chuyển về trạng thái chụp để người dùng chụp bù
    if (currentState === 'FINAL_RESULT') {
      if (videoStream) {
        setUiState('CAMERA');
      } else {
        setUiState('IDLE');
      }
    } else if (currentState === 'CAMERA') {
      updateProgressUI();
    } else if (currentState === 'PHOTO_REVIEW') {
      capturedPhoto = null;
      uncroppedUploadUrl = null;
      startCamera();
    }

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(880);
    }
  }

  function retakePhotoAtSlot(slotIdx) {
    const maxSlots = getMaxSlots();
    if (slotIdx < 0 || slotIdx >= maxSlots) return;
    photos[slotIdx] = null;
    capturedPhoto = null;
    uncroppedUploadUrl = null;
    updateStripSlot(slotIdx);
    currentPhotoIndex = slotIdx;
    updateProgressUI();
    closePhotoInspectModal();
    startCamera();
  }

  // 7c. DÁN & TRANG TRÍ STICKER NOEL TRÊN KHUNG PHOTOBOOTH (STICKER ENGINE)
  const STICKER_DEFS = {
    santa_hat: { name: 'Mũ Noel', src: 'assets/images/stickers/santa_hat.png', defaultScale: 1.15 },
    reindeer_antlers: { name: 'Sừng hươu', src: 'assets/images/stickers/reindeer_antlers.svg', defaultScale: 1.25 },
    bow: { name: 'Nơ đỏ', src: 'assets/images/ornaments/bow.png', defaultScale: 1.05 },
    mistletoe: { name: 'Tầm gửi', src: 'assets/images/stickers/mistletoe.svg', defaultScale: 1.0 },
    mini_tree: { name: 'Cây thông', src: 'assets/images/stickers/mini_tree.svg', defaultScale: 1.15 },
    candycane: { name: 'Kẹo gậy', src: 'assets/images/ornaments/candycane.png', defaultScale: 1.0 },
    gingerbread: { name: 'Bánh gừng', src: 'assets/images/ornaments/gingerbread.png', defaultScale: 1.05 },
    bell: { name: 'Chuông vàng', src: 'assets/images/ornaments/bell.png', defaultScale: 1.0 },
    snowflake: { name: 'Bông tuyết', src: 'assets/images/ornaments/snowflake.png', defaultScale: 0.95 },
    star_gold: { name: 'Sao vàng', src: 'assets/images/ornaments/star_gold.png', defaultScale: 1.05 },
    gifts: { name: 'Hộp quà', src: 'assets/images/ornaments/gifts.png', defaultScale: 1.05 },
    bear_santa: { name: 'Gấu Noel', src: 'assets/images/ornaments/bear_santa.png', defaultScale: 1.15 }
  };

  const preloadedStickerImages = {};
  Object.entries(STICKER_DEFS).forEach(([key, def]) => {
    const img = new Image();
    img.src = def.src;
    preloadedStickerImages[key] = img;
  });

  const BASE_STICKER_WIDTH_PERCENT = 22; // Tỷ lệ chiều rộng chuẩn trên dải khung (22%)
  const placedStickers = []; // Danh sách sticker đã dán: [{ id, type, src, xPercent, yPercent, scale, rotation, el }]
  let selectedStickerId = null;
  let activeStickerType = null; // Sticker đang được chọn từ bảng để chuẩn bị dán lên khung ảnh

  const stickersLayer = document.getElementById('photobooth-stickers-layer');
  const stripContainer = document.getElementById('photobooth-strip-container');
  const pbStickerDrawer = document.getElementById('pb-sticker-drawer');
  const btnClearStickers = document.getElementById('btn-clear-stickers');
  const stickerItemBtns = document.querySelectorAll('.pb-sticker-item');

  function setActiveStickerTool(type) {
    if (activeStickerType === type) {
      activeStickerType = null;
    } else {
      activeStickerType = type;
      deselectAllStickers();
    }

    stickerItemBtns.forEach(btn => {
      btn.classList.toggle('is-active-tool', btn.dataset.sticker === activeStickerType);
    });

    if (activeStickerType) {
      if (stripContainer) stripContainer.classList.add('stamp-mode-active');
      if (stickersLayer) stickersLayer.classList.add('stamp-mode-active');

      if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
        window.XMAS_SHARED.playJingleBellSound(1046.5);
      }

      // Trên màn hình di động: cuộn nhẹ đến khung ảnh nếu đang nằm ngoài tầm nhìn
      if (window.innerWidth < 1024 && stripContainer) {
        const rect = stripContainer.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.75 || rect.bottom < window.innerHeight * 0.2) {
          stripContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else {
      if (stripContainer) stripContainer.classList.remove('stamp-mode-active');
      if (stickersLayer) stickersLayer.classList.remove('stamp-mode-active');
    }
  }

  function selectSticker(id) {
    selectedStickerId = id;
    if (!stickersLayer) return;
    stickersLayer.querySelectorAll('.placed-sticker').forEach(el => {
      if (el.dataset.id === id) {
        el.classList.add('selected');
        stickersLayer.appendChild(el); // Đưa sticker được chọn lên trên cùng
      } else {
        el.classList.remove('selected');
      }
    });
  }

  function deselectAllStickers() {
    selectedStickerId = null;
    if (!stickersLayer) return;
    stickersLayer.querySelectorAll('.placed-sticker').forEach(el => {
      el.classList.remove('selected');
    });
  }

  function attachStickerEvents(sticker) {
    const el = sticker.el;
    const deleteBtn = el.querySelector('.sticker-btn-delete');
    const resizeHandle = el.querySelector('.sticker-handle-resize');

    if (deleteBtn) {
      deleteBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSticker(sticker.id);
      });
    }

    // Kéo di chuyển Sticker (Drag & Drop)
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialXPercent = sticker.xPercent;
    let initialYPercent = sticker.yPercent;

    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.sticker-btn-delete') || e.target.closest('.sticker-handle-resize')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      selectSticker(sticker.id);

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialXPercent = sticker.xPercent;
      initialYPercent = sticker.yPercent;
      el.classList.add('is-dragging');
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!isDragging || !stripContainer) return;
      const rect = stripContainer.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      const newXPercent = initialXPercent + (deltaX / rect.width) * 100;
      const newYPercent = initialYPercent + (deltaY / rect.height) * 100;

      // Giới hạn trong phạm vi khung ảnh (-8% đến 108%)
      sticker.xPercent = Math.max(-8, Math.min(108, newXPercent));
      sticker.yPercent = Math.max(-8, Math.min(108, newYPercent));

      el.style.left = `${sticker.xPercent}%`;
      el.style.top = `${sticker.yPercent}%`;
    });

    const stopDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        el.classList.remove('is-dragging');
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    el.addEventListener('pointerup', stopDrag);
    el.addEventListener('pointercancel', stopDrag);

    // Xoay và Phóng to/Thu nhỏ Sticker (Rotate & Scale)
    if (resizeHandle) {
      let isResizing = false;
      let initialDist = 1;
      let initialAngle = 0;
      let initialScale = 1;
      let initialRotation = 0;
      let centerX = 0;
      let centerY = 0;

      resizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectSticker(sticker.id);

        const rect = stripContainer.getBoundingClientRect();
        centerX = rect.left + (sticker.xPercent / 100) * rect.width;
        centerY = rect.top + (sticker.yPercent / 100) * rect.height;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        initialDist = Math.hypot(dx, dy) || 1;
        initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        initialScale = sticker.scale;
        initialRotation = sticker.rotation;

        isResizing = true;
        resizeHandle.setPointerCapture(e.pointerId);
      });

      resizeHandle.addEventListener('pointermove', (e) => {
        if (!isResizing) return;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const currentDist = Math.hypot(dx, dy);
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

        const scaleMultiplier = currentDist / initialDist;
        sticker.scale = Math.max(0.4, Math.min(3.5, initialScale * scaleMultiplier));

        const angleDelta = currentAngle - initialAngle;
        sticker.rotation = Math.round((initialRotation + angleDelta) % 360);

        el.style.width = `${BASE_STICKER_WIDTH_PERCENT * sticker.scale}%`;
        el.style.transform = `translate(-50%, -50%) rotate(${sticker.rotation}deg)`;
      });

      const stopResize = (e) => {
        if (isResizing) {
          isResizing = false;
          try { resizeHandle.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };

      resizeHandle.addEventListener('pointerup', stopResize);
      resizeHandle.addEventListener('pointercancel', stopResize);
    }
  }

  function addStickerAt(type, xPercent, yPercent) {
    const def = STICKER_DEFS[type];
    if (!def || !stickersLayer) return null;

    const id = 'stk_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const scale = def.defaultScale || 1.0;
    const rotation = Math.round(Math.random() * 10 - 5);

    const stickerEl = document.createElement('div');
    stickerEl.className = 'placed-sticker selected';
    stickerEl.dataset.id = id;
    stickerEl.style.left = `${xPercent}%`;
    stickerEl.style.top = `${yPercent}%`;
    stickerEl.style.width = `${BASE_STICKER_WIDTH_PERCENT * scale}%`;
    stickerEl.style.aspectRatio = '1 / 1';
    stickerEl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

    stickerEl.innerHTML = `
      <img src="${def.src}" class="placed-sticker-img" alt="${def.name}" draggable="false" />
      <div class="sticker-controls">
        <button type="button" class="sticker-btn-delete" title="Xóa sticker"><i class="fa-solid fa-xmark"></i></button>
        <div class="sticker-handle-resize" title="Xoay và phóng to"><i class="fa-solid fa-arrows-up-down-left-right"></i></div>
      </div>
    `;

    stickersLayer.appendChild(stickerEl);

    const stickerObj = {
      id,
      type,
      src: def.src,
      xPercent,
      yPercent,
      scale,
      rotation,
      el: stickerEl
    };

    placedStickers.push(stickerObj);
    selectSticker(id);
    attachStickerEvents(stickerObj);

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1318.51);
    }
    return stickerObj;
  }

  function addSticker(type) {
    const xPercent = 50 + (Math.random() * 14 - 7);
    const yPercent = 38 + (Math.random() * 16 - 8);
    return addStickerAt(type, xPercent, yPercent);
  }

  function handleStripStampClick(e) {
    // Nếu click trúng sticker đã có, nút xóa, nút xoay -> không dán mới
    if (e.target.closest('.placed-sticker')) {
      return;
    }

    if (activeStickerType && stripContainer) {
      e.preventDefault();
      e.stopPropagation();

      const rect = stripContainer.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Giới hạn trong vùng khung ảnh an toàn (8% đến 92% chiều ngang, 6% đến 94% chiều dọc)
      const xPercent = Math.max(8, Math.min(92, (clickX / rect.width) * 100));
      const yPercent = Math.max(6, Math.min(94, (clickY / rect.height) * 100));

      const typeToPlace = activeStickerType;
      setActiveStickerTool(null); // Tắt chế độ stamp sau khi dán 1 sticker
      addStickerAt(typeToPlace, xPercent, yPercent);
    }
  }

  function deleteSticker(id) {
    const idx = placedStickers.findIndex(s => s.id === id);
    if (idx !== -1) {
      const sticker = placedStickers[idx];
      if (sticker.el && sticker.el.parentNode) {
        sticker.el.parentNode.removeChild(sticker.el);
      }
      placedStickers.splice(idx, 1);
    }
    if (selectedStickerId === id) {
      selectedStickerId = null;
    }
    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(659.25);
    }
  }

  function clearAllStickers() {
    if (placedStickers.length === 0) return;
    placedStickers.forEach(s => {
      if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
    });
    placedStickers.length = 0;
    selectedStickerId = null;
    setActiveStickerTool(null);
    showToast('🗑️ Đã xóa hết sticker trên khung ảnh.');
  }

  // 8. GHÉP ẢNH CANVAS CHẤT LƯỢNG CAO & XUẤT PNG (EXPORT 2K HD)
  async function downloadPhotoboothStrip() {
    const maxSlots = getMaxSlots();
    const filledCount = photos.slice(0, maxSlots).filter(Boolean).length;
    if (filledCount === 0) {
      alert('Vui lòng chụp ít nhất một bức ảnh trước khi tải về nhé!');
      return;
    }

    const frameConfig = FRAME_CONFIGS[currentLayout][currentColor];
    const targetFrame = preloadedFrames[`${currentLayout}_${currentColor}`];

    const scale = 2; // Độ phân giải xuất 1152 × 2048 (2K siêu nét)
    const canvas = document.createElement('canvas');
    canvas.width = 576 * scale;
    canvas.height = 1024 * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tải trước toàn bộ các ảnh đã chụp theo maxSlots thành HTMLImageElement
    const loadedImages = await Promise.all(
      photos.slice(0, maxSlots).map(src => {
        if (!src) return Promise.resolve(null);
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      })
    );

    // 2. Vẽ các ảnh vào ô tương ứng (2 hoặc 6 ô) theo thuật toán object-fit: cover (không méo hình)
    for (let i = 0; i < maxSlots; i++) {
      const slot = frameConfig.slots[i];
      const photo = loadedImages[i];
      const destX = slot.x * scale;
      const destY = slot.y * scale;
      const destW = slot.width * scale;
      const destH = slot.height * scale;

      if (photo) {
        const imgRatio = photo.width / photo.height;
        const slotRatio = destW / destH;
        let sWidth, sHeight, sx, sy;

        if (imgRatio > slotRatio) {
          sHeight = photo.height;
          sWidth = photo.height * slotRatio;
          sx = (photo.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = photo.width;
          sHeight = photo.width / slotRatio;
          sx = 0;
          sy = (photo.height - sHeight) / 2;
        }

        ctx.drawImage(photo, sx, sy, sWidth, sHeight, destX, destY, destW, destH);
      } else {
        // Ô trống: vẽ nền trang nhã với số thứ tự
        ctx.fillStyle = '#2d060e';
        ctx.fillRect(destX, destY, destW, destH);
      }
    }

    // 3. Đảm bảo ảnh khung đã load xong và vẽ đè lên trên cùng
    if (!targetFrame.complete) {
      await new Promise(r => { targetFrame.onload = r; });
    }
    ctx.drawImage(targetFrame, 0, 0, canvas.width, canvas.height);

    // 3.5. Vẽ các Sticker đã dán lên trên cùng của dải khung (nếu có)
    if (placedStickers && placedStickers.length > 0) {
      for (const sticker of placedStickers) {
        let img = preloadedStickerImages[sticker.type];
        if (!img || !img.complete) {
          img = await new Promise(resolve => {
            const tempImg = new Image();
            tempImg.onload = () => resolve(tempImg);
            tempImg.onerror = () => resolve(null);
            tempImg.src = sticker.src;
          });
        }
        if (img && (img.naturalWidth > 0 || img.width > 0)) {
          const natW = img.naturalWidth || img.width || 100;
          const natH = img.naturalHeight || img.height || 100;
          const cx = (sticker.xPercent / 100) * canvas.width;
          const cy = (sticker.yPercent / 100) * canvas.height;
          const boxSize = (BASE_STICKER_WIDTH_PERCENT / 100) * canvas.width * sticker.scale;

          const imgRatio = natW / natH;
          let drawW = boxSize;
          let drawH = boxSize;
          if (imgRatio > 1) {
            drawH = boxSize / imgRatio;
          } else {
            drawW = boxSize * imgRatio;
          }

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((sticker.rotation * Math.PI) / 180);

          // Hiệu ứng drop shadow mềm mại chân thực
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 10 * scale;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4 * scale;

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        }
      }
    }

    // 4. Kích hoạt tải file PNG chất lượng cao
    const filename = `christmas-photobooth-${currentLayout}-o-${currentColor}-${Date.now()}.png`;
    function triggerDownload(url) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 1000);
    }

    if (canvas.toBlob) {
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          triggerDownload(url);
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        } else {
          triggerDownload(canvas.toDataURL('image/png'));
        }
      }, 'image/png');
    } else {
      triggerDownload(canvas.toDataURL('image/png'));
    }

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1567.98);
    }
  }

  // 9. CÔNG CỤ CẮT VÀ CĂN CHỈNH ẢNH (CROPPER.JS THEO TỈ LỆ KHUNG)
  function getLayoutAspectRatio() {
    if (currentLayout === '2') {
      return 452 / 373; // ~1.2118
    }
    if (currentLayout === '3') {
      return 450 / 238; // ~1.8908
    }
    return 215 / 240; // ~0.8958 (chuẩn 6 ô)
  }

  function openCropModal(imageUrl) {
    if (!imageUrl) return;

    previousStateBeforeCrop = currentState;

    if (cropModalTitle) {
      const layoutText = currentLayout === '2' ? '2 Ô' : (currentLayout === '3' ? '3 Ô' : '6 Ô');
      cropModalTitle.innerHTML = `<span>✂️</span> <span>Cắt & Căn Chỉnh (${layoutText})</span>`;
    }

    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }

    if (imageCropModal) {
      imageCropModal.classList.remove('hidden');
    }

    const initCropper = () => {
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      if (typeof Cropper === 'undefined') {
        console.warn('Cropper.js chưa sẵn sàng!');
        return;
      }

      cropperInstance = new Cropper(cropTargetImg, {
        aspectRatio: getLayoutAspectRatio(),
        viewMode: 1, // Luôn giới hạn khung cắt nằm trọn vẹn trong ảnh
        dragMode: 'move', // Cho phép kéo di chuyển ảnh
        autoCropArea: 1, // Mặc định mở rộng tối đa theo tỉ lệ khung
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        responsive: true,
        background: false
      });
    };

    if (cropTargetImg) {
      cropTargetImg.onload = () => {
        requestAnimationFrame(() => {
          setTimeout(initCropper, 40);
        });
      };
      cropTargetImg.src = imageUrl;
      if (cropTargetImg.complete && cropTargetImg.naturalWidth > 0) {
        requestAnimationFrame(() => {
          setTimeout(initCropper, 40);
        });
      }
    }
  }

  function closeCropModal() {
    if (imageCropModal) {
      imageCropModal.classList.add('hidden');
    }
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    if (inputUploadPhoto) inputUploadPhoto.value = '';
    if (inputUploadPhotoSlot) inputUploadPhotoSlot.value = '';

    // Nếu người dùng đóng modal mà chưa có ảnh nào được áp dụng
    if (!capturedPhoto) {
      if (previousStateBeforeCrop === 'CAMERA') {
        startCamera();
      } else {
        setUiState('IDLE');
      }
    }
  }

  function applyCrop() {
    if (!cropperInstance) {
      closeCropModal();
      return;
    }

    // Xuất canvas chất lượng cao, giữ độ nét tối đa
    const croppedCanvas = cropperInstance.getCroppedCanvas({
      maxWidth: 2400,
      maxHeight: 2400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    if (!croppedCanvas) {
      alert('Không thể cắt ảnh này, vui lòng thử lại!');
      return;
    }

    // Lưu ảnh cắt vào rawCaptureCanvas để có thể đổi filter linh hoạt
    rawCaptureCanvas.width = croppedCanvas.width;
    rawCaptureCanvas.height = croppedCanvas.height;
    const rawCtx = rawCaptureCanvas.getContext('2d');
    rawCtx.clearRect(0, 0, croppedCanvas.width, croppedCanvas.height);
    rawCtx.drawImage(croppedCanvas, 0, 0);

    // Xuất ảnh áp dụng bộ lọc màu đã chọn
    updateCapturedPhotoFromRaw();

    stopCamera();
    setUiState('PHOTO_REVIEW');

    if (imageCropModal) {
      imageCropModal.classList.add('hidden');
    }
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    if (inputUploadPhoto) inputUploadPhoto.value = '';
    if (inputUploadPhotoSlot) inputUploadPhotoSlot.value = '';

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1318.51);
    }
  }

  // 9b. XỬ LÝ TẢI ẢNH TỪ MÁY LÊN (UPLOAD VÀ TỰ ĐỘNG CẮT THEO TỈ LỆ KHUNG)
  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ!');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      stopCamera();
      uncroppedUploadUrl = ev.target.result;
      openCropModal(uncroppedUploadUrl);
    };
    reader.readAsDataURL(file);
  }

  // 10. BẮT SỰ KIỆN NÚT VÀ TƯƠNG TÁC
  if (btnStartCamera) btnStartCamera.addEventListener('click', startCamera);
  if (btnSnapPhoto) btnSnapPhoto.addEventListener('click', () => triggerCapture(false));

  if (btnCountdownSnapNow) {
    btnCountdownSnapNow.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerCapture(true);
    });
  }

  if (photoboothCountdownOverlay) {
    photoboothCountdownOverlay.addEventListener('click', () => {
      triggerCapture(true);
    });
  }

  // Chọn thời gian hẹn giờ (0s, 3s, 5s, 10s)
  timerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = parseInt(btn.dataset.time, 10);
      if (!isNaN(val)) {
        selectedCountdown = val;
        timerBtns.forEach(b => b.classList.toggle('active', b === btn));
        updateSnapButtonLabel();
      }
    });
  });

  if (btnRetakePhoto) btnRetakePhoto.addEventListener('click', handleRetakeCurrent);
  if (btnAcceptPhoto) btnAcceptPhoto.addEventListener('click', handleAcceptCurrent);
  if (btnRetakeAll) btnRetakeAll.addEventListener('click', handleRetakeAll);
  // Bắt sự kiện chọn bố cục khung ảnh (6 ô hoặc 2 ô)
  layoutOptBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const layout = btn.dataset.layout;
      if (layout) selectLayout(layout);
    });
  });

  // Bắt sự kiện chọn màu sắc khung ảnh
  frameOptBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.frame;
      if (key) selectColor(key);
    });
  });

  // Bắt sự kiện đảo camera Trước / Sau
  if (btnFlipCamera) {
    btnFlipCamera.addEventListener('click', (e) => {
      e.stopPropagation();
      flipCamera();
    });
  }

  // Bắt sự kiện chọn Bộ lọc màu Giáng Sinh / Tông màu da
  filterPillBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const filterId = btn.dataset.filter;
      if (filterId) {
        selectFilter(filterId);
        if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
          window.XMAS_SHARED.playJingleBellSound(880);
        }
      }
    });
  });

  if (btnDownloadFinal) btnDownloadFinal.addEventListener('click', downloadPhotoboothStrip);
  if (btnDownloadStrip) btnDownloadStrip.addEventListener('click', downloadPhotoboothStrip);

  if (inputUploadPhoto) {
    inputUploadPhoto.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) handleImageUpload(file);
    });
  }

  if (inputUploadPhotoSlot) {
    inputUploadPhotoSlot.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) handleImageUpload(file);
    });
  }

  // Chỉ cho phép bấm vào từng ô thumbnail ở thanh tiến trình (Ảnh 2) để xem lại (giữ lại ảnh, xóa hoặc chụp lại) hoặc chuyển sang chụp ô đó.
  // Các ô trong khung ảnh (stripSlots) được cố định hoàn toàn, chụp xong không sửa/không xem/xóa trực tiếp từ khung.
  thumbSlots.forEach(el => {
    el.addEventListener('click', () => {
      if (isCountingDown) return;
      const slotIdx = parseInt(el.dataset.slot, 10);
      const maxSlots = getMaxSlots();
      if (!isNaN(slotIdx) && slotIdx < maxSlots) {
        if (photos[slotIdx]) {
          openPhotoInspectModal(slotIdx);
        } else {
          currentPhotoIndex = slotIdx;
          startCamera();
        }
      }
    });
  });

  // Bắt sự kiện trên Modal xem lại và xóa ảnh
  const btnInspectDelete = document.getElementById('btn-inspect-delete');
  const btnInspectRetake = document.getElementById('btn-inspect-retake');
  const btnInspectKeep = document.getElementById('btn-inspect-keep');
  const btnCloseInspectModal = document.getElementById('btn-close-inspect-modal');
  const pbInspectModal = document.getElementById('pb-photo-inspect-modal');

  if (btnInspectDelete) {
    btnInspectDelete.addEventListener('click', () => {
      deletePhotoAtSlot(activeInspectSlotIndex);
    });
  }

  if (btnInspectRetake) {
    btnInspectRetake.addEventListener('click', () => {
      retakePhotoAtSlot(activeInspectSlotIndex);
    });
  }

  if (btnInspectKeep) {
    btnInspectKeep.addEventListener('click', closePhotoInspectModal);
  }

  if (btnCloseInspectModal) {
    btnCloseInspectModal.addEventListener('click', closePhotoInspectModal);
  }

  if (pbInspectModal) {
    pbInspectModal.addEventListener('click', (e) => {
      if (e.target === pbInspectModal) {
        closePhotoInspectModal();
      }
    });
  }

  // Bắt sự kiện trên Modal cắt và căn chỉnh ảnh (Cropper)
  if (btnCropCurrentPhoto) {
    btnCropCurrentPhoto.addEventListener('click', () => {
      const sourceImg = uncroppedUploadUrl || capturedPhoto;
      if (sourceImg) {
        openCropModal(sourceImg);
      } else {
        alert('Chưa có ảnh để cắt!');
      }
    });
  }

  if (btnCropZoomIn) {
    btnCropZoomIn.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.zoom(0.1);
    });
  }

  if (btnCropZoomOut) {
    btnCropZoomOut.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.zoom(-0.1);
    });
  }

  if (btnCropRotateLeft) {
    btnCropRotateLeft.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.rotate(-90);
    });
  }

  if (btnCropRotateRight) {
    btnCropRotateRight.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.rotate(90);
    });
  }

  if (btnCropReset) {
    btnCropReset.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.reset();
    });
  }

  if (btnCropCancel) {
    btnCropCancel.addEventListener('click', closeCropModal);
  }

  if (btnCloseCropModal) {
    btnCloseCropModal.addEventListener('click', closeCropModal);
  }

  if (btnCropApply) {
    btnCropApply.addEventListener('click', applyCrop);
  }

  if (imageCropModal) {
    imageCropModal.addEventListener('click', (e) => {
      if (e.target === imageCropModal) {
        closeCropModal();
      }
    });
  }

  // Bắt sự kiện chọn và tương tác với Sticker Noel
  stickerItemBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const stickerType = btn.dataset.sticker;
      if (stickerType) {
        setActiveStickerTool(stickerType);
      }
    });
  });

  if (stripContainer) {
    stripContainer.addEventListener('click', handleStripStampClick);
  }
  if (stickersLayer) {
    stickersLayer.addEventListener('click', handleStripStampClick);
  }


  if (btnClearStickers) {
    btnClearStickers.addEventListener('click', (e) => {
      e.stopPropagation();
      clearAllStickers();
    });
  }


  const btnScrollToStrip = document.getElementById('btn-scroll-to-strip');
  if (btnScrollToStrip) {
    btnScrollToStrip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stripContainer) {
        stripContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Bỏ chọn sticker khi click ra ngoài vùng sticker
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.placed-sticker') && 
        !e.target.closest('.pb-sticker-item') && 
        !e.target.closest('#btn-clear-stickers') && 
        !e.target.closest('#btn-toggle-stickers')) {
      deselectAllStickers();
    }
  });

  window.addEventListener('keydown', (e) => {
    // Không bắt phím khi người dùng đang nhập text trong input
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if (e.code === 'Space' || e.key === ' ') {
      if (currentState === 'CAMERA') {
        e.preventDefault();
        triggerCapture();
      } else if (currentState === 'COUNTDOWN') {
        e.preventDefault();
        triggerCapture(true); // Bỏ qua đếm ngược và chụp ngay
      } else if (currentState === 'PHOTO_REVIEW') {
        e.preventDefault();
        handleAcceptCurrent();
      }
    } else if (e.code === 'Escape' || e.key === 'Escape') {
      if (isCountingDown) {
        if (countdownTimer) {
          clearTimeout(countdownTimer);
          countdownTimer = null;
        }
        isCountingDown = false;
        if (photoboothCountdownOverlay) photoboothCountdownOverlay.classList.add('hidden');
        setUiState('CAMERA');
      } else if (imageCropModal && !imageCropModal.classList.contains('hidden')) {
        closeCropModal();
      } else {
        closePhotoInspectModal();
      }
    }
  });

  // Tự động giải phóng camera khi rời khỏi trang
  window.addEventListener('beforeunload', stopCamera);
  window.addEventListener('pagehide', stopCamera);

  // Khởi tạo trạng thái ban đầu
  updateFrameVisuals();
  setUiState('IDLE');

  window.__photobooth = {
    FRAME_CONFIGS,
    preloadedFrames,
    photos,
    PHOTOBOOTH_FILTERS,
    selectFilter,
    flipCamera,
    selectLayout,
    selectColor,
    downloadPhotoboothStrip,
    openPhotoInspectModal,
    deletePhotoAtSlot,
    retakePhotoAtSlot,
    setUiState,
    executeSnap,
    triggerCapture,
    handleAcceptCurrent,
    openCropModal,
    closeCropModal,
    applyCrop,
    getLayoutAspectRatio,
    STICKER_DEFS,
    placedStickers,
    addSticker,
    addStickerAt,
    deleteSticker,
    clearAllStickers,
    selectSticker,
    deselectAllStickers,
    setActiveStickerTool,
    getActiveStickerTool: () => activeStickerType
  };
});
