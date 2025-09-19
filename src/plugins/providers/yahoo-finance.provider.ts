import { BasePlugin } from '../base/base-plugin.js';
import type { IDataProvider, IMarketData, IDataProviderResult, IDataProviderConfig } from '../interfaces/data-provider.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';

export class YahooFinanceProvider extends BasePlugin implements IDataProvider {
  private baseUrl = 'https://query1.finance.yahoo.com';

  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'yahoo-finance-provider',
      name: 'Yahoo Finance Provider',
      version: '1.0.0',
      description: 'Provides financial market data from Yahoo Finance',
      author: 'Market Research Team',
      category: 'data-provider',
      dependencies: [],
      entryPoint: 'yahoo-finance.provider.ts',
      permissions: ['read_market_data'],
      tags: ['financial', 'market-data', 'stocks'],
      configSchema: {
        timeout: { type: 'number', required: false, default: 10000 },
        rateLimit: { type: 'number', required: false, default: 100 },
        baseUrl: { type: 'string', required: false, default: 'https://query1.finance.yahoo.com' }
      }
    });

    super(manifest);
  }

  override async init(context: any, config?: Record<string, any>): Promise<void> {
    await super.init(context, config);
    this.baseUrl = this.getConfigValue('baseUrl', this.baseUrl);
  }

  override getCapabilities(): string[] {
    return ['market_data', 'stock_prices', 'financial_metrics'];
  }

  supportsDataType(type: string): boolean {
    return ['market', 'financial'].includes(type);
  }

  async getMarketData(symbols: string[]): Promise<IDataProviderResult<IMarketData>> {
    const results: IMarketData[] = [];
    const errors: string[] = [];

    for (const symbol of symbols) {
      try {
        const data = await this.getStockPrice(symbol);
        if (data) {
          results.push(data);
        }
      } catch (error) {
        errors.push(`Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      total: results.length,
      page: 1,
      limit: symbols.length,
      hasMore: false,
      source: 'yahoo-finance',
      timestamp: new Date(),
      error: errors.length > 0 ? errors.join('; ') : ''
    };
  }

  async getStockPrice(symbol: string): Promise<IMarketData | null> {
    try {
      await this.handleRateLimit();

      const url = `${this.baseUrl}/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.chart.result[0];
      const quote = result.indicators.quote[0];
      const meta = result.meta;

      return {
        symbol,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: quote.volume[0],
        marketCap: meta.marketCap,
        timestamp: new Date(meta.regularMarketTime * 1000),
        source: 'yahoo-finance'
      };
    } catch (error) {
      this.log(`Failed to get stock price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return null;
    }
  }

  async executeQuery(query: any): Promise<IDataProviderResult<any>> {
    if (query.type === 'market') {
      return this.getMarketData([query.query]);
    }

    throw new Error(`Unsupported query type: ${query.type}`);
  }

  override async isHealthy(): Promise<boolean> {
    try {
      const testSymbol = "AAPL";
      const data = await this.getStockPrice(testSymbol);
      return data !== null;
    } catch {
      return false;
    }
  }

  async getRateLimitInfo(): Promise<{ remaining: number; reset: Date; limit: number } | null> {

    return null;
  }

  override getConfig(): IDataProviderConfig {
    return {
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
}
