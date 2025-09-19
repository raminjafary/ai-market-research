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





  override getConfig(): IAIProviderConfig {
    return {
      apiKey: this.getConfigValue('apiKey'),
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: this.defaultModel,
      timeout: this.getConfigValue('timeout', 30000),
      maxTokens: this.getConfigValue('maxTokens', 4096),
      temperature: this.getConfigValue('temperature', 0.7),
      topP: this.getConfigValue('topP', 0.9),
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

}
