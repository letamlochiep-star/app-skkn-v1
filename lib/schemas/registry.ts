import skknSessionSchema from "./skkn-session.schema.json";
import aiTaskSchema from "./ai-task.schema.json";
import stepResponseSchema from "./step-response.schema.json";
import topicAnalysisSchema from "./ai/topic-analysis.schema.json";
import topicSuggestionsSchema from "./ai/topic-suggestions.schema.json";
import dataQuestionsSchema from "./ai/data-questions.schema.json";
import projectStructureSchema from "./ai/project-structure.schema.json";
import eighteenPromptSetSchema from "./ai/18-prompt-set.schema.json";
import writerSectionSchema from "./ai/writer-section.schema.json";
import fullReviewSchema from "./ai/full-review.schema.json";
import reviewRevisionSchema from "./ai/review-revision.schema.json";
import defenseOutlineSchema from "./ai/defense-outline.schema.json";
import defenseScriptSchema from "./ai/defense-script.schema.json";
import defenseSlidesSchema from "./ai/defense-slides.schema.json";
import defenseSpeakerNotesSchema from "./ai/defense-speaker-notes.schema.json";
import defenseJuryQuestionsSchema from "./ai/defense-jury-questions.schema.json";
import defenseAnswerFrameworksSchema from "./ai/defense-answer-frameworks.schema.json";
import defenseOnePageSummarySchema from "./ai/defense-one-page-summary.schema.json";
import defenseAnswerEvaluationSchema from "./ai/defense-answer-evaluation.schema.json";

export type SchemaName =
  | "skkn-session"
  | "ai-task"
  | "step-response"
  | "topic-analysis"
  | "topic-suggestions"
  | "data-questions"
  | "project-structure"
  | "18-prompt-set"
  | "writer-section"
  | "full-review"
  | "review-revision"
  | "defense-outline"
  | "defense-script"
  | "defense-slides"
  | "defense-speaker-notes"
  | "defense-jury-questions"
  | "defense-answer-frameworks"
  | "defense-one-page-summary"
  | "defense-answer-evaluation"
  | string;

const schemaMap: Record<string, object> = {
  "skkn-session": skknSessionSchema,
  "ai-task": aiTaskSchema,
  "step-response": stepResponseSchema,
  "topic-analysis": topicAnalysisSchema,
  "topic-suggestions": topicSuggestionsSchema,
  "data-questions": dataQuestionsSchema,
  "project-structure": projectStructureSchema,
  "18-prompt-set": eighteenPromptSetSchema,
  "writer-section": writerSectionSchema,
  "full-review": fullReviewSchema,
  "review-revision": reviewRevisionSchema,
  "defense-outline": defenseOutlineSchema,
  "defense-script": defenseScriptSchema,
  "defense-slides": defenseSlidesSchema,
  "defense-speaker-notes": defenseSpeakerNotesSchema,
  "defense-jury-questions": defenseJuryQuestionsSchema,
  "defense-answer-frameworks": defenseAnswerFrameworksSchema,
  "defense-one-page-summary": defenseOnePageSummarySchema,
  "defense-answer-evaluation": defenseAnswerEvaluationSchema,
};

/**
 * Retrieves a registered JSON schema by name.
 * Throws if the schema is not found.
 */
export function getSchema(name: SchemaName): object {
  const normalizedName = name.replace(/\.schema\.json$/, "").replace(/\.json$/, "");
  const schema = schemaMap[normalizedName];

  if (!schema) {
    throw new Error(`[SchemaRegistry] Schema '${name}' not found in registry. Available: ${Object.keys(schemaMap).join(", ")}`);
  }

  return schema;
}

/**
 * Checks if a schema is registered.
 */
export function hasSchema(name: string): boolean {
  const normalizedName = name.replace(/\.schema\.json$/, "").replace(/\.json$/, "");
  return normalizedName in schemaMap;
}

/**
 * Lists all registered schema names.
 */
export function listRegisteredSchemas(): string[] {
  return Object.keys(schemaMap);
}
