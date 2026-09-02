import { describe, it, expect, beforeEach } from "vitest";
import { DefenseService } from "@/server/services/defense-service";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";

describe("Defense Ownership Security (Phase 9)", () => {
  const userA = "teacher-def-owner-A";
  const userB = "teacher-def-owner-B";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    DefenseRepository.clearMemoryDefenseStore();
  });

  it("should prevent User B from accessing User A's defense package", async () => {
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SOLUTION",
        workingTitle: "Giải pháp A",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    await expect(
      DefenseService.getDefenseState({
        projectId: projectA.id,
        userId: userB,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    await expect(
      DefenseService.createOrUpdatePackage({
        projectId: projectA.id,
        userId: userB,
        durationMinutes: 7,
      })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });
});
