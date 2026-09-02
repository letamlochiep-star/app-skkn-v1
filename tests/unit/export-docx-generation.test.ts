import { describe, it, expect } from "vitest";
import { DocumentExportService } from "@/server/services/document-export-service";
import { ExportValidator } from "@/server/services/export-validator";

describe("DOCX Generation & OpenXML Validation (Phase 10)", () => {
  it("should generate valid DOCX zip container with standard margins and Times New Roman 14pt", async () => {
    const docModel: any = {
      metadata: { projectId: "proj_docx", documentVersion: 1, reviewVersion: 1, mode: "FINAL" },
      cover: {
        title: "Nâng cao năng lực giải toán hình học lớp 8",
        schoolName: "Trường THCS Lê Quý Đôn",
        authorName: "Nguyễn Văn A",
        schoolYear: "2026-2027",
        isDraft: false,
      },
      sections: [
        {
          id: "sec_1",
          order: 1,
          title: "I. ĐẶT VẤN ĐỀ",
          contentBlocks: [{ type: "PARAGRAPH", text: "Lý do chọn đề tài nghiên cứu..." }],
        },
        {
          id: "sec_2",
          order: 2,
          title: "II. GIẢI PHÁP THỰC HIỆN",
          contentBlocks: [{ type: "PARAGRAPH", text: "Biện pháp 1: Sử dụng phần mềm trực quan..." }],
        },
      ],
      formatting: {
        pageSize: "A4",
        margins: { top: 2, bottom: 2, left: 3, right: 1.5 },
        font: { family: "Times New Roman", size: 14, lineSpacing: 1.5 },
      },
      isDraft: false,
    };

    const docxBuf = await DocumentExportService.generateDocx(docModel);
    const val = ExportValidator.validateDocx(docxBuf);

    expect(val.valid).toBe(true);
    expect(val.checksum).toBeDefined();
    expect(docxBuf[0]).toBe(0x50); // PK zip header
    expect(docxBuf[1]).toBe(0x4b);
  });
});
