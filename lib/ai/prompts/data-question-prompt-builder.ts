import type { SKKNSession } from "@/types/skkn-session";
import type { FactFieldDefinition } from "@/lib/data/project-fact-registry";

export class DataQuestionPromptBuilder {
  /**
   * Builds prompt for Phase 6A Smart Data Questions
   */
  static buildDataQuestionsPrompt(params: {
    session: SKKNSession;
    officialTitle: string;
    knownFacts: Record<string, unknown>;
    missingFields: FactFieldDefinition[];
    skillInstructions?: string;
    knowledgeContext?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { session, officialTitle, knownFacts, missingFields, skillInstructions, knowledgeContext } = params;
    const { contextData } = session;

    const isSolution = contextData.documentType === "SOLUTION";

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ CỐ VẤN NGHIÊN CỨU SÁNG KIẾN KINH NGHIỆM / GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Dựa trên tên đề tài đã chốt và các thông tin đã biết, hãy tạo một đợt gồm từ 3 đến 5 câu hỏi thông minh (Smart Data Questions) để giúp giáo viên cung cấp hoặc làm rõ các dữ liệu thực tế còn thiếu.

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):
1. TUYỆT ĐỐI KHÔNG HỎI LẠI CÁC THÔNG TIN ĐÃ BIẾT (Tên trường, Môn học, Cấp học, Năm học, Tên đề tài, v.v.).
2. TUYỆT ĐỐI KHÔNG YÊU CẦU GIÁO VIÊN BỊA ĐẶT SỐ LIỆU (không yêu cầu số liệu giả định).
3. KHÔNG YÊU CẦU THÔNG TIN CÁ NHÂN NHẠY CẢM CỦA HỌC SINH (không hỏi họ tên, địa chỉ, số điện thoại từng học sinh).
4. Câu hỏi súc tích, gần gũi, rõ ràng, tập trung vào thực tiễn dạy học/quản lý:
   ${
     isSolution
       ? "- GIẢI PHÁP HỮU ÍCH: Tập trung hỏi về quy trình hiện tại, điểm nghẽn thực tế, các bước giải pháp cụ thể, điều kiện áp dụng và minh chứng hiệu quả."
       : "- SÁNG KIẾN KINH NGHIỆM: Tập trung hỏi về thực trạng học sinh, nguyên nhân sư phạm, biện pháp đổi mới giảng dạy và công cụ đánh giá năng lực theo GDPT 2018."
   }
5. Số lượng câu hỏi: Từ 3 đến 5 câu hỏi (không quá 5 câu).
6. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON THEO SCHEMA 'data-questions'. KHÔNG THÊM BẤT KỲ VĂN BẢN NGOÀI JSON.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN SKILL ---\n${skillInstructions}\n` : ""}
${knowledgeContext ? `--- HƯỚNG DẪN MÔN HỌC / CẤP HỌC ---\n${knowledgeContext}\n` : ""}`;

    const userPrompt = `THÔNG TIN DỰ ÁN ĐÃ CHỐT:
- Tên đề tài chính thức: "${officialTitle}"
- Loại tài liệu: ${isSolution ? "Giải pháp hữu ích" : "Sáng kiến kinh nghiệm"}
- Cấp học: ${contextData.educationLevel}
- Môn học / Chuyên môn: ${contextData.subjectGroup}
- Khối lớp: ${contextData.targetGrade || "Theo phân phối chương trình"}
- Năm học: ${contextData.schoolYear || "2026-2027"}

THÔNG TIN ĐÃ CÓ (KHÔNG ĐƯỢC HỎI LẠI):
${Object.entries(knownFacts)
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join("\n")}

DANH SÁCH CÁC TRƯỜNG DỮ LIỆU CÒN THIẾU CẦN THU THẬP:
${missingFields.map((f) => `- [${f.group}] ${f.key}: ${f.label} (${f.description})`).join("\n")}

Hãy tạo từ 3 đến 5 câu hỏi thích ứng để thu thập các thông tin quan trọng nhất còn thiếu và trả về đúng JSON theo schema action="next_questions".`;

    return { systemPrompt, userPrompt };
  }
}
