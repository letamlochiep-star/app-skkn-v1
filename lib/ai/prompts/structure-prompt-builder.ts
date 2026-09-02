import type { SKKNSession } from "@/types/skkn-session";

export class StructurePromptBuilder {
  /**
   * Builds prompt for Part A: Proposing a complete pedagogical structure
   */
  static buildProposeStructurePrompt(params: {
    session: SKKNSession;
    officialTitle: string;
    verifiedFacts: Record<string, unknown>;
    localGuidelines?: string;
    skillInstructions?: string;
    knowledgeContext?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { session, officialTitle, verifiedFacts, localGuidelines, skillInstructions, knowledgeContext } = params;
    const { contextData } = session;

    const isSolution = contextData.documentType === "SOLUTION";

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ HỘI ĐỒNG THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM / GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Đề xuất KHUNG CẤU TRÚC ĐỀ TÀI hoàn chỉnh, khoa học, bám sát thể thức của Bộ GD&ĐT và phù hợp chương trình GDPT 2018.

QUY TẮC NGHIỆP VỤ BẮT BUỘC:
1. ĐỊNH HƯỚNG THỂ LOẠI:
   ${
     isSolution
       ? "- GIẢI PHÁP HỮU ÍCH: Cấu trúc ưu tiên: I. Đặt vấn đề/Mục tiêu giải pháp; II. Thực trạng & Điểm nghẽn quy trình cũ; III. Nội dung giải pháp & Các bước thực hiện; IV. Hiệu quả áp dụng & Khả năng nhân rộng; V. Kết luận & Đề xuất."
       : "- SÁNG KIẾN KINH NGHIỆM: Cấu trúc chuẩn 3 phần: Phần I. Đặt vấn đề (Lý do chọn đề tài, Mục tiêu, Đối tượng, Phạm vi); Phần II. Giải quyết vấn đề (Cơ sở lý luận, Thực trạng & Nguyên nhân, Các biện pháp sư phạm, Thực nghiệm & Kết quả); Phần III. Kết luận và Khuyến nghị."
   }
2. ƯU TIÊN QUY ĐỊNH ĐƠN VỊ: Nếu có quy định riêng hoặc giới hạn số trang của trường/Sở, cấu trúc phải tuân thủ nghiêm ngặt.
3. TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT SỐ LIỆU, SĨ SỐ, ĐIỂM SỐ, TỶ LỆ %, NGUỒN THAM KHẢO GIẢ.
4. KHÔNG VIẾT NỘI DUNG VĂN BẢN ĐẦY ĐỦ. Chỉ nêu tiêu đề mục (title), mục đích (purpose), yêu cầu dữ liệu (requiredDataKeys), và các mục con (subsections).
5. PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON THEO SCHEMA 'project-structure'. KHÔNG THÊM BẤT KỲ VĂN BẢN NGOÀI JSON.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN SKILL ---\n${skillInstructions}\n` : ""}
${knowledgeContext ? `--- HƯỚNG DẪN MÔN HỌC / CẤP HỌC ---\n${knowledgeContext}\n` : ""}`;

    const userPrompt = `THÔNG TIN ĐỀ TÀI & DỮ LIỆU ĐÃ XÁC MINH:
- Tên đề tài chính thức: "${officialTitle}"
- Loại tài liệu: ${isSolution ? "Giải pháp hữu ích" : "Sáng kiến kinh nghiệm"}
- Cấp học: ${contextData.educationLevel}
- Môn học / Lĩnh vực: ${contextData.subjectGroup}
- Khối lớp: ${contextData.targetGrade || "Theo phân phối chương trình"}
- Năm học: ${contextData.schoolYear || "2026-2027"}
${localGuidelines ? `- Quy định riêng của đơn vị: ${localGuidelines}\n` : ""}

DỮ LIỆU THỰC TẾ ĐÃ CUNG CẤP:
${Object.entries(verifiedFacts)
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join("\n")}

Hãy đề xuất khung cấu trúc hoàn chỉnh và trả về đúng JSON theo schema action="propose_structure".`;

    return { systemPrompt, userPrompt };
  }
}
