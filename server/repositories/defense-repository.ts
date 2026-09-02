import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ProjectDefensePackageRecord,
  ProjectDefenseComponentRecord,
  ProjectDefensePracticeSessionRecord,
  ProjectDefensePracticeTurnRecord,
} from "@/types/defense";

const memoryPackages = new Map<string, ProjectDefensePackageRecord[]>();
const memoryComponents = new Map<string, ProjectDefenseComponentRecord[]>();
const memorySessions = new Map<string, ProjectDefensePracticeSessionRecord[]>();
const memoryTurns = new Map<string, ProjectDefensePracticeTurnRecord[]>();

export class DefenseRepository {
  static clearMemoryDefenseStore() {
    memoryPackages.clear();
    memoryComponents.clear();
    memorySessions.clear();
    memoryTurns.clear();
  }

  /**
   * Saves or updates a defense package
   */
  async savePackage(pkg: ProjectDefensePackageRecord): Promise<ProjectDefensePackageRecord> {
    const list = memoryPackages.get(pkg.projectId) || [];
    const idx = list.findIndex((p) => p.id === pkg.id);
    if (idx >= 0) {
      list[idx] = pkg;
    } else {
      list.push(pkg);
    }
    memoryPackages.set(pkg.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_defense_packages").upsert({
        id: pkg.id,
        project_id: pkg.projectId,
        source_document_id: pkg.sourceDocumentId,
        source_document_version: pkg.sourceDocumentVersion,
        source_review_id: pkg.sourceReviewId,
        duration_minutes: pkg.durationMinutes,
        version: pkg.version,
        status: pkg.status,
        completed_at: pkg.completedAt,
      });
    } catch {
      // Memory fallback
    }

    return pkg;
  }

  /**
   * Finds latest defense package for a project
   */
  async findLatestPackage(projectId: string): Promise<ProjectDefensePackageRecord | null> {
    const list = memoryPackages.get(projectId) || [];
    if (list.length > 0) {
      return [...list].sort((a, b) => b.version - a.version)[0];
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_defense_packages")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const record: ProjectDefensePackageRecord = {
        id: data.id,
        projectId: data.project_id,
        sourceDocumentId: data.source_document_id,
        sourceDocumentVersion: data.source_document_version,
        sourceReviewId: data.source_review_id,
        durationMinutes: data.duration_minutes,
        version: data.version,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
      };

      memoryPackages.set(projectId, [record]);
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Saves a defense component
   */
  async saveComponent(component: ProjectDefenseComponentRecord): Promise<ProjectDefenseComponentRecord> {
    const list = memoryComponents.get(component.defensePackageId) || [];
    const idx = list.findIndex((c) => c.componentType === component.componentType);
    if (idx >= 0) {
      list[idx] = component;
    } else {
      list.push(component);
    }
    memoryComponents.set(component.defensePackageId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_defense_components").upsert({
        id: component.id,
        defense_package_id: component.defensePackageId,
        project_id: component.projectId,
        component_type: component.componentType,
        version: component.version,
        content_json: component.contentJson,
        status: component.status,
        ai_request_id: component.aiRequestId,
      });
    } catch {
      // Memory fallback
    }

    return component;
  }

  /**
   * Finds all components for a defense package
   */
  async findComponentsByPackage(packageId: string): Promise<ProjectDefenseComponentRecord[]> {
    const list = memoryComponents.get(packageId) || [];
    if (list.length > 0) return list;

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_defense_components")
        .select("*")
        .eq("defense_package_id", packageId);

      if (error || !data) return [];

      const records: ProjectDefenseComponentRecord[] = data.map((d: any) => ({
        id: d.id,
        defensePackageId: d.defense_package_id,
        projectId: d.project_id,
        componentType: d.component_type,
        version: d.version,
        contentJson: d.content_json,
        status: d.status,
        aiRequestId: d.ai_request_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      memoryComponents.set(packageId, records);
      return records;
    } catch {
      return [];
    }
  }

  /**
   * Saves a practice session
   */
  async savePracticeSession(session: ProjectDefensePracticeSessionRecord): Promise<ProjectDefensePracticeSessionRecord> {
    const list = memorySessions.get(session.projectId) || [];
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    memorySessions.set(session.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_defense_practice_sessions").upsert({
        id: session.id,
        project_id: session.projectId,
        defense_package_id: session.defensePackageId,
        status: session.status,
        completed_at: session.completedAt,
      });
    } catch {
      // Memory fallback
    }

    return session;
  }

  /**
   * Finds latest practice session for a project
   */
  async findLatestPracticeSession(projectId: string): Promise<ProjectDefensePracticeSessionRecord | null> {
    const list = memorySessions.get(projectId) || [];
    if (list.length > 0) return list[list.length - 1];

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_defense_practice_sessions")
        .select("*")
        .eq("project_id", projectId)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        projectId: data.project_id,
        defensePackageId: data.defense_package_id,
        status: data.status,
        startedAt: data.started_at,
        completedAt: data.completed_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Saves a practice turn
   */
  async savePracticeTurn(turn: ProjectDefensePracticeTurnRecord): Promise<ProjectDefensePracticeTurnRecord> {
    const list = memoryTurns.get(turn.sessionId) || [];
    list.push(turn);
    memoryTurns.set(turn.sessionId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_defense_practice_turns").insert({
        id: turn.id,
        session_id: turn.sessionId,
        question_id: turn.questionId,
        question_text: turn.questionText,
        answer_text: turn.answerText,
        evaluation_json: turn.evaluationJson,
      });
    } catch {
      // Memory fallback
    }

    return turn;
  }

  /**
   * Finds practice turns by session
   */
  async findPracticeTurns(sessionId: string): Promise<ProjectDefensePracticeTurnRecord[]> {
    const list = memoryTurns.get(sessionId) || [];
    if (list.length > 0) return list;

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_defense_practice_turns")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];

      const records: ProjectDefensePracticeTurnRecord[] = data.map((d: any) => ({
        id: d.id,
        sessionId: d.session_id,
        questionId: d.question_id,
        questionText: d.question_text,
        answerText: d.answer_text,
        evaluationJson: d.evaluation_json,
        createdAt: d.created_at,
      }));

      memoryTurns.set(sessionId, records);
      return records;
    } catch {
      return [];
    }
  }
}
