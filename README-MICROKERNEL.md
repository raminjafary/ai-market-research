# Market Research System - Microkernel Architecture

## 🚀 Overview

This project has been completely rewritten to use a **Plugin and Microkernel Architecture**, providing a highly modular, scalable, and extensible system for market research. The new architecture separates concerns, enables easy plugin development, and provides a robust foundation for future enhancements.

## 🏗️ Architecture Overview

### Core Components

The system is built around these core components:

1. **Microkernel** - The central orchestrator that manages all system components
2. **Event Bus** - Centralized event-driven communication system
3. **Plugin Registry** - Dynamic plugin discovery and lifecycle management
4. **Service Container** - Dependency injection and service management
5. **Configuration Manager** - Centralized, hierarchical configuration
6. **Lifecycle Manager** - Application lifecycle and plugin management

### Plugin Categories

The system supports multiple plugin categories:

- **Data Providers** - Fetch data from external sources (financial, news, economic)
- **AI Providers** - AI/ML capabilities (text generation, embeddings, analysis)
- **Analytics Providers** - Data analysis and insights (sentiment, predictions, competitive)
- **Output Format Providers** - Report generation (PDF, HTML, Excel)
- **UI Providers** - User interface components
- **Workflow Providers** - Business process automation
- **Integration Providers** - Third-party system integrations
- **Utility Providers** - Helper functions and utilities

## 📁 Project Structure

```
src/
├── core/                          # Core microkernel components
│   ├── microkernel.ts            # Main microkernel orchestrator
│   ├── event-bus.ts              # Event-driven communication
│   ├── plugin-registry.ts        # Plugin management
│   ├── service-container.ts      # Dependency injection
│   ├── config-manager.ts         # Configuration management
│   ├── lifecycle-manager.ts      # Application lifecycle
│   └── interfaces/               # Core interfaces
├── plugins/                       # Plugin implementations
│   ├── providers/                # Data provider plugins
│   │   ├── yahoo-finance.provider.ts
│   │   ├── newsapi.provider.ts
│   │   └── world-bank.provider.ts
│   ├── analytics/                # Analytics plugins
│   │   └── sentiment.analytics.ts
│   ├── ai/                       # AI provider plugins
│   │   └── google-gemini.provider.ts
│   ├── output/                   # Output format plugins
│   │   └── pdf.output.ts
│   ├── base/                     # Base plugin classes
│   ├── interfaces/               # Plugin interfaces
│   └── sdk/                      # Plugin development SDK
├── services/                      # Business logic services
│   └── research.service.ts       # Main research service
├── migration/                     # Migration tools
│   └── migrate-to-microkernel.ts # Migration script
└── types.ts                      # Shared type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- API keys for external services (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd market-research

# Install dependencies
pnpm install

# Set up environment variables (optional)
cp .env.example .env
# Edit .env with your API keys
```

### Quick Start

```bash
# Run the system with example research
pnpm start

# Or use the CLI
pnpm cli quick

# Check system status
pnpm cli status
```

## 🔌 Plugin System

### Available Plugins

#### Data Providers
- **Yahoo Finance Provider** - Financial market data
- **NewsAPI Provider** - News articles and industry news
- **World Bank Provider** - Economic indicators

#### Analytics Providers
- **Sentiment Analytics Provider** - Text sentiment analysis

#### AI Providers
- **Google Gemini Provider** - AI text generation and analysis

#### Output Providers
- **PDF Output Provider** - PDF report generation

### Creating Custom Plugins

1. **Extend BasePlugin**
```typescript
import { BasePlugin } from '../base/base-plugin.js';
import { IDataProvider } from '../interfaces/data-provider.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';

export class MyCustomProvider extends BasePlugin implements IDataProvider {
  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'my-custom-provider',
      name: 'My Custom Provider',
      version: '1.0.0',
      description: 'Custom data provider',
      author: 'Your Name',
      category: 'data-provider',
      dependencies: [],
      entryPoint: 'my-custom-provider.ts',
      permissions: ['read_data'],
      tags: ['custom', 'data']
    });

    super(manifest);
  }

  // Implement required methods...
}
```

2. **Register the Plugin**
```typescript
import { microkernel } from '../core/microkernel.js';
import { MyCustomProvider } from './my-custom-provider.js';

const provider = new MyCustomProvider();
await microkernel.loadPlugin(provider.manifest);
```

## 🛠️ Usage Examples

### Basic Research

```typescript
import { researchService } from './services/research.service.js';
import { ResearchParams } from './types.js';

const params: ResearchParams = {
  industry: "technology",
  region: "North America",
  researchType: "market-trends",
  timeFrame: "2024-2025",
  includeFinancialData: true,
  includeSocialSentiment: true,
  includeNewsAnalysis: true,
};

const result = await researchService.generateMarketResearch(params);
console.log(`PDF generated: ${result.pdfPath}`);
```

### Using the CLI

```bash
# Interactive mode
pnpm cli --interactive

# Command line options
pnpm cli --industry technology --region "North America" --financial --news

# Quick research
pnpm cli quick

# Check system status
pnpm cli status
```

### Working with Plugins

```typescript
import { microkernel } from './core/microkernel.js';

// Get all plugins
const plugins = microkernel.getPlugins();

// Get plugins by category
const dataProviders = microkernel.getPluginsByCategory('data-provider');

// Get a specific plugin
const plugin = microkernel.getPlugin('yahoo-finance-provider');

// Check plugin health
const isHealthy = await plugin.instance.isHealthy();
```

## 🔄 Migration from Old Architecture

### Automatic Migration

