import { BasePlugin } from '../base/base-plugin.js';
import type { IDataProvider, IEconomicIndicator, IDataProviderResult, IDataProviderConfig } from '../interfaces/data-provider.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';

export class WorldBankProvider extends BasePlugin implements IDataProvider {
  private baseUrl = 'https://api.worldbank.org/v2';

  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'world-bank-provider',
      name: 'World Bank Provider',
      version: '1.0.0',
      description: 'Provides economic indicators from World Bank API',
      author: 'Market Research Team',
      category: 'data-provider',
      dependencies: [],
      entryPoint: 'world-bank.provider.ts',
      permissions: ['read_economic_data'],
      tags: ['economic', 'indicators', 'world-bank'],
      configSchema: {
        timeout: { type: 'number', required: false, default: 10000 },
        rateLimit: { type: 'number', required: false, default: 100 },
        baseUrl: { type: 'string', required: false, default: 'https://api.worldbank.org/v2' }
      }
    });

    super(manifest);
  }

  override async init(context: any, config?: Record<string, any>): Promise<void> {
    await super.init(context, config);
    this.baseUrl = this.getConfigValue('baseUrl', this.baseUrl);
  }

  override getCapabilities(): string[] {
    return ['economic_indicators', 'gdp_data', 'population_data', 'development_metrics'];
  }

  supportsDataType(type: string): boolean {
    return ['economic'].includes(type);
  }

  async getEconomicIndicator(indicator: string, country: string, year: number = new Date().getFullYear() - 1): Promise<IEconomicIndicator | null> {
    try {
      await this.handleRateLimit();

      const url = `${this.baseUrl}/country/${country}/indicator/${indicator}?format=json&per_page=1&date=${year}`;
      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const indicatorData = data[1]?.[0];

      if (!indicatorData || !indicatorData.value) {
        throw new Error(`No data available for indicator ${indicator} in ${country} for year ${year}`);
      }

      return {
        indicator: indicatorData.indicator.value,
        value: indicatorData.value,
        unit: indicatorData.unit || "Unknown",
        country: indicatorData.country.value,
        year: indicatorData.date,
        source: "World Bank",
        frequency: indicatorData.frequency || "annual",
        lastUpdated: new Date()
      };
    } catch (error) {
      this.log(`Failed to get economic indicator ${indicator} for ${country}: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return null;
    }
  }

  async getEconomicIndicators(indicators: string[], country: string): Promise<IDataProviderResult<IEconomicIndicator>> {
    const results: IEconomicIndicator[] = [];
    const errors: string[] = [];

    for (const indicator of indicators) {
      try {
        const data = await this.getEconomicIndicator(indicator, country);
        if (data) {
          results.push(data);
        }
      } catch (error) {
        errors.push(`Failed to fetch indicator ${indicator}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      total: results.length,
      page: 1,
      limit: indicators.length,
      hasMore: false,
      source: 'world-bank',
      timestamp: new Date(),
      error: errors.length > 0 ? errors.join('; ') : ''
    };
  }

  async executeQuery(query: any): Promise<IDataProviderResult<any>> {
    if (query.type === 'economic') {
      if (query.indicators && query.country) {
        return this.getEconomicIndicators(query.indicators, query.country);
      } else if (query.indicator && query.country) {
        const data = await this.getEconomicIndicator(query.indicator, query.country, query.year);
        return {
          success: data !== null,
          data: data ? [data] : [],
          total: data ? 1 : 0,
          page: 1,
          limit: 1,
          hasMore: false,
          source: 'world-bank',
          timestamp: new Date(),
          error: data ? '' : 'Failed to fetch economic indicator'
        };
      }
    }

    throw new Error(`Unsupported query type: ${query.type}`);
  }

  override async isHealthy(): Promise<boolean> {
    try {
      const data = await this.getEconomicIndicator("NY.GDP.MKTP.CD", "US");
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

  static getCommonIndicators() {
    return {
      GDP: "NY.GDP.MKTP.CD", 
      GDP_PER_CAPITA: "NY.GDP.PCAP.CD", 
      INFLATION: "FP.CPI.TOTL.ZG", 
      UNEMPLOYMENT: "SL.UEM.TOTL.ZS", 
      POPULATION: "SP.POP.TOTL", 
      INTERNET_USERS: "IT.NET.USER.ZS", 
      LIFE_EXPECTANCY: "SP.DYN.LE00.IN", 
      FERTILITY_RATE: "SP.DYN.TFRT.IN", 
      EDUCATION_EXPENDITURE: "SE.XPD.TOTL.GD.ZS", 
      HEALTH_EXPENDITURE: "SH.XPD.CHEX.GD.ZS" 
    };
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
