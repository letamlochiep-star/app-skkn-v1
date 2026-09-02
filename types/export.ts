export type ExportType = "DOCX" | "FULL_PDF" | "DEFENSE_PPTX" | "ONE_PAGE_PDF";

export type ExportMode = "DRAFT" | "FINAL";

export type ExportJobStatus =
  | "PENDING"
  | "GENERATING"
  | "VALIDATING"
  | "READY"
  | "FAILED"
  | "STALE"
  | "EXPIRED";

export interface DocumentFormatting {
  pageSize: "A4";
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  font: {
    family: string;
    size: number;
    lineSpacing: number;
  };
}

export interface CoverData {
  title: string;
  documentType: "SKKN" | "SOLUTION";
  schoolName: string;
  authorName: string;
  educationLevel: string;
  subjectGroup: string;
  gradeLevel?: string;
  schoolYear: string;
  location?: string;
  isDraft: boolean;
}

export interface ExportContentBlock {
  type: "PARAGRAPH" | "HEADING" | "TABLE" | "IMAGE" | "CAPTION" | "PAGE_BREAK" | "PLACEHOLDER";
  text?: string;
  level?: number;
  rows?: string[][];
  imageUrl?: string;
  caption?: string;
}

export interface ExportSection {
  id: string;
  order: number;
  level: number;
  title: string;
  contentBlocks: ExportContentBlock[];
}

export interface DocumentExportModel {
  metadata: {
    projectId: string;
    documentVersion: number;
    reviewVersion: number;
    generatedAt: string;
    mode: ExportMode;
  };
  cover: CoverData;
  sections: ExportSection[];
  references: string[];
  appendices: string[];
  formatting: DocumentFormatting;
  isDraft: boolean;
}

export interface PresentationExportModel {
  metadata: {
    projectId: string;
    defensePackageId: string;
    defenseVersion: number;
    documentVersion: number;
    durationMinutes: number;
    mode: ExportMode;
  };
  theme: string;
  slides: {
    slideNumber: number;
    title: string;
    subtitle?: string;
    keyPoints: string[];
    keyMessage: string;
    visualSuggestion?: string;
    speakerNotes?: string;
  }[];
  isDraft: boolean;
}

export interface ExportReadiness {
  allowed: boolean;
  status: "READY" | "READY_WITH_WARNINGS" | "BLOCKED";
  blockers: string[];
  warnings: string[];
  sourceVersions: {
    documentVersion?: number;
    reviewVersion?: number;
    defenseVersion?: number;
    dataVersion?: number;
    structureVersion?: number;
  };
}

export interface ExportTemplateRecord {
  id: string;
  code: string;
  name: string;
  artifactType: ExportType;
  status: "ACTIVE" | "INACTIVE" | "DEPRECATED";
  version: number;
  configurationJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectExportJobRecord {
  id: string;
  projectId: string;
  userId: string;
  exportType: ExportType;
  status: ExportJobStatus;
  requestId?: string | null;
  sourceDocumentId?: string | null;
  sourceDocumentVersion: number;
  sourceReviewId?: string | null;
  sourceReviewVersion: number;
  sourceDefensePackageId?: string | null;
  sourceDefenseVersion: number;
  templateId?: string | null;
  templateVersion: number;
  optionsJson: {
    mode?: ExportMode;
    includeCover?: boolean;
    includeToc?: boolean;
    includeEvidence?: boolean;
    includeReferences?: boolean;
    includeSpeakerNotes?: boolean;
    [key: string]: unknown;
  };
  fingerprint: string;
  errorCode?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ProjectExportArtifactRecord {
  id: string;
  exportJobId: string;
  projectId: string;
  artifactType: ExportType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  checksum: string;
  version: number;
  createdAt: string;
  expiresAt?: string | null;
}

export interface ProjectExportDownloadRecord {
  id: string;
  artifactId: string;
  projectId: string;
  userId: string;
  downloadedAt: string;
  ipHashOptional?: string | null;
  userAgentSummaryOptional?: string | null;
}
