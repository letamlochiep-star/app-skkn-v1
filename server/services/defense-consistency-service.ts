import type { DefenseOutline, DefenseScript, DefenseSlide, DefenseDuration } from "@/types/defense";

export class DefenseConsistencyService {
  /**
   * Validates time budget for outline against duration
   */
  static validateOutlineTiming(outline: DefenseOutline, durationMinutes: DefenseDuration): { valid: boolean; error?: string } {
    const targetSeconds = durationMinutes * 60;
    const totalSeconds = outline.segments.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    const tolerance = 60; // 1 minute tolerance
    if (Math.abs(totalSeconds - targetSeconds) > tolerance) {
      return {
        valid: false,
        error: `OUTLINE_TIMING_MISMATCH: Tổng thời lượng dàn ý là ${totalSeconds}s, không khớp với thời lượng yêu cầu ${targetSeconds}s (dung sai ±${tolerance}s).`,
      };
    }

    return { valid: true };
  }

  /**
   * Checks numbers in generated text against verified facts
   */
  static checkNumericConsistency(text: string, verifiedFacts: Record<string, unknown>): { valid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];
    const knownText = JSON.stringify(verifiedFacts);

    const matches = text.match(/(\d{2,3})\s*(học sinh|em học sinh|hs|em|cán bộ|giáo viên)/gi);
    if (matches) {
      for (const m of matches) {
        const num = m.match(/\d+/)?.[0];
        if (num && !knownText.includes(num)) {
          conflicts.push(`Phát hiện số liệu tự sinh trong nội dung bảo vệ: '${m}'.`);
        }
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
    };
  }
}
