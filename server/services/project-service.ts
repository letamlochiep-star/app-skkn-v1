import { ProjectRepository } from "@/server/repositories/project-repository";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import { CreateProjectSchema, UpdateProjectSchema, type CreateProjectPayload, type UpdateProjectPayload } from "@/lib/validation/project";
import {
  STAGE_PROGRESS_MAP,
  type ProjectRecord,
  type ProjectFactRecord,
} from "@/types/project";

const processedRequestIds = new Map<string, ProjectRecord>();
const userCreationLocks = new Map<string, Promise<unknown>>();

export class ProjectService {
  private static repo = new ProjectRepository();

  /**
   * Creates a new project with Quota checking, atomic facts, and usage tracking
   */
  static async createProject(params: {
    userId: string;
    payload: CreateProjectPayload;
    requestId?: string;
  }): Promise<ProjectRecord> {
    const { userId } = params;

    // Serialize project creations per user to guarantee concurrency quota safety
    const previousLock = userCreationLocks.get(userId) || Promise.resolve();
    let resolveLock!: () => void;
    const currentLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    userCreationLocks.set(userId, currentLock);

    try {
      await previousLock;
      return await this._doCreateProject(params);
    } finally {
      resolveLock();
      if (userCreationLocks.get(userId) === currentLock) {
        userCreationLocks.delete(userId);
      }
    }
  }

  private static async _doCreateProject(params: {
    userId: string;
    payload: CreateProjectPayload;
    requestId?: string;
  }): Promise<ProjectRecord> {
    const { userId, payload, requestId } = params;

    if (!userId) {
      throw new Error("UNAUTHORIZED: Yêu cầu đăng nhập để tạo dự án");
    }

    // 1. Idempotency Check
    if (requestId && processedRequestIds.has(requestId)) {
      return processedRequestIds.get(requestId)!;
    }

    // 2. Validate input payload
    const validated = CreateProjectSchema.parse(payload);

    // 3. Enforce Server-Side Project Quota
    await requireQuota({
      userId,
      feature: "CREATE_PROJECT",
      requestedAmount: 1,
      requestId,
    });

    const now = new Date().toISOString();
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const workingTitle = validated.workingTitle?.trim() || "Dự án mới";

    const projectRecord: ProjectRecord = {
      id: projectId,
      userId,
      documentType: validated.documentType,
      title: workingTitle,
      workingTitle,
      educationLevel: validated.educationLevel,
      subjectGroup: validated.subjectGroup,
      gradeLevel: validated.gradeLevel || null,
      schoolYear: validated.schoolYear,
      schoolName: validated.schoolName || null,
      workflowStage: "TOPIC",
      status: "DRAFT",
      topicLocked: false,
      structureLocked: false,
      progressPercent: STAGE_PROGRESS_MAP.TOPIC,
      lastOpenedAt: now,
      archivedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Initial Facts (only teacher entered data, no fabrication)
    const initialFacts: Array<{ key: string; valueJson: unknown; sourceType: string }> = [];

    if (validated.problemStatement) {
      initialFacts.push({
        key: "problem_statement",
        valueJson: { text: validated.problemStatement },
        sourceType: "TEACHER_INPUT",
      });
    }

    if (validated.targetGroup) {
      initialFacts.push({
        key: "target_group",
        valueJson: { text: validated.targetGroup },
        sourceType: "TEACHER_INPUT",
      });
    }

    if (validated.initialGoal) {
      initialFacts.push({
        key: "initial_goal",
        valueJson: { text: validated.initialGoal },
        sourceType: "TEACHER_INPUT",
      });
    }

    if (validated.teacherNotes) {
      initialFacts.push({
        key: "teacher_notes",
        valueJson: { text: validated.teacherNotes },
        sourceType: "TEACHER_INPUT",
      });
    }

    // 5. Persist Project and Facts
    const created = await this.repo.create(projectRecord, initialFacts);

    // 6. Record Usage Ledger
    await UsageService.recordUsage({
      userId,
      projectId: created.id,
      feature: "CREATE_PROJECT",
      usageType: "PROJECT_CREATED",
      quantity: 1,
      idempotencyKey: requestId,
      metadataJson: {
        documentType: created.documentType,
        workingTitle: created.workingTitle,
      },
    });

    if (requestId) {
      processedRequestIds.set(requestId, created);
    }

    return created;
  }

  /**
   * Retrieves a single project and its pedagogical facts
   */
  static async getProject(params: {
    projectId: string;
    userId: string;
  }): Promise<{ project: ProjectRecord; facts: ProjectFactRecord[] }> {
    const { projectId, userId } = params;
    const project = await this.repo.findById(projectId, userId);

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND: Không tìm thấy dự án hoặc không có quyền truy cập");
    }

    const facts = await this.repo.getFacts(projectId);
    return { project, facts };
  }

