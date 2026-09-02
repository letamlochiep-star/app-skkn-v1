import { loadSkillCore, loadReference } from "@/lib/skill/skill-loader";
import { selectKnowledgeModules, CURRENT_POLICY_METADATA } from "@/lib/knowledge/module-selector";
import { getSchema } from "@/lib/schemas/registry";
import type { KnowledgeModuleSelectionInput } from "@/types/knowledge";
import type { ProjectFact } from "@/types/project";
import type { AITaskType } from "@/lib/config/ai";

export interface AIContextBuilderInput {
  taskType: AITaskType;
  contextInput: KnowledgeModuleSelectionInput;
  projectFacts?: ProjectFact[];
  targetSchemaName?: string;
  userPrompt: string;
}

export interface BuiltAIContext {
  systemPrompt: string;
  userPrompt: string;
  loadedModuleNames: string[];
  targetSchema?: object;
}

/**
 * Foundation Context Builder: Assembles dynamic multi-tier pedagogical prompts
 * without exceeding context limits or hard-coding static prompt text.
 */
export async function buildAIContext(
  input: AIContextBuilderInput
): Promise<BuiltAIContext> {
  const parts: string[] = [];

  // 1. Core Skill Prompt
  const coreSkill = await loadSkillCore();
  parts.push("=== CORE PEDAGOGICAL INSTRUCTIONS ===");
  parts.push(coreSkill);

  // 2. Dynamic Knowledge Modules
  const selectedModules = selectKnowledgeModules(input.contextInput);
  const loadedModuleNames: string[] = [];

  if (selectedModules.length > 0) {
    parts.push("\n=== DOMAIN KNOWLEDGE MODULES ===");
    for (const mod of selectedModules) {
      try {
        const content = await loadReference(mod.fileName);
        parts.push(`--- MODULE: ${mod.fileName} ---`);
        parts.push(content);
        loadedModuleNames.push(mod.fileName);
      } catch (err) {
        console.warn(`[ContextBuilder] Failed to load module ${mod.fileName}: ${(err as Error).message}`);
      }
    }
  }

  // 3. Policy Snapshot Date Header
  parts.push(`\n=== POLICY SNAPSHOT METADATA ===`);
  parts.push(`Effective Date: ${CURRENT_POLICY_METADATA.policySnapshotDate}`);
  parts.push(`School Year: ${CURRENT_POLICY_METADATA.effectiveSchoolYear}`);
  parts.push(`Curriculum: ${CURRENT_POLICY_METADATA.framework}`);

  // 4. Verified Project Facts
  if (input.projectFacts && input.projectFacts.length > 0) {
    parts.push("\n=== VERIFIED PROJECT FACTS ===");
    for (const fact of input.projectFacts) {
      parts.push(`- [${fact.sourceType}] ${fact.key}: ${JSON.stringify(fact.valueJson)}`);
    }
  }

  // 5. Target Output Schema Instruction
  let targetSchema: object | undefined;
  if (input.targetSchemaName) {
    try {
      targetSchema = getSchema(input.targetSchemaName);
      parts.push("\n=== REQUIRED OUTPUT FORMAT ===");
      parts.push(`Your output MUST be strictly valid JSON conforming to the '${input.targetSchemaName}' schema.`);
    } catch {
      // Schema lookup failure will be caught by validator
    }
  }

  const systemPrompt = parts.join("\n\n");

  return {
    systemPrompt,
    userPrompt: input.userPrompt,
    loadedModuleNames,
    targetSchema,
  };
}
