import { describe, it, expect } from "vitest";
import { selectKnowledgeModules } from "@/lib/knowledge/module-selector";

describe("Subject & Education Level Knowledge Module Adaptation (Phase 5)", () => {
  it("should select Math module for MATH subject and not load Literature", () => {
    const modules = selectKnowledgeModules({
      subjectGroup: "MATH",
      educationLevel: "SECONDARY",
      taskType: "IDEATE",
      workflowStage: "TOPIC",
      documentType: "SKKN",
    });

    const fileNames = modules.map((m) => m.fileName);
    expect(fileNames).toContain("knowledge-math.md");
    expect(fileNames).not.toContain("knowledge-literature.md");
    expect(fileNames).not.toContain("knowledge-foreign-languages.md");
  });

  it("should select Primary module for PRIMARY education level", () => {
    const modules = selectKnowledgeModules({
      subjectGroup: "PRIMARY_GENERAL",
      educationLevel: "PRIMARY",
      taskType: "IDEATE",
      workflowStage: "TOPIC",
      documentType: "SKKN",
    });

    const fileNames = modules.map((m) => m.fileName);
    expect(fileNames).toContain("knowledge-primary.md");
    expect(fileNames).not.toContain("knowledge-preschool.md");
  });
});
