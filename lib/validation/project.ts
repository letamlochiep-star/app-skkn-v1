import { z } from "zod";

export const CreateProjectSchema = z.object({
  requestId: z.string().optional(),
  documentType: z.enum(["SKKN", "SOLUTION"], {
    errorMap: () => ({ message: "Loại tài liệu phải là 'SKKN' hoặc 'SOLUTION'" }),
  }),
  workingTitle: z.string().max(300, "Tên dự án không được vượt quá 300 ký tự").optional().default(""),
  educationLevel: z.string().min(1, "Vui lòng chọn cấp học"),
  subjectGroup: z.string().min(1, "Vui lòng chọn môn hoặc nhóm chuyên môn"),
  gradeLevel: z.string().max(50).optional(),
  schoolYear: z.string().min(1, "Vui lòng chọn năm học"),
  schoolName: z.string().max(200, "Tên trường không được vượt quá 200 ký tự").optional(),
  problemStatement: z.string().max(3000, "Mô tả vấn đề không được vượt quá 3000 ký tự").optional(),
  targetGroup: z.string().max(1000, "Đối tượng áp dụng không được vượt quá 1000 ký tự").optional(),
  initialGoal: z.string().max(2000, "Mục tiêu ban đầu không được vượt quá 2000 ký tự").optional(),
  teacherNotes: z.string().max(2000).optional(),
});

export const UpdateProjectSchema = z.object({
  workingTitle: z.string().max(300).optional(),
  educationLevel: z.string().optional(),
  subjectGroup: z.string().optional(),
  gradeLevel: z.string().max(50).optional(),
  schoolYear: z.string().optional(),
  schoolName: z.string().max(200).optional(),
  problemStatement: z.string().max(3000).optional(),
  targetGroup: z.string().max(1000).optional(),
  initialGoal: z.string().max(2000).optional(),
  teacherNotes: z.string().max(2000).optional(),
});

export type CreateProjectPayload = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectPayload = z.infer<typeof UpdateProjectSchema>;
