import crypto from "crypto";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import type { SKKNSession, SubjectGroup, EducationLevel } from "@/types/skkn-session";

function toValidUuid(input: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
    return input;
  }
  // Create deterministic UUID v4 from input string
  const hash = crypto.createHash("md5").update(input).digest("hex");
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-8${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

export class ProjectSessionService {
  private static repo = new ProjectRepository();

  /**
   * Constructs a structured project session from real database records and facts,
   * validating against skkn-session.schema.json.
   * Strictly avoids any data fabrication or premature AI calls.
   */
  static async buildProjectSession(
    projectId: string,
    userId: string
  ): Promise<{ session: SKKNSession; valid: boolean; validationErrors?: string[] }> {
    const project = await this.repo.findById(projectId, userId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND: Không tìm thấy dự án hoặc không có quyền truy cập");
    }

    const facts = await this.repo.getFacts(projectId);

    // Helper to extract fact text
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

    const collectedFacts: Record<string, unknown> = {};
    if (problemStatement) collectedFacts.problemStatement = problemStatement;
    if (targetGroup) collectedFacts.targetGroup = targetGroup;
    if (initialGoal) collectedFacts.initialGoal = initialGoal;

    // Map educationLevel and subjectGroup to schema enum values
    let educationLevel: EducationLevel = "SECONDARY";
    const el = project.educationLevel?.toUpperCase();
    if (el === "PRIMARY") educationLevel = "PRIMARY";
    else if (el === "HIGH_SCHOOL" || el === "THPT") educationLevel = "HIGH_SCHOOL";
    else if (el === "PRE_SCHOOL" || el === "PRESCHOOL") educationLevel = "PRE_SCHOOL";
    else if (el === "VOCATIONAL") educationLevel = "VOCATIONAL";

    let subjectGroup: SubjectGroup = "MATH";
    const sg = project.subjectGroup?.toUpperCase();
    if (sg === "LITERATURE") subjectGroup = "LITERATURE";
    else if (sg === "NATURAL_SCIENCES") subjectGroup = "NATURAL_SCIENCES";
    else if (sg === "SOCIAL_SCIENCES") subjectGroup = "SOCIAL_SCIENCES";
    else if (sg === "FOREIGN_LANGUAGES") subjectGroup = "FOREIGN_LANGUAGES";
    else if (sg === "PRIMARY_GENERAL") subjectGroup = "PRIMARY_GENERAL";
    else if (sg === "PRE_SCHOOL") subjectGroup = "PRE_SCHOOL";
    else if (sg === "OTHER") subjectGroup = "OTHER";

    const sessionPayload: SKKNSession = {
      sessionId: toValidUuid(`session_${project.id}`),
      projectId: toValidUuid(project.id),
      userId: toValidUuid(project.userId),
      currentStep: 1, // Phase 4 project starts at Step 1 (TOPIC)
      status: "ACTIVE",
      contextData: {
        subjectGroup,
        educationLevel,
        targetGrade: project.gradeLevel || undefined,
        topicTitle: project.workingTitle || project.title || undefined,
        documentType: project.documentType,
        schoolYear: project.schoolYear,
        schoolName: project.schoolName || undefined,
        collectedFacts,
      },
      updatedAt: project.updatedAt || new Date().toISOString(),
    };

    // Validate payload against registered JSON schema
    const validation = validateAgainstSchema("skkn-session", sessionPayload);

    return {
      session: sessionPayload,
      valid: validation.valid,
      validationErrors: validation.errors?.map((e) => `${e.path} ${e.message}`),
    };
  }
}
