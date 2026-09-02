import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProjectPromptSet, ProjectPrompt } from "@/types/prompt";

const memoryPromptSets = new Map<string, ProjectPromptSet[]>();

export class PromptSetRepository {
  static clearMemoryPromptStore() {
    memoryPromptSets.clear();
  }

  /**
   * Saves or updates a prompt set along with its 18 prompts
   */
  async savePromptSet(set: ProjectPromptSet): Promise<ProjectPromptSet> {
    const list = memoryPromptSets.get(set.projectId) || [];
    const idx = list.findIndex((s) => s.id === set.id);
    if (idx >= 0) {
      list[idx] = set;
    } else {
      list.push(set);
    }
    memoryPromptSets.set(set.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_prompt_sets").upsert({
        id: set.id,
        project_id: set.projectId,
        structure_id: set.structureId,
        version: set.version,
        status: set.status,
        prompt_count: set.promptCount,
        data_version: set.dataVersion,
        prompt_framework_version: set.promptFrameworkVersion,
        ai_request_id: set.aiRequestId,
        locked_at: set.lockedAt,
      });

      if (set.prompts && set.prompts.length > 0) {
        await supabase.from("project_prompts").upsert(
          set.prompts.map((p) => ({
            id: p.id,
            prompt_set_id: p.promptSetId,
            project_id: p.projectId,
            prompt_number: p.promptNumber,
            title: p.title,
            purpose: p.purpose,
            prompt_text: p.promptText,
            required_data_keys: p.requiredDataKeys,
            missing_data_keys: p.missingDataKeys,
            status: p.status,
            immutable: p.immutable,
          }))
        );
      }
    } catch {
      // Memory fallback
    }

    return set;
  }

  /**
   * Retrieves the latest active prompt set for a project
   */
  async findCurrentByProject(projectId: string): Promise<ProjectPromptSet | null> {
    const list = memoryPromptSets.get(projectId) || [];
    if (list.length > 0) {
      return list[list.length - 1];
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_prompt_sets")
        .select("*, project_prompts(*)")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const prompts: ProjectPrompt[] = (data.project_prompts || []).map((p: any) => ({
        id: p.id,
        promptSetId: p.prompt_set_id,
        projectId: p.project_id,
        promptNumber: p.prompt_number,
        title: p.title,
        purpose: p.purpose,
        promptText: p.prompt_text,
        requiredDataKeys: p.required_data_keys || [],
        missingDataKeys: p.missing_data_keys || [],
        status: p.status,
        immutable: p.immutable,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      const record: ProjectPromptSet = {
        id: data.id,
        projectId: data.project_id,
        structureId: data.structure_id,
        version: data.version,
        status: data.status,
        promptCount: data.prompt_count,
        dataVersion: data.data_version,
        promptFrameworkVersion: data.prompt_framework_version,
        aiRequestId: data.ai_request_id,
        prompts,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lockedAt: data.locked_at,
      };

      memoryPromptSets.set(projectId, [record]);
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Updates prompt text for a specific prompt number
   */
  async updatePromptText(
    projectId: string,
    promptSetId: string,
    promptNumber: number,
    text: string
  ): Promise<ProjectPrompt | null> {
    const set = await this.findCurrentByProject(projectId);
    if (!set || !set.prompts) return null;

    const prompt = set.prompts.find((p) => p.promptNumber === promptNumber);
    if (!prompt) return null;
    if (prompt.immutable) {
      throw new Error("PROMPT_IMMUTABLE: Câu lệnh số 18 là câu lệnh chuẩn bắt buộc và không thể chỉnh sửa.");
    }

    prompt.promptText = text;
    prompt.updatedAt = new Date().toISOString();

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("project_prompts")
        .update({
          prompt_text: text,
          updated_at: prompt.updatedAt,
        })
        .eq("prompt_set_id", promptSetId)
        .eq("prompt_number", promptNumber);
    } catch {
      // Memory fallback
    }

    return prompt;
  }
}
