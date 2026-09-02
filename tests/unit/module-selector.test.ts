import { describe, it, expect } from "vitest";
import {
  selectKnowledgeModules,
  getSelectedModuleFileNames,
} from "@/lib/knowledge/module-selector";

describe("Knowledge Module Selector", () => {
  it("should select math-specific module when subjectGroup is MATH", () => {
    const modules = selectKnowledgeModules({
      subjectGroup: "MATH",
      educationLevel: "SECONDARY",
      taskType: "DRAFT",
      workflowStage: "WRITE",
    });

    const fileNames = modules.map((m) => m.fileName);
    expect(fileNames).toContain("knowledge-math.md");
    expect(fileNames).toContain("skkn-structure-standard.md");
    expect(fileNames).toContain("moet-priorities-2026-2027.md");
  });

  it("should NOT select math module for LITERATURE subject", () => {
    const modules = selectKnowledgeModules({
      subjectGroup: "LITERATURE",
      educationLevel: "HIGH_SCHOOL",
      taskType: "DRAFT",
    });

    const fileNames = modules.map((m) => m.fileName);
    expect(fileNames).not.toContain("knowledge-math.md");
    expect(fileNames).toContain("skkn-structure-standard.md");
  });

  it("should select assessment and evidence module for REVIEW tasks", () => {
    const fileNames = getSelectedModuleFileNames({
      subjectGroup: "NATURAL_SCIENCES",
      educationLevel: "SECONDARY",
      taskType: "REVIEW",
      workflowStage: "REVIEW",
    });

    expect(fileNames).toContain("knowledge-assessment-evidence.md");
    expect(fileNames).toContain("skkn-structure-standard.md");
    expect(fileNames).not.toContain("knowledge-math.md");
  });

  it("should select assessment evidence module for EXTRACT task", () => {
    const fileNames = getSelectedModuleFileNames({
      subjectGroup: "PRIMARY_GENERAL",
      educationLevel: "PRIMARY",
      taskType: "EXTRACT",
    });

    expect(fileNames).toContain("knowledge-assessment-evidence.md");
  });
});
