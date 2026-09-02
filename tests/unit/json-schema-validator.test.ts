import { describe, it, expect } from "vitest";
import { validateAgainstSchema } from "@/lib/validation/json-schema-validator";

import validSession from "../fixtures/valid-session.json";
import invalidSession from "../fixtures/invalid-session.json";
import validAiTask from "../fixtures/valid-ai-task.json";
import invalidAiTask from "../fixtures/invalid-ai-task.json";
import validStepResponse from "../fixtures/valid-step-response.json";
import invalidStepResponse from "../fixtures/invalid-step-response.json";

describe("JSON Schema Validator (Ajv Guardrails)", () => {
  describe("SKKN Session Schema Validation", () => {
    it("should accept valid session payload", () => {
      const result = validateAgainstSchema("skkn-session", validSession);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    it("should reject invalid session payload with structural errors", () => {
      const result = validateAgainstSchema("skkn-session", invalidSession);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("AI Task Schema Validation", () => {
    it("should accept valid AI task payload", () => {
      const result = validateAgainstSchema("ai-task", validAiTask);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid AI task payload", () => {
      const result = validateAgainstSchema("ai-task", invalidAiTask);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Step Response Schema Validation", () => {
    it("should accept valid step response payload", () => {
      const result = validateAgainstSchema("step-response", validStepResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid step response payload", () => {
      const result = validateAgainstSchema("step-response", invalidStepResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Custom Schema Validation", () => {
    it("should validate against dynamic schema object", () => {
      const customSchema = {
        type: "object",
        required: ["name", "score"],
        properties: {
          name: { type: "string" },
          score: { type: "number", minimum: 0, maximum: 100 },
        },
      };

      const validPayload = { name: "Test User", score: 95 };
      const invalidPayload = { name: "Test User", score: 150 };

      expect(validateAgainstSchema(customSchema, validPayload).valid).toBe(true);
      expect(validateAgainstSchema(customSchema, invalidPayload).valid).toBe(false);
    });
  });
});