```bash
# Run the migration tool
pnpm run migrate

# Run migration with test
pnpm run migrate --test

# Check migration status
pnpm run migrate --status
```

### Manual Migration Steps

1. **Update Imports**
```typescript
// Old
import { researchService } from './src/services/research.service.js';

// New
import { researchService } from './services/research.service.js';
```

2. **Update Function Calls**
```typescript
// Old
const result = await generateMarketResearch(params);

// New
const result = await researchService.generateMarketResearch(params);
```

3. **Use Plugin System**
```typescript
// Old - Direct provider usage
import { YahooFinanceProvider } from './src/plugins/providers/yahoo-finance.provider.js';

// New - Plugin system
const plugins = microkernel.getPluginsByCategory('data-provider');
const yahooProvider = plugins.find(p => p.manifest.id === 'yahoo-finance-provider');
```

## 📊 System Monitoring

### Status Information

```typescript
import { microkernel } from './core/microkernel.js';

const status = microkernel.getStatus();
console.log(`Plugins: ${status.plugins.active}/${status.plugins.total} active`);
console.log(`Services: ${status.services.resolved}/${status.services.total} resolved`);
console.log(`Uptime: ${Math.round(status.uptime / 1000)}s`);
```

### Event Monitoring

```typescript
import { microkernel } from './core/microkernel.js';

// Subscribe to events
microkernel.subscribeToEvents('research.started', (event) => {
  console.log('Research started:', event.data);
});

microkernel.subscribeToEvents('research.completed', (event) => {
  console.log('Research completed:', event.data);
});
```

## 🔧 Configuration

### Environment Variables

```bash
# AI Provider
GOOGLE_API_KEY=your_gemini_api_key

# Data Providers
NEWS_API_KEY=your_newsapi_key
GNEWS_API_KEY=your_gnews_key

# System Configuration
NODE_ENV=development
LOG_LEVEL=info
```

### Plugin Configuration

```typescript
import { microkernel } from './core/microkernel.js';

// Configure a plugin
await microkernel.setConfig('yahoo-finance-provider.timeout', 15000);
await microkernel.setConfig('pdf-output-provider.outputDirectory', './custom-reports');
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test categories
pnpm test:plugins
pnpm test:services
pnpm test:integration
```

### Plugin Testing

```typescript
import { MyCustomProvider } from './my-custom-provider.js';

describe('MyCustomProvider', () => {
  let provider: MyCustomProvider;

  beforeEach(() => {
    provider = new MyCustomProvider();
  });

  it('should be healthy', async () => {
    const isHealthy = await provider.isHealthy();
    expect(isHealthy).toBe(true);
  });
});
```

## 🚀 Deployment

### Production Setup

```bash
# Build the project
pnpm build

# Start in production mode
NODE_ENV=production pnpm start

# Use PM2 for process management
pm2 start ecosystem.config.js
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 📈 Performance

### Optimization Tips

1. **Plugin Lazy Loading** - Plugins are loaded on-demand
2. **Event-Driven Architecture** - Asynchronous processing
3. **Caching** - Built-in caching for data providers
4. **Connection Pooling** - Efficient resource management

### Monitoring

```typescript
// Performance metrics
const metrics = await provider.getPerformanceMetrics();
console.log(`Average processing time: ${metrics.averageProcessingTime}ms`);
console.log(`Success rate: ${metrics.successRate * 100}%`);
```

## 🔒 Security

### Plugin Security

- **Sandboxing** - Plugins run in isolated contexts
- **Permission System** - Granular permissions for plugins
- **Input Validation** - All inputs are validated
- **Rate Limiting** - Built-in rate limiting for external APIs

### Best Practices

1. **Validate Plugin Manifests** - Always validate plugin metadata
2. **Use HTTPS** - All external API calls use HTTPS
3. **API Key Management** - Secure storage of API keys
4. **Logging** - Comprehensive audit logging

## 🤝 Contributing

### Plugin Development

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement your plugin**
4. **Add tests**
5. **Submit a pull request**

### Plugin Guidelines

- Follow the plugin interface contracts
- Include comprehensive tests
- Document your plugin thoroughly
- Use semantic versioning
- Include example usage

## 📚 API Reference

### Core Interfaces

- `IMicrokernel` - Main microkernel interface
- `IPlugin` - Base plugin interface
- `IDataProvider` - Data provider interface
- `IAIProvider` - AI provider interface
- `IAnalyticsProvider` - Analytics provider interface
- `IOutputFormatProvider` - Output format interface

### Service Interfaces

- `IEventBus` - Event bus interface
- `IServiceContainer` - Service container interface
- `IConfigManager` - Configuration manager interface
- `ILifecycleManager` - Lifecycle manager interface

## 🐛 Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Check plugin manifest validity
   - Verify dependencies are met
   - Check console for error messages

2. **API Rate Limits**
   - Configure rate limiting in plugin config
   - Use multiple providers for redundancy
   - Implement caching strategies

3. **Memory Issues**
   - Monitor plugin memory usage
   - Implement proper cleanup in plugins
   - Use streaming for large datasets

### Debug Mode

```bash
# Enable debug mode
DEBUG=* pnpm start

# Enable specific debug categories
DEBUG=microkernel:*,plugin:* pnpm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Plugin Architecture** - Inspired by modern plugin systems
- **Event-Driven Design** - Based on reactive programming principles
- **Microkernel Pattern** - Following established architectural patterns

---

For more information, see the [Plugin Development Guide](docs/plugin-development-guide.md) and [Architecture Documentation](docs/architecture.md).
