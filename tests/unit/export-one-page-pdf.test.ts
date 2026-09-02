import { describe, it, expect } from "vitest";
import { DefenseExportService } from "@/server/services/defense-export-service";
import { ExportValidator } from "@/server/services/export-validator";

describe("One-Page PDF Summary Export (Phase 10)", () => {
  it("should generate valid One-Page PDF and pass exact single page check", async () => {
    const summary: any = {
      title: "Tóm tắt Giải pháp Nâng cao hiệu quả dạy học",
      problem: "Thiếu thiết bị thực hành trực quan",
      solution: ["Giải pháp 1", "Giải pháp 2"],
      improvements: ["Tiết kiệm chi phí", "Tăng tính trực quan"],
      evidence: ["Bảng khảo sát 40 học sinh"],
      effectiveness: ["Tăng hứng thú 85%"],
      applicability: ["Áp dụng cho khối 8"],
      limitations: ["Cần bảo quản cẩn thận"],
      closing: "Trân trọng cảm ơn Ban Giám Khảo!",
    };

    const onePageBuf = await DefenseExportService.generateOnePagePdf({
      project: { title: "Giải pháp 1" } as any,
      summary,
      mode: "FINAL",
    });

    const val = ExportValidator.validateOnePagePdf(onePageBuf);
    expect(val.valid).toBe(true);
  });
});
