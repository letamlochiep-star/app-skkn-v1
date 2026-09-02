import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { getSchema } from "../schemas/registry";

// Initialize AJV with strict options and format support
const ajv = new Ajv({
  allErrors: true,
  strict: false, // Allows flexible schema definitions
  coerceTypes: false,
});
addFormats(ajv);

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult<T = unknown> {
  valid: boolean;
  errors: ValidationError[];
  data?: T;
}

/**
 * Validates a payload against a registered schema name or a direct schema object.
 *
 * @param schemaNameOrSchema Name of registered schema (e.g. 'skkn-session') or a schema JSON object
 * @param payload The data to validate
 * @returns ValidationResult with valid flag and structured errors
 */
export function validateAgainstSchema<T = unknown>(
  schemaNameOrSchema: string | object,
  payload: unknown
): ValidationResult<T> {
  try {
    const schema =
      typeof schemaNameOrSchema === "string"
        ? getSchema(schemaNameOrSchema)
        : schemaNameOrSchema;

    const validate = ajv.compile(schema);
    const valid = validate(payload);

    if (valid) {
      return {
        valid: true,
        errors: [],
        data: payload as T,
      };
    }

    const errors: ValidationError[] = (validate.errors || []).map((err: ErrorObject) => ({
      path: err.instancePath || "/",
      message: err.message || "Unknown validation error",
      keyword: err.keyword,
      params: err.params as Record<string, unknown>,
    }));

    return {
      valid: false,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: "/",
          message: error instanceof Error ? error.message : "Schema compilation failed",
        },
      ],
    };
  }
}
