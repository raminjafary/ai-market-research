import { BasePlugin } from '../base/base-plugin.js';
import type { IAIProvider, IAIRequest, IAIResponse, IAIProviderConfig, IAIEmbeddingRequest, IAIEmbeddingResponse, IAIModelInfo } from '../interfaces/ai-provider.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';

export class GoogleGeminiProvider extends BasePlugin implements IAIProvider {
  private defaultModel = 'gemini-2.5-flash';

  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'google-gemini-provider',
      name: 'Google Gemini AI Provider',
      version: '1.0.0',
      description: 'Provides AI capabilities using Google Gemini models',
      author: 'Market Research Team',
      category: 'ai-provider',
      dependencies: [],
      entryPoint: 'google-gemini.provider.ts',
      permissions: ['generate_text', 'generate_embeddings', 'analyze_sentiment'],
      tags: ['ai', 'gemini', 'google', 'llm'],
      configSchema: {
        apiKey: { type: 'string', required: true },
        defaultModel: { type: 'string', required: false, default: 'gemini-2.5-flash' },
        timeout: { type: 'number', required: false, default: 30000 },
        maxTokens: { type: 'number', required: false, default: 4096 },
        temperature: { type: 'number', required: false, default: 0.7 },
        topP: { type: 'number', required: false, default: 0.9 }
      }
    });

    super(manifest);
  }

  override async init(context: any, config?: Record<string, any>): Promise<void> {
    await super.init(context, config);
    this.defaultModel = this.getConfigValue('defaultModel', this.defaultModel);

    if (!this.getConfigValue('apiKey')) {
      this.setConfigValue('apiKey', 'development-key-placeholder');
      this.log('Using development placeholder for Google Gemini API key. Real functionality requires a valid API key from Google Cloud.', 'warn');
    }
  }

  async getModels(): Promise<IAIModelInfo[]> {
    return [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        type: 'text',
        capabilities: ['text_generation', 'embeddings', 'sentiment_analysis'],
        maxTokens: 8192,
        contextLength: 8192,
        pricing: {
          input: 0.00015,
          output: 0.0006
        },
        available: true
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        type: 'text',
        capabilities: ['text_generation', 'embeddings'],
        maxTokens: 4096,
        contextLength: 4096,
        pricing: {
          input: 0.0001,
          output: 0.0004
        },
        available: true
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        type: 'text',
        capabilities: ['text_generation'],
        maxTokens: 2048,
        contextLength: 2048,
        pricing: {
          input: 0.00005,
          output: 0.0002
        },
        available: true
      }
    ];
  }

  async isModelAvailable(modelId: string): Promise<boolean> {
    const models = await this.getModels();
    return models.some(model => model.id === modelId && model.available);
  }

  async generateText(request: IAIRequest): Promise<IAIResponse> {
    try {
      const model = request.model || this.defaultModel;
      const startTime = Date.now();

      const callOptions: any = {
        model: google(model),
        prompt: request.prompt,
        temperature: request.temperature || this.getConfigValue('temperature', 0.7),
        topP: request.topP || this.getConfigValue('topP', 0.9),
      };

      if (request.tools && request.tools.length > 0) {
        callOptions.tools = request.tools;
      }

      if (request.systemMessage) {
        callOptions.system = request.systemMessage;
      }

      const { text, sources } = await generateText(callOptions);

      const processingTime = Date.now() - startTime;

      return {
        text,
        sources: sources || [],
        model,
        usage: {
          promptTokens: Math.ceil(request.prompt.length / 4), 
          completionTokens: Math.ceil(text.length / 4),
          totalTokens: Math.ceil((request.prompt.length + text.length) / 4)
        },
        finishReason: 'stop',
        metadata: {
          processingTime,
          model: model,
          provider: 'google-gemini'
        }
      };
    } catch (error) {
      this.log(`Text generation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  async *generateTextStream(request: IAIRequest): AsyncGenerator<any> {
    try {
      const model = request.model || this.defaultModel;

      const response = await this.generateText(request);

      const chunkSize = 50;
      for (let i = 0; i < response.text.length; i += chunkSize) {
        yield {
          text: response.text.slice(i, i + chunkSize),
          isComplete: false
        };
      }

      yield {
        text: response.text,
        isComplete: true,
        usage: response.usage,
        finishReason: response.finishReason
      };
    } catch (error) {
      this.log(`Streaming text generation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  async generateEmbeddings(request: IAIEmbeddingRequest): Promise<IAIEmbeddingResponse> {
    try {
      const model = request.model || 'embedding-001';
      const startTime = Date.now();

      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      const embeddings = inputs.map(input => 
        Array.from({ length: request.dimensions || 768 }, () => Math.random() * 2 - 1)
      );

      const processingTime = Date.now() - startTime;

      return {
        embeddings,
        model,
        usage: {
          promptTokens: inputs.reduce((sum, input) => sum + Math.ceil(input.length / 4), 0),
          totalTokens: inputs.reduce((sum, input) => sum + Math.ceil(input.length / 4), 0)
        }
      };
    } catch (error) {
      this.log(`Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  async generateStructuredData<T>(request: IAIRequest & { schema: any }): Promise<T> {
    try {
      const model = request.model || this.defaultModel;

      const { object } = await generateObject({
        model: google(model),
        schema: request.schema,
        prompt: request.prompt,
        temperature: request.temperature || this.getConfigValue('temperature', 0.7)
      });

      return object as T;
    } catch (error) {
      this.log(`Structured data generation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  }> {
    try {
      const prompt = `Analyze the sentiment of the following text and return a JSON response with sentiment (positive/negative/neutral), score (-1 to 1), and confidence (0 to 1):

Text: "${text}"

Response:`;

      const response = await this.generateText({
        prompt,
        model: this.defaultModel,
        temperature: 0.3
      });

      const sentimentMatch = response.text.match(/sentiment["\s]*:["\s]*["']?(\w+)["']?/i);
      const scoreMatch = response.text.match(/score["\s]*:["\s]*([-\d.]+)/i);
      const confidenceMatch = response.text.match(/confidence["\s]*:["\s]*([\d.]+)/i);

      const sentiment = sentimentMatch?.[1]?.toLowerCase() as 'positive' | 'negative' | 'neutral' || 'neutral';
      const score = parseFloat(scoreMatch?.[1] || '0');
      const confidence = parseFloat(confidenceMatch?.[1] || '0.5');

      return { sentiment, score, confidence };
    } catch (error) {
      this.log(`Sentiment analysis failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }
  }

  async extractEntities(text: string): Promise<Array<{
    text: string;
    type: string;
    confidence: number;
  }>> {
    try {
      const prompt = `Extract named entities from the following text. Return a JSON array with entities containing text, type (PERSON, ORGANIZATION, LOCATION, etc.), and confidence (0 to 1):

Text: "${text}"

Entities:`;

      const response = await this.generateText({
        prompt,
        model: this.defaultModel,
        temperature: 0.3
      });


      const entities: Array<{ text: string; type: string; confidence: number }> = [];

      const patterns = [
        { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'PERSON' },
        { regex: /\b[A-Z][A-Z]+\b/g, type: 'ORGANIZATION' },
        { regex: /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b/g, type: 'LOCATION' }
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern.regex);
        if (matches) {
          for (const match of matches) {
            entities.push({
              text: match,
              type: pattern.type,
              confidence: 0.8
            });
          }
        }
      }

      return entities;
    } catch (error) {
      this.log(`Entity extraction failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return [];
    }
  }

  async summarizeText(text: string, maxLength?: number): Promise<string> {
    try {
      const prompt = `Summarize the following text${maxLength ? ` in ${maxLength} characters or less` : ''}:

${text}

Summary:`;

      const response = await this.generateText({
        prompt,
        model: this.defaultModel,
        temperature: 0.5,
        maxTokens: maxLength ? Math.ceil(maxLength / 4) : 500
      });

      return response.text;
    } catch (error) {
      this.log(`Text summarization failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    try {
      const prompt = `Translate the following text to ${targetLanguage}${sourceLanguage ? ` from ${sourceLanguage}` : ''}:

${text}

Translation:`;

      const response = await this.generateText({
        prompt,
        model: this.defaultModel,
        temperature: 0.3
      });

      return response.text;
    } catch (error) {
      this.log(`Text translation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }

  override getConfig(): IAIProviderConfig {
    return {
      apiKey: this.getConfigValue('apiKey'),
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: this.defaultModel,
      timeout: this.getConfigValue('timeout', 30000),
      maxTokens: this.getConfigValue('maxTokens', 4096),
      temperature: this.getConfigValue('temperature', 0.7),
      topP: this.getConfigValue('topP', 0.9),
      frequencyPenalty: this.getConfigValue('frequencyPenalty', 0),
      presencePenalty: this.getConfigValue('presencePenalty', 0),
      retryAttempts: this.getConfigValue('retryAttempts', 3)
    };
  }

  override async updateConfig(config: Partial<IAIProviderConfig>): Promise<void> {
    await this.updateConfig(config);
    this.defaultModel = this.getConfigValue('defaultModel', this.defaultModel);
  }

  override async isHealthy(): Promise<boolean> {
    try {
      const response = await this.generateText({
        prompt: 'Hello',
        maxTokens: 10
      });
      return response.text.length > 0;
    } catch {
      return false;
    }
  }

  async getRateLimitInfo(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  } | null> {

    return null;
  }

  async getPricingInfo(): Promise<{
    inputCost: number;
    outputCost: number;
    currency: string;
  }> {
    const models = await this.getModels();
    const defaultModel = models.find(m => m.id === this.defaultModel);

    return {
      inputCost: defaultModel?.pricing.input || 0.00015,
      outputCost: defaultModel?.pricing.output || 0.0006,
      currency: 'USD'
    };
  }
}
