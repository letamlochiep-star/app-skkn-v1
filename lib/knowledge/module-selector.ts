import type {
  KnowledgeModuleSelectionInput,
  SelectedKnowledgeModule,
  PolicyMetadata,
} from "@/types/knowledge";

/**
 * Policy Snapshot Metadata (Reflects current MOET directive version)
 */
export const CURRENT_POLICY_METADATA: PolicyMetadata = {
  policySnapshotDate: "2026-09-02",
  effectiveSchoolYear: "2026-2027",
  framework: "GDPT 2018",
};

/**
 * Maps task requirements, subject, educational level, and stage to the minimal, relevant subset of knowledge modules.
 * Ensures irrelevant documents are NEVER loaded into memory or AI context.
 */
export function selectKnowledgeModules(
  input: KnowledgeModuleSelectionInput
): SelectedKnowledgeModule[] {
  const modules: SelectedKnowledgeModule[] = [];
  const stage = input.workflowStage || "WRITE";

  // 1. Structural Standards: needed for structuring, drafting, and reviewing
  if (["IDEATE", "DRAFT", "REVIEW"].includes(input.taskType) || ["STRUCTURE", "WRITE", "REVIEW"].includes(stage)) {
    modules.push({
      id: "skkn-structure-standard",
      fileName: "skkn-structure-standard.md",
      relativePath: "references/skkn-structure-standard.md",
      category: "CORE",
      priority: 1,
    });
  }

  // 2. MOET Priorities 2026-2027: essential for orientation, innovation alignment, and final review
  if (["IDEATE", "DRAFT", "FINALIZE"].includes(input.taskType) || ["TOPIC", "WRITE"].includes(stage)) {
    modules.push({
      id: "moet-priorities-2026-2027",
      fileName: "moet-priorities-2026-2027.md",
      relativePath: "references/moet-priorities-2026-2027.md",
      category: "POLICY",
      priority: 2,
    });
  }

  // 3. Subject-Specific Reference: loaded strictly when subject matches
  switch (input.subjectGroup) {
    case "MATH":
      modules.push({
        id: "knowledge-math",
        fileName: "knowledge-math.md",
        relativePath: "references/knowledge-math.md",
        category: "SUBJECT",
        priority: 3,
      });
      break;
    case "LITERATURE":
      modules.push({
        id: "knowledge-literature",
        fileName: "knowledge-literature.md",
        relativePath: "references/knowledge-literature.md",
        category: "SUBJECT",
        priority: 3,
      });
      break;
    case "FOREIGN_LANGUAGES":
      modules.push({
        id: "knowledge-foreign-languages",
        fileName: "knowledge-foreign-languages.md",
        relativePath: "references/knowledge-foreign-languages.md",
        category: "SUBJECT",
        priority: 3,
      });
      break;
    case "NATURAL_SCIENCES":
      modules.push({
        id: "knowledge-natural-sciences",
        fileName: "knowledge-natural-sciences.md",
        relativePath: "references/knowledge-natural-sciences.md",
        category: "SUBJECT",
        priority: 3,
      });
      break;
    case "SOCIAL_SCIENCES":
      modules.push({
        id: "knowledge-social-sciences",
        fileName: "knowledge-social-sciences.md",
        relativePath: "references/knowledge-social-sciences.md",
        category: "SUBJECT",
        priority: 3,
      });
      break;
    default:
      break;
  }

  // 4. Level-Specific Pedagogical Knowledge
  if (input.educationLevel === "PRE_SCHOOL" || input.subjectGroup === "PRE_SCHOOL") {
    modules.push({
      id: "knowledge-preschool",
      fileName: "knowledge-preschool.md",
      relativePath: "references/knowledge-preschool.md",
      category: "PEDAGOGY",
      priority: 4,
    });
  } else if (input.educationLevel === "PRIMARY" || input.subjectGroup === "PRIMARY_GENERAL") {
    modules.push({
      id: "knowledge-primary",
      fileName: "knowledge-primary.md",
      relativePath: "references/knowledge-primary.md",
      category: "PEDAGOGY",
      priority: 4,
    });
  }

  // 5. Assessment & Evidence Standards: needed for extraction, reality analysis, and review
  if (["EXTRACT", "REVIEW", "FINALIZE"].includes(input.taskType) || ["DATA", "REVIEW"].includes(stage)) {
    modules.push({
      id: "knowledge-assessment-evidence",
      fileName: "knowledge-assessment-evidence.md",
      relativePath: "references/knowledge-assessment-evidence.md",
      category: "EVIDENCE",
      priority: 5,
    });
  }

  // 6. Digital / AI Innovation (if applicable to stage or task)
  if (input.taskType === "IDEATE" || stage === "TOPIC") {
    modules.push({
      id: "knowledge-digital-ai",
      fileName: "knowledge-digital-ai.md",
      relativePath: "references/knowledge-digital-ai.md",
      category: "INNOVATION",
      priority: 6,
    });
  }

  // Sort deterministically by priority
  return modules.sort((a, b) => a.priority - b.priority);
}

/**
 * Returns list of reference file names selected for given input.
 */
export function getSelectedModuleFileNames(input: KnowledgeModuleSelectionInput): string[] {
  return selectKnowledgeModules(input).map((m) => m.fileName);
}
