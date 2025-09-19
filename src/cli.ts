#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { loadEnvFile } from "process";
import { microkernel } from "./core/microkernel.js";
import { researchService } from "./services/research.service.js";
import type { ResearchParams, Industry, Region, ResearchType } from "./types.js";

import { YahooFinanceProvider } from "./plugins/providers/yahoo-finance.provider.js";
import { NewsAPIProvider } from "./plugins/providers/newsapi.provider.js";
import { WorldBankProvider } from "./plugins/providers/world-bank.provider.js";
import { SentimentAnalyticsProvider } from "./plugins/analytics/sentiment.analytics.js";
import { GoogleGeminiProvider } from "./plugins/ai/google-gemini.provider.js";
import { PDFOutputProvider } from "./plugins/output/pdf.output.js";

loadEnvFile();

const program = new Command();

program
  .name("market-research")
  .description("Generate comprehensive market research reports using microkernel architecture")
  .version("2.0.0");

program
  .option("-i, --industry <industry>", "Industry to research")
  .option("-r, --region <region>", "Geographic region")
  .option("-t, --type <type>", "Research type")
  .option("-f, --timeframe <timeframe>", "Time frame for research")
  .option("--financial", "Include financial data")
  .option("--sentiment", "Include social sentiment analysis")
  .option("--news", "Include news analysis")
  .option("--interactive", "Use interactive prompts");

