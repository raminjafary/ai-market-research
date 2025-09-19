# Plugin Development Guide

## Overview

This guide explains how to create plugins for the Market Research Platform's microkernel architecture. The plugin system is designed to be modular, extensible, and easy to develop.

## Architecture Overview

The plugin system consists of several key components:

- **Microkernel**: The core orchestrator that manages all plugins and services
- **Event Bus**: Central communication system for all components
- **Service Container**: Dependency injection and service management
- **Plugin Registry**: Plugin discovery, loading, and lifecycle management
- **Configuration Manager**: Hierarchical configuration management
- **Lifecycle Manager**: Application lifecycle phase management

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
- Dashboards
- Custom UIs

### 6. Workflow Plugins
Automate business processes:
- Data pipelines
- Report generation workflows
- Scheduled tasks
- Custom workflows

### 7. Integration Plugins
Connect with external systems:
- CRM systems
- ERP systems
- Marketing platforms
- Trading platforms
- Custom integrations

### 8. Utility Plugins
Helper and utility functions:
- Data transformers
- Validators
- Caching systems
- Monitoring tools
- Custom utilities

## Creating a Plugin

### Step 1: Define the Plugin Manifest

```typescript
import { IPluginManifest } from '../core/interfaces/plugin.interface.js';

const manifest: IPluginManifest = {
  id: 'my-data-provider',
  name: 'My Data Provider',
  version: '1.0.0',
  description: 'A custom data provider plugin',
  author: 'Your Name',
  category: 'data-provider',
  dependencies: [],
  entryPoint: './index.js',
  permissions: ['data.read', 'config.write'],
  tags: ['custom', 'data'],
  configSchema: {
    apiKey: { type: 'string', required: true },
    baseUrl: { type: 'string', required: false, default: 'https://api.example.com' },
    timeout: { type: 'number', required: false, default: 30000 }
  }
};
```

### Step 2: Create the Plugin Class

