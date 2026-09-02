import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIProvider,
  GenerateTextInput,
  GenerateTextResult,
  GenerateStructuredInput,
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  ReviewDocumentInput,
  ReviewDocumentResult,
} from "../types";

export class GeminiProvider implements AIProvider {
  public readonly name = "gemini" as const;
  private customApiKeys: string[] = [];
  private keyIndex: number = 0;

  constructor(apiKeys?: string[]) {
    if (apiKeys && apiKeys.length > 0) {
      this.customApiKeys = apiKeys.filter((k) => k.trim().startsWith("AIza"));
    }
  }

  public setApiKeys(apiKeys: string[]): void {
    this.customApiKeys = apiKeys.filter((k) => k.trim().startsWith("AIza"));
    this.keyIndex = 0;
  }

  /**
   * Lấy API key hiện tại và xoay vòng sang key tiếp theo
   */
  private getNextApiKey(): string {
    if (this.customApiKeys.length > 0) {
      const key = this.customApiKeys[this.keyIndex % this.customApiKeys.length];
      this.keyIndex = (this.keyIndex + 1) % this.customApiKeys.length;
      return key;
    }
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim().startsWith("AIza")) {
      return envKey.trim();
    }
    throw new Error("[GeminiProvider] Chưa cấu hình Gemini API Key. Thầy/Cô vui lòng nhập Google Gemini API Key để tiếp tục.");
  }

  private createClient(apiKey: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Thực thi lệnh với cơ chế tự động xoay vòng sang key tiếp theo nếu gặp lỗi Rate Limit (429/Quota)
   */
  private async executeWithKeyRotation<T>(operation: (client: GoogleGenerativeAI) => Promise<T>): Promise<T> {
    const totalKeys = Math.max(1, this.customApiKeys.length);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const apiKey = this.getNextApiKey();
      try {
        const client = this.createClient(apiKey);
        return await operation(client);
      } catch (err) {
        lastError = err as Error;
        const msg = lastError.message || "";
        // Nếu lỗi do hết quota hoặc rate limit và còn key khác thì thử tiếp
        if (this.customApiKeys.length > 1 && (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED"))) {
          console.warn(`[GeminiProvider] Key ${apiKey.substring(0, 8)}... bị giới hạn quota, chuyển sang key tiếp theo...`);
          continue;
        }
        throw lastError;
      }
    }
    throw lastError || new Error("[GeminiProvider] Tất cả Gemini API keys đều không phản hồi.");
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const startTime = Date.now();
    const modelName = input.model || "gemini-1.5-flash";

    return this.executeWithKeyRotation(async (client) => {
      const generativeModel = client.getGenerativeModel({
        model: modelName,
        systemInstruction: input.systemPrompt,
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens,
          stopSequences: input.stopSequences,
        },
      });

      const response = await generativeModel.generateContent(input.prompt);
      const text = response.response.text();

      return {
        text,
        inputTokens: 0,
        outputTokens: 0,
        model: modelName,
        durationMs: Date.now() - startTime,
      };
    });
  }

  async generateStructured<T>(
    input: GenerateStructuredInput,
    schema?: unknown
  ): Promise<T> {
    const modelName = input.model || "gemini-1.5-flash";

    return this.executeWithKeyRotation(async (client) => {
      const generativeModel = client.getGenerativeModel({
        model: modelName,
        systemInstruction: input.systemPrompt,
        generationConfig: {
          temperature: input.temperature ?? 0.2,
          maxOutputTokens: input.maxTokens,
          responseMimeType: "application/json",
        },
      });

      const response = await generativeModel.generateContent(input.prompt);
      const text = response.response.text();

      try {
        return JSON.parse(text) as T;
      } catch (err) {
        throw new Error(`[GeminiProvider] Failed to parse JSON response: ${(err as Error).message}`);
      }
    });
  }

  async analyzeDocument(
    input: AnalyzeDocumentInput
  ): Promise<AnalyzeDocumentResult> {
    const prompt = `Analyze this document and return JSON with { summary, extractedFacts, keyFindings }:\n\nINSTRUCTIONS:\n${input.analysisInstructions}\n\nDOCUMENT:\n${input.documentContent}`;
    
    const result = await this.generateStructured<{
      summary: string;
      extractedFacts: Record<string, unknown>;
      keyFindings: string[];
    }>({
      prompt,
      systemPrompt: "You are an expert pedagogical analyst.",
      model: input.model || "gemini-1.5-flash",
      temperature: input.temperature ?? 0.2,
    });

    return {
      summary: result.summary || "",
      extractedFacts: result.extractedFacts || {},
      keyFindings: result.keyFindings || [],
      inputTokens: 0,
      outputTokens: 0,
      model: input.model || "gemini-1.5-flash",
    };
  }

  async reviewDocument(
    input: ReviewDocumentInput
  ): Promise<ReviewDocumentResult> {
    const criteriaDescription = input.criteria
      ? JSON.stringify(input.criteria)
      : "Standard MOET 4-pillar evaluation criteria.";

    const prompt = `Review the SKKN report and return JSON with { totalScore, maxScore, strengths, weaknesses, suggestions, detailedScores }:\n\nCRITERIA:\n${criteriaDescription}\n\nDOCUMENT CONTENT:\n${input.documentContent}`;

    const result = await this.generateStructured<{
      totalScore: number;
      maxScore: number;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      detailedScores: Record<string, number>;
    }>({
      prompt,
      systemPrompt: "You are a senior MOET SKKN Scientific Council Reviewer.",
      model: input.model || "gemini-1.5-pro",
      temperature: 0.2,
    });

    return {
      totalScore: result.totalScore || 0,
      maxScore: result.maxScore || 100,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      suggestions: result.suggestions || [],
      detailedScores: result.detailedScores || {},
      inputTokens: 0,
      outputTokens: 0,
      model: input.model || "gemini-1.5-pro",
    };
  }
}