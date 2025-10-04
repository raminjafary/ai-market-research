# Plugin Development Guide

## Overview

This guide explains how to create plugins for the Market Research Platform. The plugin system is designed to be modular, extensible, and easy to develop, allowing you to add custom data sources, analysis tools, and output formats to extend the platform's capabilities.

## System Architecture

The plugin system provides these key capabilities:

- **Plugin Management**: Automatic discovery, loading, and lifecycle management
- **Event System**: Communication between plugins and system components
- **Service Management**: Dependency injection and service resolution
- **Configuration**: Hierarchical configuration management
- **Lifecycle Management**: Application startup, shutdown, and plugin states

## Plugin Categories

### 1. Data Provider Plugins
Provide access to external data sources:
- Financial data (stock prices, market data)
- News articles and media content
- Economic indicators
- Social media data
- Custom data sources

### 2. AI Provider Plugins
Integrate with AI/ML services:
- OpenAI GPT models
- Google Gemini
- Anthropic Claude
- Local AI models
- Custom AI services

### 3. Analytics Plugins
Process and analyze data:
- Sentiment analysis
- Predictive modeling
- Competitive intelligence
- Risk assessment
- Custom analytics

### 4. Output Format Plugins
Generate reports and exports:
- PDF generation
- HTML reports
- Excel exports
- JSON/XML formats
- Custom formats

### 5. UI Plugins
User interface components:
- Web interfaces
- CLI tools
- API endpoints
- Custom UIs

## Creating a Plugin

### Step 1: Define the Plugin Manifest

```typescript
import { PluginUtils } from '../sdk/plugin-sdk.js';

const manifest = PluginUtils.createManifest({
  id: 'my-data-provider',
  name: 'My Data Provider',
  version: '1.0.0',
  description: 'A custom data provider plugin',
  author: 'Your Name',
  category: 'data-provider',
  dependencies: [],
  entryPoint: 'my-data-provider.ts',
  permissions: ['read_market_data'],
  tags: ['custom', 'data'],
  configSchema: {
    apiKey: { type: 'string', required: true },
    baseUrl: { type: 'string', required: false, default: 'https://api.example.com' },
    timeout: { type: 'number', required: false, default: 30000 }
  }
});
```

### Step 2: Create the Plugin Class