```typescript
import { BasePlugin } from '../base/base-plugin.js';
import { IDataProvider, IDataProviderConfig, IMarketData } from '../interfaces/data-provider.interface.js';

export class MyDataProviderPlugin extends BasePlugin implements IDataProvider {
  private config: IDataProviderConfig;

  constructor(manifest: any) {
    super(manifest);
    this.config = {};
  }

  async init(context: IPluginContext, config?: Record<string, any>): Promise<void> {
    await super.init(context, config);
    this.config = config || {};
    
    // Validate required configuration
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }
  }

  async start(): Promise<void> {
    await super.start();
    this.log('Data provider started successfully');
  }

  async stop(): Promise<void> {
    await super.stop();
    this.log('Data provider stopped');
  }

  async cleanup(): Promise<void> {
    await super.cleanup();
    this.log('Data provider cleaned up');
  }

  getCapabilities(): string[] {
    return ['market-data', 'stock-prices'];
  }

  supportsDataType(type: string): boolean {
    return this.getCapabilities().includes(type);
  }

  async getMarketData(symbols: string[]): Promise<IDataProviderResult<IMarketData>> {
    try {
      // Implement your data fetching logic here
      const data: IMarketData[] = [];
      
      for (const symbol of symbols) {
        const marketData = await this.fetchStockData(symbol);
        data.push(marketData);
      }

      return {
        success: true,
        data,
        total: data.length,
        page: 1,
        limit: symbols.length,
        hasMore: false,
        source: this.manifest.id,
        timestamp: new Date()
      };
    } catch (error) {
      this.log(`Error fetching market data: ${error.message}`, 'error');
      
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: symbols.length,
        hasMore: false,
        source: this.manifest.id,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  async getStockPrice(symbol: string): Promise<IMarketData | null> {
    try {
      return await this.fetchStockData(symbol);
    } catch (error) {
      this.log(`Error fetching stock price for ${symbol}: ${error.message}`, 'error');
      return null;
    }
  }

  async executeQuery(query: IDataQuery): Promise<IDataProviderResult<any>> {
    // Implement generic query execution
    switch (query.type) {
      case 'market':
        return this.getMarketData([query.query]);
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Implement health check logic
      const response = await fetch(`${this.config.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getRateLimitInfo(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  } | null> {
    // Implement rate limit checking
    return null;
  }

  getConfig(): IDataProviderConfig {
    return { ...this.config };
  }

  async updateConfig(config: Partial<IDataProviderConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.updateConfig(this.config);
  }

  private async fetchStockData(symbol: string): Promise<IMarketData> {
    // Implement actual API call
    const response = await fetch(`${this.config.baseUrl}/stock/${symbol}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000)
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
  }
}
```

### Step 3: Export the Plugin

```typescript
// index.ts
export { MyDataProviderPlugin } from './my-data-provider-plugin.js';
export { manifest } from './manifest.js';
```

### Step 4: Create Plugin Package

```json
// package.json
{
  "name": "my-data-provider-plugin",
  "version": "1.0.0",
  "description": "A custom data provider plugin",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@market-research/core": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "keywords": ["market-research", "plugin", "data-provider"],
  "author": "Your Name",
  "license": "MIT"
}
```

## Plugin Development Best Practices

### 1. Error Handling
- Always handle errors gracefully
- Log errors with appropriate context
- Return meaningful error messages
- Implement retry logic for transient failures

### 2. Configuration Management
- Validate configuration on initialization
- Provide sensible defaults
- Support configuration updates at runtime
- Document all configuration options

### 3. Event Publishing
- Publish events for important state changes
- Include relevant data in events
- Use consistent event naming conventions
- Avoid publishing too many events

### 4. Service Registration
- Register services with appropriate metadata
- Use descriptive service IDs
- Document service dependencies
- Clean up services on plugin unload

### 5. Testing
- Write unit tests for all plugin functionality
- Test error conditions and edge cases
- Mock external dependencies
- Test configuration validation

### 6. Documentation
- Document all public methods and interfaces
- Provide usage examples
- Include configuration examples
- Document any external dependencies

## Plugin Lifecycle

### 1. Discovery
The plugin registry scans for available plugins and loads their manifests.

### 2. Loading
Plugins are loaded and their classes are instantiated.

### 3. Initialization
- Plugin context is provided
- Configuration is validated
- Dependencies are resolved
- Plugin-specific initialization is performed

### 4. Starting
- Plugin is marked as active
- Event subscriptions are established
- Background tasks are started

### 5. Running
- Plugin processes requests
- Publishes events
- Responds to configuration changes

### 6. Stopping
- Background tasks are stopped
- Event subscriptions are removed
- Plugin is marked as inactive

### 7. Cleanup
- Resources are released
- Services are unregistered
- Plugin is unloaded

## Plugin Communication

### Event Publishing
```typescript
// Publish an event
await this.publishEvent('data.fetched', {
  symbol: 'AAPL',
  price: 150.00,
  timestamp: new Date()
});
```

### Event Subscription
```typescript
// Subscribe to events
this.subscribeToEvents('config.updated', (event) => {
  this.handleConfigUpdate(event.data);
});
```

### Service Registration
```typescript
// Register a service
this.registerService('my-data-service', () => new MyDataService(), {
  singleton: true,
  metadata: { category: 'data' }
});
```

### Service Resolution
```typescript
// Get a service
const dataService = await this.getService<MyDataService>('my-data-service');
```

## Configuration Management

### Configuration Schema
```typescript
const configSchema = {
  apiKey: {
    type: 'string',
    required: true,
    description: 'API key for external service'
  },
  baseUrl: {
    type: 'string',
    required: false,
    default: 'https://api.example.com',
    description: 'Base URL for API calls'
  },
  timeout: {
    type: 'number',
    required: false,
    default: 30000,
    description: 'Request timeout in milliseconds'
  }
};
```

### Configuration Access
```typescript
// Get configuration value
const apiKey = this.getConfigValue<string>('apiKey');

// Set configuration value
this.setConfigValue('timeout', 60000);

// Update configuration
await this.updateConfig({
  baseUrl: 'https://new-api.example.com'
});
```

## Testing Plugins

### Unit Testing
```typescript
import { MyDataProviderPlugin } from './my-data-provider-plugin.js';

describe('MyDataProviderPlugin', () => {
  let plugin: MyDataProviderPlugin;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      eventBus: { publish: jest.fn(), subscribe: jest.fn() },
      serviceContainer: { resolve: jest.fn() },
      configManager: { get: jest.fn() }
    };
    
    plugin = new MyDataProviderPlugin(manifest);
  });

  it('should initialize with valid configuration', async () => {
    const config = { apiKey: 'test-key' };
    await expect(plugin.init(mockContext, config)).resolves.not.toThrow();
  });

  it('should reject invalid configuration', async () => {
    const config = {};
    await expect(plugin.init(mockContext, config)).rejects.toThrow('API key is required');
  });
});
```

### Integration Testing
```typescript
import { Microkernel } from '../core/microkernel.js';

describe('Plugin Integration', () => {
  let microkernel: Microkernel;

  beforeEach(async () => {
    microkernel = new Microkernel({
      enableDebugMode: true
    });
    await microkernel.start();
  });

  afterEach(async () => {
    await microkernel.stop();
  });

  it('should load and initialize plugin', async () => {
    await microkernel.loadPlugin(manifest);
    
    const plugins = microkernel.getPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].manifest.id).toBe('my-data-provider');
  });
});
```

## Deployment

### Plugin Distribution
1. Build the plugin: `npm run build`
2. Package the plugin: `npm pack`
3. Publish to registry: `npm publish`

### Plugin Installation
1. Install plugin: `npm install my-data-provider-plugin`
2. Register plugin in configuration
3. Restart the application

### Plugin Updates
1. Update plugin version
2. Publish new version
3. Update in application
4. Restart or hot-reload

## Troubleshooting

### Common Issues

1. **Plugin not loading**
   - Check manifest validation
   - Verify dependencies are met
   - Check configuration schema

2. **Configuration errors**
   - Validate configuration schema
   - Check required fields
   - Verify data types

3. **Service resolution failures**
   - Check service registration
   - Verify service dependencies
   - Check circular dependencies

4. **Event communication issues**
   - Verify event publishing
   - Check event subscription
   - Validate event data structure

### Debugging

1. Enable debug mode in microkernel
2. Check plugin logs
3. Monitor event bus activity
4. Validate service container state

## Conclusion

This guide provides a comprehensive overview of plugin development for the Market Research Platform. By following these guidelines, you can create robust, maintainable plugins that integrate seamlessly with the microkernel architecture.

For more information, refer to the API documentation and example plugins in the repository.
