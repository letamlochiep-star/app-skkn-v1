# AI ROUTER SPECIFICATION — SKKN AI

## 1. MỤC ĐÍCH
AI Router là tầng trung gian điều phối tác vụ AI độc lập với mô hình cụ thể. Không gọi trực tiếp OpenAI hay Gemini từ business logic.

## 2. TASK TYPES VÀ PHÂN LOẠI MÔ HÌNH
1. **CLASSIFY**: Phân loại đối tượng học sinh, chuyên môn, cấp học.
   - Provider mặc định: OpenAI (`AI_CLASSIFY_MODEL` - ví dụ `gpt-4o-mini`)
   - Fallback: Gemini (`gemini-1.5-flash`)
2. **EXTRACT**: Trích xuất dữ liệu, cấu trúc thông tin từ hồ sơ/minh chứng thực tế.
   - Provider mặc định: OpenAI (`AI_EXTRACT_MODEL`)
   - Fallback: Gemini
3. **IDEATE**: Khởi tạo ý tưởng sáng kiến, giải pháp đột phá.
   - Provider mặc định: OpenAI (`AI_DRAFT_MODEL`)
   - Fallback: Gemini
4. **DRAFT**: Soạn thảo các phần báo cáo SKKN theo cấu trúc chuẩn.
   - Provider mặc định: OpenAI (`AI_DRAFT_MODEL`)
   - Fallback: Gemini
5. **REVIEW**: Đánh giá theo bộ tiêu chí chấm SKKN của Hội đồng khoa học.
   - Provider mặc định: OpenAI (`AI_REVIEW_MODEL`)
   - Fallback: Gemini
6. **FINALIZE**: Rà soát thể thức, chính tả, sư phạm và định dạng văn bản cuối cùng.
   - Provider mặc định: OpenAI (`AI_FINALIZE_MODEL`)
   - Fallback: Gemini

## 3. RESILIENCE & FALLBACK POLICY
- Nếu primary provider timeout hoặc trả lỗi HTTP 5xx/429, Router tự động chuyển tiếp request sang fallback provider nếu tác vụ cho phép `allowFallback: true`.
- Toàn bộ kết quả structured JSON bắt buộc validate qua `JSONSchemaValidator` trước khi trả về.
