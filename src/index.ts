#!/usr/bin/env node

import { microkernel } from './core/microkernel.js';
import { researchService } from './services/research.service.js';
import type { ResearchParams } from './types.js';

import { YahooFinanceProvider } from './plugins/providers/yahoo-finance.provider.js';
import { NewsAPIProvider } from './plugins/providers/newsapi.provider.js';
import { WorldBankProvider } from './plugins/providers/world-bank.provider.js';
import { SentimentAnalyticsProvider } from './plugins/analytics/sentiment.analytics.js';
import { GoogleGeminiProvider } from './plugins/ai/google-gemini.provider.js';
import { PDFOutputProvider } from './plugins/output/pdf.output.js';
import { loadEnvFile } from 'process';

loadEnvFile();

async function main() {
  try {
    console.log('🚀 Starting Market Research System with Microkernel Architecture...\n');

    await microkernel.start();
    console.log('✅ Microkernel started successfully\n');

    await registerPlugins();
    console.log('✅ All plugins registered successfully\n');

    await researchService.initializeProviders();
    console.log('✅ Research service initialized\n');

    await runExampleResearch();

  } catch (error) {
    console.error('❌ Failed to start system:', error);
    process.exit(1);
  }
}

import { getProviderConfig } from './config/plugin-config.js';

async function registerPlugins() {

  const yahooFinanceProvider = new YahooFinanceProvider();
  await microkernel.registerPlugin(yahooFinanceProvider, { config: getProviderConfig('yahoo-finance-provider') });

  const newsAPIProvider = new NewsAPIProvider();
  await microkernel.registerPlugin(newsAPIProvider, { config: getProviderConfig('newsapi-provider') });

  const worldBankProvider = new WorldBankProvider();
  await microkernel.registerPlugin(worldBankProvider, { config: getProviderConfig('world-bank-provider') });

  const sentimentAnalyticsProvider = new SentimentAnalyticsProvider();
  await microkernel.registerPlugin(sentimentAnalyticsProvider);

  const googleGeminiProvider = new GoogleGeminiProvider();
  await microkernel.registerPlugin(googleGeminiProvider, { config: getProviderConfig('google-gemini-provider') });

  const pdfOutputProvider = new PDFOutputProvider();
  await microkernel.registerPlugin(pdfOutputProvider);
}

async function runExampleResearch() {
  console.log('📊 Running example market research...\n');

  const params: ResearchParams = {
    industry: "technology",
    region: "North America",
    researchType: "market-trends",
    timeFrame: "2024-2025",
    includeFinancialData: true,
    includeSocialSentiment: true,
    includeNewsAnalysis: true,
  };

  try {
    const result = await researchService.generateMarketResearch(params);

    console.log('✅ Research completed successfully!');
    console.log(`📄 PDF Report: ${result.pdfPath}`);
    console.log(`📊 Sources found: ${result.sources.length}`);
    console.log(`📈 Charts generated: ${result.chartConfigs.length}`);

    const status = microkernel.getStatus();
    console.log('\n📋 System Status:');
    console.log(`   - Plugins: ${status.plugins.active}/${status.plugins.total} active`);
    console.log(`   - Services: ${status.services.resolved}/${status.services.total} resolved`);
    console.log(`   - Uptime: ${Math.round(status.uptime / 1000)}s`);

  } catch (error) {
    console.error('❌ Research failed:', error);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await microkernel.stop();
    console.log('✅ System shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  try {
    await microkernel.stop();
    console.log('✅ System shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

export { researchService, microkernel };

if (import.meta.url.startsWith('file://')) {
  main().catch(console.error);
}
