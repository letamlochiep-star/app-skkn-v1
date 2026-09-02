import crypto from "crypto";
import { ProjectRepository } from "@/server/repositories/project-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { ReviewerRepository } from "@/server/repositories/reviewer-repository";
import { DefenseRepository } from "@/server/repositories/defense-repository";
import { ExportRepository } from "@/server/repositories/export-repository";
import { ExportReadinessService } from "@/server/services/export-readiness-service";
import { DocumentExportService } from "@/server/services/document-export-service";
import { DefenseExportService } from "@/server/services/defense-export-service";
import { ExportValidator } from "@/server/services/export-validator";
import { UsageService } from "@/server/services/usage-service";
import { requireEntitlement } from "@/server/guards/require-entitlement";
import type {
  ExportType,
  ExportMode,
  ProjectExportJobRecord,
  ProjectExportArtifactRecord,
  ProjectExportDownloadRecord,
} from "@/types/export";

export class ExportService {
  private static projectRepo = new ProjectRepository();
  private static writerRepo = new WriterRepository();
  private static reviewRepo = new ReviewerRepository();
  private static defenseRepo = new DefenseRepository();
  private static exportRepo = new ExportRepository();

  /**
   * Retrieves overall export workspace state
   */
  static async getExportState(params: { projectId: string; userId: string }) {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    const review = await this.reviewRepo.findLatestReviewRun(projectId);
    const defense = await this.defenseRepo.findLatestPackage(projectId);

    // Evaluate readiness for each product
    const docxReadiness = await ExportReadinessService.getReadiness({ projectId, userId, exportType: "DOCX" });
    const pdfReadiness = await ExportReadinessService.getReadiness({ projectId, userId, exportType: "FULL_PDF" });
    const pptxReadiness = await ExportReadinessService.getReadiness({ projectId, userId, exportType: "DEFENSE_PPTX" });
    const onePageReadiness = await ExportReadinessService.getReadiness({ projectId, userId, exportType: "ONE_PAGE_PDF" });

    const jobs = await this.exportRepo.listJobsByProject(projectId);
    const artifacts = await this.exportRepo.listArtifactsByProject(projectId);
    const downloads = await this.exportRepo.listDownloadsByProject(projectId);

    return {
      project,
      draft,
      review,
      defense,
      readiness: {
        DOCX: docxReadiness,
        FULL_PDF: pdfReadiness,
        DEFENSE_PPTX: pptxReadiness,
        ONE_PAGE_PDF: onePageReadiness,
      },
      jobs,
      artifacts,
      downloads,
    };
  }

