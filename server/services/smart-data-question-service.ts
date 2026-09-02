import { ProjectRepository } from "@/server/repositories/project-repository";
import { ProjectFactRegistry } from "@/lib/data/project-fact-registry";
import { ProjectSessionService } from "@/server/services/project-session-service";
import { DataQuestionPromptBuilder } from "@/lib/ai/prompts/data-question-prompt-builder";
import { buildAIContext } from "@/lib/ai/context-builder";
import { AIRouter } from "@/lib/ai/router";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";
import { requireQuota } from "@/server/guards/require-quota";
import { UsageService } from "@/server/services/usage-service";
import type { SmartQuestion } from "@/types/data-collection";

export class SmartDataQuestionService {
  private static repo = new ProjectRepository();

  /**
   * Generates the next batch of 3-5 smart data questions based on missing fields
   */
  static async generateNextQuestions(params: {
    projectId: string;
    userId: string;
    requestId?: string;
  }): Promise<{
    questions: SmartQuestion[];
    remainingRequired: string[];
  }> {
    const { projectId, userId, requestId } = params;

    const project = await this.repo.findById(projectId, userId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (!project.topicLocked) {
      throw new Error("TOPIC_NOT_LOCKED: Dự án cần hoàn thành và khóa tên đề tài ở Bước 1 trước khi thu thập dữ liệu");
    }

    const rawFacts = await this.repo.getFacts(projectId);
    const knownFacts: Record<string, unknown> = {
      educationLevel: project.educationLevel,
      subjectGroup: project.subjectGroup,
      gradeLevel: project.gradeLevel,
      schoolYear: project.schoolYear,
    };

    rawFacts.forEach((f) => {
      let val = f.valueJson;
      if (typeof val === "object" && val !== null && "text" in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>).text;
      }
      knownFacts[f.key] = val;
    });

    // Check which fields from registry are missing
    const requiredFields = ProjectFactRegistry.getRequiredFields(knownFacts, {
      documentType: project.documentType,
      educationLevel: project.educationLevel,
      subjectGroup: project.subjectGroup,
    });

    const missingRequired = requiredFields.filter((f) => {
      const val = knownFacts[f.key];
      return val === undefined || val === null || String(val).trim() === "";
    });

    if (missingRequired.length === 0) {
      return {
        questions: [],
        remainingRequired: [],
      };
    }

    // Determine if we can construct smart questions directly or need AI refinement
    const staticBatch = missingRequired.slice(0, 5);
    const questions: SmartQuestion[] = staticBatch.map((field) => ({
      id: `q_${field.key}`,
      fieldKey: field.key,
      group: field.group,
      question: `Thầy/Cô vui lòng cung cấp thông tin về: ${field.label}`,
      helpText: field.description,
      answerType: field.dataType,
      required: field.required,
      options: field.options,
    }));

    // If deep pedagogical fields (causes, interventions, evidence) are missing, we can optionally use AI for contextual questions
    const hasDeepFields = missingRequired.some((f) => ["CAUSES", "SOLUTIONS", "EVIDENCE"].includes(f.group));

    if (hasDeepFields && process.env.OPENAI_API_KEY) {
      try {
        await requireQuota({
          userId,
          feature: "AI_GENERATE",
          requestedAmount: 1,
          requestId,
        });

        const sessionRes = await ProjectSessionService.buildProjectSession(projectId, userId);
        if (sessionRes.valid) {
          const builtContext = await buildAIContext({
            taskType: "EXTRACT",
            contextInput: {
              subjectGroup: project.subjectGroup as any,
              educationLevel: project.educationLevel as any,
              taskType: "EXTRACT",
              workflowStage: "DATA",
              documentType: project.documentType,
            },
            targetSchemaName: "data-questions",
            userPrompt: `Tạo câu hỏi thích ứng cho ${project.title || project.workingTitle}`,
          });

          const { systemPrompt, userPrompt } = DataQuestionPromptBuilder.buildDataQuestionsPrompt({
            session: sessionRes.session,
            officialTitle: project.title || project.workingTitle,
            knownFacts,
            missingFields: staticBatch,
            skillInstructions: builtContext.systemPrompt,
          });

          const aiRes = await AIRouter.execute({
            taskType: "EXTRACT",
            systemPrompt,
            userPrompt,
            targetSchemaName: "data-questions",
            logicalRequestId: requestId,
          });

          const parsed = JSON.parse(aiRes.content);
          const validation = validateAgainstSchema("data-questions", parsed);
          if (validation.valid && parsed.questions && parsed.questions.length > 0) {
            await UsageService.recordUsage({
              userId,
              projectId,
              feature: "AI_GENERATE",
              usageType: "AI_REQUEST",
              quantity: 1,
              idempotencyKey: requestId,
            });

            return {
              questions: parsed.questions,
              remainingRequired: missingRequired.map((m) => m.key),
            };
          }
        }
      } catch {
        // Fall back to static questions safely
      }
    }

    return {
      questions,
      remainingRequired: missingRequired.map((m) => m.key),
    };
  }
}
