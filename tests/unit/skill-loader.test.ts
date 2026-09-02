import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSkillCore,
  loadReference,
  listAvailableReferences,
  clearSkillCache,
} from "@/lib/skill/skill-loader";

describe("Skill Loader & Knowledge Base Access", () => {
  beforeEach(() => {
    clearSkillCache();
  });

  it("should successfully load core SKILL.md", async () => {
    const skillContent = await loadSkillCore();
    expect(skillContent).toContain("skkn-giai-phap-writer");
    expect(skillContent).toContain("GDPT 2018");
  });

  it("should successfully load a specific reference file by name", async () => {
    const mathRef = await loadReference("knowledge-math.md");
    expect(mathRef).toContain("DẠY HỌC MÔN TOÁN");
    expect(mathRef).toContain("GeoGebra");
  });

  it("should normalize reference names without .md extension", async () => {
    const assessmentRef = await loadReference("knowledge-assessment-evidence");
    expect(assessmentRef).toContain("XÂY DỰNG MINH CHỨNG");
  });

  it("should list all available reference files", async () => {
    const refs = await listAvailableReferences();
    expect(refs).toContain("knowledge-math.md");
    expect(refs).toContain("knowledge-assessment-evidence.md");
    expect(refs).toContain("moet-priorities-2026-2027.md");
    expect(refs).toContain("skkn-structure-standard.md");
  });

  it("should throw an error for non-existent reference files", async () => {
    await expect(loadReference("non-existent-module.md")).rejects.toThrow(
      "[SkillLoader] Reference file not found: non-existent-module.md"
    );
  });

  it("should prevent directory traversal attacks", async () => {
    await expect(loadReference("../../package.json")).rejects.toThrow(
      "[SkillLoader Security] Forbidden reference path traversal attempt"
    );
  });
});
