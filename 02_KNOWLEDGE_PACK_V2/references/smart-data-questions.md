# Bộ câu hỏi thu thập dữ liệu thông minh

## Quy tắc hỏi
1. Không hỏi lại trường đã biết.
2. Mỗi lượt tối đa 5 câu; ưu tiên câu có giá trị thông tin cao nhất.
3. Ưu tiên câu quyết định khả năng viết phần tiếp theo.
4. Cho phép câu trả lời `chưa có`; khi đó đề xuất cách thu thập hợp lệ, không bịa.
5. Dùng câu hỏi chọn nhanh + ô mô tả khi phù hợp giao diện webapp.

## Nhóm A - Chốt đề tài
- Môn/lĩnh vực và cấp/khối nào?
- Vấn đề cụ thể nào đang xảy ra? Hãy mô tả một tình huống thực tế.
- Nhóm học sinh/trẻ nào bị ảnh hưởng rõ nhất?
- Điều gì thầy/cô muốn thay đổi sau 4-12 tuần/học kì?
- Thầy/cô đã có biện pháp/công cụ dự kiến chưa?

## Nhóm B - Thực trạng
- Dấu hiệu nào cho thấy vấn đề tồn tại?
- Có dữ liệu đầu vào nào: điểm, rubric, quan sát, sản phẩm, phản hồi?
- Nguyên nhân nào do người học, nhiệm vụ, phương pháp, môi trường hoặc nguồn lực?
- Có thuận lợi nào có thể tận dụng?
- Hạn chế thiết bị/thời gian/sĩ số nào ảnh hưởng giải pháp?

## Nhóm C - Thiết kế giải pháp
- Hành vi dạy/học nào sẽ thay đổi?
- Hoạt động cốt lõi diễn ra theo các bước nào?
- Học sinh tạo sản phẩm/biểu hiện năng lực gì?
- Giáo viên phản hồi/điều chỉnh ở điểm nào?
- Điều kiện tối thiểu để nhân rộng là gì?

## Nhóm D - Minh chứng
- Chỉ báo thành công cụ thể là gì?
- Đo trước và sau bằng cùng công cụ nào?
- Có cần lớp/nhóm đối sánh không? Nếu không có, dùng thiết kế nào thay thế?
- Có minh chứng định tính nào giúp giải thích số liệu?
- Có dữ liệu nào chưa đủ tin cậy cần thu bổ sung?

## Nhóm E - AI/công nghệ
Chỉ hỏi nếu đề tài có công nghệ:
- Công cụ nào, phiên bản/tính năng nào được dùng?
- Dữ liệu nào được nhập vào công cụ?
- Ai kiểm chứng đầu ra?
- Nếu công cụ lỗi/mất mạng thì hoạt động thay thế là gì?
- Cách ngăn AI làm thay phần năng lực cần đánh giá?

## Thuật toán chọn câu hỏi cho webapp
Tính `priority_score` theo: `criticality(0-3) + missing_dependency(0-3) + evidence_value(0-2) + stage_relevance(0-2)`.
Chỉ trả 3-5 câu có điểm cao nhất. Nếu tất cả trường critical đã đủ, chuyển sang đề xuất bước kế tiếp.
