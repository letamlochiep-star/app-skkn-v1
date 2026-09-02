import { ProjectFactRegistry } from "@/lib/data/project-fact-registry";
import { DataConsistencyService } from "@/server/services/data-consistency-service";
import type { DataCompletenessSummary, DataCompletenessStatus } from "@/types/data-collection";

export class DataCompletenessService {
  /**
   * Evaluates the completeness of project facts against required definitions
   */
  static assessCompleteness(
    facts: Record<string, unknown>,
    projectContext?: Record<string, unknown>
  ): DataCompletenessSummary {
    const requiredFields = ProjectFactRegistry.getRequiredFields(facts, projectContext);
    const missingRequired: Array<{ key: string; label: string; group: any }> = [];
    const warnings: string[] = [];

    let requiredComplete = 0;

    for (const field of requiredFields) {
      const val = facts[field.key];
      const isPresent = val !== undefined && val !== null && String(val).trim() !== "";

      if (isPresent) {
        const valRes = ProjectFactRegistry.validateFieldValue(field.key, val);
        if (valRes.valid) {
          requiredComplete++;
        } else {
          missingRequired.push({
            key: field.key,
            label: field.label,
            group: field.group,
          });
          warnings.push(`Trường '${field.label}' chưa hợp lệ: ${valRes.error}`);
        }
      } else {
        missingRequired.push({
          key: field.key,
          label: field.label,
          group: field.group,
        });
      }
    }

    // Check conflicts
    const conflicts = DataConsistencyService.detectConflicts(facts);
    conflicts.forEach((c) => {
      warnings.push(c.message);
    });

    const hasBlockingConflicts = conflicts.some((c) => c.severity === "BLOCKING");

    let status: DataCompletenessStatus = "INCOMPLETE";

    if (missingRequired.length === 0 && !hasBlockingConflicts) {
      if (warnings.length > 0) {
        status = "MINIMUM_READY";
      } else {
        status = "READY_FOR_STRUCTURE";
      }
    } else if (requiredComplete >= Math.floor(requiredFields.length * 0.6)) {
      status = "MINIMUM_READY";
    }

    const optionalSuggestions: string[] = [];
    if (!facts["comparison_class"] && facts["has_comparison_group"] !== true) {
      optionalSuggestions.push("Thầy/Cô có thể bổ sung số liệu nhóm đối chứng nếu muốn tăng thêm sức thuyết phục cho đề tài.");
    }
    if (!facts["local_guidelines"]) {
      optionalSuggestions.push("Thầy/Cô có thể bổ sung quy định định dạng đặc thù của trường/Sở (nếu có).");
    }

    return {
      status,
      requiredTotal: requiredFields.length,
      requiredComplete,
      missingRequired,
      warnings,
      optionalSuggestions,
    };
  }
}
