import { ProjectRepository } from "@/server/repositories/project-repository";
import { ProjectFactRegistry, DATA_GROUPS } from "@/lib/data/project-fact-registry";
import { DataCompletenessService } from "@/server/services/data-completeness-service";
import { DataConsistencyService } from "@/server/services/data-consistency-service";
import type {
  FactSourceType,
  FactVerificationStatus,
  EvidenceStatus,
  DataGroupKey,
  DataCompletenessSummary,
  DataConflict,
} from "@/types/data-collection";
import type { ProjectRecord } from "@/types/project";

export class DataWorkflowService {
  private static repo = new ProjectRepository();

  /**
   * Retrieves complete Data Collection state for Step 2A
   */
  static async getDataState(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    project: ProjectRecord;
    groups: typeof DATA_GROUPS;
    facts: Record<string, unknown>;
    factMetadata: Record<string, { sourceType: string; verificationStatus: string; updatedAt?: string }>;
    completeness: DataCompletenessSummary;
    conflicts: DataConflict[];
  }> {
    const { projectId, userId } = params;

    const project = await this.repo.findById(projectId, userId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND: Không tìm thấy dự án hoặc không có quyền truy cập");
    }

    if (!project.topicLocked) {
      throw new Error("TOPIC_NOT_LOCKED: Dự án cần chốt tên đề tài ở Bước 1 trước khi truy cập Bước 2");
    }

    const rawFacts = await this.repo.getFacts(projectId);
    const facts: Record<string, unknown> = {
      school_name: project.schoolName || "",
      education_level: project.educationLevel,
      subject_group: project.subjectGroup,
      grade_level: project.gradeLevel || "",
      school_year: project.schoolYear,
    };

    const factMetadata: Record<string, { sourceType: string; verificationStatus: string; updatedAt?: string }> = {};

    rawFacts.forEach((f) => {
      let val = f.valueJson;
      if (typeof val === "object" && val !== null && "text" in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>).text;
      }
      facts[f.key] = val;
      factMetadata[f.key] = {
        sourceType: f.sourceType || "USER_ENTERED",
        verificationStatus: f.verified ? "VERIFIED_BY_USER" : "UNVERIFIED",
        updatedAt: f.updatedAt,
      };
    });

    const completeness = DataCompletenessService.assessCompleteness(facts, {
      documentType: project.documentType,
      educationLevel: project.educationLevel,
      subjectGroup: project.subjectGroup,
    });

    const conflicts = DataConsistencyService.detectConflicts(facts);

    return {
      project,
      groups: DATA_GROUPS,
      facts,
      factMetadata,
      completeness,
      conflicts,
    };
  }

  /**
   * Saves or updates a single pedagogical fact
   */
  static async saveFact(params: {
    projectId: string;
    userId: string;
    fieldKey: string;
    value: unknown;
    sourceType?: FactSourceType;
    verificationStatus?: FactVerificationStatus;
    evidenceStatus?: EvidenceStatus;
  }) {
    const { projectId, userId, fieldKey, value, sourceType, verificationStatus } = params;

    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    if (!project.topicLocked) throw new Error("TOPIC_NOT_LOCKED");

    const valRes = ProjectFactRegistry.validateFieldValue(fieldKey, value);
    if (!valRes.valid) {
      throw new Error(`DATA_INVALID_INPUT: ${valRes.error}`);
    }

    const isVerified = verificationStatus === "VERIFIED_BY_USER" || verificationStatus === undefined;

    await this.repo.saveFacts(projectId, [
      {
        key: fieldKey,
        valueJson: value,
        sourceType: sourceType || "USER_ENTERED",
        verified: isVerified,
      },
    ]);

    return { success: true, key: fieldKey, value };
  }

  /**
   * Saves a batch of pedagogical facts
   */
  static async saveBatchFacts(params: {
    projectId: string;
    userId: string;
    facts: Array<{
      fieldKey: string;
      value: unknown;
      sourceType?: FactSourceType;
      verificationStatus?: FactVerificationStatus;
    }>;
  }) {
    const { projectId, userId, facts } = params;

    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    if (!project.topicLocked) throw new Error("TOPIC_NOT_LOCKED");

    for (const item of facts) {
      const valRes = ProjectFactRegistry.validateFieldValue(item.fieldKey, item.value);
      if (!valRes.valid) {
        throw new Error(`DATA_INVALID_INPUT in '${item.fieldKey}': ${valRes.error}`);
      }
    }

    await this.repo.saveFacts(
      projectId,
      facts.map((item) => ({
        key: item.fieldKey,
        valueJson: item.value,
        sourceType: item.sourceType || "USER_ENTERED",
        verified: item.verificationStatus === "VERIFIED_BY_USER" || item.verificationStatus === undefined,
      }))
    );

    return { success: true, count: facts.length };
  }

  /**
   * Completes Step 2A and transitions project to Step 3 (STRUCTURE)
   * Atomic Server-Side Operation, No AI Quota charge
   */
  static async completeDataStage(params: {
    projectId: string;
    userId: string;
    confirmed: boolean;
  }): Promise<ProjectRecord> {
    const { projectId, userId, confirmed } = params;

    if (!confirmed) {
      throw new Error("DATA_CONFIRMATION_REQUIRED: Thầy/Cô cần đánh dấu xác nhận các dữ liệu thực tế trước khi hoàn thành Bước 2");
    }

    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (!project.topicLocked) {
      throw new Error("TOPIC_NOT_LOCKED: Dự án chưa khóa tên đề tài.");
    }

    const dataState = await this.getDataState({ projectId, userId });

    if (dataState.completeness.missingRequired.length > 0) {
      const missingKeys = dataState.completeness.missingRequired.map((m) => m.label).join(", ");
      throw new Error(`DATA_INCOMPLETE: Chưa hoàn thành các trường dữ liệu bắt buộc: ${missingKeys}`);
    }

    const hasBlockingConflict = dataState.conflicts.some((c) => c.severity === "BLOCKING");
    if (hasBlockingConflict) {
      throw new Error("DATA_CONFLICT: Tồn tại mâu thuẫn số liệu chưa được giải quyết.");
    }

    // Atomic transition to STRUCTURE stage
    const updated = await this.repo.update(projectId, userId, {
      workflowStage: "STRUCTURE",
      progressPercent: 45,
    });

    return updated;
  }
}
