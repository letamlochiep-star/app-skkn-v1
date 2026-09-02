import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Project Creation Concurrency Safety", () => {
  const userId = "teacher-concurrency-proj";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should respect project quota under concurrent creation requests", async () => {
    // 3 concurrent creation requests for a trial user (limit is 1)
    const promises = Array.from({ length: 3 }).map((_, i) =>
      ProjectService.createProject({
        userId,
        payload: {
          documentType: "SKKN",
          workingTitle: `Đề tài song song ${i}`,
          educationLevel: "SECONDARY",
          subjectGroup: "MATH",
          schoolYear: "2026-2027",
        },
      }).catch((err) => ({ error: err.message }))
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => !("error" in r));
    const failed = results.filter((r) => "error" in r);

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(2);
  });
});
