export type StructureStatus = "DRAFT" | "PROPOSED" | "USER_EDITED" | "LOCKED" | "SUPERSEDED";

export type StructureSource = "AI_PROPOSED" | "UNIT_TEMPLATE" | "USER_CREATED" | "USER_EDITED";

export interface StructureSubsection {
  id: string;
  order: number;
  title: string;
  purpose?: string;
}

export interface StructureSection {
  id: string;
  order: number;
  title: string;
  purpose: string;
  required: boolean;
  subsections?: StructureSubsection[];
  requiredDataKeys?: string[];
  evidenceNeeds?: string[];
  estimatedLength?: string;
}

export interface StructureCoverage {
  topicCovered: boolean;
  problemCovered: boolean;
  solutionCovered: boolean;
  evidenceCovered: boolean;
  effectivenessCovered: boolean;
  referencesCovered: boolean;
}

export interface ProjectStructureRecord {
  id: string;
  projectId: string;
  version: number;
  status: StructureStatus;
  source: StructureSource;
  structureJson: StructureSection[];
  dataVersion: number;
  topicVersion: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string | null;
  lockedBy?: string | null;
}

export interface StructureValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  coverage: StructureCoverage;
}
