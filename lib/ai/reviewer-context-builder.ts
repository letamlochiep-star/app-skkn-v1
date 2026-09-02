import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import { DocumentAssemblyService } from "@/server/services/document-assembly-service";
import type { ProjectDocumentDraftRecord, ConsistencyCheckResult } from "@/types/writer";
import type { StructureSection } from "@/types/structure";

export class ReviewerContextBuilder {
  private static projectRepo = new ProjectRepository();
  private static structureRepo = new StructureRepository();
  private static writerRepo = new WriterRepository();

  /**
   * Builds context for full document AI Review
   */
  static async buildReviewerContext(params: {
    projectId: string;
    userId: string;
  }): Promise<{
    project: any;
    draft: ProjectDocumentDraftRecord;
    consistency: ConsistencyCheckResult;
    lockedSections: StructureSection[];
    verifiedFacts: Record<string, unknown>;
  }> {
    const { projectId, userId } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    let draft = await this.writerRepo.findDocumentDraft(projectId);
    if (!draft || !draft.plainText || draft.plainText.trim().length === 0) {
      draft = await DocumentAssemblyService.assembleDraftDocument({ projectId, userId });
    }

    const consistency = await DocumentAssemblyService.checkDraftConsistency({ projectId, userId });

    const structure = await this.structureRepo.findCurrentByProject(projectId);
    const lockedSections = structure?.structureJson || [];

    const rawFacts = await this.projectRepo.getFacts(projectId);
    const verifiedFacts: Record<string, unknown> = {
      school_name: project.schoolName,
      education_level: project.educationLevel,
      subject_group: project.subjectGroup,
      grade_level: project.gradeLevel,
      school_year: project.schoolYear,
    };

    rawFacts.forEach((f) => {
      if (f.verified) {
        verifiedFacts[f.key] = f.valueJson;
      }
    });

    return {
      project,
      draft,
      consistency,
      lockedSections,
      verifiedFacts,
    };
  }
}
