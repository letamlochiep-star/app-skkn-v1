import { describe, it, expect } from "vitest";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";

describe("Defense Outline & Script Schemas (Phase 9)", () => {
  it("should validate defense-outline schema", () => {
    const payload = {
      action: "generate_defense_outline",
      durationMinutes: 7,
      segments: [
        { order: 1, title: "Mở đầu", purpose: "Lý do", keyPoints: ["Điểm 1"], durationSeconds: 30 },
        { order: 2, title: "Vấn đề", purpose: "Thực trạng", keyPoints: ["Điểm 2"], durationSeconds: 60 },
        { order: 3, title: "Giải pháp", purpose: "Nội dung", keyPoints: ["Điểm 3"], durationSeconds: 150 },
        { order: 4, title: "Kết luận", purpose: "Tổng kết", keyPoints: ["Điểm 4"], durationSeconds: 60 },
      ],
      totalDurationSeconds: 300,
      warnings: [],
    };

    const val = validateAgainstSchema("defense-outline", payload);
    expect(val.valid).toBe(true);
  });

  it("should validate defense-script schema", () => {
    const payload = {
      action: "generate_defense_script",
      durationMinutes: 7,
      sections: [
        { spokenText: "Kính thưa Ban Giám khảo, tôi xin trình bày...", durationSeconds: 30 },
        { spokenText: "Xuất phát từ thực trạng đồ dùng dạy học...", durationSeconds: 60 },
        { spokenText: "Giải pháp gồm 3 điểm cải tiến chính...", durationSeconds: 150 },
        { spokenText: "Qua quá trình triển khai, kết quả đạt được...", durationSeconds: 60 },
      ],
      closingStatement: "Xin trân trọng cảm ơn Ban Giám khảo!",
      warnings: [],
    };

    const val = validateAgainstSchema("defense-script", payload);
    expect(val.valid).toBe(true);
  });
});
