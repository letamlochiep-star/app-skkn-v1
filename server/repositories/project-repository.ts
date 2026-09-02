import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ProjectRecord,
  ProjectFactRecord,
  ProjectStatus,
  DocumentType,
} from "@/types/project";

// In-memory project and facts store for test runtime and fast fallback
const memoryProjects = new Map<string, ProjectRecord>();
const memoryFacts = new Map<string, ProjectFactRecord[]>();

export class ProjectRepository {
  /**
   * Clears in-memory storage (used in tests)
   */
  static clearMemoryStore() {
    memoryProjects.clear();
    memoryFacts.clear();
  }

  /**
   * Creates a project and its associated initial facts
   */
  async create(
    project: ProjectRecord,
    facts: Array<{ key: string; valueJson: unknown; sourceType: string }> = []
  ): Promise<ProjectRecord> {
    memoryProjects.set(project.id, project);

    const factRecords: ProjectFactRecord[] = facts.map((f) => ({
      id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId: project.id,
      key: f.key,
      valueJson: f.valueJson,
      sourceType: f.sourceType,
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    memoryFacts.set(project.id, factRecords);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("projects").insert({
        id: project.id,
        user_id: project.userId,
        document_type: project.documentType,
        title: project.title,
        working_title: project.workingTitle,
        education_level: project.educationLevel,
        subject_group: project.subjectGroup,
        grade_level: project.gradeLevel,
        school_year: project.schoolYear,
        school_name: project.schoolName,
        workflow_stage: project.workflowStage,
        status: project.status,
        topic_locked: project.topicLocked,
        structure_locked: project.structureLocked,
        progress_percent: project.progressPercent,
        last_opened_at: project.lastOpenedAt,
      });

      if (factRecords.length > 0) {
        await supabase.from("project_facts").insert(
          factRecords.map((r) => ({
            id: r.id,
            project_id: r.projectId,
            key: r.key,
            value_json: r.valueJson,
            source_type: r.sourceType,
            verified: r.verified,
          }))
        );
      }
    } catch {
      // Memory store fallback
    }

    return project;
  }

  /**
   * Finds a project by ID and optionally verifies ownership
   */
  async findById(id: string, userId?: string): Promise<ProjectRecord | null> {
    if (!id) return null;

    if (memoryProjects.has(id)) {
      const p = memoryProjects.get(id)!;
      if (userId && p.userId !== userId) return null;
      if (p.deletedAt) return null;
      return p;
    }

    try {
      const supabase = createServerSupabaseClient();
      let query = supabase.from("projects").select("*").eq("id", id).is("deleted_at", null);
      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query.single();
      if (error || !data) return null;

      const record: ProjectRecord = {
        id: data.id,
        userId: data.user_id,
        documentType: data.document_type as DocumentType,
        title: data.title || "",
        workingTitle: data.working_title || data.title || "",
        educationLevel: data.education_level,
        subjectGroup: data.subject_group,
        gradeLevel: data.grade_level,
        schoolYear: data.school_year || "2026-2027",
        schoolName: data.school_name,
        workflowStage: data.workflow_stage,
        status: data.status as ProjectStatus,
        topicLocked: data.topic_locked ?? false,
        structureLocked: data.structure_locked ?? false,
        progressPercent: data.progress_percent ?? 10,
        lastOpenedAt: data.last_opened_at || data.updated_at,
        archivedAt: data.archived_at,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      memoryProjects.set(record.id, record);
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Lists projects for a user with filters, search, and pagination
   */
  async listByUser(
    userId: string,
    options: {
      status?: string;
      documentType?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: ProjectRecord[]; total: number }> {
    const { status, documentType, search, limit = 20, offset = 0 } = options;

    let all: ProjectRecord[] = Array.from(memoryProjects.values()).filter(
      (p) => p.userId === userId && !p.deletedAt
    );

    if (status && status !== "ALL") {
      all = all.filter((p) => p.status === status);
    }

    if (documentType && documentType !== "ALL") {
      all = all.filter((p) => p.documentType === documentType);
    }

    if (search) {
      const q = search.toLowerCase();
      all = all.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.workingTitle.toLowerCase().includes(q) ||
          p.subjectGroup.toLowerCase().includes(q)
      );
    }

    // Sort by lastOpenedAt DESC
    all.sort(
      (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );

    const total = all.length;
    const items = all.slice(offset, offset + limit);

    return { items, total };
  }

  /**
   * Counts active non-archived projects for quota calculation
   */
  async countActiveByUser(userId: string): Promise<number> {
    const active = Array.from(memoryProjects.values()).filter(
      (p) => p.userId === userId && !p.deletedAt && p.status !== "ARCHIVED"
    );
    return active.length;
  }

  /**
   * Updates project fields
   */
  async update(
    id: string,
    userId: string,
    data: Partial<ProjectRecord>
  ): Promise<ProjectRecord> {
    const p = await this.findById(id, userId);
    if (!p) {
      throw new Error("PROJECT_NOT_FOUND: Dự án không tồn tại hoặc không thuộc quyền sở hữu");
    }

    const updated: ProjectRecord = {
      ...p,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    memoryProjects.set(id, updated);

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("projects")
        .update({
          working_title: updated.workingTitle,
          title: updated.title,
          education_level: updated.educationLevel,
          subject_group: updated.subjectGroup,
          grade_level: updated.gradeLevel,
          school_year: updated.schoolYear,
          school_name: updated.schoolName,
          status: updated.status,
          workflow_stage: updated.workflowStage,
          progress_percent: updated.progressPercent,
          topic_locked: updated.topicLocked,
          structure_locked: updated.structureLocked,
          archived_at: updated.archivedAt,
          deleted_at: updated.deletedAt,
          updated_at: updated.updatedAt,
        })
        .eq("id", id)
        .eq("user_id", userId);
    } catch {
      // fallback
    }

    return updated;
  }

  /**
   * Updates or sets facts for a project
   */
  async updateFacts(
    projectId: string,
    facts: Array<{ key: string; valueJson: unknown; sourceType: string }>
  ) {
    const existing = memoryFacts.get(projectId) || [];
    const updated = [...existing];

    for (const f of facts) {
      const idx = updated.findIndex((r) => r.key === f.key);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          valueJson: f.valueJson,
          sourceType: f.sourceType,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updated.push({
          id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          projectId,
          key: f.key,
          valueJson: f.valueJson,
          sourceType: f.sourceType,
          verified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    memoryFacts.set(projectId, updated);
  }

  /**
   * Alias for updating or saving facts
   */
  async saveFacts(
    projectId: string,
    facts: Array<{ key: string; valueJson: unknown; sourceType: string; verified?: boolean }>
  ) {
    return this.updateFacts(projectId, facts);
  }

  /**
   * Retrieves all facts for a project
   */
  async getFacts(projectId: string): Promise<ProjectFactRecord[]> {
    return memoryFacts.get(projectId) || [];
  }
}
