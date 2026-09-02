import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ProjectReviewRunRecord,
  ProjectReviewFindingRecord,
  FindingStatus,
} from "@/types/review";

const memoryReviewRuns = new Map<string, ProjectReviewRunRecord[]>();
const memoryReviewFindings = new Map<string, ProjectReviewFindingRecord[]>();

export class ReviewerRepository {
  static clearMemoryReviewStore() {
    memoryReviewRuns.clear();
    memoryReviewFindings.clear();
  }

  /**
   * Saves a review run
   */
  async saveReviewRun(run: ProjectReviewRunRecord): Promise<ProjectReviewRunRecord> {
    const list = memoryReviewRuns.get(run.projectId) || [];
    const idx = list.findIndex((r) => r.id === run.id);
    if (idx >= 0) {
      list[idx] = run;
    } else {
      list.push(run);
    }
    memoryReviewRuns.set(run.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_review_runs").upsert({
        id: run.id,
        project_id: run.projectId,
        document_draft_id: run.documentDraftId,
        document_version: run.documentVersion,
        review_version: run.reviewVersion,
        status: run.status,
        rubric_source: run.rubricSource,
        summary_json: run.summaryJson,
        ai_request_id: run.aiRequestId,
        data_version: run.dataVersion,
        structure_version: run.structureVersion,
        completed_at: run.completedAt,
      });
    } catch {
      // Memory fallback
    }

    return run;
  }

  /**
   * Finds latest review run for a project
   */
  async findLatestReviewRun(projectId: string): Promise<ProjectReviewRunRecord | null> {
    const list = memoryReviewRuns.get(projectId) || [];
    if (list.length > 0) {
      return [...list].sort((a, b) => b.reviewVersion - a.reviewVersion)[0];
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_review_runs")
        .select("*")
        .eq("project_id", projectId)
        .order("review_version", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const record: ProjectReviewRunRecord = {
        id: data.id,
        projectId: data.project_id,
        documentDraftId: data.document_draft_id,
        documentVersion: data.document_version,
        reviewVersion: data.review_version,
        status: data.status,
        rubricSource: data.rubric_source,
        summaryJson: data.summary_json,
        aiRequestId: data.ai_request_id,
        dataVersion: data.data_version,
        structureVersion: data.structure_version,
        createdAt: data.created_at,
        completedAt: data.completed_at,
      };

      memoryReviewRuns.set(projectId, [record]);
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Saves a single finding
   */
  async saveFinding(finding: ProjectReviewFindingRecord): Promise<ProjectReviewFindingRecord> {
    const list = memoryReviewFindings.get(finding.reviewRunId) || [];
    const idx = list.findIndex((f) => f.id === finding.id);
    if (idx >= 0) {
      list[idx] = finding;
    } else {
      list.push(finding);
    }
    memoryReviewFindings.set(finding.reviewRunId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_review_findings").upsert({
        id: finding.id,
        review_run_id: finding.reviewRunId,
        project_id: finding.projectId,
        category: finding.category,
        severity: finding.severity,
        finding_type: finding.findingType,
        section_id: finding.sectionId,
        location_json: finding.locationJson,
        title: finding.title,
        description: finding.description,
        why_it_matters: finding.whyItMatters,
        suggested_fix: finding.suggestedFix,
        required_data_keys: finding.requiredDataKeys,
        priority_number: finding.priorityNumber,
        status: finding.status,
      });
    } catch {
      // Memory fallback
    }

    return finding;
  }

  /**
   * Saves multiple findings in batch
   */
  async saveFindings(findings: ProjectReviewFindingRecord[]): Promise<ProjectReviewFindingRecord[]> {
    for (const f of findings) {
      await this.saveFinding(f);
    }
    return findings;
  }

  /**
   * Finds all findings for a review run
   */
  async findFindingsByRun(reviewRunId: string): Promise<ProjectReviewFindingRecord[]> {
    const list = memoryReviewFindings.get(reviewRunId) || [];
    if (list.length > 0) return list;

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_review_findings")
        .select("*")
        .eq("review_run_id", reviewRunId);

      if (error || !data) return [];

      const records: ProjectReviewFindingRecord[] = data.map((d: any) => ({
        id: d.id,
        reviewRunId: d.review_run_id,
        projectId: d.project_id,
        category: d.category,
        severity: d.severity,
        findingType: d.finding_type,
        sectionId: d.section_id,
        locationJson: d.location_json,
        title: d.title,
        description: d.description,
        whyItMatters: d.why_it_matters,
        suggestedFix: d.suggested_fix,
        requiredDataKeys: d.required_data_keys,
        priorityNumber: d.priority_number,
        status: d.status,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      memoryReviewFindings.set(reviewRunId, records);
      return records;
    } catch {
      return [];
    }
  }

  /**
   * Finds a finding by ID
   */
  async findFindingById(findingId: string): Promise<ProjectReviewFindingRecord | null> {
    const allLists = Array.from(memoryReviewFindings.values());
    for (const list of allLists) {
      const found = list.find((f: ProjectReviewFindingRecord) => f.id === findingId);
      if (found) return found;
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_review_findings")
        .select("*")
        .eq("id", findingId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        reviewRunId: data.review_run_id,
        projectId: data.project_id,
        category: data.category,
        severity: data.severity,
        findingType: data.finding_type,
        sectionId: data.section_id,
        locationJson: data.location_json,
        title: data.title,
        description: data.description,
        whyItMatters: data.why_it_matters,
        suggestedFix: data.suggested_fix,
        requiredDataKeys: data.required_data_keys,
        priorityNumber: data.priority_number,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Updates status of a finding
   */
  async updateFindingStatus(findingId: string, status: FindingStatus): Promise<ProjectReviewFindingRecord> {
    const finding = await this.findFindingById(findingId);
    if (!finding) throw new Error("FINDING_NOT_FOUND");

    finding.status = status;
    finding.updatedAt = new Date().toISOString();
    return await this.saveFinding(finding);
  }
}
