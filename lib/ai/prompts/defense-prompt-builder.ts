import type { DefenseDuration } from "@/types/defense";
import type { ProjectDocumentDraftRecord } from "@/types/writer";

export class DefensePromptBuilder {
  /**
   * System prompt base for defense presentation
   */
  private static getBaseSystemPrompt(durationMinutes: DefenseDuration, skillInstructions?: string): string {
    return `BẠN LÀ CHUYÊN GIA TƯ VẤN THUYẾT TRÌNH VÀ BẢO VỆ GIẢI PHÁP HỮU ÍCH VIỆT NAM (BỘ GD&ĐT).

NHIỆM VỤ: Chuẩn bị nội dung báo cáo trình bày và bảo vệ Giải pháp hữu ích trước Ban Giám Khảo trong thời lượng ${durationMinutes} PHÚT.

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. NÓI ĐÚNG NHỮNG GÌ CÓ THỂ CHỨNG MINH:
   - Toàn bộ bài nói, slide và câu trả lời phải bám sát bản thảo đã rà soát và dữ liệu xác minh.
2. TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU / MINH CHỨNG MỚI:
   - Không tự bịa thêm sĩ số, điểm số trước/sau, tỷ lệ % hoặc ảnh chụp minh chứng.
   - Nếu thiếu minh chứng thực tế, ghi rõ [CHỜ ẢNH/MINH CHỨNG THỰC TỪ GIÁO VIÊN] hoặc [CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN].
3. KHÔNG PHÓNG ĐẠI TÍNH MỚI HOẶC HIỆU QUẢ:
   - Tránh các từ "hoàn toàn mới", "đầu tiên tại Việt Nam", "đột phá nhất" nếu không có căn cứ xác minh. Tập trung vào điểm cải tiến trong bối cảnh cụ thể.
4. KHÔNG CHE GIẤU HẠN CHẾ:
   - Nêu rõ điều kiện áp dụng, phạm vi và những hạn chế thực tế.
5. VĂN PHONG THUYẾT TRÌNH:
   - Câu ngắn gọn, tự nhiên, chuyên nghiệp, dễ nói, tốc độ nói tiêu chuẩn 110–140 từ/phút.

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN ---\n${skillInstructions}\n` : ""}`;
  }

  /**
   * Builds prompt for Outline generation
   */
  static buildOutlinePrompt(params: {
    project: any;
    draft: ProjectDocumentDraftRecord;
    verifiedFacts: Record<string, unknown>;
    durationMinutes: DefenseDuration;
    skillInstructions?: string;
  }) {
    const { project, draft, verifiedFacts, durationMinutes, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(durationMinutes, skillInstructions);

    const userPrompt = `ĐỀ TÀI GIẢI PHÁP HỮU ÍCH: "${project.title || project.workingTitle}"
Thời lượng: ${durationMinutes} phút (${durationMinutes * 60} giây)

DỮ LIỆU XÁC MINH:
${Object.entries(verifiedFacts).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join("\n")}

NỘI DUNG BẢN THẢO:
"""
${draft.plainText.substring(0, 3000)}...
"""

Hãy tạo Dàn ý thuyết trình (Defense Outline) phân bổ thời gian cho từng phần sao cho tổng thời gian đúng ${durationMinutes * 60} giây. Trả về đúng JSON theo schema action="generate_defense_outline".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Oral Script generation
   */
  static buildScriptPrompt(params: {
    project: any;
    draft: ProjectDocumentDraftRecord;
    verifiedFacts: Record<string, unknown>;
    durationMinutes: DefenseDuration;
    outlineJson: any;
    skillInstructions?: string;
  }) {
    const { project, draft, verifiedFacts, durationMinutes, outlineJson, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(durationMinutes, skillInstructions);

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"
Thời lượng: ${durationMinutes} phút

DÀN Ý ĐÃ PHÂN BỔ THỜI GIAN:
${JSON.stringify(outlineJson, null, 2)}

Hãy soạn thảo Bài nói hoàn chỉnh (Oral Script) để giáo viên thuyết trình trực tiếp trước Ban Giám Khảo. Trả về đúng JSON theo schema action="generate_defense_script".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Slide Content generation
   */
  static buildSlidesPrompt(params: {
    project: any;
    draft: ProjectDocumentDraftRecord;
    durationMinutes: DefenseDuration;
    skillInstructions?: string;
  }) {
    const { project, draft, durationMinutes, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(durationMinutes, skillInstructions);

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"
Thời lượng: ${durationMinutes} phút

Hãy tạo Nội dung từng slide trình chiếu (Slide Content Model). Mỗi slide gồm tiêu đề, 3-5 ý chính ngắn gọn, thông điệp cốt lõi và gợi ý hình ảnh/biểu đồ trực quan. Trả về đúng JSON theo schema action="generate_slide_content".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Speaker Notes generation
   */
  static buildSpeakerNotesPrompt(params: {
    project: any;
    slidesJson: any;
    durationMinutes: DefenseDuration;
    skillInstructions?: string;
  }) {
    const { project, slidesJson, durationMinutes, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(durationMinutes, skillInstructions);

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"

DANH SÁCH SLIDE:
${JSON.stringify(slidesJson, null, 2)}

Hãy tạo Ghi chú diễn giả (Speaker Notes) cho từng slide. Trả về đúng JSON theo schema action="generate_speaker_notes".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Jury Questions generation
   */
  static buildJuryQuestionsPrompt(params: {
    project: any;
    draft: ProjectDocumentDraftRecord;
    skillInstructions?: string;
  }) {
    const { project, draft, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(7, skillInstructions);

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"

NỘI DUNG BẢN THẢO:
"""
${draft.plainText.substring(0, 3000)}...
"""

Hãy tạo bộ 10-15 Câu hỏi phản biện dự kiến từ Ban Giám Khảo xoay quanh tính mới, hiệu quả, minh chứng, chi phí và khả năng nhân rộng. Trả về đúng JSON theo schema action="generate_jury_questions".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Answer Frameworks generation
   */
  static buildAnswerFrameworksPrompt(params: {
    project: any;
    questionsJson: any;
    verifiedFacts: Record<string, unknown>;
    skillInstructions?: string;
  }) {
    const { project, questionsJson, verifiedFacts, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(7, skillInstructions);

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"

CÂU HỎI BAN GIÁM KHẢO:
${JSON.stringify(questionsJson, null, 2)}

DỮ LIỆU XÁC MINH:
${Object.entries(verifiedFacts).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join("\n")}

Hãy tạo Khung trả lời (Answer Framework) cho từng câu hỏi theo cấu trúc: Trả lời trực tiếp -> Minh chứng -> Giải thích -> Nêu giới hạn -> Kết thúc. Trả về đúng JSON theo schema action="generate_answer_framework".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for One-Page Summary generation
   */
  static buildOnePageSummaryPrompt(params: {
    project: any;
    draft: ProjectDocumentDraftRecord;
    skillInstructions?: string;
  }) {
    const { project, draft, skillInstructions } = params;
    const systemPrompt = this.getBaseSystemPrompt(7, skillInstructions);

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"

NỘI DUNG BẢN THẢO:
"""
${draft.plainText.substring(0, 3000)}...
"""

Hãy tạo Bản tóm tắt 1 trang A4 (One-Page Summary) cô đọng toàn bộ vấn đề, giải pháp cốt lõi, điểm cải tiến, minh chứng, hiệu quả và thông điệp cuối. Trả về đúng JSON theo schema action="generate_one_page_summary".`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for Practice Answer Evaluation
   */
  static buildAnswerEvaluationPrompt(params: {
    project: any;
    questionText: string;
    answerText: string;
    verifiedFacts: Record<string, unknown>;
  }) {
    const { project, questionText, answerText, verifiedFacts } = params;

    const systemPrompt = `BẠN LÀ GIÁM KHẢO PHẢN BIỆN ĐÁNH GIÁ CÂU TRẢ LỜI CỦA GIÁO VIÊN TRONG BUỔI BẢO VỆ GIẢI PHÁP HỮU ÍCH.

NHIỆM VỤ: Đánh giá câu trả lời của giáo viên theo các tiêu chí: Đúng trọng tâm, chính xác, sử dụng minh chứng, rõ ràng, thừa nhận giới hạn và phát hiện số liệu tự bịa (UNSUPPORTED_CLAIM).`;

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"
CÂU HỎI CỦA BAN GIÁM KHẢO: "${questionText}"

CÂU TRẢ LỜI CỦA GIÁO VIÊN:
"""
${answerText}
"""

DỮ LIỆU ĐÃ XÁC MINH CỦA DỰ ÁN:
${Object.entries(verifiedFacts).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join("\n")}

Hãy đánh giá câu trả lời và trả về đúng JSON theo schema action="evaluate_defense_answer".`;

    return { systemPrompt, userPrompt };
  }
}
