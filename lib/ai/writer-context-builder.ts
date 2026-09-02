import { ProjectRepository } from "@/server/repositories/project-repository";
import { StructureRepository } from "@/server/repositories/structure-repository";
import { PromptSetRepository } from "@/server/repositories/prompt-set-repository";
import { WriterRepository } from "@/server/repositories/writer-repository";
import type { ProjectSectionRecord } from "@/types/writer";
import type { StructureSection } from "@/types/structure";
import type { ProjectPrompt } from "@/types/prompt";

export class WriterContextBuilder {
  private static projectRepo = new ProjectRepository();
  private static structureRepo = new StructureRepository();
  private static promptRepo = new PromptSetRepository();
  private static writerRepo = new WriterRepository();

  /**
   * Builds selective context for a specific prompt number
   */
  static async buildWriterContext(params: {
    projectId: string;
    userId: string;
    promptNumber: number;
  }): Promise<{
    project: any;
    prompt: ProjectPrompt;
    lockedSections: StructureSection[];
    verifiedFacts: Record<string, unknown>;
    relevantPreviousSections: ProjectSectionRecord[];
    missingDataManifest: string[];
  }> {
    const { projectId, userId, promptNumber } = params;

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    const structure = await this.structureRepo.findCurrentByProject(projectId);
    if (!structure) throw new Error("STRUCTURE_NOT_FOUND");

    const promptSet = await this.promptRepo.findCurrentByProject(projectId);
    if (!promptSet || !promptSet.prompts) throw new Error("PROMPT_SET_NOT_FOUND");

    const prompt = promptSet.prompts.find((p) => p.promptNumber === promptNumber);
    if (!prompt) throw new Error(`PROMPT_NOT_FOUND: Không tìm thấy Prompt ${promptNumber}`);

    // Load verified facts
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

    // Selective previous sections
    const allSections = await this.writerRepo.findSectionsByProject(projectId);
    const relevantPreviousSections = allSections.filter((s) => {
      if (promptNumber === 18) {
        // Prompt 18 loads all available sections
        return s.promptNumber < 18 && s.content.trim().length > 0;
      }
      // Other prompts only load immediately preceding 2 sections or related section
      return s.promptNumber < promptNumber && s.promptNumber >= Math.max(1, promptNumber - 2);
    });

    // Detect missing fields relevant to this prompt
    const missingDataManifest: string[] = (prompt.missingDataKeys || []).filter(
      (k) => !verifiedFacts[k]
    );

    return {
      project,
      prompt,
      lockedSections: structure.structureJson,
      verifiedFacts,
      relevantPreviousSections,
      missingDataManifest,
    };
  }
}
