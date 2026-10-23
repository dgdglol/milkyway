# 🌌 Milky Way 3D - Dải Ngân Hà Siêu Thực & Huyền Ảo

Website mô phỏng 3D Dải Ngân Hà (Milky Way Galaxy) sống động, rực rỡ sắc màu, đạt chuẩn 60+ FPS với công nghệ **Three.js** và hiệu ứng phát sáng đa tầng **UnrealBloom**.

---

## ✨ Điểm nổi bật & Tính năng

1. **Kiến trúc Dải Ngân Hà chuẩn xác & lung linh**:
   - Hơn **200.000 ngôi sao** (có thể chỉnh lên 250.000) xoắn ốc theo phương trình logarithmic với 4 nhánh chính và nhánh phụ Orion Spur.
   - Hiệu ứng nhấp nháy (twinkle) và quỹ đạo tự xoay vi sai (differential orbital rotation) mượt mà bằng Custom GLSL Shader.
   - **Lõi lỗ đen siêu khối lượng Sagittarius A\*** ở trung tâm với đĩa bồi tụ phát sáng hiệu ứng Doppler relativistic, vầng hào quang quang tử (Photon ring) và tia năng lượng cực (Astrophysical Jets).
   - **Mây bụi tinh vân (Nebula Clouds)** uốn lượn đa sắc (tím cosmic, hồng magenta, xanh cyan) tăng chiều sâu vũ trụ.
   - **Hệ Mặt Trời & Trái Đất** ("Bạn đang ở đây") với cột mốc radar phát xung sinh động tại nhánh Orion.

2. **Chế độ quan sát & Du hành điện ảnh (Cinematic Tour)**:
   - **Cinematic Tour**: Tự động đưa bạn du hành qua các kỳ quan nổi bật của Dải Ngân Hà với chuyển động camera mượt mà.
   - **Góc nhìn nhanh**: Toàn cảnh (Overview), Hệ Mặt Trời (Sun), Lỗ đen Sagittarius A*, Bản đồ xoắn ốc nhìn từ trên xuống (Top-down).
   - Tự do xoay 360°, phóng to / thu nhỏ bằng chuột hoặc cảm ứng trên điện thoại.

3. **Bảng điều khiển tương tác (HUD Glassmorphism)**:
   - **Bộ lọc màu sắc vũ trụ**: Cosmic Violet, Andromeda Cyan, Solar Gold, Cyberpunk Neon, Astrophysical.
   - Tùy chỉnh tốc độ xoay thiên hà, độ sáng phát sáng (Bloom Glow), mật độ sao.
   - Bật/tắt nhãn 3D, mây bụi, tia cực lỗ đen.
   - **Nút chụp ảnh HD**: Xuất hình ảnh sắc nét lưu về máy tính.
   - **Âm thanh không gian vũ trụ**: Hệ thống âm thanh Web Audio API tự sinh tiếng trầm hùng huyền bí của vũ trụ (không cần tải file ngoài).

---

## 🚀 Cách mở và chạy trang web

### Cách 1: Click chuột chạy ngay (Đơn giản nhất trên Windows)
- Nhấp đúp chuột vào file **`chay-web.bat`** trong thư mục này. Trình duyệt sẽ tự động mở trang web tại `http://localhost:3000`.

### Cách 2: Chạy bằng dòng lệnh Terminal
```bash
npm install
npm run dev
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

### Cách 3: Build bản chạy tĩnh
```bash
npm run build
```
Thư mục `dist/` sẽ chứa mã nguồn tối ưu sẵn sàng deploy lên Vercel, Netlify hoặc GitHub Pages.