```typescript
import { BasePlugin } from '../base/base-plugin.js';
import { IDataProvider, IDataProviderConfig, IMarketData } from '../interfaces/data-provider.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';

export class MyDataProviderPlugin extends BasePlugin implements IDataProvider {
  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'my-data-provider',
      name: 'My Data Provider',
      version: '1.0.0',
      description: 'A custom data provider plugin',
      author: 'Your Name',
      category: 'data-provider',
      dependencies: [],
      entryPoint: 'my-data-provider.ts',
      permissions: ['read_market_data'],
      tags: ['custom', 'data'],
      configSchema: {
        apiKey: { type: 'string', required: true },
        baseUrl: { type: 'string', required: false, default: 'https://api.example.com' },
        timeout: { type: 'number', required: false, default: 30000 }
      }
    });

    super(manifest);
  }

  override async init(context: any, config?: Record<string, any>): Promise<void> {
    await super.init(context, config);
    
    // Validate required configuration
    if (!this.getConfigValue('apiKey')) {
      throw new Error('API key is required');
    }
  }

  override getCapabilities(): string[] {
    return ['market_data', 'stock_prices'];
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
      source: this.manifest.id,
      timestamp: new Date(),
      error: errors.length > 0 ? errors.join('; ') : ''
    };
  }

  async getStockPrice(symbol: string): Promise<IMarketData | null> {
    try {
      const baseUrl = this.getConfigValue('baseUrl', 'https://api.example.com');
      const apiKey = this.getConfigValue('apiKey');
      const timeout = this.getConfigValue('timeout', 30000);

      const response = await fetch(`${baseUrl}/stock/${symbol}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        symbol: data.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        marketCap: data.marketCap,
        timestamp: new Date(data.timestamp),
        source: this.manifest.id
      };
    } catch (error) {
      this.log(`Error fetching stock price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`, 'error');
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

  override getConfig(): IDataProviderConfig {
    return {
      apiKey: this.getConfigValue('apiKey'),
      baseUrl: this.getConfigValue('baseUrl', 'https://api.example.com'),
      timeout: this.getConfigValue('timeout', 30000),
      rateLimit: this.getConfigValue('rateLimit', 100),
      retryAttempts: this.getConfigValue('retryAttempts', 3),
      cacheEnabled: this.getConfigValue('cacheEnabled', false),
      cacheTTL: this.getConfigValue('cacheTTL', 300000)
    };
  }

  override async updateConfig(config: Partial<IDataProviderConfig>): Promise<void> {
    await this.updateConfig(config);
  }

}
```

### Step 3: Export the Plugin

```typescript
// index.ts
export { MyDataProviderPlugin } from './my-data-provider-plugin.js';
```

## Plugin Development Best Practices

- **Error Handling**: Always handle errors gracefully and log with context
- **Configuration**: Validate on initialization and provide sensible defaults
- **Events**: Publish events for important state changes with consistent naming
- **Services**: Register services with descriptive IDs and clean up on unload
- **Testing**: Write unit tests for all functionality and error conditions
- **Documentation**: Document all public methods and provide usage examples

## Plugin Lifecycle

1. **Discovery** - Plugin registry scans and loads manifests
2. **Loading** - Plugin classes are instantiated
3. **Initialization** - Context provided, config validated, dependencies resolved
4. **Starting** - Plugin marked active, event subscriptions established
5. **Running** - Plugin processes requests and publishes events
6. **Stopping** - Background tasks stopped, subscriptions removed
7. **Cleanup** - Resources released, services unregistered

## Plugin Communication

### Events
```typescript
// Publish events
await this.publishEvent('data.fetched', { symbol: 'AAPL', price: 150.00 });

// Subscribe to events
this.subscribeToEvents('config.updated', (event) => {
  this.handleConfigUpdate(event.data);
});
```

### Services
```typescript
// Register service
const sdk = new PluginSDK(this);
sdk.registerService('my-data-service', () => new MyDataService(), {
  singleton: true,
  metadata: { category: 'data' }
});

// Get service
const dataService = await sdk.getService<MyDataService>('my-data-service');
```

## Configuration Management

```typescript
// Configuration schema
const configSchema = {
  apiKey: { type: 'string', required: true },
  baseUrl: { type: 'string', required: false, default: 'https://api.example.com' },
  timeout: { type: 'number', required: false, default: 30000 }
};

// Access configuration
const apiKey = this.getConfigValue('apiKey');
this.setConfigValue('timeout', 60000);
await this.updateConfig({ baseUrl: 'https://new-api.example.com' });
```

## Testing Plugins

### Unit Testing
```typescript
import { MyDataProviderPlugin } from './my-data-provider-plugin.js';

describe('MyDataProviderPlugin', () => {
  let plugin: MyDataProviderPlugin;

  beforeEach(() => {
    plugin = new MyDataProviderPlugin();
  });

  it('should initialize with valid configuration', async () => {
    const config = { apiKey: 'test-key' };
    await expect(plugin.init(mockContext, config)).resolves.not.toThrow();
  });
});
```

### Integration Testing
```typescript
import { Microkernel } from '../core/microkernel.js';

describe('Plugin Integration', () => {
  let microkernel: Microkernel;

  beforeEach(async () => {
    microkernel = new Microkernel({ enableDebugMode: true });
    await microkernel.start();
  });

  it('should load and initialize plugin', async () => {
    const plugin = new MyDataProviderPlugin();
    await microkernel.loadPlugin(plugin.manifest);
    
    const plugins = microkernel.getPlugins();
    expect(plugins).toHaveLength(1);
  });
});
```


