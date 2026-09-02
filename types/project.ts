export type DocumentType = "SKKN" | "SOLUTION";

export type WorkflowStage =
  | "TOPIC"
  | "DATA"
  | "STRUCTURE"
  | "WRITE"
  | "REVIEW"
  | "FINALIZE";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export const STAGE_PROGRESS_MAP: Record<WorkflowStage, number> = {
  TOPIC: 10,
  DATA: 30,
  STRUCTURE: 45,
  WRITE: 70,
  REVIEW: 90,
  FINALIZE: 100,
};

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  TOPIC: "Bước 1: Tên đề tài",
  DATA: "Bước 2: Dữ liệu thực tế",
  STRUCTURE: "Bước 3: Khung cấu trúc",
  WRITE: "Bước 4: Soạn thảo nội dung",
  REVIEW: "Bước 5: Rà soát & Đánh giá",
  FINALIZE: "Bước 6: Hoàn thiện & Xuất bản",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  SKKN: "Sáng kiến kinh nghiệm",
  SOLUTION: "Giải pháp hữu ích",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  ARCHIVED: "Đã lưu trữ",
};

export interface ProjectRecord {
  id: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  workingTitle: string;
  educationLevel: string;
  subjectGroup: string;
  gradeLevel?: string | null;
  schoolYear: string;
  schoolName?: string | null;
  workflowStage: WorkflowStage;
  status: ProjectStatus;
  topicLocked: boolean;
  structureLocked: boolean;
  progressPercent: number;
  lastOpenedAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFactRecord {
  id: string;
  projectId: string;
  key: string;
  valueJson: unknown;
  sourceType: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectFact = ProjectFactRecord;

export interface CreateProjectInput {
  documentType: DocumentType;
  workingTitle?: string;
  educationLevel: string;
  subjectGroup: string;
  gradeLevel?: string;
  schoolYear: string;
  schoolName?: string;
  problemStatement?: string;
  targetGroup?: string;
  initialGoal?: string;
  teacherNotes?: string;
}

export interface UpdateProjectInput {
  workingTitle?: string;
  educationLevel?: string;
  subjectGroup?: string;
  gradeLevel?: string;
  schoolYear?: string;
  schoolName?: string;
  problemStatement?: string;
  targetGroup?: string;
  initialGoal?: string;
  teacherNotes?: string;
}
