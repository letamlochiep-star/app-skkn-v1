import type { ProjectPrompt, PromptSetValidationResult } from "@/types/prompt";
import type { StructureSection } from "@/types/structure";
import { PROMPT_18_STANDARD_TEXT } from "@/lib/ai/prompts/prompt-set-builder";

export class PromptSetValidator {
  /**
   * Strictly validates a candidate 18-prompt set
   */
  static validatePromptSet(
    prompts: ProjectPrompt[],
    structureSections: StructureSection[] = [],
    verifiedFacts: Record<string, unknown> = {}
  ): PromptSetValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. EXACTLY 18 Prompts Check
    if (prompts.length !== 18) {
      errors.push(`Số lượng câu lệnh không đúng chuẩn: Yêu cầu ĐÚNG 18 câu lệnh (nhận được ${prompts.length}).`);
    }

    // 2. Numbering 1 to 18 Check
    const numbersSeen = new Set<number>();
    for (const p of prompts) {
      if (p.promptNumber < 1 || p.promptNumber > 18) {
        errors.push(`Số thứ tự câu lệnh không hợp lệ: ${p.promptNumber} (chỉ cho phép từ 1 đến 18).`);
      }
      if (numbersSeen.has(p.promptNumber)) {
        errors.push(`Trùng lặp số thứ tự câu lệnh: Prompt ${p.promptNumber}.`);
      }
      numbersSeen.add(p.promptNumber);
    }

    for (let i = 1; i <= 18; i++) {
      if (!numbersSeen.has(i)) {
        errors.push(`Thiếu câu lệnh số: Prompt ${i}.`);
      }
    }

    // 3. Prompt 18 Immutability & Content Check
    const prompt18 = prompts.find((p) => p.promptNumber === 18);
    if (prompt18) {
      if (!prompt18.immutable) {
        warnings.push("Câu lệnh số 18 phải được đánh dấu immutable=true.");
      }
      // Check keyword presence in Prompt 18
      const p18Text = prompt18.promptText.toLowerCase();
      if (!p18Text.includes("thực trạng") || !p18Text.includes("biện pháp") || !p18Text.includes("tài liệu tham khảo")) {
        warnings.push("Câu lệnh số 18 cần bám sát mẫu rà soát và liên kết toàn văn chuẩn.");
      }
    }

    // 4. Data Integrity Check (Detect fabricated stats in prompt texts)
    const allText = prompts.map((p) => p.promptText).join(" ");
    const fakeClassSizeRegex = /(\d{2,3})\s*(học sinh|em học sinh|hs)/gi;
    const matches = allText.match(fakeClassSizeRegex);
    if (matches) {
      const knownText = JSON.stringify(verifiedFacts);
      for (const m of matches) {
        const num = m.match(/\d+/)?.[0];
        if (num && !knownText.includes(num)) {
          errors.push(`Phát hiện số liệu sĩ số học sinh tự sinh trong câu lệnh: "${m}".`);
        }
      }
    }

    // 5. Structure Coverage Map
    const structureCoverage: Record<string, number[]> = {};
    structureSections.forEach((sec, idx) => {
      // Approximate mapping: section 1 -> prompt 1..3, etc.
      structureCoverage[sec.id] = [idx + 1];
    });

    return {
      valid: errors.length === 0,
      count: prompts.length,
      errors,
      warnings,
      structureCoverage,
    };
  }
}
