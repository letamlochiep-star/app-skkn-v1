import type { ProjectDocumentDraftRecord, ConsistencyCheckResult } from "@/types/writer";
import type { StructureSection } from "@/types/structure";
import type { ReviewFindingItem } from "@/types/review";

export class ReviewerPromptBuilder {
  /**
   * Builds prompt for full document review
   */
  static buildFullReviewPrompt(params: {
    project: any;
    draft: ProjectDocumentDraftRecord;
    consistency: ConsistencyCheckResult;
    lockedSections: StructureSection[];
    verifiedFacts: Record<string, unknown>;
    skillInstructions?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { project, draft, consistency, lockedSections, verifiedFacts, skillInstructions } = params;
    const isSolution = project.documentType === "SOLUTION";

    const systemPrompt = `BẠN LÀ CHỦ TỊCH HỘI ĐỒNG THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM VÀ GIẢI PHÁP HỮU ÍCH (BỘ GIÁO DỤC VÀ ĐÀO TẠO VIỆT NAM).

NHIỆM VỤ CỦA BẠN: Rà soát toàn văn bản thảo, đánh giá theo 10 tiêu chí sư phạm chuẩn mực, phân loại vấn đề thành 3 nhóm rõ ràng và đề xuất ĐÚNG 3 CHỈNH SỬA ƯU TIÊN LỚN NHẤT.

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. PHÂN LOẠI 3 NHÓM NHẬN XÉT:
   - A. LỖI BẮT BUỘC PHẢI SỬA (mandatoryFixes): Mâu thuẫn số liệu, thiếu minh chứng trọng yếu, sai sót cấu trúc (severity: BLOCKING / HIGH / MEDIUM).
   - B. ĐIỂM CÓ THỂ NÂNG CHẤT LƯỢNG (qualityImprovements): Gợi ý diễn đạt, tính khả thi, nhân rộng.
   - C. PHẦN ĐÃ TỐT VÀ NÊN GIỮ (keepAsIs): Nhận diện các điểm sáng tạo, logic sư phạm chuẩn mực cần bảo toàn.
2. QUY TẮC ĐÚNG 3 GỢI Ý ƯU TIÊN (EXACTLY 3 PRIORITY REVISIONS):
   - Mảng priorityRevisions BẮT BUỘC có đúng 3 phần tử (priorityNumber: 1, 2, 3), sắp xếp theo mức độ ảnh hưởng (Data truth > Evidence > Solution logic > Structure > Style).
3. NGUYÊN TẮC TRUNG THỰC DỮ LIỆU:
   - Tuyệt đối KHÔNG tự bịa thêm số liệu (sĩ số, điểm số) hoặc bịa nguồn trích dẫn / thông tư.
   - Mọi số liệu trong bài không có trong Verified Facts phải được flag là UNVERIFIED_NUMERIC_CLAIM.
4. TUYỆT ĐỐI KHÔNG DỰ ĐOÁN GIẢI HOẶC CHẤM ĐIỂM AI:
   - Nghiêm cấm đưa ra dự đoán "Khả năng đạt giải 95%" hoặc "AI detector 0%".
5. ĐỊNH DẠNG ĐẦU RA:
   - Bắt buộc trả về đúng JSON theo schema action="review_full_document".

${skillInstructions ? `--- HƯỚNG DẪN CHUYÊN MÔN ---\n${skillInstructions}\n` : ""}`;

    const userPrompt = `THÔNG TIN DỰ ÁN:
- Tên đề tài: "${project.title || project.workingTitle}"
- Thể loại: ${isSolution ? "Giải pháp hữu ích" : "Sáng kiến kinh nghiệm"}
- Cấp học: ${project.educationLevel} | Môn: ${project.subjectGroup} | Năm học: ${project.schoolYear || "2026-2027"}

DỮ LIỆU ĐÃ XÁC MINH (VERIFIED FACTS):
${Object.entries(verifiedFacts)
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join("\n")}

KẾT QUẢ KIỂM ĐỊNH KỸ THUẬT (DETERMINISTIC AUDIT):
- Vị trí chờ dữ liệu thực: ${consistency.placeholderSummary.realDataPlaceholders}
- Vị trí chờ minh chứng: ${consistency.placeholderSummary.evidencePlaceholders}
- Nguồn cần xác minh: ${consistency.placeholderSummary.referencePlaceholders}
${
  consistency.conflicts.length > 0
    ? `- Các cảnh báo nhất quán: ${consistency.conflicts.map((c) => c.message).join("; ")}`
    : "- Không có xung đột số liệu kỹ thuật cơ bản."
}

NỘI DUNG TOÀN VĂN BẢN THẢO CẦN RÀ SOÁT:
"""
${draft.plainText}
"""

Hãy thực hiện rà soát toàn diện và trả về JSON đúng schema 'full-review' với ĐÚNG 3 priorityRevisions.`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Builds prompt for targeted AI revision of a specific finding
   */
  static buildTargetedRevisionPrompt(params: {
    project: any;
    finding: ReviewFindingItem;
    sectionTitle: string;
    sectionContent: string;
    verifiedFacts: Record<string, unknown>;
  }): { systemPrompt: string; userPrompt: string } {
    const { project, finding, sectionTitle, sectionContent, verifiedFacts } = params;

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SƯ PHẠM VÀ TÁC GIẢ SKKN/GIẢI PHÁP HỮU ÍCH VIỆT NAM.

NHIỆM VỤ: Soạn thảo bản sửa có kiểm soát cho một phần nội dung cụ thể nhằm khắc phục nhận xét rà soát được chỉ định.

QUY TẮC BẮT BUỘC:
1. CHỈ SỬA PHẠM VI LIÊN QUAN ĐẾN VẤN ĐỀ ĐƯỢC CHỈ ĐỊNH, không viết lại toàn bài.
2. KHÔNG tự bịa số liệu hay nguồn trích dẫn mới. Nếu thiếu số liệu, dùng placeholder chuẩn [CHỜ SỐ LIỆU THỰC TỪ GIÁO VIÊN].
3. Trả về đúng JSON theo schema action="revise_section".`;

    const userPrompt = `ĐỀ TÀI: "${project.title || project.workingTitle}"

VẤN ĐỀ CẦN KHẮC PHỤC (FINDING):
- Tiêu đề: ${finding.title}
- Mô tả: ${finding.description}
- Đề xuất khắc phục: ${finding.suggestedFix || "Hoàn thiện nội dung theo nhận xét."}

PHẦN CẦN SỬA: ${sectionTitle}
NỘI DUNG HIỆN TẠI:
"""
${sectionContent}
"""

DỮ LIỆU XÁC MINH:
${Object.entries(verifiedFacts)
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join("\n")}

Hãy trả về phiên bản chỉnh sửa hoàn thiện cho phần này theo đúng schema 'review-revision'.`;

    return { systemPrompt, userPrompt };
  }
}