async function initializeSystem() {
  try {
    console.log('🚀 Initializing Market Research System...\n');

    await microkernel.start();
    console.log('✅ Microkernel started\n');

    await registerPlugins();
    console.log('✅ Plugins registered\n');

    await researchService.initializeProviders();
    console.log('✅ Research service initialized\n');

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize system:', error);
    return false;
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

async function getInteractiveParams(): Promise<ResearchParams> {
  const questions = [
    {
      type: "list",
      name: "industry",
      message: "Select the industry to research:",
      choices: [
        { name: "Technology", value: "technology" },
        { name: "Healthcare", value: "healthcare" },
        { name: "Finance", value: "finance" },
        { name: "Retail", value: "retail" },
        { name: "Automotive", value: "automotive" },
        { name: "Energy", value: "energy" },
        { name: "Telecommunications", value: "telecommunications" },
        { name: "Tourism", value: "tourism" },
        { name: "Real Estate", value: "real-estate" },
        { name: "Manufacturing", value: "manufacturing" },
        { name: "Custom", value: "custom" },
      ],
    },
    {
      type: "input",
      name: "customIndustry",
      message: "Enter custom industry:",
      when: (answers: any) => answers.industry === "custom",
      validate: (input: string) => input.length > 0 || "Industry name is required",
    },
    {
      type: "list",
      name: "region",
      message: "Select the geographic region:",
      choices: [
        { name: "MENA (Middle East & North Africa)", value: "MENA" },
        { name: "MEA (Middle East & Africa)", value: "MEA" },
        { name: "North America", value: "North America" },
        { name: "Europe", value: "Europe" },
        { name: "Asia Pacific", value: "Asia Pacific" },
        { name: "Latin America", value: "Latin America" },
        { name: "Africa", value: "Africa" },
        { name: "Custom", value: "custom" },
      ],
    },
    {
      type: "input",
      name: "customRegion",
      message: "Enter custom region:",
      when: (answers: any) => answers.region === "custom",
      validate: (input: string) => input.length > 0 || "Region name is required",
    },
    {
      type: "list",
      name: "researchType",
      message: "Select the research type:",
      choices: [
        { name: "Market Trends", value: "market-trends" },
        { name: "Competitive Analysis", value: "competitive-analysis" },
        { name: "Trend Forecasting", value: "trend-forecasting" },
        { name: "Consumer Behavior", value: "consumer-behavior" },
        { name: "Market Size", value: "market-size" },
        { name: "Investment Analysis", value: "investment-analysis" },
        { name: "Custom", value: "custom" },
      ],
    },
    {
      type: "input",
      name: "customResearchType",
      message: "Enter custom research type:",
      when: (answers: any) => answers.researchType === "custom",
      validate: (input: string) => input.length > 0 || "Research type is required",
    },
    {
      type: "list",
      name: "timeFrame",
      message: "Select the time frame:",
      choices: [
        { name: "2024-2025", value: "2024-2025" },
        { name: "2024-2026", value: "2024-2026" },
        { name: "2025-2030", value: "2025-2030" },
        { name: "Custom", value: "custom" },
      ],
    },
    {
      type: "input",
      name: "customTimeFrame",
      message: "Enter custom time frame:",
      when: (answers: any) => answers.timeFrame === "custom",
      validate: (input: string) => input.length > 0 || "Time frame is required",
    },
    {
      type: "confirm",
      name: "includeFinancialData",
      message: "Include financial data and metrics?",
      default: false,
    },
    {
      type: "confirm",
      name: "includeSocialSentiment",
      message: "Include social media sentiment analysis?",
      default: false,
    },
    {
      type: "confirm",
      name: "includeNewsAnalysis",
      message: "Include recent news analysis?",
      default: false,
    },
  ];

  const answers = await inquirer.prompt(questions);

  return {
    industry: answers.industry as Industry,
    region: answers.region as Region,
    researchType: answers.researchType as ResearchType,
    customIndustry: answers.customIndustry,
    customRegion: answers.customRegion,
    customResearchType: answers.customResearchType,
    timeFrame: answers.timeFrame,
    customTimeFrame: answers.customTimeFrame,
    includeFinancialData: answers.includeFinancialData,
    includeSocialSentiment: answers.includeSocialSentiment,
    includeNewsAnalysis: answers.includeNewsAnalysis,
  };
}

function parseCommandLineParams(options: any): ResearchParams {
  return {
    industry: (options.industry as Industry) || "tourism",
    region: (options.region as Region) || "MENA",
    researchType: (options.type as ResearchType) || "market-trends",
    timeFrame: options.timeframe || "2024-2025",
    includeFinancialData: options.financial || false,
    includeSocialSentiment: options.sentiment || false,
    includeNewsAnalysis: options.news || false,
  };
}

async function runResearch(params: ResearchParams) {
  console.log("🚀 Starting market research with microkernel architecture...");
  console.log(`📊 Industry: ${params.industry}`);
  console.log(`🌍 Region: ${params.region}`);
  console.log(`🔍 Research Type: ${params.researchType}`);
  console.log(`⏰ Time Frame: ${params.timeFrame}`);

  try {
    const result = await researchService.generateMarketResearch(params);
    console.log("✅ Research completed successfully!");
    console.log(`📄 PDF Report: ${result.pdfPath}`);
    console.log(`📊 Sources found: ${result.sources.length}`);
    console.log(`📈 Charts generated: ${result.chartConfigs.length}`);

    const status = microkernel.getStatus();
    console.log('\n📋 System Status:');
    console.log(`   - Plugins: ${status.plugins.active}/${status.plugins.total} active`);
    console.log(`   - Services: ${status.services.resolved}/${status.services.total} resolved`);
    console.log(`   - Uptime: ${Math.round(status.uptime / 1000)}s`);

  } catch (error) {
    console.error("❌ Error during research:", error);
    process.exit(1);
  }
}

program.action(async (options) => {

  const initialized = await initializeSystem();
  if (!initialized) {
    process.exit(1);
  }

  let params: ResearchParams;

  if (options.interactive) {
    console.log("🎯 Interactive Market Research Tool\n");
    params = await getInteractiveParams();
  } else {
    params = parseCommandLineParams(options);
  }

  await runResearch(params);
});

program
  .command("quick")
  .description("Quick research with default settings")
  .action(async () => {
    const initialized = await initializeSystem();
    if (!initialized) {
      process.exit(1);
    }

    const defaultParams: ResearchParams = {
      industry: "tourism",
      region: "MENA",
      researchType: "market-trends",
      timeFrame: "2024-2025",
      includeFinancialData: true,
      includeSocialSentiment: true,
      includeNewsAnalysis: true,
    };

    await runResearch(defaultParams);
  });

program
  .command("status")
  .description("Check system status and plugin health")
  .action(async () => {
    const initialized = await initializeSystem();
    if (!initialized) {
      process.exit(1);
    }

    const status = microkernel.getStatus();
    console.log('\n📋 System Status:');
    console.log(`   - Running: ${status.isRunning}`);
    console.log(`   - Uptime: ${Math.round(status.uptime / 1000)}s`);
    console.log(`   - Plugins: ${status.plugins.active}/${status.plugins.total} active`);
    console.log(`   - Services: ${status.services.resolved}/${status.services.total} resolved`);

    const plugins = microkernel.getPlugins();
    console.log('\n🔌 Plugin Status:');
    plugins.forEach(plugin => {
      const statusIcon = plugin.status === 'active' ? '✅' : '❌';
      console.log(`   ${statusIcon} ${plugin.manifest.name} (${plugin.status})`);
    });
  });

program
  .command("list")
  .description("List available industries, regions, and research types")
  .action(() => {
    console.log("📋 Available Options:\n");

    console.log("🏭 Industries:");
    console.log("  - technology, healthcare, finance, retail, automotive");
    console.log(
      "  - energy, telecommunications, tourism, real-estate, manufacturing"
    );
    console.log("  - custom (with --interactive)\n");

    console.log("🌍 Regions:");
    console.log("  - MENA, MEA, North America, Europe, Asia Pacific");
    console.log("  - Latin America, Africa, custom (with --interactive)\n");

    console.log("🔍 Research Types:");
    console.log("  - market-trends, competitive-analysis, trend-forecasting");
    console.log("  - consumer-behavior, market-size, investment-analysis");
    console.log("  - custom (with --interactive)\n");

    console.log("⏰ Time Frames:");
    console.log(
      "  - 2024-2025, 2024-2026, 2025-2030, custom (with --interactive)\n"
    );

    console.log("📊 Additional Options:");
    console.log("  --financial    Include financial data");
    console.log("  --sentiment    Include social sentiment analysis");
    console.log("  --news         Include news analysis");
    console.log("  --interactive  Use interactive prompts");
  });

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

program.parse();
