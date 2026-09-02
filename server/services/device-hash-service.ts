import crypto from "crypto";

/**
 * Computes a secure SHA-256 hash of the client installation ID.
 * Avoids storing plaintext installation IDs and protects user privacy.
 */
export function hashInstallationId(installationId: string): string {
  if (!installationId || typeof installationId !== "string") {
    throw new Error("INVALID_INSTALLATION_ID: Installation ID must be a non-empty string");
  }

  return crypto
    .createHash("sha256")
    .update(`skkn_device_${installationId.trim()}`)
    .digest("hex");
}
