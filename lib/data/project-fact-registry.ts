import type {
  DataGroupKey,
  DataGroupMeta,
  FactDataType,
} from "@/types/data-collection";

export interface FactFieldDefinition {
  key: string;
  group: DataGroupKey;
  label: string;
  description: string;
  dataType: FactDataType;
  required: boolean;
  isDynamicRequired?: (facts: Record<string, unknown>, projectContext?: Record<string, unknown>) => boolean;
  options?: string[];
  validate?: (val: unknown) => { valid: boolean; error?: string };
}

export const DATA_GROUPS: DataGroupMeta[] = [
  {
    key: "GENERAL",
    title: "Thông tin chung",
    description: "Đơn vị công tác, cấp học, môn học, năm học và thời gian thực hiện",
    icon: "🏫",
    isBlocking: true,
  },
  {
    key: "TARGET_GROUP",
    title: "Đối tượng áp dụng",
    description: "Khối lớp, sĩ số học sinh thực nghiệm và lớp đối chứng (nếu có)",
    icon: "👥",
    isBlocking: true,
  },
  {
    key: "REALITY",
    title: "Thực trạng",
    description: "Khó khăn thực tế, biểu hiện cụ thể và hạn chế cần khắc phục",
    icon: "🔍",
    isBlocking: true,
  },
  {
    key: "CAUSES",
    title: "Nguyên nhân",
    description: "Nguyên nhân từ học sinh, phương pháp giảng dạy hoặc điều kiện cơ sở",
    icon: "💡",
    isBlocking: true,
  },
  {
    key: "GOALS",
    title: "Mục tiêu",
    description: "Phẩm chất, năng lực và kết quả học tập/quản lý kỳ vọng cải thiện",
    icon: "🎯",
    isBlocking: true,
  },
  {
    key: "SOLUTIONS",
    title: "Giải pháp / Biện pháp",
    description: "Các bước thực hiện, công cụ sư phạm, kỹ thuật dạy học áp dụng",
    icon: "🛠️",
    isBlocking: true,
  },
  {
    key: "EVIDENCE",
    title: "Minh chứng & Đánh giá",
    description: "Các nguồn minh chứng thực tế: bài kiểm tra, phiếu khảo sát, sản phẩm",
    icon: "📊",
    isBlocking: true,
  },
  {
    key: "LOCAL_RULES",
    title: "Quy định riêng của đơn vị",
    description: "Khung cấu trúc hoặc quy định định dạng đặc thù của trường/Sở GD&ĐT",
    icon: "📋",
    isBlocking: false,
  },
];

