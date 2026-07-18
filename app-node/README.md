# AI Document Translator

Dịch tài liệu PDF / Word (.docx) / Ảnh sang PDF / Word / Ảnh bằng AI (OpenAI, Google Gemini, Anthropic Claude, DeepSeek), cố gắng giữ nguyên bố cục/định dạng gốc.

## Cài đặt

```bash
npm install
cp .env.example .env   # rồi điền API key vào .env (hoặc nhập trực tiếp trên giao diện web)
npm start               # hoặc: npm run dev (tự restart khi sửa code)
```

Mở `http://localhost:3000`.

## Cách hoạt động

1. **Trích xuất văn bản** từ file nguồn, có kèm vị trí/kiểu chữ:
   - PDF: `pdfjs-dist` đọc từng dòng text kèm tọa độ (x, y), cỡ chữ.
   - DOCX: giải nén file (là một zip XML theo chuẩn OOXML) và đọc trực tiếp các thẻ `<w:t>`.
   - Ảnh: OCR bằng `tesseract.js`, lấy từng dòng kèm bounding box.
2. **Dịch** danh sách đoạn văn bản bằng AI đã chọn (gộp batch, yêu cầu trả về JSON array đúng thứ tự để không bị lệch vị trí khi ghép lại).
3. **Dựng lại tài liệu**:
   - Nếu input/output cùng định dạng: sửa trực tiếp trên file gốc (fidelity cao nhất).
     - DOCX → DOCX: chỉ thay nội dung text bên trong các thẻ `<w:t>`, mọi style/ảnh/bảng biểu giữ nguyên 100%.
     - PDF → PDF: vẽ hình chữ nhật trắng đè lên vị trí chữ gốc rồi vẽ chữ đã dịch đúng tọa độ đó (font Unicode DejaVu Sans, hỗ trợ tiếng Việt có dấu, Cyrillic, Hy Lạp...).
     - Ảnh → Ảnh: OCR, che chữ gốc bằng ô trắng, vẽ chữ đã dịch đè lên đúng vị trí.
   - Nếu input/output khác định dạng: dựng tài liệu mới theo bố cục ước lượng tốt nhất (xem phần Giới hạn bên dưới).

## Các tổ hợp được hỗ trợ

| Input \ Output | PDF | DOCX | Ảnh |
|---|---|---|---|
| PDF  | Sửa tại chỗ (giữ layout tốt nhất) | Dựng đoạn văn bản mới theo thứ tự đọc | Vẽ lại text lên ảnh nền trắng (không có hình/đồ họa gốc) |
| DOCX | Dàn văn bản theo trang A4 (word-wrap) | Sửa tại chỗ (giữ layout tốt nhất) | Dàn văn bản lên ảnh trang A4 |
| Ảnh  | Nhúng ảnh đã dịch (OCR) vào 1 trang PDF | Dựng đoạn văn bản mới theo thứ tự đọc | Sửa tại chỗ (giữ layout tốt nhất) |

## Giới hạn đã biết

- **PDF → PDF**: chữ gốc vẫn còn ẩn bên dưới lớp text mới (chỉ bị che bằng hình trắng, không bị xóa khỏi content stream). Người xem thấy đúng bản dịch, nhưng nếu copy toàn bộ text hoặc dùng công cụ tìm kiếm nâng cao có thể vẫn thấy văn bản gốc.
- **PDF → Ảnh**: chỉ vẽ lại lớp văn bản, không rasterize hình ảnh/đồ họa/vector trong PDF gốc (vì không dùng engine render PDF đầy đủ như poppler/Ghostscript).
- **Chuyển đổi khác định dạng** (PDF↔DOCX, DOCX↔Ảnh, ...): không thể giữ bố cục tuyệt đối vì định dạng đích không hỗ trợ (DOCX tự dàn trang, không có tọa độ tuyệt đối). Bố cục được dựng lại ở mức "tốt nhất có thể", không pixel-perfect.
- **Font/Unicode cho ảnh**: chữ vẽ lên ảnh dùng font hệ thống mặc định (không nhúng cứng font); trên máy chưa cài font cho ngôn ngữ đích (đặc biệt là các ngôn ngữ CJK trên máy chủ Linux tối giản) có thể hiển thị ô vuông trống. Với PDF, font Unicode (DejaVu Sans) được nhúng thẳng vào file nên luôn hiển thị đúng trên mọi máy (trừ chữ Hán/Nhật/Hàn, do DejaVu không có bộ chữ CJK).
- Xử lý đồng bộ (không có hàng đợi job); file lớn hoặc OCR nhiều trang có thể mất vài phút. Giới hạn upload: 25MB.
- Chỉ hỗ trợ `.docx` (không hỗ trợ `.doc` cũ).

## Cấu hình API key

Có 2 cách:
- Đặt sẵn trong `.env` (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`) — dùng chung cho mọi request.
- Hoặc nhập trực tiếp vào ô "API Key" trên giao diện web mỗi lần dịch (ưu tiên hơn giá trị trong `.env`).

## API

```bash
curl -X POST http://localhost:3000/api/translate \
  -F "file=@document.pdf" \
  -F "sourceLang=auto" \
  -F "targetLang=vi" \
  -F "outputFormat=pdf" \
  -F "provider=openai" \
  -F "apiKey=sk-..." \
  -o translated.pdf
```

`GET /api/languages`, `GET /api/providers` trả về danh sách để hiển thị lên UI.
