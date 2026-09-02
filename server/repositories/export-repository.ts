import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ProjectExportJobRecord,
  ProjectExportArtifactRecord,
  ProjectExportDownloadRecord,
  ExportTemplateRecord,
  ExportType,
} from "@/types/export";

const memoryTemplates = new Map<string, ExportTemplateRecord>([
  [
    "DEFAULT_SKKN_DOCX",
    {
      id: "tpl_skkn_docx_1",
      code: "DEFAULT_SKKN_DOCX",
      name: "Mẫu Chuẩn SKKN Bộ GD&ĐT (Word)",
      artifactType: "DOCX",
      status: "ACTIVE",
      version: 1,
      configurationJson: { pageSize: "A4", margins: { top: 2, bottom: 2, left: 3, right: 1.5 }, font: { family: "Times New Roman", size: 14, lineSpacing: 1.5 } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "DEFAULT_SOLUTION_DOCX",
    {
      id: "tpl_sol_docx_1",
      code: "DEFAULT_SOLUTION_DOCX",
      name: "Mẫu Chuẩn Giải pháp Hữu ích (Word)",
      artifactType: "DOCX",
      status: "ACTIVE",
      version: 1,
      configurationJson: { pageSize: "A4", margins: { top: 2, bottom: 2, left: 3, right: 1.5 }, font: { family: "Times New Roman", size: 14, lineSpacing: 1.5 } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "DEFAULT_FULL_PDF",
    {
      id: "tpl_full_pdf_1",
      code: "DEFAULT_FULL_PDF",
      name: "Mẫu Xuất PDF Toàn văn Chuẩn in",
      artifactType: "FULL_PDF",
      status: "ACTIVE",
      version: 1,
      configurationJson: { pageSize: "A4", margins: { top: 2, bottom: 2, left: 3, right: 1.5 }, font: { family: "Times New Roman", size: 14 } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "DEFAULT_DEFENSE_PPTX",
    {
      id: "tpl_defense_pptx_1",
      code: "DEFAULT_DEFENSE_PPTX",
      name: "Mẫu Thuyết trình Hội đồng Chuẩn (16:9)",
      artifactType: "DEFENSE_PPTX",
      status: "ACTIVE",
      version: 1,
      configurationJson: { aspectRatio: "16:9", theme: "CLASSIC_BLUE", minFontSize: 18 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "DEFAULT_ONE_PAGE_PDF",
    {
      id: "tpl_one_page_1",
      code: "DEFAULT_ONE_PAGE_PDF",
      name: "Mẫu Tóm tắt 1 Trang A4 BGK",
      artifactType: "ONE_PAGE_PDF",
      status: "ACTIVE",
      version: 1,
      configurationJson: { pageSize: "A4", maxPages: 1, columns: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const memoryJobs = new Map<string, ProjectExportJobRecord>();
const memoryArtifacts = new Map<string, ProjectExportArtifactRecord>();
const memoryDownloads = new Map<string, ProjectExportDownloadRecord[]>();

export class ExportRepository {
  static clearMemoryExportStore() {
    memoryJobs.clear();
    memoryArtifacts.clear();
    memoryDownloads.clear();
  }

  async findTemplateByCode(code: string): Promise<ExportTemplateRecord | null> {
    return memoryTemplates.get(code) || null;
  }

  async listTemplates(artifactType?: ExportType): Promise<ExportTemplateRecord[]> {
    const all = Array.from(memoryTemplates.values());
    if (artifactType) return all.filter((t) => t.artifactType === artifactType && t.status === "ACTIVE");
    return all.filter((t) => t.status === "ACTIVE");
  }

  async saveJob(job: ProjectExportJobRecord): Promise<ProjectExportJobRecord> {
    memoryJobs.set(job.id, job);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_export_jobs").upsert({
        id: job.id,
        project_id: job.projectId,
        user_id: job.userId,
        export_type: job.exportType,
        status: job.status,
        request_id: job.requestId,
        source_document_id: job.sourceDocumentId,
        source_document_version: job.sourceDocumentVersion,
        source_review_id: job.sourceReviewId,
        source_review_version: job.sourceReviewVersion,
        source_defense_package_id: job.sourceDefensePackageId,
        source_defense_version: job.sourceDefenseVersion,
        template_id: job.templateId,
        template_version: job.templateVersion,
        options_json: job.optionsJson,
        fingerprint: job.fingerprint,
        error_code: job.errorCode,
        started_at: job.startedAt,
        completed_at: job.completedAt,
      });
    } catch {
      // Memory fallback
    }

    return job;
  }

  async findJobById(jobId: string): Promise<ProjectExportJobRecord | null> {
    const mem = memoryJobs.get(jobId);
    if (mem) return mem;

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.from("project_export_jobs").select("*").eq("id", jobId).single();
      if (error || !data) return null;
      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        exportType: data.export_type,
        status: data.status,
        requestId: data.request_id,
        sourceDocumentId: data.source_document_id,
        sourceDocumentVersion: data.source_document_version,
        sourceReviewId: data.source_review_id,
        sourceReviewVersion: data.source_review_version,
        sourceDefensePackageId: data.source_defense_package_id,
        sourceDefenseVersion: data.source_defense_version,
        templateId: data.template_id,
        templateVersion: data.template_version,
        optionsJson: data.options_json,
        fingerprint: data.fingerprint,
        errorCode: data.error_code,
        createdAt: data.created_at,
        startedAt: data.started_at,
        completedAt: data.completed_at,
      };
    } catch {
      return null;
    }
  }

  async findJobByFingerprint(fingerprint: string): Promise<ProjectExportJobRecord | null> {
    const list = Array.from(memoryJobs.values());
    for (const job of list) {
      if (job.fingerprint === fingerprint && job.status === "READY") {
        return job;
      }
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_export_jobs")
        .select("*")
        .eq("fingerprint", fingerprint)
        .eq("status", "READY")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        exportType: data.export_type,
        status: data.status,
        requestId: data.request_id,
        sourceDocumentId: data.source_document_id,
        sourceDocumentVersion: data.source_document_version,
        sourceReviewId: data.source_review_id,
        sourceReviewVersion: data.source_review_version,
        sourceDefensePackageId: data.source_defense_package_id,
        sourceDefenseVersion: data.source_defense_version,
        templateId: data.template_id,
        templateVersion: data.template_version,
        optionsJson: data.options_json,
        fingerprint: data.fingerprint,
        errorCode: data.error_code,
        createdAt: data.created_at,
        startedAt: data.started_at,
        completedAt: data.completed_at,
      };
    } catch {
      return null;
    }
  }

  async listJobsByProject(projectId: string): Promise<ProjectExportJobRecord[]> {
    const list = Array.from(memoryJobs.values()).filter((j) => j.projectId === projectId);
    if (list.length > 0) return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_export_jobs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        userId: d.user_id,
        exportType: d.export_type,
        status: d.status,
        requestId: d.request_id,
        sourceDocumentId: d.source_document_id,
        sourceDocumentVersion: d.source_document_version,
        sourceReviewId: d.source_review_id,
        sourceReviewVersion: d.source_review_version,
        sourceDefensePackageId: d.source_defense_package_id,
        sourceDefenseVersion: d.source_defense_version,
        templateId: d.template_id,
        templateVersion: d.template_version,
        optionsJson: d.options_json,
        fingerprint: d.fingerprint,
        errorCode: d.error_code,
        createdAt: d.created_at,
        startedAt: d.started_at,
        completedAt: d.completed_at,
      }));
    } catch {
      return [];
    }
  }

  async saveArtifact(artifact: ProjectExportArtifactRecord): Promise<ProjectExportArtifactRecord> {
    memoryArtifacts.set(artifact.id, artifact);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_export_artifacts").upsert({
        id: artifact.id,
        export_job_id: artifact.exportJobId,
        project_id: artifact.projectId,
        artifact_type: artifact.artifactType,
        filename: artifact.filename,
        mime_type: artifact.mimeType,
        size_bytes: artifact.sizeBytes,
        storage_path: artifact.storagePath,
        checksum: artifact.checksum,
        version: artifact.version,
      });
    } catch {
      // Memory fallback
    }

    return artifact;
  }

  async findArtifactById(artifactId: string): Promise<ProjectExportArtifactRecord | null> {
    const mem = memoryArtifacts.get(artifactId);
    if (mem) return mem;

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.from("project_export_artifacts").select("*").eq("id", artifactId).single();
      if (error || !data) return null;
      return {
        id: data.id,
        exportJobId: data.export_job_id,
        projectId: data.project_id,
        artifactType: data.artifact_type,
        filename: data.filename,
        mimeType: data.mime_type,
        sizeBytes: data.size_bytes,
        storagePath: data.storage_path,
        checksum: data.checksum,
        version: data.version,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };
    } catch {
      return null;
    }
  }

  async listArtifactsByProject(projectId: string): Promise<ProjectExportArtifactRecord[]> {
    const list = Array.from(memoryArtifacts.values()).filter((a) => a.projectId === projectId);
    if (list.length > 0) return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("project_export_artifacts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        exportJobId: d.export_job_id,
        projectId: d.project_id,
        artifactType: d.artifact_type,
        filename: d.filename,
        mimeType: d.mime_type,
        sizeBytes: d.size_bytes,
        storagePath: d.storage_path,
        checksum: d.checksum,
        version: d.version,
        createdAt: d.created_at,
        expiresAt: d.expires_at,
      }));
    } catch {
      return [];
    }
  }

  async saveDownload(download: ProjectExportDownloadRecord): Promise<ProjectExportDownloadRecord> {
    const list = memoryDownloads.get(download.projectId) || [];
    list.push(download);
    memoryDownloads.set(download.projectId, list);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("project_export_downloads").insert({
        id: download.id,
        artifact_id: download.artifactId,
        project_id: download.projectId,
        user_id: download.userId,
        ip_hash_optional: download.ipHashOptional,
        user_agent_summary_optional: download.userAgentSummaryOptional,
      });
    } catch {
      // Memory fallback
    }

    return download;
  }

  async listDownloadsByProject(projectId: string): Promise<ProjectExportDownloadRecord[]> {
    return memoryDownloads.get(projectId) || [];
  }
}
