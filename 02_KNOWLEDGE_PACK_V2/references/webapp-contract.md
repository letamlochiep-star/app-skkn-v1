# Hợp đồng gọi Skill từ webapp Antigravity

## Quy trình
1. Frontend gửi action đến backend.
2. Backend xác thực user/subscription/license/quota.
3. Backend lấy project facts từ DB.
4. Build payload theo `skkn-session.schema.json`.
5. Orchestrator chọn knowledge modules.
6. AI Router tạo `ai-task`.
7. Provider trả structured response.
8. Validate bằng `step-response.schema.json`.
9. Chỉ sau khi validate mới ghi DB và trả frontend.

## Actions chuẩn
- `analyze_topic`
- `suggest_topics`
- `lock_topic`
- `next_questions`
- `assess_data_completeness`
- `propose_structure`
- `lock_structure`
- `draft_section`
- `revise_section`
- `review_full_document`
- `final_consistency_check`

## Trạng thái không được bỏ qua
`TOPIC -> DATA -> STRUCTURE -> WRITE -> REVIEW -> FINALIZE`
Có thể quay lại bước trước để sửa, nhưng không tự đánh dấu bước sau hoàn thành nếu điều kiện chưa đạt.
