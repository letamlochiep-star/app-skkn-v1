import type { SKKNSession } from "@/types/skkn-session";

export class TopicPromptBuilder {
  /**
   * Builds prompt for Branch A: Analyzing an existing topic title
   */
  static buildAnalyzeTopicPrompt(params: {
    session: SKKNSession;
    titleToAnalyze: string;
    skillInstructions?: string;
    knowledgeContext?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { session, titleToAnalyze, skillInstructions, knowledgeContext } = params;
    const { contextData } = session;

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM / GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Phân tích tên đề tài do giáo viên cung cấp, chỉ ra điểm mạnh, điểm cần hoàn thiện và đề xuất TỐI ĐA 3 phương án tên đề tài tối ưu.

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):
1. TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT SỐ LIỆU (không tự sinh sĩ số, điểm số, tỷ lệ %, tên lớp cụ thể không có trong dữ liệu).
2. TUYỆT ĐỐI KHÔNG TỰ GẮN TỪ KHÓA "AI", "CÔNG NGHỆ" VÀO TÊN NẾU BẢN THÂN BIỆN PHÁP KHÔNG SỬ DỤNG.
3. TUYỆT ĐỐI KHÔNG DÙNG TỪ TUYỆT ĐỐI ("tốt nhất", "triệt để", "100%", "chắc chắn đạt giải").
4. Đánh giá khách quan 8 tiêu chí: Đối tượng, Vấn đề, Biện pháp, Phạm vi, Độ rõ ràng, Tính mới có căn cứ, Khả năng đo lường, Khả năng thu thập minh chứng.
5. Đề xuất TỐI ĐA 3 phương án:
   - Phương án 1: An toàn, rõ ràng, chuẩn thể thức sư phạm.
   - Phương án 2: Làm rõ biện pháp/giải pháp thực hiện.
   - Phương án 3: Nhấn mạnh phạm vi áp dụng hoặc điểm mới (chỉ khi có căn cứ thực tế).
6. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON THEO SCHEMA 'topic-analysis'. KHÔNG THÊM BẤT KỲ VĂN BẢN NGOÀI JSON.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN SKILL ---\n${skillInstructions}\n` : ""}
${knowledgeContext ? `--- HƯỚNG DẪN MÔN HỌC / CẤP HỌC ---\n${knowledgeContext}\n` : ""}`;

    const userPrompt = `DỮ LIỆU DỰ ÁN CỦA GIÁO VIÊN:
- Loại tài liệu: ${contextData.documentType === "SKKN" ? "Sáng kiến kinh nghiệm (SKKN)" : "Giải pháp hữu ích"}
- Cấp học: ${contextData.educationLevel}
- Môn học / Lĩnh vực: ${contextData.subjectGroup}
- Khối lớp: ${contextData.targetGrade || "Chưa xác định"}
- Năm học: ${contextData.schoolYear || "2026-2027"}
- Vấn đề thực tế: ${(contextData.collectedFacts?.problemStatement as string) || "Chưa cung cấp"}
- Đối tượng áp dụng: ${(contextData.collectedFacts?.targetGroup as string) || "Chưa cung cấp"}
- Mục tiêu ban đầu: ${(contextData.collectedFacts?.initialGoal as string) || "Chưa cung cấp"}

TÊN ĐỀ TÀI CẦN PHÂN TÍCH:
"${titleToAnalyze}"

Hãy phân tích toàn diện tên đề tài trên và trả về đúng JSON theo cấu trúc action="analyze_topic".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Branch B: Suggesting 5 new topic titles from pedagogical facts
   */
  static buildSuggestTopicsPrompt(params: {
    session: SKKNSession;
    skillInstructions?: string;
    knowledgeContext?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { session, skillInstructions, knowledgeContext } = params;
    const { contextData } = session;

    const isSolution = contextData.documentType === "SOLUTION";

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM / GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Gợi ý ĐÚNG 5 tên đề tài chuẩn thể thức, tính khả thi cao, dễ thu thập minh chứng và phù hợp chương trình GDPT 2018.

QUY TẮC NGHIỆP VỤ BẮT BUỘC:
1. ĐÚNG 5 TÊN ĐỀ TÀI (không nhiều hơn, không ít hơn).
2. Định hướng loại tài liệu:
   ${
     isSolution
       ? "- GIẢI PHÁP HỮU ÍCH: Tập trung vào giải pháp thực tiễn, tính mới, cách triển khai cụ thể, hiệu quả áp dụng và khả năng nhân rộng."
       : "- SÁNG KIẾN KINH NGHIỆM: Tập trung vào biện pháp sư phạm, đổi mới phương pháp dạy học, rèn luyện năng lực/phẩm chất học sinh theo GDPT 2018."
   }
3. TUYỆT ĐỐI KHÔNG BỊA ĐẶT SỐ LIỆU, SĨ SỐ, ĐIỂM SỐ, TỶ LỆ %, TÊN TRƯỜNG/LỚP LẠ.
4. TUYỆT ĐỐI KHÔNG DÙNG TỪ TUYỆT ĐỐI HAY DỰ ĐOÁN ĐIỂM SỐ GIẢ TẠO ("98 điểm", "100% đạt giải").
5. Tên đề tài súc tích, tự nhiên, dưới 300 ký tự.
6. Đưa ra 1 gợi ý KHUYẾN NGHỊ (recommendedIndex từ 0 đến 4) kèm lý do giải thích rõ ràng.
7. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON THEO SCHEMA 'topic-suggestions'. KHÔNG THÊM BẤT KỲ VĂN BẢN NGOÀI JSON.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN SKILL ---\n${skillInstructions}\n` : ""}
${knowledgeContext ? `--- HƯỚNG DẪN MÔN HỌC / CẤP HỌC ---\n${knowledgeContext}\n` : ""}`;

    const userPrompt = `DỮ LIỆU SƯ PHẠM THỰC TẾ:
- Loại tài liệu: ${isSolution ? "Giải pháp hữu ích" : "Sáng kiến kinh nghiệm"}
- Cấp học: ${contextData.educationLevel}
- Môn / Lĩnh vực: ${contextData.subjectGroup}
- Khối lớp: ${contextData.targetGrade || "Toàn cấp / Theo phân phối chương trình"}
- Năm học: ${contextData.schoolYear || "2026-2027"}
- Vấn đề thực tiễn cần giải quyết: ${(contextData.collectedFacts?.problemStatement as string) || "Chưa cung cấp"}
- Đối tượng áp dụng: ${(contextData.collectedFacts?.targetGroup as string) || "Chưa cung cấp"}
- Mục tiêu cần đạt: ${(contextData.collectedFacts?.initialGoal as string) || "Chưa cung cấp"}

Hãy tạo ĐÚNG 5 tên đề tài và trả về cấu trúc JSON action="suggest_topics".`;

    return { systemPrompt, userPrompt };
  }
}
