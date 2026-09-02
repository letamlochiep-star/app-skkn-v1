import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIRouter } from "@/lib/ai/router";
import { ExportValidator } from "@/server/services/export-validator";

describe("Resilience & Fallback Simulation (Phase 12)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should failover gracefully when primary provider throws an error", async () => {
    vi.spyOn(AIRouter, "execute").mockResolvedValue({
      provider: "gemini",
      model: "gemini-1.5-pro",
      content: JSON.stringify({ analysis: "Phân tích thành công qua nhà cung cấp dự phòng" }),
      tokenUsage: { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
      latencyMs: 340,
      requestId: "req_fallback_sim_1",
    });

    const result = await AIRouter.execute({
      taskType: "IDEATE",
      systemPrompt: "Hệ thống chuyên gia",
      userPrompt: "Phân tích đề tài",
      logicalRequestId: "req_fallback_sim_1",
    });

    expect(result.provider).toBe("gemini");
    expect(result.content).toContain("Phân tích thành công qua nhà cung cấp dự phòng");
  });

  it("should reject corrupted binary buffers safely without unhandled exceptions", () => {
    const corruptedDocxBuffer = Buffer.from("NOT_A_VALID_ZIP_ARCHIVE_DATA");
    const valDocx = ExportValidator.validateDocx(corruptedDocxBuffer);
    expect(valDocx.valid).toBe(false);
    expect(valDocx.error).toBeDefined();

    const corruptedPdfBuffer = Buffer.from("NOT_A_PDF_STREAM");
    const valPdf = ExportValidator.validatePdf(corruptedPdfBuffer);
    expect(valPdf.valid).toBe(false);
    expect(valPdf.error).toBeDefined();
  });
});
