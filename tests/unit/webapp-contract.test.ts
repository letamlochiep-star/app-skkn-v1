import { describe, it, expect } from "vitest";
import { DATA_INTEGRITY_PLACEHOLDERS, hasIntegrityPlaceholder } from "@/lib/utils/data-integrity";
import type { WebappAction, WorkflowStage } from "@/types/ai";
import type { ProjectStatus } from "@/types/project";

describe("Webapp Contract & Data Integrity Types", () => {
  it("should define standard data integrity placeholders", () => {
    expect(DATA_INTEGRITY_PLACEHOLDERS.PENDING_REAL_DATA).toBe("[CHỜ DỮ LIỆU THỰC TỪ GIÁO VIÊN]");
    expect(DATA_INTEGRITY_PLACEHOLDERS.PENDING_REAL_EVIDENCE).toBe("[CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN]");
    expect(DATA_INTEGRITY_PLACEHOLDERS.SOURCE_NEEDS_VERIFICATION).toBe("[NGUỒN CẦN XÁC MINH]");
  });

  it("should detect integrity placeholders in drafted text", () => {
    const textWithPlaceholder = "Thực trạng năm học: Điểm kiểm tra đầu vào là [CHỜ DỮ LIỆU THỰC TỪ GIÁO VIÊN].";
    expect(hasIntegrityPlaceholder(textWithPlaceholder)).toBe(true);

    const normalText = "Thực trạng năm học được ghi nhận rõ ràng.";
    expect(hasIntegrityPlaceholder(normalText)).toBe(false);
  });

  it("should type-check supported webapp actions and stages", () => {
    const stages: WorkflowStage[] = ["TOPIC", "DATA", "STRUCTURE", "WRITE", "REVIEW", "FINALIZE"];
    expect(stages).toHaveLength(6);

    const testAction: WebappAction = "suggest_topics";
    expect(testAction).toBe("suggest_topics");

    const defenseAction: WebappAction = "generate_defense_script";
    expect(defenseAction).toBe("generate_defense_script");
  });
});
