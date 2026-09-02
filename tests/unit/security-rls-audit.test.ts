import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { TopicService } from "@/server/services/topic-service";
import { DataWorkflowService } from "@/server/services/data-workflow-service";
import { WriterService } from "@/server/services/writer-service";
import { DefenseService } from "@/server/services/defense-service";
import { ExportService } from "@/server/services/export-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { ExportRepository } from "@/server/repositories/export-repository";

describe("Security, Multi-tenant RLS & Secret Leak Audit (Phase 12)", () => {
  const userA = "teacher_alice_uuid";
  const userB = "teacher_bob_uuid";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    ExportRepository.clearMemoryExportStore();
  });

  it("should enforce strict multi-tenant isolation across all project domains", async () => {
    // User A creates a project
    const projectA = await ProjectService.createProject({
      userId: userA,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài Bảo mật của Alice",
        educationLevel: "PRIMARY",
        subjectGroup: "VIETNAMESE",
        schoolYear: "2026-2027",
      },
    });

    // User B attempts to access project A
    await expect(ProjectService.getProject({ projectId: projectA.id, userId: userB })).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to perform Topic operations on project A
    await expect(
      TopicService.suggestTopics({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to perform Data operations on project A
    await expect(
      DataWorkflowService.getDataState({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to perform Writer operations on project A
    await expect(
      WriterService.getWriterState({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to perform Defense operations on project A
    await expect(
      DefenseService.getDefenseState({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    // User B attempts to perform Export operations on project A
    await expect(
      ExportService.getExportState({ projectId: projectA.id, userId: userB })
    ).rejects.toThrow("PROJECT_NOT_FOUND");
  });

  it("should never leak API keys, secret hashes or service role credentials in error payloads", async () => {
    try {
      await ExportService.generateExport({
        projectId: "non_existent_id",
        userId: "fake_user",
        exportType: "DOCX",
      });
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).not.toContain("sk-");
      expect(msg).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(msg).not.toContain("OPENAI_API_KEY");
      expect(msg).not.toContain("GEMINI_API_KEY");
    }
  });
});
