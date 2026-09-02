import type { SKKNSession } from "@/types/skkn-session";
import type { StructureSection } from "@/types/structure";

export const PROMPT_18_STANDARD_TEXT = `Đóng vai trò chuyên gia thẩm định SKKN / Giải pháp hữu ích Bộ Giáo dục và Đào tạo, hãy rà soát tính logic, tính liên kết mạch lạc toàn văn giữa Thực trạng -> Nguyên nhân -> Biện pháp -> Kết quả thực nghiệm -> Kết luận; kiểm tra tính toàn vẹn số liệu (không để sót placeholder chưa xác minh); và hoàn thiện danh mục tài liệu tham khảo theo quy chuẩn trích dẫn Bộ GD&ĐT.`;

export class PromptSetBuilder {
  /**
   * Builds prompt for Part B: Generating exactly 18 personalized prompts
   */
  static buildGenerate18PromptsPrompt(params: {
    session: SKKNSession;
    officialTitle: string;
    lockedSections: StructureSection[];
    verifiedFacts: Record<string, unknown>;
    skillInstructions?: string;
    knowledgeContext?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { session, officialTitle, lockedSections, verifiedFacts, skillInstructions, knowledgeContext } = params;
    const { contextData } = session;

    const isSolution = contextData.documentType === "SOLUTION";

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM / GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Dựa trên Tên đề tài đã chốt, Khung cấu trúc đã khóa và Dữ liệu thực tế đã xác minh, hãy tạo BỘ ĐÚNG 18 CÂU LỆNH (18 Prompts) chi tiết, cá nhân hóa để giáo viên có thể sao chép và thực thi từng phần soạn thảo.

QUY TẮC BẮT BUỘC VỀ BỘ 18 CÂU LỆNH (CHÍNH XÁC & BẤT DI BẤT DỊCH):
1. SỐ LƯỢNG: PHẢI CÓ ĐÚNG 18 CÂU LỆNH (Được đánh số thứ tự từ 1 đến 18, không được 17, không được 19).
2. TÍNH CÁ NHÂN HÓA:
   - Câu lệnh 1 đến 17 phải gắn trực tiếp Tên đề tài, Môn học, Khối lớp, Đối tượng và các Dữ liệu thực tế đã xác minh.
   - Tuyệt đối không dùng cụm từ chung chung như "[môn học]", "[khối lớp]" nếu dữ liệu đã có.
3. QUY TẮC PLACEHOLDER CHUẨN KHI THIẾU DỮ LIỆU:
   - Nếu dữ liệu chưa có (như điểm số cụ thể hoặc minh chứng chưa thu thập), BẮT BUỘC dùng đúng nhãn:
     * [CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN]
     * [CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN]
     * [NGUỒN CẦN XÁC MINH]
   - TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT SỐ LIỆU (không tự sinh 42 học sinh, 85%, điểm 8.5).
4. CÂU LỆNH 18 (BẮT BUỘC NGUYÊN VĂN & BẤT BIẾN):
   - Câu lệnh số 18 là câu lệnh tổng hợp hoàn thiện cuối cùng, phải có nội dung:
     "${PROMPT_18_STANDARD_TEXT}"
5. PHÂN BỔ 18 CÂU LỆNH PHÙ HỢP CẤU TRÚC ĐÃ KHÓA:
   - Prompt 1: Đặt vấn đề / Tính cấp thiết của đề tài
   - Prompt 2: Mục tiêu và nhiệm vụ nghiên cứu
   - Prompt 3: Đối tượng và phạm vi nghiên cứu
   - Prompt 4: Phương pháp nghiên cứu / Cách tiếp cận
   - Prompt 5: Cơ sở lý luận & định hướng GDPT 2018
   - Prompt 6: Thực trạng và khó khăn thực tế tại đơn vị
   - Prompt 7: Phân tích các nguyên nhân của thực trạng
   - Prompt 8: Tổng quan hệ thống giải pháp / biện pháp
   - Prompt 9: Biện pháp / Giải pháp 1 (Quy trình chi tiết, ví dụ minh họa)
   - Prompt 10: Biện pháp / Giải pháp 2 (Quy trình chi tiết, ví dụ minh họa)
   - Prompt 11: Biện pháp / Giải pháp 3 (nếu có, hoặc cách thức triển khai chuyên sâu)
   - Prompt 12: Điều kiện, phương tiện và học liệu thực hiện
   - Prompt 13: Quy trình tổ chức thực nghiệm / áp dụng giải pháp
   - Prompt 14: Kết quả và đánh giá hiệu quả (định lượng & định tính)
   - Prompt 15: Khả năng áp dụng và nhân rộng giải pháp
   - Prompt 16: Bài học kinh nghiệm rút ra từ thực tiễn
   - Prompt 17: Kết luận và Đề xuất, kiến nghị
   - Prompt 18: Rà soát logic toàn văn và hoàn thiện danh mục tài liệu tham khảo
6. ĐỊNH DẠNG ĐẦU RA: PHẢI TRẢ VỀ ĐÚNG JSON THEO SCHEMA '18-prompt-set'.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN SKILL ---\n${skillInstructions}\n` : ""}
${knowledgeContext ? `--- HƯỚNG DẪN MÔN HỌC / CẤP HỌC ---\n${knowledgeContext}\n` : ""}`;

    const userPrompt = `THÔNG TIN DỰ ÁN & CẤU TRÚC ĐÃ KHÓA:
- Tên đề tài chính thức: "${officialTitle}"
- Thể loại: ${isSolution ? "Giải pháp hữu ích" : "Sáng kiến kinh nghiệm"}
- Cấp học: ${contextData.educationLevel}
- Môn / Chuyên môn: ${contextData.subjectGroup}
- Khối lớp: ${contextData.targetGrade || "Theo phân phối chương trình"}
- Năm học: ${contextData.schoolYear || "2026-2027"}

CÁC MỤC CỦA KHUNG CẤU TRÚC ĐÃ KHÓA:
${lockedSections.map((s) => `${s.order}. ${s.title} (Mục đích: ${s.purpose})`).join("\n")}

DỮ LIỆU THỰC TẾ ĐÃ XÁC MINH (ĐƯA VÀO PROMPT):
${Object.entries(verifiedFacts)
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join("\n")}

Hãy tạo BỘ ĐÚNG 18 CÂU LỆNH (numbered 1..18) và trả về JSON theo schema action="generate_18_prompts".`;

    return { systemPrompt, userPrompt };
  }
}
