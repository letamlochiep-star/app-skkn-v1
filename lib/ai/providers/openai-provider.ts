import OpenAI from "openai";
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

export class OpenAIProvider implements AIProvider {
  public readonly name = "openai" as const;
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("[OpenAIProvider] Missing OPENAI_API_KEY environment variable");
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const startTime = Date.now();
    const client = this.getClient();
    const model = input.model || process.env.AI_DRAFT_MODEL || "gpt-4o";

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (input.systemPrompt) {
      messages.push({ role: "system", content: input.systemPrompt });
    }
    messages.push({ role: "user", content: input.prompt });

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens,
      stop: input.stopSequences,
    });

    const text = completion.choices[0]?.message?.content || "";
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    return {
      text,
      inputTokens,
      outputTokens,
      model,
      durationMs: Date.now() - startTime,
    };
  }

  async generateStructured<T>(
    input: GenerateStructuredInput,
    schema?: unknown
  ): Promise<T> {
    const client = this.getClient();
    const model = input.model || process.env.AI_DRAFT_MODEL || "gpt-4o";

    const systemPrompt =
      (input.systemPrompt ? `${input.systemPrompt}\n` : "") +
      "You must respond ONLY with valid JSON matching the required schema. Do not include markdown code block formatting like ```json or any preamble.";

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.prompt },
    ];

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    try {
      return JSON.parse(content) as T;
    } catch (err) {
      throw new Error(`[OpenAIProvider] Failed to parse JSON response: ${(err as Error).message}`);
    }
  }

  async analyzeDocument(
    input: AnalyzeDocumentInput
  ): Promise<AnalyzeDocumentResult> {
    const prompt = `Analyze the following pedagogical document and extract key facts according to the instructions:\n\nINSTRUCTIONS:\n${input.analysisInstructions}\n\nDOCUMENT:\n${input.documentContent}`;
    
    const result = await this.generateStructured<{
      summary: string;
      extractedFacts: Record<string, unknown>;
      keyFindings: string[];
    }>({
      prompt,
      systemPrompt: "You are an expert pedagogical analyst.",
      model: input.model || process.env.AI_EXTRACT_MODEL || "gpt-4o-mini",
      temperature: input.temperature ?? 0.2,
    });

    return {
      summary: result.summary || "",
      extractedFacts: result.extractedFacts || {},
      keyFindings: result.keyFindings || [],
      inputTokens: 0,
      outputTokens: 0,
      model: input.model || "gpt-4o-mini",
    };
  }

  async reviewDocument(
    input: ReviewDocumentInput
  ): Promise<ReviewDocumentResult> {
    const criteriaDescription = input.criteria
      ? JSON.stringify(input.criteria, null, 2)
      : "Standard MOET 4-pillar evaluation criteria.";

    const prompt = `Review the following SKKN report against criteria:\n\nCRITERIA:\n${criteriaDescription}\n\nDOCUMENT CONTENT:\n${input.documentContent}`;

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
      model: input.model || process.env.AI_REVIEW_MODEL || "gpt-4o",
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
      model: input.model || "gpt-4o",
    };
  }
}
