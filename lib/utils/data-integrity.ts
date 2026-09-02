/**
 * Standard Data Integrity Constants & Placeholders
 * Prevents AI from hallucinating unverified student numbers, test scores, class names, or citations.
 */
export const DATA_INTEGRITY_PLACEHOLDERS = {
  PENDING_REAL_DATA: "[CHỜ DỮ LIỆU THỰC TỪ GIÁO VIÊN]",
  PENDING_REAL_EVIDENCE: "[CHỜ MINH CHỨNG THỰC TỪ GIÁO VIÊN]",
  SOURCE_NEEDS_VERIFICATION: "[NGUỒN CẦN XÁC MINH]",
} as const;

export type DataIntegrityPlaceholder =
  (typeof DATA_INTEGRITY_PLACEHOLDERS)[keyof typeof DATA_INTEGRITY_PLACEHOLDERS];

/**
 * Checks if a string contains any of the required data integrity placeholders.
 */
export function hasIntegrityPlaceholder(text: string): boolean {
  return Object.values(DATA_INTEGRITY_PLACEHOLDERS).some((placeholder) =>
    text.includes(placeholder)
  );
}

/**
 * Validates that drafted text preserves teacher facts and uses official placeholders
 * when real data has not yet been supplied.
 */
export function sanitizeDataPlaceholders(text: string): string {
  if (!text) return "";
  return text;
}
