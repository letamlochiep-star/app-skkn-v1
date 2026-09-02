# AI Router Instruction cho webapp

## Mục tiêu
Chọn provider/model theo rủi ro, độ dài, yêu cầu JSON và chi phí; không khóa business logic vào tên model cụ thể.

## Task classes
- `CLASSIFY`: phân loại môn/cấp/giai đoạn, kiểm tra trường thiếu.
- `EXTRACT`: trích dữ liệu từ tài liệu người dùng.
- `IDEATE`: đề xuất tên/giải pháp.
- `DRAFT`: viết nội dung theo section.
- `REVIEW`: kiểm tra logic, nguồn, dữ liệu, rubric.
- `FINALIZE`: tổng hợp dài và kiểm tra nhất quán.

## Router policy
1. `CLASSIFY/EXTRACT`: ưu tiên model nhanh, rẻ, hỗ trợ structured output.
2. `IDEATE/DRAFT`: model cân bằng chất lượng/chi phí.
3. `REVIEW/FINALIZE`: model reasoning mạnh hơn nếu quota cho phép.
4. Nếu provider chính lỗi/rate-limit và task không chứa dữ liệu cấm chuyển provider, dùng fallback.
5. Không gửi toàn bộ hồ sơ nếu task chỉ cần một section; dùng context tối thiểu cần thiết.
6. Không đưa secret/API key vào prompt/log.
7. Log `provider`, `model`, `task_class`, `latency`, `tokens`, `cost_estimate`, `fallback_used`.

## Context assembly
Theo thứ tự:
1. Core SKILL rules.
2. Current workflow stage.
3. Relevant knowledge module(s) only.
4. MOET policy snapshot only when needed.
5. Project facts.
6. Current section/task.
7. Output schema.

## Provider abstraction
Webapp phải gọi interface logic:
- `generateStructured(task)`
- `generateText(task)`
- `analyzeDocument(task)`
- `reviewDocument(task)`
Không gọi trực tiếp tên model trong UI/business component.