  /**
   * Lists projects with search, filter, and pagination
   */
  static async listProjects(params: {
    userId: string;
    status?: string;
    documentType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ProjectRecord[]; total: number; page: number; totalPages: number }> {
    const { userId, status, documentType, search, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const { items, total } = await this.repo.listByUser(userId, {
      status,
      documentType,
      search,
      limit,
      offset,
    });

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Updates project information and facts
   */
  static async updateProject(params: {
    projectId: string;
    userId: string;
    payload: UpdateProjectPayload;
  }): Promise<ProjectRecord> {
    const { projectId, userId, payload } = params;
    const validated = UpdateProjectSchema.parse(payload);

    const project = await this.repo.findById(projectId, userId);
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND: Không tìm thấy dự án");
    }

    const updated = await this.repo.update(projectId, userId, {
      workingTitle: validated.workingTitle || project.workingTitle,
      title: project.topicLocked ? project.title : (validated.workingTitle || project.title),
      educationLevel: validated.educationLevel || project.educationLevel,
      subjectGroup: validated.subjectGroup || project.subjectGroup,
      gradeLevel: validated.gradeLevel ?? project.gradeLevel,
      schoolYear: validated.schoolYear || project.schoolYear,
      schoolName: validated.schoolName ?? project.schoolName,
    });

    const factUpdates: Array<{ key: string; valueJson: unknown; sourceType: string }> = [];
    if (validated.problemStatement !== undefined) {
      factUpdates.push({ key: "problem_statement", valueJson: { text: validated.problemStatement }, sourceType: "TEACHER_INPUT" });
    }
    if (validated.targetGroup !== undefined) {
      factUpdates.push({ key: "target_group", valueJson: { text: validated.targetGroup }, sourceType: "TEACHER_INPUT" });
    }
    if (validated.initialGoal !== undefined) {
      factUpdates.push({ key: "initial_goal", valueJson: { text: validated.initialGoal }, sourceType: "TEACHER_INPUT" });
    }
    if (validated.teacherNotes !== undefined) {
      factUpdates.push({ key: "teacher_notes", valueJson: { text: validated.teacherNotes }, sourceType: "TEACHER_INPUT" });
    }

    if (factUpdates.length > 0) {
      await this.repo.updateFacts(projectId, factUpdates);
    }

    return updated;
  }

  /**
   * Renames a project
   */
  static async renameProject(params: {
    projectId: string;
    userId: string;
    newTitle: string;
  }): Promise<ProjectRecord> {
    const { projectId, userId, newTitle } = params;
    const trimmed = newTitle.trim();
    if (!trimmed) {
      throw new Error("INVALID_TITLE: Tên dự án không được để trống");
    }

    return this.updateProject({
      projectId,
      userId,
      payload: { workingTitle: trimmed },
    });
  }

  /**
   * Archives a project
   */
  static async archiveProject(params: {
    projectId: string;
    userId: string;
  }): Promise<ProjectRecord> {
    const { projectId, userId } = params;
    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    return this.repo.update(projectId, userId, {
      status: "ARCHIVED",
      archivedAt: new Date().toISOString(),
    });
  }

  /**
   * Restores an archived project (checks project quota before restoring)
   */
  static async restoreProject(params: {
    projectId: string;
    userId: string;
  }): Promise<ProjectRecord> {
    const { projectId, userId } = params;
    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    // Check project quota before restoring
    await requireQuota({
      userId,
      feature: "CREATE_PROJECT",
      requestedAmount: 1,
    });

    return this.repo.update(projectId, userId, {
      status: "DRAFT",
      archivedAt: null,
    });
  }

  /**
   * Soft deletes a project
   */
  static async softDeleteProject(params: {
    projectId: string;
    userId: string;
  }): Promise<boolean> {
    const { projectId, userId } = params;
    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    await this.repo.update(projectId, userId, {
      deletedAt: new Date().toISOString(),
    });
    return true;
  }

  /**
   * Updates lastOpenedAt timestamp
   */
  static async touchLastOpened(params: {
    projectId: string;
    userId: string;
  }): Promise<void> {
    const { projectId, userId } = params;
    try {
      await this.repo.update(projectId, userId, {
        lastOpenedAt: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }
  }
}
