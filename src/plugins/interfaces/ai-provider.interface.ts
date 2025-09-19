import type { IPlugin } from '../../core/interfaces/plugin.interface.js';

export interface IAIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
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
  tools?: any[];
  systemMessage?: string;
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


  generateStructuredData<T>(
    request: IAIRequest & { schema: any }
  ): Promise<T>;

  getConfig(): IAIProviderConfig;

  updateConfig(config: Partial<IAIProviderConfig>): Promise<void>;

  isHealthy(): Promise<boolean>;

}
