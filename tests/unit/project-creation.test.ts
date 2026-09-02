import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { UsageService } from "@/server/services/usage-service";

describe("Project Creation & Pedagogical Facts (Phase 4)", () => {
  const userId = "teacher-create-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    UsageService.clearMemoryLedger();
  });

  it("should create a valid SKKN project with default stage TOPIC and unlocked state", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Nâng cao hứng thú học Toán 8 qua mô hình thực tế",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        gradeLevel: "Lớp 8",
        schoolYear: "2026-2027",
        problemStatement: "Học sinh còn thụ động trong việc giải quyết bài toán thực tế.",
        targetGroup: "Học sinh khối 8",
        initialGoal: "100% học sinh biết vận dụng kiến thức vào thực tế.",
      },
    });

    expect(project.id).toBeDefined();
    expect(project.documentType).toBe("SKKN");
    expect(project.workflowStage).toBe("TOPIC");
    expect(project.status).toBe("DRAFT");
    expect(project.topicLocked).toBe(false);
    expect(project.structureLocked).toBe(false);
    expect(project.progressPercent).toBe(10);

    // Verify facts were persisted accurately without fabrication
    const { facts } = await ProjectService.getProject({ projectId: project.id, userId });
    expect(facts.length).toBe(3);
    const problemFact = facts.find((f) => f.key === "problem_statement");
    expect(problemFact?.valueJson).toEqual({
      text: "Học sinh còn thụ động trong việc giải quyết bài toán thực tế.",
    });
  });

  it("should create a valid SOLUTION (Giải pháp hữu ích) project", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SOLUTION",
        workingTitle: "Giải pháp ứng dụng STEM trong giảng dạy Khoa học tự nhiên",
        educationLevel: "SECONDARY",
        subjectGroup: "NATURAL_SCIENCES",
        schoolYear: "2026-2027",
      },
    });

    expect(project.documentType).toBe("SOLUTION");
    expect(project.status).toBe("DRAFT");
  });

  it("should be idempotent when passing same requestId", async () => {
    const requestId = "unique-req-1234";

    const project1 = await ProjectService.createProject({
      userId,
      requestId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài lần 1",
        educationLevel: "PRIMARY",
        subjectGroup: "PRIMARY_GENERAL",
        schoolYear: "2026-2027",
      },
    });

    const project2 = await ProjectService.createProject({
      userId,
      requestId,
      payload: {
        documentType: "SKKN",
        workingTitle: "Đề tài lần 2 (Retry)",
        educationLevel: "PRIMARY",
        subjectGroup: "PRIMARY_GENERAL",
        schoolYear: "2026-2027",
      },
    });

    expect(project1.id).toBe(project2.id);
  });
});
