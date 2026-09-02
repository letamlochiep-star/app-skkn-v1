import { ProjectRepository } from "@/server/repositories/project-repository";
import type { TopicInputStatus } from "@/types/topic";

export class TopicInputService {
  private static repo = new ProjectRepository();

  /**
   * Evaluates known vs missing pedagogical input fields for Step 1
   */
  static async getTopicInputStatus(projectId: string, userId: string): Promise<TopicInputStatus> {
    const project = await this.repo.findById(projectId, userId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND: Không tìm thấy dự án");
    }

    const facts = await this.repo.getFacts(projectId);

    const getFactText = (key: string): string | undefined => {
      const f = facts.find((r) => r.key === key);
      if (!f || !f.valueJson) return undefined;
      if (typeof f.valueJson === "object" && "text" in (f.valueJson as Record<string, unknown>)) {
        return String((f.valueJson as Record<string, unknown>).text);
      }
      return typeof f.valueJson === "string" ? f.valueJson : undefined;
    };

    const problemStatement = getFactText("problem_statement");
    const targetGroup = getFactText("target_group");
    const initialGoal = getFactText("initial_goal");
    const teacherNotes = getFactText("teacher_notes");

    const missing: Array<{ key: string; label: string; description: string; required: boolean }> = [];

    if (!problemStatement || problemStatement.trim().length < 10) {
      missing.push({
        key: "problem_statement",
        label: "Vấn đề thực tế cần giải quyết",
        description: "Khó khăn hoặc thực trạng cụ thể của học sinh / giáo viên cần khắc phục",
        required: true,
      });
    }

    if (!targetGroup) {
      missing.push({
        key: "target_group",
        label: "Đối tượng áp dụng",
        description: "Khối lớp hoặc nhóm đối tượng cụ thể (Ví dụ: Học sinh lớp 8)",
        required: false,
      });
    }

    if (!initialGoal) {
      missing.push({
        key: "initial_goal",
        label: "Mục tiêu cần cải thiện",
        description: "Kết quả hoặc phẩm chất, năng lực kỳ vọng đạt được",
        required: false,
      });
    }

    // Ready for suggestion if essential problemStatement exists along with subject and education level
    const readyForSuggestion =
      Boolean(project.educationLevel) &&
      Boolean(project.subjectGroup) &&
      Boolean(problemStatement && problemStatement.trim().length >= 10);

    return {
      known: {
        documentType: project.documentType,
        educationLevel: project.educationLevel,
        subjectGroup: project.subjectGroup,
        gradeLevel: project.gradeLevel,
        schoolYear: project.schoolYear,
        problemStatement,
        targetGroup,
        initialGoal,
        teacherNotes,
      },
      missing,
      readyForSuggestion,
    };
  }
}
