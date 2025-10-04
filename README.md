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
# Create .env file with your API keys if needed
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

### Using the Microkernel

```typescript
import { Microkernel } from './core/microkernel.js';

// Initialize the system
const microkernel = new Microkernel({
  enableDebugMode: true
});

await microkernel.start();

// Load plugins
const yahooProvider = new YahooFinanceProvider();
await microkernel.loadPlugin(yahooProvider.manifest);

// Get system status
const microkernel = new Microkernel();
const status = microkernel.getStatus();
console.log(`Active plugins: ${status.plugins.active}/${status.plugins.total}`);
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
import { Microkernel } from './core/microkernel.js';

const microkernel = new Microkernel();

// Configure system settings
await microkernel.setConfig('timeout', 15000);
await microkernel.setConfig('outputDirectory', './custom-reports');

// Get system status
const status = microkernel.getStatus();
console.log(`Active plugins: ${status.plugins.active}/${status.plugins.total}`);
```

## 🧪 Testing

```bash
# Run all tests
pnpm test
```

## 🚀 Deployment

```bash
# Build the project
pnpm build

# Start in production mode
NODE_ENV=production pnpm dev
```

## 📚 API Reference

### Core Interfaces

- `IMicrokernel` - Main microkernel interface
- `IPlugin` - Base plugin interface
- `IDataProvider` - Data provider interface
- `IAIProvider` - AI provider interface
- `IAnalyticsProvider` - Analytics provider interface
- `IOutputFormatProvider` - Output format interface

---

For more information, see the [Plugin Development Guide](docs/plugin-development-guide.md).
