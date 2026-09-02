import type { DataConflict } from "@/types/data-collection";

export class DataConsistencyService {
  /**
   * Evaluates facts to detect conflicts, contradictory student numbers, or data inconsistencies
   */
  static detectConflicts(facts: Record<string, unknown>): DataConflict[] {
    const conflicts: DataConflict[] = [];

    // 1. Check experimental student count vs text mentions in descriptions
    const expCountVal = facts["experimental_student_count"];
    if (expCountVal !== undefined && expCountVal !== null && expCountVal !== "") {
      const expCount = Number(expCountVal);
      if (!isNaN(expCount)) {
        // Look through long text fields
        const textFields = ["current_problem", "observable_manifestations", "proposed_interventions"];
        for (const fKey of textFields) {
          const text = facts[fKey];
          if (typeof text === "string") {
            const matches = text.match(/(\d{2,3})\s*(học sinh|em học sinh|hs|em)/gi);
            if (matches) {
              for (const m of matches) {
                const foundNum = Number(m.match(/\d+/)?.[0]);
                if (foundNum && foundNum !== expCount && Math.abs(foundNum - expCount) > 1) {
                  conflicts.push({
                    type: "COUNT_MISMATCH",
                    fieldKeys: ["experimental_student_count", fKey],
                    message: `Phát hiện mâu thuẫn sĩ số: Trường 'Sĩ số thực nghiệm' là ${expCount}, nhưng nội dung '${fKey}' nhắc tới '${m}'.`,
                    severity: "WARNING",
                  });
                }
              }
            }
          }
        }
      }
    }

    // 2. Check comparison group consistency
    const hasComp = facts["has_comparison_group"];
    const compClass = facts["comparison_class"];
    const compCount = facts["comparison_student_count"];

    if ((hasComp === true || hasComp === "true") && (!compClass || !compCount || Number(compCount) <= 0)) {
      conflicts.push({
        type: "TEXT_CONTRADICTION",
        fieldKeys: ["has_comparison_group", "comparison_class", "comparison_student_count"],
        message: "Thầy/Cô đã chọn có lớp đối chứng nhưng chưa cung cấp đầy đủ tên lớp hoặc sĩ số đối chứng.",
        severity: "BLOCKING",
      });
    }

    return conflicts;
  }
}
