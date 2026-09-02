import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentExportService } from "@/server/services/document-export-service";
import { DefenseExportService } from "@/server/services/defense-export-service";
import { AIRouter } from "@/lib/ai/router";

describe("No AI Calls During Export (Phase 10)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate DOCX and PDF purely with zero AI Router calls", async () => {
    const aiSpy = vi.spyOn(AIRouter, "execute");

    const dummyModel: any = {
      metadata: { projectId: "p1", documentVersion: 1, reviewVersion: 1, mode: "FINAL" },
      cover: { title: "Tên SKKN", schoolName: "Trường THCS", isDraft: false },
      sections: [{ id: "s1", title: "Phần 1", contentBlocks: [{ type: "PARAGRAPH", text: "Nội dung" }] }],
    };

    const docxBuf = await DocumentExportService.generateDocx(dummyModel);
    const pdfBuf = await DocumentExportService.generateFullPdf(dummyModel);

    expect(docxBuf.length).toBeGreaterThan(50);
    expect(pdfBuf.length).toBeGreaterThan(50);
    expect(aiSpy).not.toHaveBeenCalled();
  });

  it("should generate PPTX and One-Page PDF with zero AI Router calls", async () => {
    const aiSpy = vi.spyOn(AIRouter, "execute");

    const presModel: any = {
      metadata: { projectId: "p1", defensePackageId: "def1", defenseVersion: 1, durationMinutes: 7, mode: "FINAL" },
      slides: [{ slideNumber: 1, title: "Slide 1", keyPoints: ["Ý 1"], keyMessage: "Thông điệp" }],
      isDraft: false,
    };

    const pptxBuf = await DefenseExportService.generatePptx(presModel);
    const onePageBuf = await DefenseExportService.generateOnePagePdf({
      project: { title: "Giải pháp 1" } as any,
      summary: { title: "Tóm tắt", problem: "Vấn đề", solution: ["GP"], improvements: ["Điểm mới"], closing: "Cảm ơn" } as any,
      mode: "FINAL",
    });

    expect(pptxBuf.length).toBeGreaterThan(50);
    expect(onePageBuf.length).toBeGreaterThan(50);
    expect(aiSpy).not.toHaveBeenCalled();
  });
});
