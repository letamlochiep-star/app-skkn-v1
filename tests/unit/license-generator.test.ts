import { describe, it, expect } from "vitest";
import {
  generateLicenseKey,
  hashLicenseKey,
  normalizeLicenseKey,
} from "@/server/services/license-generator";

describe("License Key Generator & Cryptographic Hashing", () => {
  it("should generate license key matching format SKKN-XXXX-XXXX-XXXX-XXXX", () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^SKKN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(key).toHaveLength(24);
  });

  it("should produce unique keys on multiple generations", () => {
    const key1 = generateLicenseKey();
    const key2 = generateLicenseKey();
    expect(key1).not.toBe(key2);
  });

  it("should compute deterministic SHA-256 hash for identical keys", () => {
    const key = "SKKN-A7K9-M2PX-Q41D-R8TZ";
    const hash1 = hashLicenseKey(key);
    const hash2 = hashLicenseKey(key.toLowerCase()); // Case-insensitive normalized hash

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it("should throw error when hashing an empty key", () => {
    expect(() => hashLicenseKey("")).toThrow("INVALID_LICENSE_KEY");
  });
});
