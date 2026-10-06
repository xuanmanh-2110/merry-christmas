# 🎄 Thiệp Giáng Sinh Tương Tác (Interactive Christmas Card)

Website thiệp chúc mừng Giáng Sinh tương tác lộng lẫy, ấm áp và mượt mà trên cả Mobile lẫn PC, được xây dựng theo tiêu chuẩn Frontend hiện đại (HTML5, Modern CSS, Tailwind CSS CDN & Vanilla JavaScript).

---

## ✨ CÁC TÍNH NĂNG NỔI BẬT

1. **Bầu trời đêm & Cực quang (Aurora Borealis):**
   - Nền trời xanh thẫm mùa đông kết hợp 2 lớp cực quang huyền ảo lượn sóng mềm mại.
   - Bầu trời sao lấp lánh (Starfield) nhấp nháy dịu dàng.

2. **Tuyết rơi vật lý 3D (Canvas Snow Engine):**
   - Hơn 140 bông tuyết rơi tự nhiên với nhiều kích cỡ, độ mờ và chiều sâu khác nhau (60 FPS).
   - Có các bông hoa tuyết hình ngôi sao 6 cánh độc đáo, hiệu ứng lắc lư theo gió.
   - Tự động tạm dừng khi chuyển tab để tối ưu hiệu năng và tiết kiệm pin.

3. **Dây đèn LED Giáng Sinh & Cỗ xe tuần lộc Santa:**
   - Dây đèn trang trí thả viền trên màn hình với các bóng LED vàng, đỏ, xanh lá, xanh dương, hồng phát sáng rực rỡ (`box-shadow glow`).
   - Cỗ xe tuần lộc của Santa với vệt bụi sao lấp lánh lướt qua bầu trời định kỳ và ngay khi mở thiệp.

4. **Phát bài hát kinh điển "Wham - Last Christmas":**
   - Tích hợp trực tiếp file âm thanh `Wham - Last Christmas (Lyrics).mp3` chất lượng cao, phát mượt mà 100% offline không cần kết nối mạng.
   - **Tự động cất tiếng hát du dương của George Michael ngay khi người nhận mở thiệp!** Không cần thêm bất kỳ nút bấm thủ công nào, tạo bất ngờ tuyệt đối cho người nhận thiệp.

5. **Phong bì 3D & Con dấu sáp hoàng gia (Royal Wax Seal):**
   - Phong bì màu đỏ rượu vang (Burgundy) viền chỉ vàng kim, tem bưu điện North Pole cổ điển.
   - Con dấu sáp đỏ dập nổi bông tuyết 3D.
   - Khi chạm vào: Con dấu vỡ nhẹ, nắp phong bì lật ngược 180° theo không gian 3D, bùng nổ pháo hoa tuyết lung linh (`canvas-confetti`), lá thư trang trọng trượt lên mở rộng.

6. **🎄 Cây thông Noel mini tương tác:**
   - Nằm ngay trong lá thư là cây thông Giáng sinh vẽ bằng SVG/CSS tinh xảo phủ tuyết trắng và ngôi sao phát sáng trên đỉnh.
   - Khi nhấp vào cây thông / quả cầu:
     + Dàn đèn và quả cầu tự động đổi màu theo 5 theme lễ hội: *Vàng Kim Hoàng Gia*, *Đỏ Ruby Quý Phái*, *Lục Bảo Tuyết Trắng*, *Cầu Vồng Lễ Hội*, *Pha Lê Băng Giá*.
     + Phát ra âm thanh chuông ngân *"leng keng"* (Jingle Bell Chime) bằng Web Audio API với âm sắc kim loại chân thực.
     + Bung nở chùm pháo hạt sparkle lấp lánh tại ngọn thông.

7. **📸 Tải thiệp về máy dạng hình ảnh PNG (html2canvas):**
   - Nút bấm *"📸 Tải thiệp về máy (PNG)"* chụp lại toàn bộ lá thư thiệp độ nét cao (scale 2.5x).
   - Tự động xuất file `thiep-giang-sinh-[ten].png` sắc nét, sẵn sàng chia sẻ lên Story Facebook, Instagram, Zalo.

8. **Cá nhân hóa lời chúc qua đường dẫn URL:**
   - Dễ dàng gửi tặng bạn bè kèm tên và lời chúc qua URL Query Parameters:
     + `?to=Minh%20Anh` (Hiển thị: *"Gửi bạn Minh Anh thân mến!"*)
     + `?from=Hoàng` (Chữ ký: *"Thân gửi từ trái tim, Hoàng ❄️"*)
     + `?msg=Lời%20chúc...`
   - Nút *"✉️ Gấp thiệp lại"* để gấp thư vào phong bì và trải nghiệm lại bất cứ lúc nào.

---

## 🚀 HƯỚNG DẪN SỬ DỤNG

### 1. Mở trực tiếp (Không cần cài đặt, không cần build tool)
- Chỉ cần **nhấp đúp chuột vào file `index.html`** để mở ngay trên trình duyệt bất kỳ (Chrome, Edge, Safari, Firefox, Cốc Cốc trên cả PC và điện thoại).

### 2. Cấu trúc thư mục
```
giangsinh/
├── index.html        # Giao diện chính hoàn chỉnh
├── css/
│   └── style.css     # Toàn bộ hiệu ứng 3D, cực quang, đèn LED, animation
├── js/
│   └── app.js        # Logic Web Audio API, Canvas tuyết, html2canvas, modal
└── README.md         # Hướng dẫn sử dụng
```

### 3. Ví dụ đường link chia sẻ cá nhân hóa
```
index.html?to=Minh%20Anh&from=Thành%20Nam&msg=Chúc%20cậu%20một%20mùa%20Noel%20ấm%20áp%20và%20luôn%20hạnh%20phúc!
```
