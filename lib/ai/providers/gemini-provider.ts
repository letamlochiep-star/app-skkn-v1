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
  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("[GeminiProvider] Missing GEMINI_API_KEY environment variable");
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const startTime = Date.now();
    const client = this.getClient();
    const modelName = input.model || "gemini-1.5-flash";
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
  }

  async generateStructured<T>(
    input: GenerateStructuredInput,
    schema?: unknown
  ): Promise<T> {
    const client = this.getClient();
    const modelName = input.model || "gemini-1.5-flash";
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
