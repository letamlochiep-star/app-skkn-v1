import { describe, it, expect, beforeEach } from "vitest";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { ProjectService } from "@/server/services/project-service";
import { ProjectRepository } from "@/server/repositories/project-repository";

describe("Mock Defense Practice Rehearsal (Phase 9)", () => {
  const userId = "teacher-mock-test";

  beforeEach(() => {
    ProjectRepository.clearMemoryStore();
    DefenseRepository.clearMemoryDefenseStore();
  });

  it("should record practice turn and persist answer evaluation", async () => {
    const project = await ProjectService.createProject({
      userId,
      payload: {
        documentType: "SOLUTION",
        workingTitle: "Giải pháp cải tiến",
        educationLevel: "SECONDARY",
        subjectGroup: "MATH",
        schoolYear: "2026-2027",
      },
    });

    const defenseRepo = new DefenseRepository();
    const session = await defenseRepo.savePracticeSession({
      id: "sess_1",
      projectId: project.id,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
    });

    const turn = await defenseRepo.savePracticeTurn({
      id: "turn_1",
      sessionId: session.id,
      questionId: "q1",
      questionText: "Điểm cải tiến chính là gì?",
      answerText: "Điểm cải tiến là tối ưu hóa quy trình làm đồ dùng dạy học tự làm.",
      evaluationJson: {
        assessment: "STRONG",
        strengths: ["Trả lời đúng trọng tâm"],
        issues: [],
        unsupportedClaims: [],
        missingEvidence: [],
        improvedAnswerFramework: [],
      },
      createdAt: new Date().toISOString(),
    });

    expect(turn.questionId).toBe("q1");
    expect(turn.evaluationJson.assessment).toBe("STRONG");

    const turns = await defenseRepo.findPracticeTurns(session.id);
    expect(turns.length).toBe(1);
  });
});
