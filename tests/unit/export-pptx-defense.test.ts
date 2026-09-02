import { describe, it, expect } from "vitest";
import { DefenseExportService } from "@/server/services/defense-export-service";
import { ExportValidator } from "@/server/services/export-validator";

describe("PPTX Defense Export (Phase 10)", () => {
  it("should generate valid PPTX container with slides from Defense Package", async () => {
    const presModel: any = {
      metadata: {
        projectId: "proj_pptx",
        defensePackageId: "def_pkg_1",
        defenseVersion: 1,
        documentVersion: 1,
        durationMinutes: 7,
        mode: "FINAL",
      },
      theme: "CLASSIC_BLUE",
      slides: [
        {
          slideNumber: 1,
          title: "Báo cáo bảo vệ giải pháp",
          subtitle: "Đồ dùng dạy học tự làm",
          keyPoints: ["Ý chính 1"],
          keyMessage: "Thông điệp cốt lõi",
          speakerNotes: "Kính thưa Hội đồng...",
        },
        {
          slideNumber: 2,
          title: "Vấn đề thực tiễn",
          keyPoints: ["Khó khăn 1", "Khó khăn 2"],
          keyMessage: "Cần cải tiến",
          speakerNotes: "Xuất phát từ thực tế...",
        },
      ],
      isDraft: false,
    };

    const pptxBuf = await DefenseExportService.generatePptx(presModel);
    const val = ExportValidator.validatePptx(pptxBuf);

    expect(val.valid).toBe(true);
    expect(pptxBuf[0]).toBe(0x50);
  });
});
