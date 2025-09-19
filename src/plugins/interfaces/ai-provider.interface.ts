import type { IPlugin } from '../../core/interfaces/plugin.interface.js';

export interface IAIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  retryAttempts?: number;
}

export interface IAIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  tools?: any[];
  systemMessage?: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
  }>;
}

export interface IAIResponse {
  text: string;
  sources?: any[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  metadata?: Record<string, any>;
}

export interface IAIStreamResponse {
  text: string;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface IAIEmbeddingRequest {
  input: string | string[];
  model?: string;
  dimensions?: number;
}

export interface IAIEmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface IAIModelInfo {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'multimodal';
  capabilities: string[];
  maxTokens: number;
  contextLength: number;
  pricing: {
    input: number; 
    output: number; 
  };
  available: boolean;
}

export interface IAIProvider extends IPlugin {

  getModels(): Promise<IAIModelInfo[]>;

  isModelAvailable(modelId: string): Promise<boolean>;

  generateText(request: IAIRequest): Promise<IAIResponse>;

  generateTextStream(request: IAIRequest): AsyncGenerator<IAIStreamResponse>;

  generateEmbeddings(request: IAIEmbeddingRequest): Promise<IAIEmbeddingResponse>;

  generateStructuredData<T>(
    request: IAIRequest & { schema: any }
  ): Promise<T>;

  generateImage?(request: {
    prompt: string;
    model?: string;
    size?: string;
    quality?: string;
    style?: string;
  }): Promise<{
    url: string;
    model: string;
    usage: any;
  }>;

  analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  }>;

  extractEntities(text: string): Promise<Array<{
    text: string;
    type: string;
    confidence: number;
  }>>;

  summarizeText(text: string, maxLength?: number): Promise<string>;

  translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string>;

  getConfig(): IAIProviderConfig;

  updateConfig(config: Partial<IAIProviderConfig>): Promise<void>;

  isHealthy(): Promise<boolean>;

  getRateLimitInfo(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  } | null>;

  getPricingInfo(): Promise<{
    inputCost: number;
    outputCost: number;
    currency: string;
  }>;
}
