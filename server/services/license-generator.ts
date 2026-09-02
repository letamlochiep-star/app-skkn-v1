import crypto from "crypto";

// Unambiguous alphanumeric characters (excluding 0, O, 1, I to avoid teacher reading mistakes)
const LICENSE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a cryptographically random license key in format SKKN-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments: string[] = ["SKKN"];

  for (let s = 0; s < 4; s++) {
    let segment = "";
    const randomBytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      const charIndex = randomBytes[i] % LICENSE_CHARSET.length;
      segment += LICENSE_CHARSET[charIndex];
    }
    segments.push(segment);
  }

  return segments.join("-");
}

/**
 * Normalizes a license key string (uppercase, trims whitespace)
 */
export function normalizeLicenseKey(key: string): string {
  return key ? key.trim().toUpperCase() : "";
}

/**
 * Computes a secure SHA-256 hash of a normalized license key
 */
export function hashLicenseKey(key: string): string {
  const normalized = normalizeLicenseKey(key);
  if (!normalized) {
    throw new Error("INVALID_LICENSE_KEY: Key must not be empty");
  }

  return crypto
    .createHash("sha256")
    .update(`skkn_license_${normalized}`)
    .digest("hex");
}
