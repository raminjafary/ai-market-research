import { loadEnvFile } from 'process';

loadEnvFile();

export interface PluginConfig {
  newsapi?: {
    apiKey?: string;
  };
  googleGemini?: {
    apiKey?: string;
  };
  yahooFinance?: {
    apiKey?: string;
  };
  worldBank?: {
    apiKey?: string;
  };
}

export function getPluginConfig(): PluginConfig {
  return {
    newsapi: {
      ...(process.env['NEWSAPI_API_KEY'] && { apiKey: process.env['NEWSAPI_API_KEY'] }),
    },
    googleGemini: {
      ...(process.env['GOOGLE_GENERATIVE_AI_API_KEY'] && { apiKey: process.env['GOOGLE_GENERATIVE_AI_API_KEY'] }),
    },
    yahooFinance: {
      ...(process.env['YAHOO_FINANCE_API_KEY'] && { apiKey: process.env['YAHOO_FINANCE_API_KEY'] }),
    },
    worldBank: {
      ...(process.env['WORLD_BANK_API_KEY'] && { apiKey: process.env['WORLD_BANK_API_KEY'] }),
    },
  };
}

export function getProviderConfig(providerId: string): Record<string, any> {
  const config = getPluginConfig();

  switch (providerId) {
    case 'newsapi-provider':
      return {
        apiKey: config.newsapi?.apiKey,
        timeout: 10000,
        rateLimit: 100,
        baseUrl: 'https://newsapi.org/v2'
      };
    case 'google-gemini-provider':
      return {
        apiKey: config.googleGemini?.apiKey,
        defaultModel: 'gemini-2.5-flash',
        timeout: 30000,
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9
      };
    case 'yahoo-finance-provider':
      return {
        apiKey: config.yahooFinance?.apiKey,
        timeout: 10000,
        rateLimit: 100,
        baseUrl: 'https://query1.finance.yahoo.com'
      };
    case 'world-bank-provider':
      return {
        apiKey: config.worldBank?.apiKey,
        timeout: 10000,
        rateLimit: 100,
        baseUrl: 'https://api.worldbank.org/v2'
      };
    default:
      return {};
  }
}
