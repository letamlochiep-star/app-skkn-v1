import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TopicCandidate, TopicHistoryRecord } from "@/types/topic";

const memoryCandidates = new Map<string, TopicCandidate[]>();
const memoryHistory = new Map<string, TopicHistoryRecord[]>();

export class TopicRepository {
  static clearMemoryTopicStore() {
    memoryCandidates.clear();
    memoryHistory.clear();
  }

  /**
   * Saves a list of topic candidates
   */
  async saveCandidates(candidates: TopicCandidate[]): Promise<TopicCandidate[]> {
    if (candidates.length === 0) return [];

    const projectId = candidates[0].projectId;
    const existing = memoryCandidates.get(projectId) || [];
    const updated = [...existing, ...candidates];
    memoryCandidates.set(projectId, updated);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_topic_candidates").insert(
        candidates.map((c) => ({
          id: c.id,
          project_id: c.projectId,
          source: c.source,
          title: c.title,
          rationale: c.rationale,
          strengths_json: c.strengths,
          evidence_feasibility: c.evidenceFeasibility,
          notes: c.notes,
          rank: c.rank,
          status: c.status,
          ai_request_id: c.aiRequestId,
        }))
      );
    } catch {
      // Memory store fallback
    }

    return candidates;
  }

  /**
   * Retrieves all topic candidates for a project
   */
  async listCandidatesByProject(projectId: string): Promise<TopicCandidate[]> {
    if (memoryCandidates.has(projectId)) {
      return memoryCandidates.get(projectId)!;
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_topic_candidates")
        .select("*")
        .eq("project_id", projectId)
        .order("rank", { ascending: true });

      if (error || !data) return [];

      const candidates: TopicCandidate[] = data.map((d) => ({
        id: d.id,
        projectId: d.project_id,
        source: d.source,
        title: d.title,
        rationale: d.rationale,
        strengths: Array.isArray(d.strengths_json) ? d.strengths_json : [],
        evidenceFeasibility: d.evidence_feasibility,
        notes: d.notes,
        rank: d.rank,
        status: d.status,
        aiRequestId: d.ai_request_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      memoryCandidates.set(projectId, candidates);
      return candidates;
    } catch {
      return [];
    }
  }

  /**
   * Finds a specific candidate by ID
   */
  async findCandidateById(candidateId: string, projectId: string): Promise<TopicCandidate | null> {
    const list = await this.listCandidatesByProject(projectId);
    return list.find((c) => c.id === candidateId) || null;
  }

  /**
   * Updates candidate status or title
   */
  async updateCandidate(
    candidateId: string,
    projectId: string,
    data: Partial<TopicCandidate>
  ): Promise<TopicCandidate | null> {
    const list = await this.listCandidatesByProject(projectId);
    const candidate = list.find((c) => c.id === candidateId);
    if (!candidate) return null;

    Object.assign(candidate, data, { updatedAt: new Date().toISOString() });

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("project_topic_candidates")
        .update({
          title: candidate.title,
          source: candidate.source,
          status: candidate.status,
          updated_at: candidate.updatedAt,
        })
        .eq("id", candidateId);
    } catch {
      // Memory fallback
    }

    return candidate;
  }

  /**
   * Records a topic lock or change action into history
   */
  async recordHistory(history: TopicHistoryRecord): Promise<void> {
    const list = memoryHistory.get(history.projectId) || [];
    list.push(history);
    memoryHistory.set(history.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_topic_history").insert({
        id: history.id,
        project_id: history.projectId,
        action: history.action,
        previous_title: history.previousTitle,
        new_title: history.newTitle,
        user_id: history.userId,
      });
    } catch {
      // Memory fallback
    }
  }

  /**
   * Gets history of topic actions for a project
   */
  async getHistoryByProject(projectId: string): Promise<TopicHistoryRecord[]> {
    return memoryHistory.get(projectId) || [];
  }
}
