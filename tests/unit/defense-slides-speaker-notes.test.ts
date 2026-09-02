import { describe, it, expect } from "vitest";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";

describe("Defense Slides & Speaker Notes Schemas (Phase 9)", () => {
  it("should validate defense-slides schema", () => {
    const payload = {
      action: "generate_slide_content",
      slides: [
        { slideNumber: 1, title: "Tên giải pháp", keyPoints: ["Điểm 1"], keyMessage: "Thông điệp 1", estimatedSeconds: 30 },
        { slideNumber: 2, title: "Thực trạng", keyPoints: ["Điểm 2"], keyMessage: "Thông điệp 2", estimatedSeconds: 60 },
        { slideNumber: 3, title: "Giải pháp", keyPoints: ["Điểm 3"], keyMessage: "Thông điệp 3", estimatedSeconds: 150 },
        { slideNumber: 4, title: "Kết luận", keyPoints: ["Điểm 4"], keyMessage: "Thông điệp 4", estimatedSeconds: 60 },
      ],
      warnings: [],
    };

    const val = validateAgainstSchema("defense-slides", payload);
    expect(val.valid).toBe(true);
  });

  it("should validate defense-speaker-notes schema", () => {
    const payload = {
      action: "generate_speaker_notes",
      notes: [
        { slideNumber: 1, talkingPoints: ["Nhấn mạnh 1"], emphasis: ["Điểm 1"], transition: "Chuyển sang...", durationSeconds: 30 },
        { slideNumber: 2, talkingPoints: ["Nhấn mạnh 2"], emphasis: ["Điểm 2"], transition: "Chuyển sang...", durationSeconds: 60 },
        { slideNumber: 3, talkingPoints: ["Nhấn mạnh 3"], emphasis: ["Điểm 3"], transition: "Chuyển sang...", durationSeconds: 150 },
        { slideNumber: 4, talkingPoints: ["Nhấn mạnh 4"], emphasis: ["Điểm 4"], transition: "Chuyển sang...", durationSeconds: 60 },
      ],
      warnings: [],
    };

    const val = validateAgainstSchema("defense-speaker-notes", payload);
    expect(val.valid).toBe(true);
  });
});
