export interface GenerateTextInput {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface GenerateTextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  durationMs: number;
}

export interface GenerateStructuredInput {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AnalyzeDocumentInput {
  documentContent: string;
  analysisInstructions: string;
  model?: string;
  temperature?: number;
}

export interface AnalyzeDocumentResult {
  summary: string;
  extractedFacts: Record<string, unknown>;
  keyFindings: string[];
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ReviewDocumentInput {
  documentContent: string;
  criteria?: Array<{
    name: string;
    description: string;
    maxScore: number;
  }>;
  model?: string;
}

export interface ReviewDocumentResult {
  totalScore: number;
  maxScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailedScores: Record<string, number>;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/**
 * Standard AI Provider Abstraction Interface
 */
export interface AIProvider {
  readonly name: "openai" | "gemini" | string;

  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;

  generateStructured<T>(
    input: GenerateStructuredInput,
    schema?: unknown
  ): Promise<T>;

  analyzeDocument(
    input: AnalyzeDocumentInput
  ): Promise<AnalyzeDocumentResult>;

  reviewDocument(
    input: ReviewDocumentInput
  ): Promise<ReviewDocumentResult>;
}