export const FACT_FIELD_DEFINITIONS: FactFieldDefinition[] = [
  // --- NHÓM A: THÔNG TIN CHUNG ---
  {
    key: "school_name",
    group: "GENERAL",
    label: "Tên trường / Đơn vị công tác",
    description: "Trường Tiểu học/THCS/THPT nơi thầy/cô đang công tác",
    dataType: "SHORT_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 3,
      error: "Tên trường phải từ 3 ký tự trở lên",
    }),
  },
  {
    key: "implementation_period",
    group: "GENERAL",
    label: "Thời gian triển khai thực tế",
    description: "Ví dụ: Từ tháng 09/2026 đến tháng 03/2027",
    dataType: "SHORT_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 3,
      error: "Vui lòng nhập khoảng thời gian thực hiện",
    }),
  },

  // --- NHÓM B: ĐỐI TƯỢNG ÁP DỤNG ---
  {
    key: "target_group",
    group: "TARGET_GROUP",
    label: "Nhóm đối tượng áp dụng",
    description: "Ví dụ: Học sinh lớp 8 tại trường",
    dataType: "SHORT_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 3,
      error: "Vui lòng nhập đối tượng áp dụng",
    }),
  },
  {
    key: "experimental_class",
    group: "TARGET_GROUP",
    label: "Lớp thực nghiệm / Nhóm áp dụng",
    description: "Ví dụ: Lớp 8A hoặc Nhóm học sinh CLB Toán",
    dataType: "SHORT_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 1,
      error: "Vui lòng nhập tên lớp hoặc nhóm thực nghiệm",
    }),
  },
  {
    key: "experimental_student_count",
    group: "TARGET_GROUP",
    label: "Sĩ số học sinh thực nghiệm",
    description: "Tổng số học sinh tham gia thực nghiệm (số nguyên dương)",
    dataType: "NUMBER",
    required: true,
    validate: (val) => {
      const num = Number(val);
      return {
        valid: !isNaN(num) && Number.isInteger(num) && num > 0,
        error: "Sĩ số phải là số nguyên dương lớn hơn 0",
      };
    },
  },
  {
    key: "has_comparison_group",
    group: "TARGET_GROUP",
    label: "Có lớp đối chứng không?",
    description: "Chọn Có nếu có lớp đối chứng để so sánh",
    dataType: "YES_NO",
    required: false,
  },
  {
    key: "comparison_class",
    group: "TARGET_GROUP",
    label: "Tên lớp đối chứng",
    description: "Ví dụ: Lớp 8B (chỉ bắt buộc nếu có nhóm đối chứng)",
    dataType: "SHORT_TEXT",
    required: false,
    isDynamicRequired: (facts) => facts["has_comparison_group"] === true || facts["has_comparison_group"] === "true",
  },
  {
    key: "comparison_student_count",
    group: "TARGET_GROUP",
    label: "Sĩ số lớp đối chứng",
    description: "Số học sinh lớp đối chứng",
    dataType: "NUMBER",
    required: false,
    isDynamicRequired: (facts) => facts["has_comparison_group"] === true || facts["has_comparison_group"] === "true",
    validate: (val) => {
      if (val === undefined || val === null || val === "") return { valid: true };
      const num = Number(val);
      return {
        valid: !isNaN(num) && Number.isInteger(num) && num >= 0,
        error: "Sĩ số lớp đối chứng phải là số nguyên dương",
      };
    },
  },

  // --- NHÓM C: THỰC TRẠNG ---
  {
    key: "current_problem",
    group: "REALITY",
    label: "Vấn đề / Khó khăn thực tế",
    description: "Thực trạng và khó khăn gặp phải trong công tác dạy học hoặc quản lý",
    dataType: "LONG_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 15,
      error: "Mô tả thực trạng phải từ 15 ký tự trở lên",
    }),
  },
  {
    key: "observable_manifestations",
    group: "REALITY",
    label: "Biểu hiện cụ thể của học sinh / nhà trường",
    description: "Các biểu hiện quan sát được qua thái độ, kết quả bài tập, hành vi",
    dataType: "LONG_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 10,
      error: "Vui lòng mô tả biểu hiện cụ thể (tối thiểu 10 ký tự)",
    }),
  },

  // --- NHÓM D: NGUYÊN NHÂN ---
  {
    key: "main_causes",
    group: "CAUSES",
    label: "Các nguyên nhân chủ yếu dẫn đến thực trạng",
    description: "Nguyên nhân từ phía học sinh, phương pháp, tài liệu hoặc cơ sở vật chất",
    dataType: "LONG_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 15,
      error: "Mô tả nguyên nhân phải từ 15 ký tự trở lên",
    }),
  },

  // --- NHÓM E: MỤC TIÊU ---
  {
    key: "target_goals",
    group: "GOALS",
    label: "Mục tiêu cụ thể cần cải thiện",
    description: "Kỳ vọng về năng lực, phẩm chất hoặc kết quả sau khi áp dụng giải pháp",
    dataType: "LONG_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 15,
      error: "Mô tả mục tiêu phải từ 15 ký tự trở lên",
    }),
  },

  // --- NHÓM F: GIẢI PHÁP / BIỆN PHÁP ---
  {
    key: "proposed_interventions",
    group: "SOLUTIONS",
    label: "Các biện pháp / giải pháp cụ thể dự kiến triển khai",
    description: "Tóm tắt các biện pháp sư phạm, quy trình các bước hoặc kỹ thuật sử dụng",
    dataType: "LONG_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 20,
      error: "Mô tả biện pháp phải từ 20 ký tự trở lên để đảm bảo tính khả thi",
    }),
  },

  // --- NHÓM G: MINH CHỨNG & ĐÁNH GIÁ ---
  {
    key: "evidence_types",
    group: "EVIDENCE",
    label: "Các loại minh chứng thu thập",
    description: "Ví dụ: Bài kiểm tra thường xuyên, phiếu khảo sát, sản phẩm học sinh",
    dataType: "LONG_TEXT",
    required: true,
    validate: (val) => ({
      valid: typeof val === "string" && val.trim().length >= 10,
      error: "Vui lòng nêu các loại minh chứng thu thập (tối thiểu 10 ký tự)",
    }),
  },
  {
    key: "evidence_status",
    group: "EVIDENCE",
    label: "Trạng thái minh chứng",
    description: "Tình trạng sẵn có của minh chứng",
    dataType: "STATUS",
    required: true,
    options: ["AVAILABLE", "COLLECTING", "MISSING", "NOT_APPLICABLE"],
  },

  // --- NHÓM H: QUY ĐỊNH RIÊNG CỦA ĐƠN VỊ ---
  {
    key: "has_no_local_requirements",
    group: "LOCAL_RULES",
    label: "Không có quy định riêng đặc thù",
    description: "Áp dụng theo khung chuẩn của Bộ Giáo dục & Đào tạo",
    dataType: "YES_NO",
    required: false,
  },
  {
    key: "local_guidelines",
    group: "LOCAL_RULES",
    label: "Ghi chú quy định riêng (nếu có)",
    description: "Ví dụ: Giới hạn số trang tối đa 25 trang, font Times New Roman cỡ 14",
    dataType: "LONG_TEXT",
    required: false,
  },
];

export class ProjectFactRegistry {
  static getField(key: string): FactFieldDefinition | undefined {
    return FACT_FIELD_DEFINITIONS.find((f) => f.key === key);
  }

  static getFieldsByGroup(group: DataGroupKey): FactFieldDefinition[] {
    return FACT_FIELD_DEFINITIONS.filter((f) => f.group === group);
  }

  static getRequiredFields(
    facts: Record<string, unknown> = {},
    projectContext?: Record<string, unknown>
  ): FactFieldDefinition[] {
    return FACT_FIELD_DEFINITIONS.filter((f) => {
      if (f.isDynamicRequired) {
        return f.isDynamicRequired(facts, projectContext);
      }
      return f.required;
    });
  }

  static validateFieldValue(key: string, value: unknown): { valid: boolean; error?: string } {
    const field = this.getField(key);
    if (!field) {
      return { valid: false, error: `Trường dữ liệu '${key}' không thuộc danh mục cho phép.` };
    }
    if (field.validate) {
      return field.validate(value);
    }
    return { valid: true };
  }
}
