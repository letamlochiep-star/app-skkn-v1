import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ProjectSectionRecord,
  ProjectSectionVersionRecord,
  ProjectWritingRunRecord,
  ProjectDocumentDraftRecord,
} from "@/types/writer";

const memorySections = new Map<string, ProjectSectionRecord[]>();
const memoryVersions = new Map<string, ProjectSectionVersionRecord[]>();
const memoryRuns = new Map<string, ProjectWritingRunRecord[]>();
const memoryDrafts = new Map<string, ProjectDocumentDraftRecord[]>();

export class WriterRepository {
  static clearMemoryWriterStore() {
    memorySections.clear();
    memoryVersions.clear();
    memoryRuns.clear();
    memoryDrafts.clear();
  }

  /**
   * Saves or updates a project section
   */
  async saveSection(section: ProjectSectionRecord): Promise<ProjectSectionRecord> {
    const list = memorySections.get(section.projectId) || [];
    const idx = list.findIndex((s) => s.promptNumber === section.promptNumber);
    if (idx >= 0) {
      list[idx] = section;
    } else {
      list.push(section);
    }
    memorySections.set(section.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_sections").upsert({
        id: section.id,
        project_id: section.projectId,
        structure_section_id: section.structureSectionId,
        prompt_number: section.promptNumber,
        title: section.title,
        content: section.content,
        status: section.status,
        source: section.source,
        version: section.version,
        data_version: section.dataVersion,
        structure_version: section.structureVersion,
        prompt_set_version: section.promptSetVersion,
        approved_at: section.approvedAt,
        approved_by: section.approvedBy,
      });
    } catch {
      // Memory fallback
    }

    return section;
  }

  /**
   * Finds all sections for a project sorted by prompt number
   */
  async findSectionsByProject(projectId: string): Promise<ProjectSectionRecord[]> {
    const list = memorySections.get(projectId) || [];
    if (list.length > 0) {
      return [...list].sort((a, b) => a.promptNumber - b.promptNumber);
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_sections")
        .select("*")
        .eq("project_id", projectId)
        .order("prompt_number", { ascending: true });

      if (error || !data) return [];

      const records: ProjectSectionRecord[] = data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        structureSectionId: d.structure_section_id,
        promptNumber: d.prompt_number,
        title: d.title,
        content: d.content,
        status: d.status,
        source: d.source,
        version: d.version,
        dataVersion: d.data_version,
        structureVersion: d.structure_version,
        promptSetVersion: d.prompt_set_version,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        approvedAt: d.approved_at,
        approvedBy: d.approved_by,
      }));

      memorySections.set(projectId, records);
      return records;
    } catch {
      return [];
    }
  }

  /**
   * Finds a specific section by prompt number
   */
  async findSectionByNumber(projectId: string, promptNumber: number): Promise<ProjectSectionRecord | null> {
    const list = await this.findSectionsByProject(projectId);
    return list.find((s) => s.promptNumber === promptNumber) || null;
  }

  /**
   * Saves a section version into history
   */
  async saveSectionVersion(version: ProjectSectionVersionRecord): Promise<ProjectSectionVersionRecord> {
    const key = `${version.projectId}_${version.promptNumber}`;
    const list = memoryVersions.get(key) || [];
    list.push(version);
    memoryVersions.set(key, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_section_versions").insert({
        id: version.id,
        section_id: version.sectionId,
        project_id: version.projectId,
        prompt_number: version.promptNumber,
        version: version.version,
        content: version.content,
        source: version.source,
        created_by: version.createdBy,
        ai_request_id: version.aiRequestId,
      });
    } catch {
      // Memory fallback
    }

    return version;
  }

  /**
   * Retrieves version history for a prompt number
   */
  async getSectionVersions(projectId: string, promptNumber: number): Promise<ProjectSectionVersionRecord[]> {
    const key = `${projectId}_${promptNumber}`;
    const list = memoryVersions.get(key) || [];
    if (list.length > 0) {
      return [...list].sort((a, b) => b.version - a.version);
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_section_versions")
        .select("*")
        .eq("project_id", projectId)
        .eq("prompt_number", promptNumber)
        .order("version", { ascending: false });

      if (error || !data) return [];

      const records: ProjectSectionVersionRecord[] = data.map((d: any) => ({
        id: d.id,
        sectionId: d.section_id,
        projectId: d.project_id,
        promptNumber: d.prompt_number,
        version: d.version,
        content: d.content,
        source: d.source,
        createdBy: d.created_by,
        aiRequestId: d.ai_request_id,
        createdAt: d.created_at,
      }));

      memoryVersions.set(key, records);
      return records;
    } catch {
      return [];
    }
  }

  /**
   * Saves a document draft
   */
  async saveDocumentDraft(draft: ProjectDocumentDraftRecord): Promise<ProjectDocumentDraftRecord> {
    const list = memoryDrafts.get(draft.projectId) || [];
    const idx = list.findIndex((d) => d.id === draft.id);
    if (idx >= 0) {
      list[idx] = draft;
    } else {
      list.push(draft);
    }
    memoryDrafts.set(draft.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_document_drafts").upsert({
        id: draft.id,
        project_id: draft.projectId,
        version: draft.version,
        content_json: draft.contentJson,
        plain_text: draft.plainText,
        status: draft.status,
        placeholder_summary: draft.placeholderSummary,
        data_version: draft.dataVersion,
        structure_version: draft.structureVersion,
        prompt_set_version: draft.promptSetVersion,
      });
    } catch {
      // Memory fallback
    }

    return draft;
  }

  /**
   * Finds latest document draft for a project
   */
  async findDocumentDraft(projectId: string): Promise<ProjectDocumentDraftRecord | null> {
    const list = memoryDrafts.get(projectId) || [];
    if (list.length > 0) return list[list.length - 1];

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_document_drafts")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const record: ProjectDocumentDraftRecord = {
        id: data.id,
        projectId: data.project_id,
        version: data.version,
        contentJson: data.content_json,
        plainText: data.plain_text,
        status: data.status,
        placeholderSummary: data.placeholder_summary,
        dataVersion: data.data_version,
        structureVersion: data.structure_version,
        promptSetVersion: data.prompt_set_version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      memoryDrafts.set(projectId, [record]);
      return record;
    } catch {
      return null;
    }
  }
}
