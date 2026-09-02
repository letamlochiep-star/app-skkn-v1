import { describe, it, expect } from "vitest";
import { DefenseConsistencyService } from "@/server/services/defense-consistency-service";
import type { DefenseOutline } from "@/types/defense";

describe("Defense Duration & Time Budget Validation (Phase 9)", () => {
  it("should PASS when total duration matches target duration within tolerance", () => {
    const outline: DefenseOutline = {
      durationMinutes: 7,
      segments: [
        { order: 1, title: "Mở đầu", purpose: "Lý do", keyPoints: ["P1"], durationSeconds: 30 },
        { order: 2, title: "Vấn đề thực tiễn", purpose: "Khó khăn", keyPoints: ["P2"], durationSeconds: 60 },
        { order: 3, title: "Giải pháp cải tiến", purpose: "Cốt lõi", keyPoints: ["P3"], durationSeconds: 150 },
        { order: 4, title: "Minh chứng & Hiệu quả", purpose: "Kết quả", keyPoints: ["P4"], durationSeconds: 120 },
        { order: 5, title: "Kết luận", purpose: "Kết thúc", keyPoints: ["P5"], durationSeconds: 60 },
      ],
      totalDurationSeconds: 420,
    };

    const res = DefenseConsistencyService.validateOutlineTiming(outline, 7);
    expect(res.valid).toBe(true);
  });

  it("should FAIL when total duration significantly differs from target duration", () => {
    const outline: DefenseOutline = {
      durationMinutes: 5,
      segments: [
        { order: 1, title: "Mở đầu", purpose: "Lý do", keyPoints: ["P1"], durationSeconds: 300 },
        { order: 2, title: "Vấn đề", purpose: "Khó khăn", keyPoints: ["P2"], durationSeconds: 300 }, // Total 600s for a 5min (300s) target
      ],
      totalDurationSeconds: 600,
    };

    const res = DefenseConsistencyService.validateOutlineTiming(outline, 5);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("OUTLINE_TIMING_MISMATCH");
  });
});
