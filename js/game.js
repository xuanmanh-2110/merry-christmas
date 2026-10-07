/**
 * CHRISTMAS TREE DECORATION GAME ENGINE
 * Full interactive system: Tree Color, Fairy LED Lights, Accessories, Drag & Drop, Sound, Completion Modal
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. STATE MANAGEMENT
  let currentTreeColor = 'green';
  let currentLedColor = 'red';
  let currentStarColor = 'gold'; // Màu ngôi sao đỉnh cây có thể tùy chỉnh
  let selectedAccessory = null; // Khi vào chưa chọn phụ kiện nào theo yêu cầu người dùng
  let placedOrnaments = []; // Khởi tạo cây thông sạch chưa trang trí gì theo yêu cầu
  let placedGroundItems = []; // Khởi tạo khay đồ dưới gốc chưa đặt món nào

  // 2. COLOR PALETTES (Áp dụng CSS Filter thời gian thực cho ảnh cây thông tách nền)
  const TREE_COLORS = {
    red: { name: 'Cây Đỏ Noel', filter: 'hue-rotate(240deg) saturate(1.5) contrast(1.1)' },
    green: { name: 'Cây Xanh Thông', filter: 'none' },
    blue: { name: 'Cây Xanh Đêm', filter: 'hue-rotate(145deg) saturate(1.3)' },
    yellow: { name: 'Cây Vàng Kim', filter: 'hue-rotate(305deg) saturate(1.8) brightness(1.2)' },
    white: { name: 'Cây Trắng Tuyết', filter: 'grayscale(1) brightness(1.65) contrast(0.95)' },
    bronze: { name: 'Cây Vàng Đồng', filter: 'hue-rotate(280deg) saturate(1.5) brightness(0.95) sepia(0.25)' }
  };

  const LED_COLORS = {
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#facc15',
    white: '#ffffff',
    gold: '#f59e0b'
  };

  const TREE_BULB_POSITIONS = [
    // Dây 1 (Đỉnh)
    { x: 47, y: 19 }, { x: 53, y: 22 }, { x: 59, y: 20 },
    // Dây 2
    { x: 40.5, y: 34 }, { x: 47.5, y: 37 }, { x: 54.5, y: 38 }, { x: 61.5, y: 36 }, { x: 68.5, y: 33 },
    // Dây 3
    { x: 31.5, y: 51 }, { x: 39.5, y: 54 }, { x: 47.5, y: 56 }, { x: 55.5, y: 56 }, { x: 64.5, y: 54 }, { x: 73.5, y: 50 },
    // Dây 4
    { x: 24.5, y: 66 }, { x: 32.5, y: 70 }, { x: 41.5, y: 72 }, { x: 51.5, y: 73 }, { x: 61.5, y: 72 }, { x: 70.5, y: 69 }, { x: 79.5, y: 65 },
    // Dây 5 (Đáy)
    { x: 18.5, y: 79 }, { x: 27.5, y: 82 }, { x: 38.5, y: 84 }, { x: 49.5, y: 85 }, { x: 59.5, y: 85 }, { x: 70.5, y: 83 }, { x: 81.5, y: 80 }, { x: 89, y: 77 }
  ];

  const STAR_COLORS = {
    gold: {
      name: 'Vàng Kim',
      base: '#facc15',
      stroke: '#ca8a04',
      light: '#fffbeb',
      mid: '#fef08a',
      dark: '#b45309',
      glow: 'rgba(250, 204, 21, 0.95)'
    },
    silver: {
      name: 'Bạc Tuyết',
      base: '#e2e8f0',
      stroke: '#94a3b8',
      light: '#ffffff',
      mid: '#f1f5f9',
      dark: '#64748b',
      glow: 'rgba(255, 255, 255, 0.95)'
    },
    red: {
      name: 'Đỏ Ruby',
      base: '#ef4444',
      stroke: '#991b1b',
      light: '#fca5a5',
      mid: '#f87171',
      dark: '#7f1d1d',
      glow: 'rgba(239, 68, 68, 0.95)'
    },
    blue: {
      name: 'Xanh Lam',
      base: '#38bdf8',
      stroke: '#0369a1',
      light: '#e0f2fe',
      mid: '#7dd3fc',
      dark: '#075985',
      glow: 'rgba(56, 189, 248, 0.95)'
    },
    green: {
      name: 'Xanh Ngọc',
      base: '#22c55e',
      stroke: '#15803d',
      light: '#dcfce7',
      mid: '#86efac',
      dark: '#14532d',
      glow: 'rgba(34, 197, 94, 0.95)'
    },
    pink: {
      name: 'Hồng Pha Lê',
      base: '#f43f5e',
      stroke: '#be123c',
      light: '#ffe4e6',
      mid: '#fb7185',
      dark: '#881337',
      glow: 'rgba(244, 63, 94, 0.95)'
    }
  };

  function getStarSvg(starColorKey) {
    const sc = STAR_COLORS[starColorKey] || STAR_COLORS.gold;
    const uid = 'tree-star-grad-' + starColorKey;
    return `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow" style="filter: drop-shadow(0 0 10px ${sc.glow});">
        <defs>
          <linearGradient id="${uid}-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${sc.light}" />
            <stop offset="100%" stop-color="${sc.mid}" />
          </linearGradient>
          <linearGradient id="${uid}-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${sc.base}" />
            <stop offset="100%" stop-color="${sc.dark}" />
          </linearGradient>
        </defs>
        <!-- Thân ngôi sao 3D giác cạnh sắc sảo -->
        <polygon points="50,6 62,38 96,38 68,58 78,92 50,72 22,92 32,58 4,38 38,38" fill="${sc.base}" stroke="${sc.stroke}" stroke-width="1.8" />
        <polygon points="50,6 62,38 50,72" fill="url(#${uid}-light)" />
        <polygon points="96,38 68,58 50,72" fill="url(#${uid}-dark)" />
        <polygon points="78,92 50,72 50,6" fill="url(#${uid}-light)" />
        <polygon points="22,92 32,58 50,72" fill="url(#${uid}-dark)" />
        <polygon points="4,38 38,38 50,72" fill="url(#${uid}-light)" />
        <!-- Điểm sáng trung tâm lấp lánh -->
        <circle cx="50" cy="50" r="4.5" fill="#ffffff" opacity="0.9" />
      </svg>
    `;
  }

  // 3. THƯ VIỆN HÌNH ẢNH PHỤ KIỆN TÁCH NỀN THẬT (THEO YÊU CẦU DÙNG ẢNH THẬT THAY VÌ CODE SVG)
  const IMAGE_ORNAMENTS = {
    gingerbread: 'assets/images/ornaments/gingerbread.png',
    snowglobe: 'assets/images/ornaments/snowglobe.png',
    nutcracker: 'assets/images/ornaments/nutcracker.png',
    bow: 'assets/images/ornaments/bow.png',
    bauble_red: 'assets/images/ornaments/bauble_red.png',
    reindeer: 'assets/images/ornaments/reindeer.png',
    candycane: 'assets/images/ornaments/candycane.png',
    bauble_gold: 'assets/images/ornaments/bauble_gold.png',
    bauble_trio: 'assets/images/ornaments/bauble_trio.png',
    bird: 'assets/images/ornaments/bird.png',
    gifts: 'assets/images/ornaments/gifts.png',
    teddy: 'assets/images/ornaments/teddy.png',
    cocoa: 'assets/images/ornaments/cocoa.png',
    train: 'assets/images/ornaments/train.png',
    candles: 'assets/images/ornaments/candles.png',
    star_silver: 'assets/images/ornaments/star_silver.png',
    star_gold: 'assets/images/ornaments/star_gold.png',
    bell: 'assets/images/ornaments/bell.png',
    stocking: 'assets/images/ornaments/stocking.png',
    snowflake: 'assets/images/ornaments/snowflake.png',
    bear_santa: 'assets/images/ornaments/bear_santa.png'
  };

  function getItemMarkup(type) {
    if (IMAGE_ORNAMENTS[type]) {
      return `<img src="${IMAGE_ORNAMENTS[type]}" alt="${type}" class="w-full h-full object-contain pointer-events-none select-none drop-shadow" draggable="false" decoding="async" />`;
    }
    if (SVG_ASSETS[type]) {
      return SVG_ASSETS[type];
    }
    return '';
  }

  // 3.2. SVG ICONS & ACCESSORIES ASSETS LIBRARY (Dành cho các phụ kiện phụ)
  const SVG_ASSETS = {
    // 1. Người bánh gừng
    gingerbread: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Thân bánh nướng vàng -->
        <path d="M50,15 C40,15 35,25 35,33 C35,40 40,45 42,48 C35,50 20,53 15,62 C11,70 18,76 25,72 C33,67 38,62 42,60 C42,68 40,78 35,90 C32,96 40,100 46,96 C50,91 50,85 50,80 C50,85 50,91 54,96 C60,100 68,96 65,90 C60,78 58,68 58,60 C62,62 67,67 75,72 C82,76 89,70 85,62 C80,53 65,50 58,48 C60,45 65,40 65,33 C65,25 60,15 50,15 Z" fill="#b45309" stroke="#78350f" stroke-width="2" />
        <!-- Kem trắng đường icing trên đầu và tay chân -->
        <path d="M40,20 Q50,16 60,20" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M19,65 Q22,68 25,65" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M75,65 Q78,68 81,65" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M38,91 Q42,94 45,91" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M55,91 Q58,94 62,91" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <!-- Mắt, miệng cười -->
        <circle cx="44" cy="28" r="2.5" fill="#ffffff" />
        <circle cx="56" cy="28" r="2.5" fill="#ffffff" />
        <path d="M44,36 Q50,42 56,36" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <!-- Nơ đỏ xinh -->
        <polygon points="45,45 50,48 45,51" fill="#ef4444" />
        <polygon points="55,45 50,48 55,51" fill="#ef4444" />
        <circle cx="50" cy="48" r="2" fill="#fef08a" />
        <!-- Cúc áo kẹo đỏ -->
        <circle cx="50" cy="58" r="3" fill="#ef4444" />
        <circle cx="50" cy="68" r="3" fill="#22c55e" />
      </svg>
    `,

    // 2. Quả cầu tuyết
    snowglobe: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <defs>
          <radialGradient id="globe-glass" cx="35%" cy="35%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="40%" stop-color="#bae6fd" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.8" />
          </radialGradient>
        </defs>
        <!-- Nắp treo kim loại -->
        <rect x="44" y="5" width="12" height="10" rx="2" fill="#eab308" stroke="#ca8a04" stroke-width="1.5" />
        <path d="M50,5 C46,0 54,0 50,5" stroke="#facc15" stroke-width="2.5" fill="none" />
        <!-- Quả cầu thủy tinh -->
        <circle cx="50" cy="55" r="40" fill="url(#globe-glass)" stroke="#e0f2fe" stroke-width="2" />
        <!-- Bụi tuyết bên trong -->
        <ellipse cx="50" cy="80" rx="32" ry="12" fill="#ffffff" opacity="0.9" />
        <!-- Cây thông mini hoặc ông già noel bên trong -->
        <path d="M50,40 L40,65 L60,65 Z" fill="#15803d" />
        <path d="M50,50 L35,75 L65,75 Z" fill="#166534" />
        <rect x="47" y="75" width="6" height="8" fill="#78350f" />
        <!-- Tuyết rơi lấp lánh -->
        <circle cx="35" cy="45" r="2" fill="#ffffff" />
        <circle cx="62" cy="40" r="1.5" fill="#ffffff" />
        <circle cx="42" cy="30" r="2" fill="#ffffff" />
        <circle cx="60" cy="58" r="1.8" fill="#ffffff" />
        <!-- Vệt sáng phản chiếu thủy tinh -->
        <path d="M22,40 A30,30 0 0,1 40,20" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8" />
      </svg>
    `,

    // 3. Chú lính kẹp hạt dẻ
    nutcracker: `
      <svg viewBox="0 0 100 120" class="w-full h-full drop-shadow">
        <!-- Mũ cao lông cừu đen viền vàng -->
        <rect x="36" y="8" width="28" height="32" rx="3" fill="#18181b" stroke="#3f3f46" stroke-width="1.5" />
        <circle cx="50" cy="20" r="4" fill="#eab308" />
        <line x1="36" y1="36" x2="64" y2="36" stroke="#ffd700" stroke-width="2.5" />
        <!-- Khuôn mặt -->
        <rect x="40" y="40" width="20" height="20" fill="#fed7aa" />
        <circle cx="45" cy="48" r="2" fill="#18181b" />
        <circle cx="55" cy="48" r="2" fill="#18181b" />
        <circle cx="43" cy="54" r="2.5" fill="#f87171" opacity="0.6" />
        <circle cx="57" cy="54" r="2.5" fill="#f87171" opacity="0.6" />
        <!-- Bộ ria mép oai vệ -->
        <path d="M44,55 Q50,52 56,55 Q50,58 44,55 Z" fill="#18181b" />
        <!-- Hàm răng kẹp hạt dẻ -->
        <rect x="46" y="57" width="8" height="4" fill="#ffffff" stroke="#71717a" stroke-width="0.5" />
        <!-- Áo quân phục đỏ cầu vai vàng -->
        <rect x="34" y="60" width="32" height="32" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        <line x1="34" y1="63" x2="66" y2="63" stroke="#facc15" stroke-width="3" />
        <!-- Dây chéo áo & cúc áo -->
        <line x1="36" y1="64" x2="62" y2="88" stroke="#fef08a" stroke-width="2" />
        <line x1="62" y1="64" x2="36" y2="88" stroke="#fef08a" stroke-width="2" />
        <circle cx="50" cy="76" r="3" fill="#f59e0b" />
        <!-- Thắt lưng đen khóa vàng -->
        <rect x="34" y="86" width="32" height="6" fill="#18181b" />
        <rect x="47" y="86" width="6" height="6" fill="#eab308" />
        <!-- Quần trắng & ủng đen -->
        <rect x="38" y="92" width="10" height="15" fill="#f4f4f5" />
        <rect x="52" y="92" width="10" height="15" fill="#f4f4f5" />
        <rect x="37" y="104" width="12" height="12" rx="2" fill="#18181b" />
        <rect x="51" y="104" width="12" height="12" rx="2" fill="#18181b" />
      </svg>
    `,

    // 4. Chiếc nơ đỏ lụa
    bow: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <defs>
          <linearGradient id="bow-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444" />
            <stop offset="40%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#991b1b" />
          </linearGradient>
        </defs>
        <!-- Cánh nơ trái -->
        <path d="M50,45 C35,25 10,25 12,50 C14,65 35,60 50,52 Z" fill="url(#bow-red)" stroke="#7f1d1d" stroke-width="1.5" />
        <path d="M45,46 C35,35 22,35 22,48 C22,55 35,54 45,50 Z" fill="#b91c1c" />
        <!-- Cánh nơ phải -->
        <path d="M50,45 C65,25 90,25 88,50 C86,65 65,60 50,52 Z" fill="url(#bow-red)" stroke="#7f1d1d" stroke-width="1.5" />
        <path d="M55,46 C65,35 78,35 78,48 C78,55 65,54 55,50 Z" fill="#b91c1c" />
        <!-- Đuôi nơ rủ xuống trái -->
        <path d="M46,52 L26,88 L38,84 L48,60 Z" fill="url(#bow-red)" stroke="#7f1d1d" stroke-width="1.5" />
        <!-- Đuôi nơ rủ xuống phải -->
        <path d="M54,52 L74,88 L62,84 L52,60 Z" fill="url(#bow-red)" stroke="#7f1d1d" stroke-width="1.5" />
        <!-- Nút thắt trung tâm -->
        <ellipse cx="50" cy="49" rx="9" ry="8" fill="#f87171" stroke="#7f1d1d" stroke-width="1.5" />
        <ellipse cx="50" cy="49" rx="6" ry="5.5" fill="#dc2626" />
        <circle cx="50" cy="48" r="2.5" fill="#fef08a" />
      </svg>
    `,

    // 5. Quả châu sọc xanh đỏ
    bauble_striped: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Nắp kim loại -->
        <rect x="43" y="8" width="14" height="10" rx="2" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
        <path d="M50,8 C46,0 54,0 50,8" stroke="#fef08a" stroke-width="2.5" fill="none" />
        <!-- Quả cầu -->
        <circle cx="50" cy="56" r="38" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        <!-- Các sọc màu xanh lá và vàng uốn cong -->
        <path d="M18,40 Q50,70 82,40" stroke="#16a34a" stroke-width="7" fill="none" />
        <path d="M14,56 Q50,86 86,56" stroke="#fef08a" stroke-width="4.5" fill="none" />
        <path d="M22,72 Q50,98 78,72" stroke="#15803d" stroke-width="6" fill="none" />
        <!-- Ánh bóng phản chiếu -->
        <ellipse cx="36" cy="36" rx="6" ry="12" transform="rotate(-30 36 36)" fill="#ffffff" opacity="0.5" />
      </svg>
    `,

    // 6. Quả châu chấm bi
    bauble_dots: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <rect x="43" y="8" width="14" height="10" rx="2" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
        <path d="M50,8 C46,0 54,0 50,8" stroke="#fef08a" stroke-width="2.5" fill="none" />
        <circle cx="50" cy="56" r="38" fill="#e11d48" stroke="#9f1239" stroke-width="1.5" />
        <!-- Các chấm bi xanh lá và vàng -->
        <circle cx="36" cy="40" r="5.5" fill="#86efac" />
        <circle cx="64" cy="42" r="6" fill="#fde047" />
        <circle cx="50" cy="56" r="7" fill="#4ade80" />
        <circle cx="32" cy="68" r="5" fill="#fef08a" />
        <circle cx="68" cy="70" r="5.5" fill="#86efac" />
        <circle cx="50" cy="82" r="4.5" fill="#fef08a" />
        <!-- Ánh bóng -->
        <ellipse cx="32" cy="34" rx="5" ry="10" transform="rotate(-30 32 34)" fill="#ffffff" opacity="0.45" />
      </svg>
    `,

    // 7. Ngôi sao bạc 3D
    star_silver: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <defs>
          <linearGradient id="star-silver-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>
          <linearGradient id="star-silver-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
        </defs>
        <polygon points="50,8 62,38 95,38 68,58 78,90 50,72 22,90 32,58 5,38 38,38" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
        <!-- Các mặt vát 3D -->
        <polygon points="50,8 62,38 50,72" fill="url(#star-silver-light)" />
        <polygon points="95,38 68,58 50,72" fill="url(#star-silver-dark)" />
        <polygon points="78,90 50,72 50,8" fill="url(#star-silver-light)" />
        <polygon points="22,90 32,58 50,72" fill="url(#star-silver-dark)" />
        <polygon points="5,38 38,38 50,72" fill="url(#star-silver-light)" />
      </svg>
    `,

    // 8. Ngôi sao vàng 3D
    star_gold: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <defs>
          <linearGradient id="star-gold-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="100%" stop-color="#fef08a" />
          </linearGradient>
          <linearGradient id="star-gold-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
        </defs>
        <polygon points="50,8 62,38 95,38 68,58 78,90 50,72 22,90 32,58 5,38 38,38" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
        <polygon points="50,8 62,38 50,72" fill="url(#star-gold-light)" />
        <polygon points="95,38 68,58 50,72" fill="url(#star-gold-dark)" />
        <polygon points="78,90 50,72 50,8" fill="url(#star-gold-light)" />
        <polygon points="22,90 32,58 50,72" fill="url(#star-gold-dark)" />
        <polygon points="5,38 38,38 50,72" fill="url(#star-gold-light)" />
      </svg>
    `,

    // 9. Người tuyết đội mũ đỏ
    snowman: `
      <svg viewBox="0 0 100 110" class="w-full h-full drop-shadow">
        <!-- Thân người tuyết -->
        <circle cx="50" cy="74" r="30" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
        <circle cx="50" cy="38" r="22" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
        <!-- Mũ len đỏ noel -->
        <path d="M34,26 C34,10 66,10 66,26 Z" fill="#dc2626" />
        <rect x="30" y="24" width="40" height="7" rx="3.5" fill="#fef08a" />
        <circle cx="50" cy="9" r="4.5" fill="#ffffff" />
        <!-- Mắt và miệng cười -->
        <circle cx="43" cy="36" r="2.5" fill="#1e293b" />
        <circle cx="57" cy="36" r="2.5" fill="#1e293b" />
        <polygon points="50,39 40,43 50,45" fill="#f97316" /> <!-- Mũi cà rốt -->
        <circle cx="40" cy="46" r="1.5" fill="#1e293b" />
        <circle cx="46" cy="49" r="1.5" fill="#1e293b" />
        <circle cx="54" cy="49" r="1.5" fill="#1e293b" />
        <circle cx="60" cy="46" r="1.5" fill="#1e293b" />
        <!-- Khăn quàng cổ đỏ -->
        <path d="M32,54 Q50,60 68,54 L68,62 Q50,66 32,62 Z" fill="#ef4444" />
        <rect x="56" y="58" width="10" height="22" rx="2" fill="#dc2626" transform="rotate(15 56 58)" />
        <!-- Cúc áo than đen -->
        <circle cx="50" cy="72" r="3" fill="#1e293b" />
        <circle cx="50" cy="82" r="3" fill="#1e293b" />
      </svg>
    `,

    // 10. Tuần lộc mũi đỏ
    reindeer: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Gạc sừng tuần lộc nâu -->
        <path d="M30,30 L20,12 M20,12 L12,18 M20,12 L26,6 M30,22 L15,22" stroke="#78350f" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M70,30 L80,12 M80,12 L88,18 M80,12 L74,6 M70,22 L85,22" stroke="#78350f" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Đầu và tai -->
        <ellipse cx="24" cy="42" rx="6" ry="12" transform="rotate(-30 24 42)" fill="#a16207" />
        <ellipse cx="76" cy="42" rx="6" ry="12" transform="rotate(30 76 42)" fill="#a16207" />
        <ellipse cx="50" cy="56" rx="30" ry="26" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
        <!-- Mõm và má hồng -->
        <ellipse cx="50" cy="65" rx="18" ry="14" fill="#fde68a" />
        <!-- Mắt to tròn đáng yêu -->
        <circle cx="40" cy="48" r="4" fill="#1e293b" />
        <circle cx="60" cy="48" r="4" fill="#1e293b" />
        <circle cx="42" cy="46" r="1.5" fill="#ffffff" />
        <circle cx="62" cy="46" r="1.5" fill="#ffffff" />
        <!-- Mũi đỏ rực của Rudolph -->
        <circle cx="50" cy="63" r="7.5" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />
        <ellipse cx="48" cy="61" rx="2" ry="3.5" fill="#ffffff" opacity="0.75" />
      </svg>
    `,

    // 11. Kẹo gậy Giáng Sinh
    candycane: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <path d="M40,90 L40,40 A20,20 0 0,1 80,40 L80,50" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" />
        <path d="M40,90 L40,40 A20,20 0 0,1 80,40 L80,50" stroke="#dc2626" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="10 10" />
        <!-- Chiếc nơ xanh thắt giữa kẹo -->
        <circle cx="40" cy="55" r="5" fill="#16a34a" />
        <polygon points="32,50 40,55 32,60" fill="#22c55e" />
        <polygon points="48,50 40,55 48,60" fill="#22c55e" />
      </svg>
    `,

    // 12. Quả châu tím lấp lánh
    bauble_purple: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <rect x="43" y="8" width="14" height="10" rx="2" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
        <path d="M50,8 C46,0 54,0 50,8" stroke="#fef08a" stroke-width="2.5" fill="none" />
        <circle cx="50" cy="56" r="38" fill="url(#bauble-purp-grad)" stroke="#6b21a8" stroke-width="1.5" />
        <defs>
          <radialGradient id="bauble-purp-grad" cx="35%" cy="35%">
            <stop offset="0%" stop-color="#e9d5ff" />
            <stop offset="30%" stop-color="#a855f7" />
            <stop offset="100%" stop-color="#581c87" />
          </radialGradient>
        </defs>
        <!-- Ngôi sao phát sáng trên quả châu -->
        <polygon points="50,42 53,52 63,52 55,58 58,68 50,62 42,68 45,58 37,52 47,52" fill="#ffffff" opacity="0.8" />
        <circle cx="32" cy="40" r="2" fill="#ffffff" opacity="0.9" />
        <circle cx="68" cy="62" r="2" fill="#ffffff" opacity="0.9" />
      </svg>
    `,

    // CÁC MÓN KHAY ĐỒ TRANG TRÍ DƯỚI GỐC (GROUND ITEMS)
    // 1. Hộp quà Noel
    gifts: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Hộp quà xanh sau -->
        <rect x="15" y="45" width="38" height="45" rx="3" fill="#15803d" stroke="#052e16" stroke-width="1.5" />
        <rect x="13" y="38" width="42" height="10" rx="2" fill="#166534" />
        <rect x="31" y="38" width="6" height="52" fill="#ef4444" />
        <!-- Hộp quà đỏ to trước -->
        <rect x="40" y="35" width="48" height="55" rx="4" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        <rect x="37" y="27" width="54" height="12" rx="2" fill="#ef4444" />
        <rect x="61" y="27" width="8" height="63" fill="#facc15" />
        <rect x="40" y="58" width="48" height="8" fill="#facc15" />
        <!-- Nơ vàng trên hộp quà đỏ -->
        <path d="M65,27 C50,12 40,25 62,27 Z" fill="#fef08a" />
        <path d="M65,27 C80,12 90,25 68,27 Z" fill="#fef08a" />
        <circle cx="65" cy="27" r="4" fill="#f59e0b" />
      </svg>
    `,

    // 2. Ly cacao nóng
    cocoa: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Đĩa sứ -->
        <ellipse cx="50" cy="85" rx="40" ry="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
        <ellipse cx="50" cy="84" rx="32" ry="7" fill="#e2e8f0" />
        <!-- Quai cốc -->
        <path d="M68,48 C85,48 85,75 66,75" stroke="#b91c1c" stroke-width="6" fill="none" stroke-linecap="round" />
        <!-- Thân cốc đỏ giáng sinh -->
        <path d="M25,40 L32,80 Q50,86 68,80 L75,40 Z" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
        <ellipse cx="50" cy="40" rx="25" ry="8" fill="#581c87" />
        <!-- Mặt nước cacao nâu thơm -->
        <ellipse cx="50" cy="42" rx="23" ry="7" fill="#451a03" />
        <!-- Kẹo marshmallow trắng bồng bềnh -->
        <rect x="42" y="36" width="10" height="7" rx="2" fill="#ffffff" />
        <rect x="52" y="38" width="8" height="6" rx="2" fill="#fef08a" />
        <!-- Làn khói bốc lên ấm áp -->
        <path d="M40,30 Q35,20 42,12" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <path d="M52,30 Q58,18 50,10" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" fill="none" stroke-linecap="round" />
      </svg>
    `,

    // 3. Đoàn tàu hỏa Noel
    train: `
      <svg viewBox="0 0 110 90" class="w-full h-full drop-shadow">
        <!-- Buồng lái đỏ -->
        <rect x="65" y="20" width="35" height="45" rx="3" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        <rect x="62" y="15" width="41" height="6" rx="2" fill="#15803d" />
        <rect x="74" y="28" width="16" height="16" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
        <!-- Thân tàu xanh lá -->
        <rect x="18" y="35" width="50" height="30" rx="3" fill="#166534" stroke="#14532d" stroke-width="1.5" />
        <!-- Ống khói vàng phía trước -->
        <polygon points="26,18 34,18 32,35 28,35" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
        <ellipse cx="30" cy="18" rx="5" ry="2" fill="#fef08a" />
        <!-- Đèn pha trước -->
        <polygon points="18,44 10,40 10,56 18,52" fill="#facc15" />
        <!-- Bánh xe vàng xoay tròn -->
        <circle cx="32" cy="70" r="10" fill="#b45309" stroke="#facc15" stroke-width="2.5" />
        <circle cx="56" cy="70" r="10" fill="#b45309" stroke="#facc15" stroke-width="2.5" />
        <circle cx="82" cy="68" r="13" fill="#b45309" stroke="#facc15" stroke-width="3" />
        <!-- Khói trắng tròn bay ra -->
        <circle cx="30" cy="10" r="4" fill="rgba(255,255,255,0.7)" />
        <circle cx="24" cy="5" r="5" fill="rgba(255,255,255,0.5)" />
      </svg>
    `,

    // 4. Gấu bông Noel
    teddy: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Tai gấu -->
        <circle cx="28" cy="28" r="10" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
        <circle cx="28" cy="28" r="6" fill="#fde68a" />
        <circle cx="72" cy="28" r="10" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
        <circle cx="72" cy="28" r="6" fill="#fde68a" />
        <!-- Tay và chân -->
        <circle cx="20" cy="65" r="10" fill="#b45309" />
        <circle cx="80" cy="65" r="10" fill="#b45309" />
        <circle cx="30" cy="85" r="12" fill="#b45309" />
        <circle cx="30" cy="85" r="7" fill="#fde68a" />
        <circle cx="70" cy="85" r="12" fill="#b45309" />
        <circle cx="70" cy="85" r="7" fill="#fde68a" />
        <!-- Thân gấu -->
        <ellipse cx="50" cy="65" rx="26" ry="24" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
        <ellipse cx="50" cy="65" rx="16" ry="14" fill="#fde68a" />
        <!-- Đầu gấu -->
        <circle cx="50" cy="40" r="22" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
        <ellipse cx="50" cy="46" rx="11" ry="8" fill="#fde68a" />
        <!-- Mắt và mũi -->
        <circle cx="43" cy="38" r="2.5" fill="#18181b" />
        <circle cx="57" cy="38" r="2.5" fill="#18181b" />
        <ellipse cx="50" cy="44" rx="4" ry="2.5" fill="#18181b" />
        <!-- Nơ đỏ noel ở cổ -->
        <polygon points="44,52 50,55 44,58" fill="#ef4444" />
        <polygon points="56,52 50,55 56,58" fill="#ef4444" />
        <circle cx="50" cy="55" r="2" fill="#fef08a" />
      </svg>
    `,

    // 5. Nến lung linh
    candles: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow">
        <!-- Đĩa đựng nến vàng -->
        <ellipse cx="50" cy="86" rx="42" ry="8" fill="#ca8a04" stroke="#a16207" stroke-width="1.5" />
        <!-- Nến 1: Trái (Thấp vừa) -->
        <rect x="22" y="52" width="16" height="32" rx="3" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
        <!-- Nến 2: Giữa (Cao nhất) -->
        <rect x="42" y="38" width="16" height="46" rx="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        <!-- Nến 3: Phải (Thấp) -->
        <rect x="62" y="60" width="16" height="24" rx="3" fill="#fef08a" stroke="#ca8a04" stroke-width="1" />
        <!-- Bấc nến -->
        <line x1="30" y1="52" x2="30" y2="47" stroke="#18181b" stroke-width="1.5" />
        <line x1="50" y1="38" x2="50" y2="33" stroke="#18181b" stroke-width="1.5" />
        <line x1="70" y1="60" x2="70" y2="55" stroke="#18181b" stroke-width="1.5" />
        <!-- Ngọn lửa vàng lung linh -->
        <path d="M30,47 C26,42 26,35 30,30 C34,35 34,42 30,47 Z" fill="#f59e0b" filter="drop-shadow(0 0 4px #facc15)" />
        <path d="M50,33 C46,28 46,21 50,15 C54,21 54,28 50,33 Z" fill="#f59e0b" filter="drop-shadow(0 0 6px #fde047)" />
        <path d="M70,55 C66,50 66,43 70,38 C74,43 74,50 70,55 Z" fill="#f59e0b" filter="drop-shadow(0 0 4px #facc15)" />
      </svg>
    `
  };

  // 4. STARTER ORNAMENTS (Mặc định rỗng - cây thông chưa được trang trí gì)
  const STARTER_ORNAMENTS = [];

  // 5. DOM ELEMENTS
  const treeContainer = document.getElementById('tree-interactive-canvas');
  const treeStarTopper = document.getElementById('tree-star-topper');
  const placedOrnamentsLayer = document.getElementById('tree-placed-ornaments');
  const treeLedOverlay = document.getElementById('tree-led-lights-overlay');
  const treeGroundDecorations = document.getElementById('tree-ground-decorations');
  const treePineSvg = document.getElementById('tree-pine-svg');
  const treeColorSwatchBtns = document.querySelectorAll('.tree-color-swatch-btn');
  const ledColorSwatchBtns = document.querySelectorAll('.led-color-swatch-btn');
  const starColorSwatchBtns = document.querySelectorAll('.star-color-swatch-btn');
  const accessorySlotBtns = document.querySelectorAll('.accessory-slot-btn');
  const groundSlotBtns = document.querySelectorAll('.ground-item-slot-btn');
  const btnFinishTree = document.getElementById('btn-finish-tree');
  const btnResetTree = document.getElementById('btn-reset-tree');
  const treeCompletionModal = document.getElementById('tree-completion-modal');
  const btnCloseCompletionModal = document.getElementById('btn-close-completion-modal');
  const btnClaimTree = document.getElementById('btn-claim-tree');
  const modalTreeDisplay = document.getElementById('modal-tree-display');
  const treeResetConfirmModal = document.getElementById('tree-reset-confirm-modal');
  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  const btnCancelResetX = document.getElementById('btn-cancel-reset-x');
  const toastNotification = document.getElementById('toast-notification');
  const toastText = document.getElementById('toast-text');

  // Thông báo tiện ích hoàng gia (Toast) - Đã tắt để giữ giao diện thông thoáng, không che khuất màn hình
  function showToast(message) {
    return;
  }

  // Điền các icon ảnh thật vào các nút trên Giá treo và Khay đồ
  function populateToolIcons() {
    const allKeys = [
      'gingerbread', 'snowglobe', 'nutcracker', 'bow',
      'bauble_red', 'reindeer', 'candycane', 'bauble_gold',
      'bauble_trio', 'bird', 'star_silver', 'star_gold',
      'bell', 'stocking', 'snowflake', 'bear_santa',
      'gifts', 'cocoa', 'train', 'teddy', 'candles'
    ];

    allKeys.forEach(key => {
      const slotEl = document.getElementById(`slot-icon-${key}`);
      if (slotEl) {
        slotEl.innerHTML = getItemMarkup(key);
      }
      const groundEl = document.getElementById(`ground-icon-${key}`);
      if (groundEl) {
        groundEl.innerHTML = getItemMarkup(key);
      }
    });

    // Modal Nutcracker góc dưới trái & phải dùng ảnh thật chú lính kẹp hạt dẻ (Chuẩn Ảnh 2)
    const nutcrackerLeft = document.getElementById('modal-nutcracker-svg-left');
    const nutcrackerRight = document.getElementById('modal-nutcracker-svg-right');
    const nutcrackerModalHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-end">
        <img src="${IMAGE_ORNAMENTS.nutcracker}" alt="Lính kẹp hạt dẻ" class="w-full h-[85%] object-contain drop-shadow-lg pointer-events-none select-none" />
        <div class="w-full h-[22%] -mt-1 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 100 40" class="w-full h-full drop-shadow">
            <path d="M15,22 Q30,12 45,24 Q65,12 85,22 Q70,36 45,30 Q25,36 15,22 Z" fill="#15803d" stroke="#052e16" stroke-width="1" />
            <path d="M25,25 Q45,16 65,25 Q50,33 30,27 Z" fill="#166534" />
            <circle cx="43" cy="24" r="3.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.8" />
            <circle cx="53" cy="23" r="3.2" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.8" />
            <circle cx="48" cy="28" r="3" fill="#b91c1c" stroke="#7f1d1d" stroke-width="0.8" />
          </svg>
        </div>
      </div>
    `;
    if (nutcrackerLeft) nutcrackerLeft.innerHTML = nutcrackerModalHTML;
    if (nutcrackerRight) nutcrackerRight.innerHTML = nutcrackerModalHTML;
  }

  // 6. RENDER DÂY ĐÈN LED BÔNG TUYẾT (SNOWFLAKE LED LIGHTS)
  function renderLedLights() {
    if (!treeLedOverlay) return;
    treeLedOverlay.innerHTML = '';

    const snowflakeSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="2" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        <line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line>
        <polyline points="10 4 12 2 14 4"></polyline>
        <polyline points="10 20 12 22 14 20"></polyline>
        <polyline points="4 10 2 12 4 14"></polyline>
        <polyline points="20 10 22 12 20 14"></polyline>
      </svg>
    `;

    TREE_BULB_POSITIONS.forEach((pos, idx) => {
      const bulb = document.createElement('div');
      bulb.className = 'tree-led-bulb tree-led-snowflake';
      bulb.style.left = `${pos.x}%`;
      bulb.style.top = `${pos.y}%`;
      bulb.style.animationDelay = `${(idx * 0.14) % 2.4}s`;
      bulb.innerHTML = snowflakeSvg;
      treeLedOverlay.appendChild(bulb);
    });

    updateLedColorCSS();
  }

  function updateLedColorCSS() {
    const colorHex = LED_COLORS[currentLedColor] || '#ef4444';
    document.documentElement.style.setProperty('--led-bulb-color', colorHex);
  }

  // 6.1. RENDER & QUẢN LÝ NGÔI SAO ĐỈNH CÂY (TÙY CHỈNH MÀU SẮC THEO YÊU CẦU)
  function updateStarTopperPosition() {
    if (!treeStarTopper) return;
    const img = document.getElementById('tree-real-img');
    const container = document.getElementById('tree-interactive-canvas');
    if (!img || !container) return;

    const cRect = container.getBoundingClientRect();
    const iRect = img.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0 || iRect.width === 0 || iRect.height === 0) return;

    // Tính kích thước và vị trí chính xác của ảnh thật bên trong object-contain
    const nw = img.naturalWidth || 381;
    const nh = img.naturalHeight || 563;
    const scale = Math.min(iRect.width / nw, iRect.height / nh);
    const rw = nw * scale;
    const rh = nh * scale;
    const rx = iRect.left + (iRect.width - rw) / 2;
    const ry = iRect.top + (iRect.height - rh) / 2;

    // Điểm tâm ngôi sao trên ảnh gốc: x = 202.5, y = 43.5
    const starPixelX = rx + (202.5 / nw) * rw;
    const starPixelY = ry + (43.5 / nh) * rh;

    const pctX = ((starPixelX - cRect.left) / cRect.width) * 100;
    const pctY = ((starPixelY - cRect.top) / cRect.height) * 100;

    treeStarTopper.style.left = `${pctX.toFixed(2)}%`;
    treeStarTopper.style.top = `${pctY.toFixed(2)}%`;
  }

  function renderTreeStar() {
    if (!treeStarTopper) return;
    treeStarTopper.innerHTML = getStarSvg(currentStarColor);
    updateStarTopperPosition();
  }

  window.addEventListener('resize', updateStarTopperPosition);
  const treeRealImgElem = document.getElementById('tree-real-img');
  if (treeRealImgElem) {
    if (treeRealImgElem.complete) {
      setTimeout(updateStarTopperPosition, 50);
    } else {
      treeRealImgElem.addEventListener('load', () => setTimeout(updateStarTopperPosition, 50));
    }
  }

  function setStarColor(starKey) {
    if (!STAR_COLORS[starKey]) return;
    currentStarColor = starKey;
    renderTreeStar();

    if (starColorSwatchBtns) {
      starColorSwatchBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.star === starKey);
      });
    }

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1396.91);
    }
  }

  function cycleStarColor() {
    const keys = Object.keys(STAR_COLORS);
    const currIdx = keys.indexOf(currentStarColor);
    const nextIdx = (currIdx + 1) % keys.length;
    setStarColor(keys[nextIdx]);
  }

  // 7. MÀU CÂY THÔNG (GIỮ NGUYÊN MÀU XANH THẬT THEO YÊU CẦU ĐÃ BỎ BẢNG CHỌN MÀU)
  function setTreeColor(colorKey) {
    const treeRealImg = document.getElementById('tree-real-img');
    if (treeRealImg) {
      treeRealImg.style.filter = 'none';
    }
  }

  // 8. CẬP NHẬT MÀU ĐÈN LED (LED COLOR)
  function setLedColor(ledKey) {
    if (!LED_COLORS[ledKey]) return;
    currentLedColor = ledKey;
    updateLedColorCSS();

    ledColorSwatchBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.led === ledKey);
    });

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1174.66);
    }
  }

  // 9. RENDER CÁC PHỤ KIỆN TREO TRÊN CÂY
  function renderPlacedOrnaments() {
    if (!placedOrnamentsLayer) return;
    placedOrnamentsLayer.innerHTML = '';

    placedOrnaments.forEach(item => {
      const el = document.createElement('div');
      el.className = 'placed-ornament';
      el.dataset.id = item.id;
      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
      el.style.width = `${item.size || 42}px`;
      el.style.height = `${item.size || 42}px`;

      el.innerHTML = `
        ${getItemMarkup(item.type)}
        <button type="button" class="ornament-delete-btn" title="Gỡ phụ kiện này">✕</button>
      `;

      // Nút gỡ phụ kiện
      const btnDel = el.querySelector('.ornament-delete-btn');
      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          removeOrnament(item.id);
        });
      }

      // Kéo thả phụ kiện trên cây
      setupOrnamentDrag(el, item);

      placedOrnamentsLayer.appendChild(el);
    });
  }

  function removeOrnament(id) {
    placedOrnaments = placedOrnaments.filter(o => o.id !== id);
    renderPlacedOrnaments();
    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(587.33);
    }
  }

  // 10. RENDER ĐỒ TRANG TRÍ DƯỚI GỐC CÂY (KÉO THẢ TỰ DO DƯỚI GỐC CÂY THEO YÊU CẦU)
  function renderGroundDecorations() {
    if (!treeGroundDecorations) return;
    treeGroundDecorations.innerHTML = '';

    placedGroundItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'placed-ground-item';
      el.dataset.id = item.id;
      el.dataset.type = item.type;
      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
      const sz = item.size || 58;
      el.style.width = `${sz}px`;
      el.style.height = `${sz}px`;

      el.innerHTML = `
        ${getItemMarkup(item.type)}
        <button type="button" class="ground-item-delete-btn" title="Cất món này">✕</button>
      `;

      const btnDel = el.querySelector('.ground-item-delete-btn');
      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          removeGroundItem(item.id);
        });
      }

      // Kích hoạt kéo thả tự do dưới gốc cây
      setupGroundItemDrag(el, item);
      treeGroundDecorations.appendChild(el);
    });

    // Cập nhật trạng thái active của các nút trên khay đồ
    groundSlotBtns.forEach(btn => {
      const t = btn.dataset.ground;
      const isActive = placedGroundItems.some(item => item.type === t);
      btn.classList.toggle('active', isActive);
    });
  }

  function removeGroundItem(id) {
    placedGroundItems = placedGroundItems.filter(item => item.id !== id);
    renderGroundDecorations();
    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(587.33);
    }
  }

  function toggleGroundItem(type) {
    const existingIndex = placedGroundItems.findIndex(item => item.type === type);
    if (existingIndex !== -1) {
      placedGroundItems.splice(existingIndex, 1);
    } else {
      // Vị trí mặc định thông minh quanh gốc cây
      const defaultPositions = {
        gifts: { x: 28, y: 88, size: 60 },
        cocoa: { x: 40, y: 87, size: 48 },
        train: { x: 52, y: 89, size: 62 },
        teddy: { x: 74, y: 88, size: 54 },
        candles: { x: 86, y: 87, size: 50 }
      };
      const def = defaultPositions[type] || { x: 50, y: 88, size: 55 };
      placedGroundItems.push({
        id: Date.now() + Math.random(),
        type: type,
        x: def.x,
        y: def.y,
        size: def.size
      });
    }
    renderGroundDecorations();
    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(987.77);
    }
  }

  function setupGroundItemDrag(el, item) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = item.x, initialTop = item.y;

    const onPointerDown = (e) => {
      if (e.target.closest('.ground-item-delete-btn')) return;
      e.stopPropagation();
      isDragging = true;
      el.classList.add('dragging');
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      initialLeft = item.x;
      initialTop = item.y;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const point = e.touches ? e.touches[0] : e;
      const rect = treeContainer.getBoundingClientRect();
      const deltaX = ((point.clientX - startX) / rect.width) * 100;
      const deltaY = ((point.clientY - startY) / rect.height) * 100;

      // Giới hạn trong vùng quanh gốc cây & tuyết dưới đất (x: 6%..94%, y: 65%..96%)
      let newX = Math.max(6, Math.min(94, initialLeft + deltaX));
      let newY = Math.max(65, Math.min(96, initialTop + deltaY));

      item.x = Math.round(newX);
      item.y = Math.round(newY);

      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  // 11. HỆ THỐNG KÉO THẢ & CHẠM ĐẶT PHỤ KIỆN
  function setupOrnamentDrag(el, item) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = item.x, initialTop = item.y;

    const onPointerDown = (e) => {
      e.stopPropagation();
      isDragging = true;
      el.classList.add('dragging');
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      initialLeft = item.x;
      initialTop = item.y;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const point = e.touches ? e.touches[0] : e;
      const rect = treeContainer.getBoundingClientRect();
      const deltaX = ((point.clientX - startX) / rect.width) * 100;
      const deltaY = ((point.clientY - startY) / rect.height) * 100;

      let newX = Math.max(15, Math.min(85, initialLeft + deltaX));
      let newY = Math.max(15, Math.min(85, initialTop + deltaY));

      item.x = Math.round(newX);
      item.y = Math.round(newY);

      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  // Bấm vào cây thông để treo phụ kiện đang chọn
  if (treeContainer) {
    treeContainer.addEventListener('click', (e) => {
      if (e.target.closest('.placed-ornament') || e.target.closest('.placed-ground-item') || e.target.closest('#tree-star-topper')) {
        return;
      }
      if (!selectedAccessory) {
        showToast('👉 Hãy chọn một món phụ kiện trên giá trước nhé!');
        return;
      }

      const rect = treeContainer.getBoundingClientRect();
      const clickX = ((e.clientX - rect.x) / rect.width) * 100;
      const clickY = ((e.clientY - rect.y) / rect.height) * 100;

      // Giới hạn trong vùng tán lá cây thông (18% - 85%)
      if (clickY >= 16 && clickY <= 86 && clickX >= 15 && clickX <= 85) {
        let size = 42;
        if (selectedAccessory === 'bow') size = 56;
        if (selectedAccessory === 'nutcracker') size = 48;
        if (selectedAccessory === 'snowglobe') size = 46;
        if (selectedAccessory === 'gingerbread') size = 44;
        if (selectedAccessory === 'reindeer') size = 46;
        if (selectedAccessory === 'candycane') size = 42;
        if (selectedAccessory === 'bauble_trio') size = 44;
        if (selectedAccessory === 'bird') size = 42;
        if (selectedAccessory === 'star_silver' || selectedAccessory === 'star_gold') size = 44;
        if (selectedAccessory === 'bell') size = 48;
        if (selectedAccessory === 'stocking') size = 48;
        if (selectedAccessory === 'snowflake') size = 46;
        if (selectedAccessory === 'bear_santa') size = 46;
        if (selectedAccessory === 'bauble_red' || selectedAccessory === 'bauble_gold') size = 38;

        const newOrnament = {
          id: Date.now() + Math.random(),
          type: selectedAccessory,
          x: Math.round(clickX),
          y: Math.round(clickY),
          size: size
        };

        placedOrnaments.push(newOrnament);
        renderPlacedOrnaments();

        if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
          window.XMAS_SHARED.playJingleBellSound(1318.51);
        }
      }
    });
  }

  // 12. CHỌN MÓN TỪ GIÁ TREO PHỤ KIỆN
  accessorySlotBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      if (!type) return;

      selectedAccessory = type;

      // Cập nhật class active & huy hiệu ĐÃ CHỌN
      accessorySlotBtns.forEach(b => {
        b.classList.remove('active');
        const badge = b.querySelector('.slot-badge-selected');
        if (badge) badge.remove();
      });

      btn.classList.add('active');
      const badge = document.createElement('span');
      badge.className = 'slot-badge-selected';
      badge.textContent = 'ĐÃ CHỌN';
      btn.appendChild(badge);

      if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
        window.XMAS_SHARED.playJingleBellSound(1046.50);
      }
    });
  });

  // Chọn khay đồ dưới gốc
  groundSlotBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.ground;
      if (type) toggleGroundItem(type);
    });
  });

  // Chọn màu cây thông
  treeColorSwatchBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const c = btn.dataset.color;
      if (c) setTreeColor(c);
    });
  });

  // Chọn màu đèn LED
  ledColorSwatchBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const l = btn.dataset.led;
      if (l) setLedColor(l);
    });
  });

  // Chọn màu ngôi sao đỉnh cây thông
  if (starColorSwatchBtns) {
    starColorSwatchBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = btn.dataset.star;
        if (s) setStarColor(s);
      });
    });
  }

  // Bấm trực tiếp vào ngôi sao trên đỉnh cây để đổi màu
  if (treeStarTopper) {
    treeStarTopper.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleStarColor();
    });
  }

  // 12.1. MODAL XÁC NHẬN LÀM MỚI CÂY THÔNG (HOÀNG GIA ĐỒNG BỘ GIAO DIỆN)
  function openResetConfirmModal() {
    if (!treeResetConfirmModal) return;
    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(880);
    }
    treeResetConfirmModal.classList.remove('hidden');
  }

  function closeResetConfirmModal() {
    if (!treeResetConfirmModal) return;
    treeResetConfirmModal.classList.add('hidden');
  }

  function performTreeReset() {
    placedOrnaments = [];
    placedGroundItems = [];
    selectedAccessory = null;
    accessorySlotBtns.forEach(b => {
      b.classList.remove('active');
      const badge = b.querySelector('.slot-badge-selected');
      if (badge) badge.remove();
    });
    setTreeColor('green');
    setLedColor('red');
    setStarColor('gold');
    renderPlacedOrnaments();
    renderGroundDecorations();
    closeResetConfirmModal();

    if (window.XMAS_SHARED && window.XMAS_SHARED.playGiftChime) {
      window.XMAS_SHARED.playGiftChime();
    }
    showToast('✨ Đã làm mới cây thông! Hãy bắt đầu trang trí nào!');
  }

  if (btnResetTree) {
    btnResetTree.addEventListener('click', openResetConfirmModal);
  }

  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', performTreeReset);
  }

  if (btnCancelReset) {
    btnCancelReset.addEventListener('click', closeResetConfirmModal);
  }

  if (btnCancelResetX) {
    btnCancelResetX.addEventListener('click', closeResetConfirmModal);
  }

  if (treeResetConfirmModal) {
    treeResetConfirmModal.addEventListener('click', (e) => {
      if (e.target === treeResetConfirmModal) closeResetConfirmModal();
    });
  }

  // 13. HOÀN THÀNH VÀ MỞ MODAL CHÚC MỪNG (CHUẨN ẢNH 2)
  function openCompletionModal() {
    if (!treeCompletionModal) return;

    // Âm thanh chúc mừng hân hoan
    if (window.XMAS_SHARED && window.XMAS_SHARED.playGiftChime) {
      window.XMAS_SHARED.playGiftChime();
    }

    // Hiệu ứng pháo hoa tuyết rực rỡ
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 90,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#ffd700', '#dc2626', '#16a34a', '#ffffff', '#38bdf8']
        });
      } catch (e) {}
    }

    // Sao chép cây thông đã trang trí vào đĩa huy chương vàng (Medallion)
    if (modalTreeDisplay && treeContainer) {
      modalTreeDisplay.innerHTML = '';
      const clone = treeContainer.cloneNode(true);
      clone.style.width = '100%';
      clone.style.height = '100%';
      clone.style.transform = 'scale(0.82) translateY(-2%)';
      // Xóa các nút delete, gợi ý và con trỏ tay trên bản clone
      clone.querySelectorAll('.ornament-delete-btn, .ground-item-delete-btn, #tree-drop-hint, .tree-hand-pointer').forEach(el => el.remove());
      modalTreeDisplay.appendChild(clone);
    }

    treeCompletionModal.classList.remove('hidden');
  }

  function closeCompletionModal() {
    if (treeCompletionModal) {
      treeCompletionModal.classList.add('hidden');
    }
  }

  if (btnFinishTree) btnFinishTree.addEventListener('click', openCompletionModal);
  if (btnCloseCompletionModal) btnCloseCompletionModal.addEventListener('click', closeCompletionModal);
  if (treeCompletionModal) {
    treeCompletionModal.addEventListener('click', (e) => {
      if (e.target === treeCompletionModal) closeCompletionModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCompletionModal();
      closeResetConfirmModal();
    }
  });

  // NÚT "NHẬN CÂY THÔNG NGAY!" TRÊN MODAL (TẢI ẢNH CÂY THÔNG KỶ NIỆM VỀ MÁY)
  if (btnClaimTree) {
    btnClaimTree.addEventListener('click', () => {
      downloadDecoratedTreeCard();
    });
  }

  async function downloadDecoratedTreeCard() {
    // Tạo canvas HD để xuất ảnh thiệp cây thông kỷ niệm
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    // Nền thiệp đỏ nhung Giáng Sinh hoàng gia
    const bgGrad = ctx.createRadialGradient(600, 500, 60, 600, 600, 750);
    bgGrad.addColorStop(0, '#4a0815');
    bgGrad.addColorStop(0.55, '#22030b');
    bgGrad.addColorStop(1, '#0e0104');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 1200);

    // Khung viền vàng kép tinh tế
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(36, 36, 1128, 1128);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 46, 1108, 1108);

    // Ngôi sao 4 góc viền
    const cornerStars = [
      { x: 62, y: 65 }, { x: 1138, y: 65 },
      { x: 62, y: 1140 }, { x: 1138, y: 1140 }
    ];
    ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    cornerStars.forEach(cs => ctx.fillText('✦', cs.x, cs.y));

    // Tiêu đề chữ vàng hoàng gia (Đặt ở trên cao, cách xa đĩa vàng bên dưới)
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 50px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.55)';
    ctx.shadowBlur = 12;
    ctx.fillText('🎄 Cây Thông Noel Của Bạn 🎄', 600, 112);
    ctx.shadowBlur = 0;

    // Phụ đề thanh lịch (Baseline y=158, cách đỉnh đĩa vàng y=225 tới gần 70px)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.font = 'italic 23px "Playfair Display", Georgia, serif';
    ctx.fillText('Giáng Sinh An Lành & Hạnh Phúc 2026', 600, 158);

    // Đĩa vàng hoàng gia (Tâm 600, 655; Bán kính 430; Đỉnh đĩa ở y=225 -> Tuyệt đối không đè lên chữ)
    const plateGrad = ctx.createRadialGradient(600, 655, 30, 600, 655, 430);
    plateGrad.addColorStop(0, '#662d08');
    plateGrad.addColorStop(0.35, '#401503');
    plateGrad.addColorStop(0.75, '#200705');
    plateGrad.addColorStop(1, '#120205');
    ctx.fillStyle = plateGrad;
    ctx.beginPath();
    ctx.arc(600, 655, 430, 0, Math.PI * 2);
    ctx.fill();

    // Vòng kim loại đồng tâm bên trong đĩa
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(600, 655, 412, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(600, 655, 394, 0, Math.PI * 2);
    ctx.stroke();

    // Viền vàng ngoài cùng sáng bóng
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.65)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(600, 655, 430, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ngôi sao lấp lánh xung quanh đĩa vàng
    const sparkles = [
      { x: 185, y: 250, size: 28, char: '✦' },
      { x: 1015, y: 310, size: 24, char: '★' },
      { x: 180, y: 880, size: 22, char: '★' },
      { x: 1020, y: 840, size: 28, char: '✦' }
    ];
    ctx.fillStyle = '#fde047';
    sparkles.forEach(s => {
      ctx.font = `${s.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillText(s.char, s.x, s.y);
    });
    ctx.shadowBlur = 0;

    // Tọa độ & kích thước cây thông trong đĩa vàng
    const treeW = 560;
    const treeH = 780;
    const treeX = 600 - treeW / 2; // 320
    const treeY = 275;

    // Vẽ ảnh cây thông thực tế đã tách nền lên canvas
    const treeRealImg = document.getElementById('tree-real-img');
    if (treeRealImg) {
      ctx.save();
      if (treeRealImg.style.filter && treeRealImg.style.filter !== 'none') {
        ctx.filter = treeRealImg.style.filter;
      }
      ctx.drawImage(treeRealImg, treeX, treeY, treeW, treeH);
      ctx.restore();
    }

    // Helper tải ảnh hoặc SVG an toàn lên canvas
    const loadImgAsync = (src) => new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });

    // Vẽ ngôi sao đỉnh cây theo màu đã chọn lên canvas thiệp
    const starSvgContent = getStarSvg(currentStarColor);
    const starBlob = new Blob([
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${starSvgContent}</svg>`
    ], { type: 'image/svg+xml;charset=utf-8' });
    const starUrl = URL.createObjectURL(starBlob);
    const starImg = await loadImgAsync(starUrl);
    URL.revokeObjectURL(starUrl);
    if (starImg) {
      const starSize = 84;
      const starX = treeX + (0.526 * treeW) - starSize / 2;
      const starY = treeY + (0.077 * treeH) - starSize / 2;
      ctx.save();
      ctx.shadowColor = (STAR_COLORS[currentStarColor] && STAR_COLORS[currentStarColor].glow) || 'rgba(250, 204, 21, 0.9)';
      ctx.shadowBlur = 18;
      ctx.drawImage(starImg, starX, starY, starSize, starSize);
      ctx.restore();
    }

    // Vẽ dây đèn LED bông tuyết lung linh lên thiệp (Đúng 100% hình dạng bông tuyết phát quang như trên màn hình)
    const ledColor = LED_COLORS[currentLedColor] || '#ef4444';
    const ledSvgStr = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="${ledColor}" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <filter id="led-card-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="${ledColor}" flood-opacity="0.95" />
            <feDropShadow dx="0" dy="0" stdDeviation="6.5" flood-color="${ledColor}" flood-opacity="0.65" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="#ffffff" flood-opacity="0.9" />
          </filter>
        </defs>
        <g transform="translate(12, 12)" filter="url(#led-card-glow)" stroke-width="2.2">
          <line x1="12" y1="2" x2="12" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          <line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line>
          <polyline points="10 4 12 2 14 4"></polyline>
          <polyline points="10 20 12 22 14 20"></polyline>
          <polyline points="4 10 2 12 4 14"></polyline>
          <polyline points="20 10 22 12 20 14"></polyline>
          <circle cx="12" cy="12" r="1.5" fill="#ffffff" stroke="#ffffff" stroke-width="0.5"></circle>
        </g>
      </svg>
    `;
    const ledBlob = new Blob([ledSvgStr], { type: 'image/svg+xml;charset=utf-8' });
    const ledUrl = URL.createObjectURL(ledBlob);
    const ledSnowflakeImg = await loadImgAsync(ledUrl);
    URL.revokeObjectURL(ledUrl);

    if (ledSnowflakeImg) {
      const bulbDrawSize = 46;
      ctx.save();
      TREE_BULB_POSITIONS.forEach(b => {
        const bx = treeX + (b.x / 100) * treeW;
        const by = treeY + (b.y / 100) * treeH;
        ctx.drawImage(ledSnowflakeImg, bx - bulbDrawSize / 2, by - bulbDrawSize / 2, bulbDrawSize, bulbDrawSize);
      });
      ctx.restore();
    }

    const loadItemImageAsync = async (type) => {
      const src = IMAGE_ORNAMENTS[type];
      if (src) {
        return await loadImgAsync(src);
      }
      const svgContent = SVG_ASSETS[type];
      if (svgContent) {
        const svgBlob = new Blob([
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${svgContent}</svg>`
        ], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = await loadImgAsync(url);
        URL.revokeObjectURL(url);
        return img;
      }
      return null;
    };

    // Vẽ các phụ kiện thật đã treo lên canvas thiệp
    for (const item of placedOrnaments) {
      const ornImg = await loadItemImageAsync(item.type);
      if (ornImg) {
        const sz = (item.size || 42) * 1.5;
        const px = treeX + (item.x / 100) * treeW - sz / 2;
        const py = treeY + (item.y / 100) * treeH - sz / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(ornImg, px, py, sz, sz);
        ctx.restore();
      }
    }

    // Vẽ các đồ trang trí dưới gốc cây lên canvas thiệp đúng theo vị trí kéo thả
    for (const gItem of placedGroundItems) {
      const gImg = await loadItemImageAsync(gItem.type);
      if (gImg) {
        const sz = (gItem.size || 58) * 1.5;
        const px = treeX + (gItem.x / 100) * treeW - sz / 2;
        const py = treeY + (gItem.y / 100) * treeH - sz / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(gImg, px, py, sz, sz);
        ctx.restore();
      }
    }

    // Tải file PNG về máy
    const filename = `cay-thong-noel-cua-ban-${Date.now()}.png`;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 1000);

    if (window.XMAS_SHARED && window.XMAS_SHARED.playJingleBellSound) {
      window.XMAS_SHARED.playJingleBellSound(1567.98);
    }

    showToast('🎉 Đã tải ảnh cây thông Noel tuyệt đẹp về máy của bạn!');
    return dataUrl;
  }

  // 14. KHỞI TẠO BAN ĐẦU
  populateToolIcons();
  renderLedLights();
  renderTreeStar();
  setTreeColor('green');
  setLedColor('red');
  setStarColor('gold');
  placedOrnaments = [];
  placedGroundItems = [];
  selectedAccessory = null;
  accessorySlotBtns.forEach(b => {
    b.classList.remove('active');
    const badge = b.querySelector('.slot-badge-selected');
    if (badge) badge.remove();
  });
  renderPlacedOrnaments();
  renderGroundDecorations();

  // Export window API for testing and automation
  window.__treeGame = {
    setTreeColor,
    setLedColor,
    setStarColor,
    getStarColor: () => currentStarColor,
    cycleStarColor,
    openCompletionModal,
    closeCompletionModal,
    openResetConfirmModal,
    closeResetConfirmModal,
    performTreeReset,
    showToast,
    getSelectedAccessory: () => selectedAccessory,
    getPlacedOrnaments: () => placedOrnaments,
    getPlacedGroundItems: () => placedGroundItems,
    renderPlacedOrnaments,
    toggleGroundItem,
    removeGroundItem,
    downloadDecoratedTreeCard
  };
});
