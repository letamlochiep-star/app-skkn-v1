const STORAGE_KEY = "skkn_installation_id";

/**
 * Generates or retrieves a persistent client installation ID (UUID v4).
 * This installation ID is non-sensitive and purely used as a seed for server-side device hashing.
 */
export function getOrCreateInstallationId(): string {
  if (typeof window === "undefined") {
    return "server-env-installation-id";
  }

  try {
    let installationId = localStorage.getItem(STORAGE_KEY);
    if (!installationId) {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        installationId = crypto.randomUUID();
      } else {
        installationId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      }
      localStorage.setItem(STORAGE_KEY, installationId);
    }
    return installationId;
  } catch {
    return "fallback-installation-id";
  }
}
