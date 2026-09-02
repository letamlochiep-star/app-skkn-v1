import fs from "fs/promises";
import path from "path";

// In-memory cache to avoid re-reading disk unnecessarily
const skillFileCache = new Map<string, string>();

/**
 * Returns the resolved base path to the skill knowledge directory
 */
export function getKnowledgeBasePath(): string {
  return path.resolve(process.cwd(), "knowledge", "skkn-giai-phap-writer");
}

/**
 * Loads the core SKILL.md file with caching.
 */
export function getSkillCoreSync(): string {
  const filePath = path.join(getKnowledgeBasePath(), "SKILL.md");
  if (skillFileCache.has("SKILL.md")) {
    return skillFileCache.get("SKILL.md")!;
  }
  return "";
}

/**
 * Asynchronously loads the core SKILL.md file.
 */
export async function loadSkillCore(): Promise<string> {
  const cacheKey = "SKILL.md";
  if (skillFileCache.has(cacheKey)) {
    return skillFileCache.get(cacheKey)!;
  }

  const filePath = path.join(getKnowledgeBasePath(), "SKILL.md");
  try {
    const content = await fs.readFile(filePath, "utf-8");
    skillFileCache.set(cacheKey, content);
    return content;
  } catch (err) {
    throw new Error(`[SkillLoader] Failed to load core SKILL.md at ${filePath}: ${(err as Error).message}`);
  }
}

/**
 * Asynchronously loads a specific reference file by name with path traversal protection.
 *
 * @param referenceName e.g., "knowledge-math.md" or "knowledge-math"
 */
export async function loadReference(referenceName: string): Promise<string> {
  const normalizedName = referenceName.endsWith(".md") ? referenceName : `${referenceName}.md`;
  const cacheKey = `ref:${normalizedName}`;

  if (skillFileCache.has(cacheKey)) {
    return skillFileCache.get(cacheKey)!;
  }

  const referencesDir = path.join(getKnowledgeBasePath(), "references");
  const targetPath = path.resolve(referencesDir, normalizedName);

  // Security check: ensure path traversal is prevented
  if (!targetPath.startsWith(referencesDir)) {
    throw new Error(`[SkillLoader Security] Forbidden reference path traversal attempt: ${referenceName}`);
  }

  try {
    const content = await fs.readFile(targetPath, "utf-8");
    skillFileCache.set(cacheKey, content);
    return content;
  } catch (err) {
    throw new Error(`[SkillLoader] Reference file not found: ${normalizedName} at ${targetPath}`);
  }
}

/**
 * Checks if a reference file exists securely.
 */
export async function referenceExists(referenceName: string): Promise<boolean> {
  const normalizedName = referenceName.endsWith(".md") ? referenceName : `${referenceName}.md`;
  const referencesDir = path.join(getKnowledgeBasePath(), "references");
  const targetPath = path.resolve(referencesDir, normalizedName);

  if (!targetPath.startsWith(referencesDir)) {
    return false;
  }

  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists all available reference file names.
 */
export async function listAvailableReferences(): Promise<string[]> {
  const referencesDir = path.join(getKnowledgeBasePath(), "references");
  try {
    const files = await fs.readdir(referencesDir);
    return files.filter((f) => f.endsWith(".md"));
  } catch (err) {
    throw new Error(`[SkillLoader] Unable to list references from ${referencesDir}: ${(err as Error).message}`);
  }
}

/**
 * Clears in-memory skill cache (useful during testing or hot updates).
 */
export function clearSkillCache(): void {
  skillFileCache.clear();
}
