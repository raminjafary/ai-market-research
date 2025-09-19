# Market Research System

## 🚀 Overview

A comprehensive market research platform that provides automated data collection, analysis, and report generation. The system is built with a modular plugin architecture that allows for easy extension and customization of research capabilities.

## 🏗️ System Architecture

### Core Features

The system provides these key capabilities:

1. **Data Collection** - Automated data gathering from multiple sources
2. **AI Analysis** - Intelligent market trend analysis and insights
3. **Report Generation** - Professional PDF reports with charts and visualizations
4. **Plugin System** - Extensible architecture for custom data sources and analysis
5. **Web Interface** - User-friendly interface for research management
6. **CLI Tools** - Command-line interface for automation and scripting

### Supported Data Sources

The system integrates with various data providers:

- **Financial Data** - Stock prices, market data, economic indicators
- **News Sources** - Industry news, market updates, company announcements
- **AI Analysis** - Market trend analysis, sentiment analysis, predictive insights
- **Report Formats** - PDF reports, HTML dashboards, data exports

## 📁 Project Structure

```
src/
├── core/                          # Core system components
│   ├── microkernel.ts            # Main system orchestrator
│   ├── event-bus.ts              # Event system
│   ├── plugin-registry.ts        # Plugin management
│   ├── service-container.ts      # Service management
│   ├── config-manager.ts         # Configuration
│   ├── lifecycle-manager.ts      # Application lifecycle
│   └── interfaces/               # Core interfaces
├── plugins/                       # Plugin implementations
│   ├── providers/                # Data source plugins
│   │   ├── yahoo-finance.provider.ts
│   │   ├── newsapi.provider.ts
│   │   └── world-bank.provider.ts
│   ├── analytics/                # Analysis plugins
│   │   └── sentiment.analytics.ts
│   ├── ai/                       # AI provider plugins
│   │   └── google-gemini.provider.ts
│   ├── output/                   # Output format plugins
│   │   └── pdf.output.ts
│   ├── base/                     # Base plugin classes
│   ├── interfaces/               # Plugin interfaces
│   └── sdk/                      # Plugin development SDK
├── services/                      # Business logic
│   └── research.service.ts       # Main research service
├── config/                        # Configuration files
│   └── plugin-config.ts         # Plugin configuration
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
pnpm dev

# Or use the CLI
pnpm cli

# Start web interface
pnpm web

# Check system status
pnpm cli status
```

## 🔌 Available Plugins

### Data Sources
- **Yahoo Finance** - Financial market data and stock prices
- **NewsAPI** - News articles and industry updates
- **World Bank** - Economic indicators and statistics

### Analysis Tools
- **Sentiment Analysis** - Text sentiment and market sentiment
- **Google Gemini AI** - AI-powered market analysis and insights

### Output Formats
- **PDF Reports** - Professional PDF report generation

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

### Working with the System

```typescript
import { researchService } from './services/research.service.js';

// Generate market research
const result = await researchService.generateMarketResearch({
  industry: "technology",
  region: "North America",
  researchType: "market-trends",
  timeFrame: "2024-2025",
  includeFinancialData: true,
  includeSocialSentiment: true,
  includeNewsAnalysis: true
});

console.log(`Report generated: ${result.pdfPath}`);
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
```

### Plugin Configuration

```typescript
import { microkernel } from './core/microkernel.js';

// Configure system settings
await microkernel.setConfig('timeout', 15000);
await microkernel.setConfig('outputDirectory', './custom-reports');
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
```

### Plugin Configuration

```typescript
import { microkernel } from './core/microkernel.js';

// Configure system settings
await microkernel.setConfig('timeout', 15000);
await microkernel.setConfig('outputDirectory', './custom-reports');
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test
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
NODE_ENV=production pnpm dev

# Use process manager for production
# Example: pm2 start ecosystem.config.js
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
DEBUG=* pnpm dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Plugin Architecture** - Inspired by modern plugin systems
- **Event-Driven Design** - Based on reactive programming principles
- **Microkernel Pattern** - Following established architectural patterns

---

For more information, see the [Plugin Development Guide](docs/plugin-development-guide.md).
