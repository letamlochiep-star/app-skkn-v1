import { describe, it, expect } from "vitest";
import { DocumentExportService } from "@/server/services/document-export-service";
import { ExportValidator } from "@/server/services/export-validator";

describe("Full PDF Generation & Signature Validation (Phase 10)", () => {
  it("should generate valid PDF with %PDF- header", async () => {
    const docModel: any = {
      metadata: { projectId: "proj_pdf", documentVersion: 1, reviewVersion: 1, mode: "FINAL" },
      cover: {
        title: "Bản PDF toàn văn giải pháp",
        schoolName: "Trường THCS Chu Văn An",
        isDraft: false,
      },
      sections: [
        {
          id: "sec_1",
          order: 1,
          title: "I. MỞ ĐẦU",
          contentBlocks: [{ type: "PARAGRAPH", text: "Nội dung mở đầu bản PDF." }],
        },
      ],
      isDraft: false,
    };

    const pdfBuf = await DocumentExportService.generateFullPdf(docModel);
    const val = ExportValidator.validatePdf(pdfBuf);

    expect(val.valid).toBe(true);
    expect(pdfBuf.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });
});