  /**
   * Triggers or reuses an export generation job
   */
  static async generateExport(params: {
    projectId: string;
    userId: string;
    exportType: ExportType;
    mode?: ExportMode;
    templateCode?: string;
    options?: Record<string, unknown>;
    requestId?: string;
  }): Promise<{ job: ProjectExportJobRecord; artifact: ProjectExportArtifactRecord }> {
    const { projectId, userId, exportType, mode = "FINAL", templateCode, options = {}, requestId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    // 1. Entitlement verification
    const featureCode =
      exportType === "DOCX"
        ? "EXPORT_DOCX"
        : exportType === "FULL_PDF" || exportType === "ONE_PAGE_PDF"
        ? "EXPORT_PDF"
        : "EXPORT_PPTX";

    await requireEntitlement(userId, featureCode as any);

    // 2. Readiness check
    const readiness = await ExportReadinessService.getReadiness({ projectId, userId, exportType, mode });
    if (!readiness.allowed && mode === "FINAL") {
      throw new Error(`EXPORT_NOT_ALLOWED: ${readiness.blockers.join("; ")}`);
    }

    const draft = await this.writerRepo.findDocumentDraft(projectId);
    const review = await this.reviewRepo.findLatestReviewRun(projectId);
    const defense = await this.defenseRepo.findLatestPackage(projectId);

    // 3. Resolve template
    const defaultTemplateCode =
      templateCode ||
      (exportType === "DOCX"
        ? project.documentType === "SKKN"
          ? "DEFAULT_SKKN_DOCX"
          : "DEFAULT_SOLUTION_DOCX"
        : exportType === "FULL_PDF"
        ? "DEFAULT_FULL_PDF"
        : exportType === "DEFENSE_PPTX"
        ? "DEFAULT_DEFENSE_PPTX"
        : "DEFAULT_ONE_PAGE_PDF");

    const template = await this.exportRepo.findTemplateByCode(defaultTemplateCode);

    // 4. Compute deterministic fingerprint
    const fingerprint = crypto
      .createHash("sha256")
      .update(
        `${projectId}_${exportType}_${mode}_${draft?.version || 1}_${review?.reviewVersion || 1}_${defense?.version || 1}_${template?.version || 1}_${JSON.stringify(options)}`
      )
      .digest("hex");

    // 5. Idempotency & Artifact Reuse Check
    const existingJob = await this.exportRepo.findJobByFingerprint(fingerprint);
    if (existingJob && existingJob.status === "READY") {
      const artifacts = await this.exportRepo.listArtifactsByProject(projectId);
      const matched = artifacts.find((a) => a.exportJobId === existingJob.id);
      if (matched) {
        return { job: existingJob, artifact: matched };
      }
    }

    // 6. Create Job record
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const jobRecord: ProjectExportJobRecord = {
      id: jobId,
      projectId,
      userId,
      exportType,
      status: "GENERATING",
      requestId: requestId || `req_${Date.now()}`,
      sourceDocumentId: draft?.id || null,
      sourceDocumentVersion: draft?.version || 1,
      sourceReviewId: review?.id || null,
      sourceReviewVersion: review?.reviewVersion || 1,
      sourceDefensePackageId: defense?.id || null,
      sourceDefenseVersion: defense?.version || 1,
      templateId: template?.id || null,
      templateVersion: template?.version || 1,
      optionsJson: { ...options, mode },
      fingerprint,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };

    await this.exportRepo.saveJob(jobRecord);

    // 7. Render Binary Document (NO AI CALLS)
    let buffer: Buffer;
    let mimeType: string;
    let ext: string;

    const sections = await this.writerRepo.findSectionsByProject(projectId);
    const facts = await this.projectRepo.getFacts(projectId);
    const verifiedFacts: Record<string, unknown> = {};
    facts.forEach((f) => {
      if (f.verified) verifiedFacts[f.key] = f.valueJson;
    });

    if (exportType === "DOCX") {
      const docModel = DocumentExportService.buildDocumentExportModel({
        project,
        draft: draft!,
        sections,
        verifiedFacts,
        mode,
      });
      buffer = await DocumentExportService.generateDocx(docModel);
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      ext = "docx";
    } else if (exportType === "FULL_PDF") {
      const docModel = DocumentExportService.buildDocumentExportModel({
        project,
        draft: draft!,
        sections,
        verifiedFacts,
        mode,
      });
      buffer = await DocumentExportService.generateFullPdf(docModel);
      mimeType = "application/pdf";
      ext = "pdf";
    } else if (exportType === "DEFENSE_PPTX") {
      const components = await this.defenseRepo.findComponentsByPackage(defense!.id);
      const presModel = DefenseExportService.buildPresentationExportModel({
        project,
        pkg: defense!,
        components,
        mode,
      });
      buffer = await DefenseExportService.generatePptx(presModel);
      mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      ext = "pptx";
    } else {
      // ONE_PAGE_PDF
      const components = await this.defenseRepo.findComponentsByPackage(defense!.id);
      const summaryComp = components.find((c) => c.componentType === "ONE_PAGE_SUMMARY");
      const summary = summaryComp?.contentJson as any || {
        title: project.title,
        problem: "Vấn đề thực tiễn",
        solution: ["Giải pháp"],
        improvements: ["Điểm mới"],
        closing: "Trân trọng cảm ơn.",
      };
      buffer = await DefenseExportService.generateOnePagePdf({
        project,
        summary,
        mode,
      });
      mimeType = "application/pdf";
      ext = "pdf";
    }

    // 8. Validate File
    let validation: { valid: boolean; error?: string; checksum: string };
    if (exportType === "DOCX") {
      validation = ExportValidator.validateDocx(buffer);
    } else if (exportType === "FULL_PDF") {
      validation = ExportValidator.validatePdf(buffer);
    } else if (exportType === "DEFENSE_PPTX") {
      validation = ExportValidator.validatePptx(buffer);
    } else {
      validation = ExportValidator.validateOnePagePdf(buffer);
    }

    if (!validation.valid) {
      jobRecord.status = "FAILED";
      jobRecord.errorCode = validation.error;
      jobRecord.completedAt = new Date().toISOString();
      await this.exportRepo.saveJob(jobRecord);
      throw new Error(`EXPORT_VALIDATION_FAILED: ${validation.error}`);
    }

    // 9. Save Artifact
    const filename = this.sanitizeFilename(
      `${project.documentType}_${project.title.replace(/\s+/g, "-")}_${mode}_v${draft?.version || 1}.${ext}`
    );
    const storagePath = `exports/${userId}/${projectId}/${jobId}/${filename}`;

    const artifactRecord: ProjectExportArtifactRecord = {
      id: `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exportJobId: jobId,
      projectId,
      artifactType: exportType,
      filename,
      mimeType,
      sizeBytes: buffer.length,
      storagePath,
      checksum: validation.checksum,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    const savedArtifact = await this.exportRepo.saveArtifact(artifactRecord);

    // 10. Update Job status
    jobRecord.status = "READY";
    jobRecord.completedAt = new Date().toISOString();
    await this.exportRepo.saveJob(jobRecord);

    // 11. Record Usage
    await UsageService.recordUsage({
      userId,
      projectId,
      feature: featureCode as any,
      usageType: "AI_REQUEST",
      quantity: 1,
      idempotencyKey: requestId,
    });

    return {
      job: jobRecord,
      artifact: savedArtifact,
    };
  }

  /**
   * Logs download of an existing artifact
   */
  static async recordDownload(params: {
    projectId: string;
    userId: string;
    artifactId: string;
    ipHash?: string;
    userAgent?: string;
  }): Promise<ProjectExportDownloadRecord> {
    const { projectId, userId, artifactId, ipHash, userAgent } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const artifact = await this.exportRepo.findArtifactById(artifactId);
    if (!artifact || artifact.projectId !== projectId) {
      throw new Error("ARTIFACT_NOT_FOUND");
    }

    const downloadRecord: ProjectExportDownloadRecord = {
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      artifactId,
      projectId,
      userId,
      downloadedAt: new Date().toISOString(),
      ipHashOptional: ipHash,
      userAgentSummaryOptional: userAgent ? userAgent.substring(0, 100) : undefined,
    };

    return await this.exportRepo.saveDownload(downloadRecord);
  }

  private static sanitizeFilename(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_{2,}/g, "_");
  }
}
