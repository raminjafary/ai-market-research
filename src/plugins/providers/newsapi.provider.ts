import { BasePlugin } from '../base/base-plugin.js';
import type { IDataProvider, INewsArticle, IDataProviderResult, IDataProviderConfig } from '../interfaces/data-provider.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';

export class NewsAPIProvider extends BasePlugin implements IDataProvider {
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'newsapi-provider',
      name: 'NewsAPI Provider',
      version: '1.0.0',
      description: 'Provides news articles from NewsAPI',
      author: 'Market Research Team',
      category: 'data-provider',
      dependencies: [],
      entryPoint: 'newsapi.provider.ts',
      permissions: ['read_news_data'],
      tags: ['news', 'articles', 'media'],
      configSchema: {
        apiKey: { type: 'string', required: true },
        timeout: { type: 'number', required: false, default: 10000 },
        rateLimit: { type: 'number', required: false, default: 100 },
        baseUrl: { type: 'string', required: false, default: 'https://newsapi.org/v2' }
      }
    });

    super(manifest);
  }

  override async init(context: any, config?: Record<string, any>): Promise<void> {
    await super.init(context, config);
    this.baseUrl = this.getConfigValue('baseUrl', this.baseUrl);

    if (!this.getConfigValue('apiKey')) {
      this.setConfigValue('apiKey', 'development-key-placeholder');
      this.log('Using development placeholder for NewsAPI key. Real functionality requires a valid API key from https://newsapi.org/', 'warn');
    }
  }

  override getCapabilities(): string[] {
    return ['news_articles', 'industry_news', 'sentiment_analysis'];
  }

  supportsDataType(type: string): boolean {
    return ['news'].includes(type);
  }

  async getNews(query: string, limit: number = 10): Promise<IDataProviderResult<INewsArticle>> {
    try {
      await this.handleRateLimit();

      const apiKey = this.getConfigValue('apiKey');
      const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&pageSize=${limit}&sortBy=publishedAt&apiKey=${apiKey}`;
      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const articles: INewsArticle[] = data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: new Date(article.publishedAt),
        source: article.source.name,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        category: this.categorizeArticle(article.title, article.description),
        tags: this.extractTags(article.title, article.description)
      }));

      return {
        success: true,
        data: articles,
        total: data.totalResults,
        page: 1,
        limit,
        hasMore: data.totalResults > limit,
        source: 'newsapi',
        timestamp: new Date()
      };
    } catch (error) {
              this.log(`Failed to get news for query "${query}": ${error instanceof Error ? error.message : String(error)}`, 'error');
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit,
        hasMore: false,
        source: 'newsapi',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async getIndustryNews(industry: string, limit: number = 10): Promise<IDataProviderResult<INewsArticle>> {
    const query = `${industry} market business trends`;
    return this.getNews(query, limit);
  }

  async executeQuery(query: any): Promise<IDataProviderResult<any>> {
    if (query.type === 'news') {
      return this.getNews(query.query, query.limit);
    }

    throw new Error(`Unsupported query type: ${query.type}`);
  }

  override async isHealthy(): Promise<boolean> {
    try {
      if (!this.getConfigValue('apiKey')) {
        return false;
      }

      const result = await this.getNews("technology", 1);
      return result.success;
    } catch {
      return false;
    }
  }

  async getRateLimitInfo(): Promise<{ remaining: number; reset: Date; limit: number } | null> {

    return null;
  }

  override getConfig(): IDataProviderConfig {
    return {
      apiKey: this.getConfigValue('apiKey'),
      timeout: this.getConfigValue('timeout', 10000),
      rateLimit: this.getConfigValue('rateLimit', 100),
      baseUrl: this.baseUrl,
      retryAttempts: this.getConfigValue('retryAttempts', 3),
      cacheEnabled: this.getConfigValue('cacheEnabled', false),
      cacheTTL: this.getConfigValue('cacheTTL', 300000)
    };
  }

  override async updateConfig(config: Partial<IDataProviderConfig>): Promise<void> {
    await this.updateConfig(config);
    this.baseUrl = this.getConfigValue('baseUrl', this.baseUrl);
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const timeout = this.getConfigValue('timeout', 10000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async handleRateLimit(): Promise<void> {
    const rateLimit = this.getConfigValue('rateLimit', 100);
    return new Promise(resolve => {
      setTimeout(resolve, 1000 / rateLimit);
    });
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['growth', 'profit', 'increase', 'positive', 'strong', 'success', 'opportunity'];
    const negativeWords = ['decline', 'loss', 'decrease', 'negative', 'weak', 'failure', 'risk'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private categorizeArticle(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('market') || text.includes('stock') || text.includes('trading')) return 'financial';
    if (text.includes('technology') || text.includes('tech') || text.includes('digital')) return 'technology';
    if (text.includes('health') || text.includes('medical') || text.includes('pharma')) return 'healthcare';
    if (text.includes('energy') || text.includes('oil') || text.includes('gas')) return 'energy';
    if (text.includes('retail') || text.includes('consumer') || text.includes('shopping')) return 'retail';

    return 'general';
  }

  private extractTags(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const tags: string[] = [];

    const businessTerms = ['market', 'business', 'company', 'industry', 'economy', 'growth', 'investment'];

    for (const term of businessTerms) {
      if (text.includes(term)) {
        tags.push(term);
      }
    }

    return tags.slice(0, 5); 
  }
}
