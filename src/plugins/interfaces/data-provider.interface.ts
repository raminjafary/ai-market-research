import type { IPlugin } from '../../core/interfaces/plugin.interface.js';

export interface IMarketData {
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  timestamp: Date;
  source: string;
}

export interface INewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: string;
  tags?: string[];
}

export interface IEconomicIndicator {
  indicator: string;
  value: number;
  unit: string;
  country: string;
  year: number;
  source: string;
  frequency?: string;
  lastUpdated?: Date;
}

export interface ISocialMediaPost {
  id: string;
  platform: string;
  content: string;
  author: string;
  publishedAt: Date;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  hashtags?: string[];
}

export interface IDataProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  rateLimit?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface IDataQuery {
  type: 'market' | 'news' | 'economic' | 'social';
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDataProviderResult<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  source: string;
  timestamp: Date;
  error?: string;
}

export interface IDataProvider extends IPlugin {

  getCapabilities(): string[];

  supportsDataType(type: string): boolean;

  getMarketData?(symbols: string[]): Promise<IDataProviderResult<IMarketData>>;

  getStockPrice?(symbol: string): Promise<IMarketData | null>;

  getNews?(query: string, limit?: number): Promise<IDataProviderResult<INewsArticle>>;

  getIndustryNews?(industry: string, limit?: number): Promise<IDataProviderResult<INewsArticle>>;

  getEconomicIndicator?(indicator: string, country: string, year?: number): Promise<IEconomicIndicator | null>;

  getEconomicIndicators?(indicators: string[], country: string): Promise<IDataProviderResult<IEconomicIndicator>>;

  getSocialMediaPosts?(query: string, platform?: string, limit?: number): Promise<IDataProviderResult<ISocialMediaPost>>;

  executeQuery(query: IDataQuery): Promise<IDataProviderResult<any>>;

  isHealthy(): Promise<boolean>;

  getRateLimitInfo(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  } | null>;

  getConfig(): IDataProviderConfig;

  updateConfig(config: Partial<IDataProviderConfig>): Promise<void>;
}
