import type { ProjectPrompt } from "@/types/prompt";
import type { ProjectSectionRecord } from "@/types/writer";
import type { StructureSection } from "@/types/structure";

export class WriterPromptBuilder {
  /**
   * Builds prompt for drafting a specific section in AI Writer
   */
  static buildSectionDraftPrompt(params: {
    project: any;
    prompt: ProjectPrompt;
    lockedSections: StructureSection[];
    verifiedFacts: Record<string, unknown>;
    relevantPreviousSections: ProjectSectionRecord[];
    missingDataManifest: string[];
    revisionMode?: string;
    skillInstructions?: string;
    knowledgeContext?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const {
      project,
      prompt,
      lockedSections,
      verifiedFacts,
      relevantPreviousSections,
      missingDataManifest,
      revisionMode,
      skillInstructions,
      knowledgeContext,
    } = params;

    const isSolution = project.documentType === "SOLUTION";

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ TÁC GIẢ VIẾT SÁNG KIẾN KINH NGHIỆM / GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Soạn thảo nội dung chi tiết, khoa học, thực tiễn và chuẩn mực cho phần nội dung tương ứng với PROMPT ${prompt.promptNumber} của đề tài.

QUY TẮC CỐT LÕI VỀ TÍNH TOÀN VẸN DỮ LIỆU (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. CHỈ SỬ DỤNG DỮ LIỆU ĐÃ ĐƯỢC XÁC MINH (VERIFIED FACTS):
   - Đưa trực tiếp số liệu thật (sĩ số, lớp, trường, thời gian, biện pháp) vào bài viết.
2. TUYỆT ĐỐI KHÔNG BỊA ĐẶT SỐ LIỆU GIẢ:
   - Nghiêm cấm tự tạo sĩ số học sinh giả (như 42 học sinh, 45 em), tỷ lệ % giả, điểm số trước/sau giả định.
   - Nghiêm cấm tự tạo số hiệu thông tư, tên tác giả, DOI hoặc đường dẫn giả.
3. QUY TẮC PLACEHOLDER CHUẨN:
   - Mọi thông tin/số liệu cần thiết nhưng chưa có trong danh mục Dữ liệu xác minh, BẮT BUỘC giữ nguyên placeholder chuẩn:
     * [CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN]
     * [CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN]
     * [NGUỒN CẦN XÁC MINH]
4. VĂN PHONG VÀ THỂ THỨC:
   - Viết tiếng Việt chuẩn mực sư phạm, tự nhiên, chuyên nghiệp, gắn liền với đổi mới phương pháp dạy học theo GDPT 2018.
   - Tránh văn phong sáo rỗng, phóng đại hiệu quả hoặc trang trí hồ sơ.
5. ĐỊNH DẠNG ĐẦU RA:
   - Phải trả về JSON đúng schema 'writer-section' với action="draft_section", promptNumber=${prompt.promptNumber}.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN SKILL ---\n${skillInstructions}\n` : ""}
${knowledgeContext ? `--- HƯỚNG DẪN MÔN HỌC / CẤP HỌC ---\n${knowledgeContext}\n` : ""}`;

    const userPrompt = `THÔNG TIN ĐỀ TÀI:
- Tên đề tài: "${project.title || project.workingTitle}"
- Thể loại: ${isSolution ? "Giải pháp hữu ích" : "Sáng kiến kinh nghiệm"}
- Cấp học: ${project.educationLevel} | Môn: ${project.subjectGroup} | Khối: ${project.gradeLevel || "Theo phân phối"} | Năm học: ${project.schoolYear || "2026-2027"}

NHIỆM VỤ SOẠN THẢO (PROMPT ${prompt.promptNumber}):
- Tiêu đề phần: ${prompt.title}
- Mục đích: ${prompt.purpose}
- Yêu cầu câu lệnh:
"""
${prompt.promptText}
"""
${revisionMode ? `\n- Yêu cầu tùy chỉnh: ${revisionMode}\n` : ""}

DỮ LIỆU THỰC TẾ ĐÃ XÁC MINH:
${Object.entries(verifiedFacts)
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join("\n")}

${
  missingDataManifest.length > 0
    ? `DỮ LIỆU CÒN THIẾU (BẮT BUỘC DÙNG PLACEHOLDER CHUẨN):\n${missingDataManifest.map((k) => `- ${k}`).join("\n")}\n`
    : ""
}
${
  relevantPreviousSections.length > 0
    ? `CÁC PHẦN ĐÃ SOẠN THẢO TRƯỚC ĐÓ ĐỂ LIÊN KẾT MẠCH LẠC:\n${relevantPreviousSections
        .map((s) => `[Prompt ${s.promptNumber}: ${s.title}]\n${s.content.substring(0, 300)}...`)
        .join("\n\n")}\n`
    : ""
}

Hãy soạn thảo nội dung hoàn chỉnh cho Prompt ${prompt.promptNumber} và trả về đúng JSON theo schema action="draft_section".`;

    return { systemPrompt, userPrompt };
  }
}
