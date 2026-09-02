# WEBAPP CONTRACT SPECIFICATION — SKKN AI

## 1. GIAO THỨC DỮ LIỆU GIỮA FRONTEND VÀ BACKEND

Mọi giao tiếp API giữa Client và Server tuân theo JSON Contract chuẩn:

### 1.1 Response Format Chuẩn
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}
```

### 1.2 Session State Contract
- Định nghĩa trong `lib/schemas/skkn-session.schema.json` và `types/skkn-session.ts`.
- Chứa: `sessionId`, `projectId`, `userId`, `currentStep`, `status`, `contextData`, `metadata`.

### 1.3 AI Task Contract
- Định nghĩa trong `lib/schemas/ai-task.schema.json` và `types/ai-task.ts`.
- Chứa: `taskId`, `taskType`, `parameters`, `knowledgeModules`, `targetSchema`.

### 1.4 Step Response Contract
- Định nghĩa trong `lib/schemas/step-response.schema.json` và `types/step-response.ts`.
- Chứa: `stepId`, `status`, `result`, `validationErrors`, `suggestions`.
