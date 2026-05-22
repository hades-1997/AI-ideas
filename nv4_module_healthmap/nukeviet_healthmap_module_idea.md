# 🗺️ Tài liệu Tổng Hợp: Ý Tưởng & Cấu Trúc Module Healthmap (NukeViet)

## 1. Ý tưởng cốt lõi
Module **Healthmap (Bản đồ trạm y tế)** được xây dựng nhằm mục đích cung cấp một hệ thống quản lý và hiển thị trực quan vị trí các cơ sở y tế trên nền tảng **NukeViet CMS**. 

Mục tiêu trải nghiệm người dùng (UX):
- Xem toàn cảnh hệ thống y tế trong khu vực qua bản đồ số hiện đại.
- Nhanh chóng tìm kiếm trạm y tế gần nhất nhờ tính năng định vị GPS tự động từ trình duyệt.
- Dễ dàng tra cứu thông tin liên hệ, đánh giá, và chỉ đường trực tiếp (Google Maps) từ hệ thống.
- Module phải linh hoạt: có thể hiển thị như một trang độc lập (Main Module) hoặc nhúng gọn gàng vào các trang khác thông qua hệ thống Block của NukeViet.

---

## 2. Công nghệ & Thư viện sử dụng
- **Backend:** PHP & MySQL (Tuân thủ kiến trúc và tiêu chuẩn mã nguồn của NukeViet CMS).
- **Template Engine:** XTemplate (Mặc định của NukeViet).
- **Bản đồ số:** [Leaflet JS](https://leafletjs.com/) (thư viện render bản đồ mã nguồn mở) + Dữ liệu nền (Base map) từ CARTO / OpenStreetMap.
- **Tính toán tọa độ:** Thuật toán Haversine (tính toán khoảng cách chim bay giữa 2 điểm Lat/Lng) & Geolocation API (HTML5).
- **CSS Architecture:** Vanilla CSS kết hợp BEM convention (`.hm-*`) để tránh xung đột với theme gốc.

---

## 3. Kiến trúc hệ thống thư mục (Cấu trúc Module NukeViet)

Module được xây dựng bài bản theo chuẩn MVC của NukeViet:

```text
modules/healthmap/
├── admin/                  # [Backend] Quản trị module
│   ├── main.php            # Giao diện danh sách các trạm y tế
│   └── content.php         # Giao diện Thêm/Sửa trạm (kèm bản đồ mini chọn tọa độ)
├── blocks/                 # [Blocks] Chức năng nhúng linh hoạt
│   ├── global.block_map.ini # Cấu hình block (Khai báo với NukeViet, tham số chiều cao)
│   └── global.block_map.php # Logic truy xuất DB và truyền dữ liệu cho block
├── funcs/                  # [Frontend] Chức năng người dùng
│   ├── main.php            # Trang hiển thị bản đồ lớn
│   └── api.php             # REST API nội bộ trả về JSON danh sách trạm
└── js/
    └── map.js              # Logic Javascript cho bản đồ trang chính

themes/default/
├── css/
│   └── healthmap.css       # CSS chung cho cả main và block (Mobile-first)
└── modules/healthmap/
    ├── main.tpl            # Layout trang chính
    ├── block_map.tpl       # Layout của block bản đồ
    └── admin/
        ├── main.tpl        # Layout quản trị danh sách
        └── content.tpl     # Layout form Thêm/Sửa trạm
```

---

## 4. Các luồng xử lý chính (Workflows)

### 4.1. Luồng Backend (Quản trị Admin)
- Dữ liệu trạm y tế (Tên, Địa chỉ, Số điện thoại, Tọa độ Lat/Lng, Hình ảnh) được lưu trong bảng DB `nv4_vi_healthmap`.
- Thay vì admin phải nhập tay tọa độ rất dễ sai sót, form "Thêm/Sửa" được tích hợp **bản đồ mini tương tác**. Admin chỉ cần click vào bản đồ hoặc dùng ô tìm kiếm, tọa độ `latitude` và `longitude` sẽ tự động điền vào form.
- Form lưu dữ liệu dùng công nghệ AJAX (Fetch API) tránh reload lại trang, tạo cảm giác mượt mà (Single Page Application).

### 4.2. Luồng Frontend (Trang người dùng & Block)
1. **Lấy dữ liệu:** Trang PHP dùng hàm DB của NukeViet truy xuất toàn bộ trạm đang có trạng thái kích hoạt, chuyển đổi thành chuỗi JSON an toàn và nhúng trực tiếp vào biến Javascript.
2. **Khởi tạo bản đồ (Leaflet):** Bản đồ tự động canh chỉnh (center) dựa trên danh sách tọa độ đang có. Vẽ các điểm đánh dấu (Marker) tùy chỉnh.
3. **Tính năng "Tìm gần nhất":** 
   - Kích hoạt HTML5 Geolocation xin quyền lấy vị trí người dùng.
   - Duyệt qua toàn bộ danh sách trạm, áp dụng thuật toán Haversine để tìm ra trạm có khoảng cách ngắn nhất.
   - Bản đồ lập tức bay tới (FlyTo) điểm đó, nổi bật marker và bật Info Card báo khoảng cách thực tế (km/m).

---

## 5. Các thách thức đã giải quyết & Bài học (Technical Solutions)

Trong quá trình xây dựng, chúng ta đã tối ưu các vấn đề kỹ thuật đặc thù của NukeViet CMS:

> [!NOTE]
> **Vấn đề Scope & Xung đột CSS/JS (Block Architecture)**
> Khác với trang chính, một trang web có thể gắn nhiều block cùng loại. Do đó, việc dùng ID cố định (như `id="map"`) sẽ gây vỡ layout và lỗi JS.
> **Giải pháp:** Sử dụng thẻ tag `{BLOCK_ID}` của XTemplate để tạo tiền tố động cho toàn bộ ID (`id="hm-b-map-{BLOCK_ID}"`). CSS hoàn toàn dùng Class(`.hm-*`).

> [!WARNING]
> **XTemplate "nuốt" tham số của Leaflet (Tile rendering 404)**
> Trong NukeViet, XTemplate tự động dò tìm mọi chuỗi nằm trong `{}` để nội suy biến. Leaflet lại dùng URL tile như `https://{s}.basemaps.../{z}/{x}/{y}.png`. Kết quả: NukeViet xóa trắng các cụm `{z}` làm bản đồ không load được.
> **Giải pháp:** Trong file `block_map.tpl`, sử dụng mã ASCII để "lắp ráp" URL trong Javascript thời gian thực: `String.fromCharCode(123)` thay cho `{`, tránh XTemplate can thiệp.

> [!TIP]
> **Responsive Mobile-first (Lỗi hiển thị bản đồ & Control)**
> Trên Mobile, màn hình dọc làm các controls của bản đồ (như nút +/-) bị đè bởi bảng thông tin (Info Card). NukeViet thường nhét layout block vào các vùng có kích thước không xác định.
> **Giải pháp:** 
> 1. Chuyển Zoom Control lên góc trên cùng (`topright`).
> 2. Sử dụng biến CSS `--hm-height` thay vì `100vh` để giao diện luôn chia 50-50 cân đối (danh sách trên, bản đồ dưới) bất kể được nhúng ở đâu.
> 3. Vô hiệu hóa CSS ảnh hưởng xấu từ Theme mẹ (`img { max-width: 100% }`).

---

## 6. Tổng kết
Module **Healthmap** hoàn chỉnh không chỉ đóng vai trò như một tính năng tra cứu địa lý tiện ích, mà còn là một minh chứng về việc có thể tích hợp mượt mà các ứng dụng web hiện đại (SPA, Interactive Maps) vào một hệ thống CMS truyền thống như NukeViet một cách an toàn và tối ưu nhất về UX/UI.
