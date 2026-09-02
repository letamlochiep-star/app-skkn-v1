import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProjectStructureRecord } from "@/types/structure";

const memoryStructures = new Map<string, ProjectStructureRecord[]>();

export class StructureRepository {
  static clearMemoryStructureStore() {
    memoryStructures.clear();
  }

  /**
   * Saves or updates a project structure
   */
  async saveStructure(structure: ProjectStructureRecord): Promise<ProjectStructureRecord> {
    const list = memoryStructures.get(structure.projectId) || [];
    const idx = list.findIndex((s) => s.id === structure.id);
    if (idx >= 0) {
      list[idx] = structure;
    } else {
      list.push(structure);
    }
    memoryStructures.set(structure.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_structures").upsert({
        id: structure.id,
        project_id: structure.projectId,
        version: structure.version,
        status: structure.status,
        source: structure.source,
        structure_json: structure.structureJson,
        data_version: structure.dataVersion,
        topic_version: structure.topicVersion,
        created_by: structure.createdBy,
        locked_at: structure.lockedAt,
        locked_by: structure.lockedBy,
      });
    } catch {
      // Memory fallback
    }

    return structure;
  }

  /**
   * Retrieves the current active structure for a project
   */
  async findCurrentByProject(projectId: string): Promise<ProjectStructureRecord | null> {
    const list = memoryStructures.get(projectId) || [];
    if (list.length > 0) {
      // Prioritize LOCKED structure or latest version
      const locked = list.find((s) => s.status === "LOCKED");
      if (locked) return locked;
      return list[list.length - 1];
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_structures")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const record: ProjectStructureRecord = {
        id: data.id,
        projectId: data.project_id,
        version: data.version,
        status: data.status,
        source: data.source,
        structureJson: data.structure_json,
        dataVersion: data.data_version,
        topicVersion: data.topic_version,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lockedAt: data.locked_at,
        lockedBy: data.locked_by,
      };

      memoryStructures.set(projectId, [record]);
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Locks the structure
   */
  async lockStructure(structureId: string, projectId: string, userId: string): Promise<ProjectStructureRecord | null> {
    const list = memoryStructures.get(projectId) || [];
    const structure = list.find((s) => s.id === structureId);
    if (!structure) return null;

    structure.status = "LOCKED";
    structure.lockedAt = new Date().toISOString();
    structure.lockedBy = userId;
    structure.updatedAt = new Date().toISOString();

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("project_structures")
        .update({
          status: "LOCKED",
          locked_at: structure.lockedAt,
          locked_by: structure.lockedBy,
          updated_at: structure.updatedAt,
        })
        .eq("id", structureId);
    } catch {
      // Memory fallback
    }

    return structure;
  }
}
