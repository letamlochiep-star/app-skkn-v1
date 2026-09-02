import { describe, it, expect } from "vitest";
import {
  getSchema,
  hasSchema,
  listRegisteredSchemas,
} from "@/lib/schemas/registry";

describe("JSON Schema Registry", () => {
  it("should retrieve registered schemas by base name", () => {
    const sessionSchema = getSchema("skkn-session");
    expect(sessionSchema).toBeDefined();
    expect((sessionSchema as { title?: string }).title).toBe("SKKNSession");

    const aiTaskSchema = getSchema("ai-task");
    expect(aiTaskSchema).toBeDefined();
    expect((aiTaskSchema as { title?: string }).title).toBe("AITask");

    const stepResponseSchema = getSchema("step-response");
    expect(stepResponseSchema).toBeDefined();
    expect((stepResponseSchema as { title?: string }).title).toBe("StepResponse");
  });

  it("should normalize schema names with extension suffix", () => {
    const schemaWithSuffix = getSchema("skkn-session.schema.json");
    expect(schemaWithSuffix).toBeDefined();
    expect((schemaWithSuffix as { title?: string }).title).toBe("SKKNSession");
  });

  it("should verify schema existence using hasSchema", () => {
    expect(hasSchema("skkn-session")).toBe(true);
    expect(hasSchema("ai-task")).toBe(true);
    expect(hasSchema("step-response")).toBe(true);
    expect(hasSchema("non-existent-schema")).toBe(false);
  });

  it("should throw an informative error when schema is not found", () => {
    expect(() => getSchema("invalid-schema-name")).toThrow(
      "[SchemaRegistry] Schema 'invalid-schema-name' not found in registry"
    );
  });

  it("should list all registered schemas", () => {
    const list = listRegisteredSchemas();
    expect(list).toContain("skkn-session");
    expect(list).toContain("ai-task");
    expect(list).toContain("step-response");
  });
});
