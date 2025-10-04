import { microkernel } from '../core/microkernel.js';
import type { ResearchParams, ResearchResult, Source } from '../types.js';
import type { IDataProvider } from '../plugins/interfaces/data-provider.interface.js';
import type { IAnalyticsProvider } from '../plugins/interfaces/analytics.interface.js';
import type { IAIProvider } from '../plugins/interfaces/ai-provider.interface.js';
import type { IOutputFormatProvider } from '../plugins/interfaces/output-format.interface.js';

export class ResearchService {
  private dataProviders: IDataProvider[] = [];
  private analyticsProviders: IAnalyticsProvider[] = [];
  private aiProviders: IAIProvider[] = [];
  private outputProviders: IOutputFormatProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  public async initializeProviders() {
    try {
      console.log('🔧 Initializing research service providers...');

      const plugins = microkernel.getPlugins();
      console.log(`📦 Total plugins registered: ${plugins.length}`);

      for (const plugin of plugins) {
        console.log(`🔍 Checking plugin: ${plugin.manifest?.id} (status: ${plugin.status})`);

        if (plugin.status === 'active') {
          const instance = plugin.instance;

          if (this.isDataProvider(instance)) {
            console.log(`📊 Found data provider: ${plugin.manifest?.id}`);
            this.dataProviders.push(instance);
          } else if (this.isAnalyticsProvider(instance)) {
            console.log(`📈 Found analytics provider: ${plugin.manifest?.id}`);
            this.analyticsProviders.push(instance);
          } else if (this.isAIProvider(instance)) {
            console.log(`🤖 Found AI provider: ${plugin.manifest?.id}`);
            this.aiProviders.push(instance);
          } else if (this.isOutputProvider(instance)) {
            console.log(`📄 Found output provider: ${plugin.manifest?.id}`);
            this.outputProviders.push(instance);
          } else {
            console.log(`❓ Unknown plugin type: ${plugin.manifest?.id}`);
          }
        } else {
          console.log(`⚠️ Plugin ${plugin.manifest?.id} is not active (status: ${plugin.status})`);
        }
      }

      console.log(`✅ Research service initialized with:
        - ${this.dataProviders.length} data providers
        - ${this.analyticsProviders.length} analytics providers
        - ${this.aiProviders.length} AI providers
        - ${this.outputProviders.length} output providers`);
    } catch (error) {
      console.error('❌ Failed to initialize research service:', error);
    }
  }

  async generateMarketResearch(params: ResearchParams): Promise<ResearchResult> {
    const startTime = Date.now();

    try {
      console.log('🔍 Starting market research...');

      await microkernel.publishEvent({
        type: 'research.started',
        data: { params },
        source: 'research-service'
      });

      console.log('📊 Step 1: Collecting data from providers...');
      const data = await this.collectData(params);
      console.log('✅ Data collection completed');

      console.log('🤖 Step 2: Generating market trends using AI...');
      const marketTrends = await this.generateMarketTrends(params, data);
      console.log('✅ Market trends generation completed');

      console.log('📈 Step 3: Extracting chart data...');
      const chartConfigs = await this.extractChartData(marketTrends);
      console.log('✅ Chart data extraction completed');

      console.log('📄 Step 4: Generating HTML report...');
      const htmlReport = await this.generateHTMLReport(chartConfigs, marketTrends, data.sources);
      console.log('✅ HTML report generation completed');

      console.log('📋 Step 5: Generating PDF...');
      const pdfPath = await this.generatePDF(htmlReport, params);
      console.log('✅ PDF generation completed');

      const processingTime = Date.now() - startTime;
      console.log(`⏱️ Total processing time: ${processingTime}ms`);

      const result: ResearchResult = {
        marketTrends,
        sources: data.sources,
        chartConfigs,
        htmlReport,
        pdfPath,
      };

      await microkernel.publishEvent({
        type: 'research.completed',
        data: { result, processingTime },
        source: 'research-service'
      });

      return result;
    } catch (error) {
      console.error('❌ Research error:', error);

      await microkernel.publishEvent({
        type: 'research.error',
        data: { error: error instanceof Error ? error.message : String(error), params },
        source: 'research-service'
      });

      throw error;
    }
  }

  private async collectData(params: ResearchParams): Promise<{ sources: Source[]; additionalData: string }> {
    const sources: Source[] = [];
    let additionalData = '';

    if (params.includeFinancialData) {
      try {
        const industry = params.industry === "custom" ? (params.customIndustry || 'technology') : params.industry;
        const symbols = this.getIndustrySymbols(industry);

        for (const provider of this.dataProviders) {
          if (provider.supportsDataType('market') && provider.getMarketData) {
            const result = await provider.getMarketData(symbols);
            if (result.success && result.data.length > 0) {
              additionalData += "\n\nFinancial Market Data:\n";
              result.data.forEach((data: any) => {
                additionalData += `- ${data.symbol}: $${data.price} (${data.changePercent?.toFixed(2)}%)\n`;
              });

              sources.push({
                type: "source",
                id: `financial-${provider.manifest.id}`,
                sourceType: "url",
                url: "https://finance.yahoo.com",
                title: "Financial Market Data",
                providerMetadata: { provider: provider.manifest.id }
              });
              break; 
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch financial data:", error);
      }
    }

    if (params.includeNewsAnalysis) {
      try {
        const industry = params.industry === "custom" ? (params.customIndustry || 'technology') : params.industry;

        for (const provider of this.dataProviders) {
          if (provider.supportsDataType('news') && provider.getIndustryNews) {
            const result = await provider.getIndustryNews(industry, 5);
            if (result.success && result.data.length > 0) {
              additionalData += "\n\nRecent News:\n";
              result.data.forEach((article: any) => {
                additionalData += `- ${article.title} (${article.source})\n`;
              });

              sources.push({
                type: "source",
                id: `news-${provider.manifest.id}`,
                sourceType: "url",
                url: "https://newsapi.org",
                title: "Industry News",
                providerMetadata: { provider: provider.manifest.id }
              });
              break; 
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch news data:", error);
      }
    }

    return { sources, additionalData };
  }

  private async generateMarketTrends(params: ResearchParams, data: { sources: Source[]; additionalData: string }): Promise<string> {
    console.log('🤖 Starting market trends generation...');
    console.log(`📝 Available AI providers: ${this.aiProviders.length}`);

    const prompt = this.generateResearchPrompt(params);
    const enhancedPrompt = prompt + data.additionalData;

    console.log('📝 Generated prompt length:', enhancedPrompt.length);

    if (this.aiProviders.length === 0) {
      console.warn('No AI providers available, returning basic market trends');
      return this.generateBasicMarketTrends(params, data);
    }

    for (const aiProvider of this.aiProviders) {
      try {
        console.log(`🤖 Trying AI provider: ${aiProvider.manifest.id}`);

        const tools = [];
        try {
          const { google } = await import('@ai-sdk/google');
          tools.push(google.tools.googleSearch({}));
          console.log('🔍 Google Search tool loaded');
        } catch (error) {
          console.warn('Google Search tool not available:', error);
        }

        console.log('🤖 Calling AI provider generateText...');
        const response = await aiProvider.generateText({
          prompt: enhancedPrompt,
          tools: tools.length > 0 ? tools as any : undefined,
          model: 'gemini-2.5-flash'
        });
        console.log('✅ AI provider response received');

        if (response.sources && response.sources.length > 0) {
          data.sources.push(...response.sources);
        }

        return response.text;
      } catch (error) {
        console.warn(`AI provider ${aiProvider.manifest.id} failed:`, error instanceof Error ? error.message : String(error));

      }
    }

    console.warn('All AI providers failed, returning basic market trends');
    return this.generateBasicMarketTrends(params, data);
  }

  private generateBasicMarketTrends(params: ResearchParams, data: { sources: Source[]; additionalData: string }): string {
    const industry = params.industry === "custom" ? params.customIndustry : params.industry;
    const region = params.region === "custom" ? params.customRegion : params.region;
    const researchType = params.researchType === "custom" ? params.customResearchType : params.researchType;
    const timeFrame = params.timeFrame === "custom" ? params.customTimeFrame : params.timeFrame;

    return `Market Research Report: ${industry} Industry in ${region}

Executive Summary:
This report provides a comprehensive analysis of the ${industry} industry in the ${region} region for the period ${timeFrame}. The analysis covers market trends, competitive landscape, and future outlook.

Key Findings:
- The ${industry} industry in ${region} is experiencing steady growth
- Market competition is intensifying with new entrants
- Technology adoption is driving innovation across the sector
- Regulatory changes are impacting market dynamics

Market Trends:
1. Digital Transformation: Companies are increasingly adopting digital technologies
2. Sustainability Focus: Environmental considerations are becoming more important
3. Consumer Behavior: Changing preferences are reshaping market demands
4. Globalization: International markets are influencing local dynamics

${data.additionalData}

Note: This is a basic analysis generated without AI assistance. For more detailed insights, please ensure AI providers are properly configured.`;
  }

  private async extractChartData(marketTrends: string): Promise<any[]> {
    console.log('📈 Starting chart data extraction...');

    if (this.aiProviders.length === 0) {
      console.warn('No AI providers available, returning basic chart configs');
      return this.generateBasicChartConfigs();
    }

    for (const aiProvider of this.aiProviders) {
      try {
        console.log(`🤖 Trying AI provider for chart extraction: ${aiProvider.manifest.id}`);

        const { modelChartSchema } = await import('../schema.js');

        const chartData = await aiProvider.generateStructuredData({
          prompt: `Given the following market trends text, come up with a list of 1-3 meaningful bar or line charts and generate chart data.

Market Trends:
${marketTrends}`,
          schema: modelChartSchema
        });

        console.log('✅ Chart data extracted successfully');
        return (chartData as any).chartConfigurations.map((config: any) => this.createChartConfig(config));
      } catch (error) {
        console.warn(`AI provider ${aiProvider.manifest.id} failed for chart extraction:`, error instanceof Error ? error.message : String(error));

      }
    }

    console.warn('All AI providers failed for chart extraction, returning basic charts');
    return this.generateBasicChartConfigs();
  }

  private generateBasicChartConfigs(): any[] {
    return [
      this.createChartConfig({
        title: 'Market Growth Trends',
        type: 'bar',
        labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        label: 'Market Growth (%)',
        data: [12, 15, 18, 22],
        colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
      }),
      this.createChartConfig({
        title: 'Industry Performance',
        type: 'line',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        label: 'Performance Index',
        data: [100, 105, 110, 108, 115, 120],
        colors: ['#4facfe']
      })
    ];
  }

  private async generateHTMLReport(chartConfigs: any[], marketTrends: string, sources: Source[]): Promise<string> {
    console.log('📄 Starting HTML report generation...');

    if (this.aiProviders.length === 0) {
      console.warn('No AI providers available, returning basic HTML report');
      return this.generateBasicHTMLReport(chartConfigs, marketTrends, sources);
    }

    for (const aiProvider of this.aiProviders) {
      try {
        console.log(`🤖 Trying AI provider for HTML generation: ${aiProvider.manifest.id}`);

        const response = await aiProvider.generateText({
          prompt: `You are an expert financial analyst and report writer.
Your task is to generate a comprehensive market analysis report in HTML format.

**CRITICAL INSTRUCTIONS:**
1. Write a complete HTML document starting with <!DOCTYPE html> and ending with </html>
2. Use the provided "Market Trends" text to write the main body of the report. Structure it with clear headings and paragraphs.
3. Incorporate the provided "Chart Configurations" to visualize the data. For each chart, you MUST create a unique <canvas> element and a corresponding <script> block to render it using Chart.js.
4. Reference the "Sources" at the end of the report.
5. Do not include any placeholder data; use only the information provided.
6. **IMPORTANT: Return ONLY the raw HTML code without any markdown formatting, code blocks, or backticks. Do not wrap the HTML in \`\`\`html or \`\`\` tags.**

**Chart Rendering Snippet:**
Include this script in the head of the HTML: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
For each chart, use a structure like below, ensuring the canvas 'id' is unique for each chart, and apply the corresponding config:

<div style="width: 800px; height: 600px;">
  <canvas id="chart1"></canvas>
</div>
<script>
  new Chart(document.getElementById('chart1'), config);
</script>

(For the second chart, use 'chart2' and the corresponding config, and so on.)

**Data:**
- Market Trends: ${marketTrends}
- Chart Configurations: ${JSON.stringify(chartConfigs)}
- Sources: ${JSON.stringify(sources)}

**Remember: Return ONLY the HTML code, no markdown formatting!**`
        });

        console.log('✅ HTML report generated successfully');

        let cleanedHtml = response.text;

        cleanedHtml = cleanedHtml.replace(/^```html\s*/i, ''); 
        cleanedHtml = cleanedHtml.replace(/^```\s*/i, ''); 
        cleanedHtml = cleanedHtml.replace(/\s*```\s*$/i, ''); 

        cleanedHtml = cleanedHtml.trim();

        if (!cleanedHtml.startsWith('<!DOCTYPE html>') && !cleanedHtml.startsWith('<html')) {
          console.warn('Generated HTML does not start with proper HTML declaration, using fallback');
          return this.generateBasicHTMLReport(chartConfigs, marketTrends, sources);
        }

        return cleanedHtml;
      } catch (error) {
        console.warn(`AI provider ${aiProvider.manifest.id} failed for HTML generation:`, error instanceof Error ? error.message : String(error));

      }
    }

    console.warn('All AI providers failed for HTML generation, returning basic HTML report');
    return this.generateBasicHTMLReport(chartConfigs, marketTrends, sources);
  }

  private generateBasicHTMLReport(chartConfigs: any[], marketTrends: string, sources: Source[]): string {
    const chartScripts = chartConfigs.map((config, index) => `
      <div style="width: 800px; height: 600px; margin: 20px 0;">
        <canvas id="chart${index + 1}"></canvas>
      </div>
      <script>
        new Chart(document.getElementById('chart${index + 1}'), ${JSON.stringify(config)});
      </script>
    `).join('');

    const sourcesList = sources.map(source => `<li><a href="${source.url}">${source.title}</a></li>`).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Market Research Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .content { line-height: 1.6; }
        .sources { margin-top: 40px; }
    </style>
</head>
<body>
    <h1>Market Research Report</h1>
    <div class="content">
        <h2>Market Analysis</h2>
        <p>${marketTrends}</p>

        <h2>Charts and Visualizations</h2>
        ${chartScripts}

        <div class="sources">
            <h2>Sources</h2>
            <ul>${sourcesList}</ul>
        </div>
    </div>
</body>
</html>`;
  }

  private async generatePDF(htmlReport: string, params: ResearchParams): Promise<string> {
    console.log('📋 Starting PDF generation...');

    for (const outputProvider of this.outputProviders) {
      try {
        console.log(`📄 Trying output provider: ${outputProvider.manifest.id}`);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `report-${params.industry}-${params.region}-${timestamp}.pdf`;

        const completeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Market Research Report - ${params.industry}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .meta {
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Market Research Report - ${params.industry}</div>
        <div class="meta">
            <div>Region: ${params.region}</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
    </div>

    ${htmlReport}
</body>
</html>`;

        const reportData = {
          title: `Market Research Report - ${params.industry}`,
          date: new Date(),
          summary: 'Comprehensive market analysis report',
          sections: [
            {
              title: 'Market Analysis',
              content: completeHTML, 
              level: 1
            }
          ],
          charts: [],
          tables: [],
          metadata: { industry: params.industry, region: params.region }
        };

        console.log('📄 Calling output provider generateOutput...');
        const result = await outputProvider.generateOutput(reportData, {
          format: 'pdf',
          template: 'professional',
          includeCharts: false,
          includeTables: false,
          includeMetadata: true
        });

        console.log('✅ PDF generation completed successfully');
        return result.filePath || filename;
      } catch (error) {
        console.warn(`Output provider ${outputProvider.manifest.id} failed:`, error instanceof Error ? error.message : String(error));

      }
    }

    console.warn('All output providers failed, returning basic filename');
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `report-${params.industry}-${params.region}-${timestamp}.pdf`;
  }

  private generateResearchPrompt(params: ResearchParams): string {
    const industry = params.industry === "custom" ? params.customIndustry : params.industry;
    const region = params.region === "custom" ? params.customRegion : params.region;
    const researchType = params.researchType === "custom" ? params.customResearchType : params.researchType;
    const timeFrame = params.timeFrame === "custom" ? params.customTimeFrame : params.timeFrame;

    const researchTypePrompts = {
      "market-trends": `Search the web for market trends for ${industry} in ${region} region for ${timeFrame}. I need to know the market size, key players and their market share, and primary consumer drivers.`,
      "competitive-analysis": `Search the web for competitive analysis of ${industry} market in ${region} region for ${timeFrame}. I need to know the major competitors, their market positioning, strengths and weaknesses, and competitive strategies.`,
      "trend-forecasting": `Search the web for trend forecasting and future outlook for ${industry} in ${region} region for ${timeFrame}. I need to know emerging trends, technological advancements, and future market predictions.`,
      "consumer-behavior": `Search the web for consumer behavior analysis in ${industry} market in ${region} region for ${timeFrame}. I need to know consumer preferences, buying patterns, demographics, and behavioral trends.`,
      "market-size": `Search the web for detailed market size analysis of ${industry} in ${region} region for ${timeFrame}. I need to know current market size, growth rates, market segments, and revenue projections.`,
      "investment-analysis": `Search the web for investment analysis and opportunities in ${industry} market in ${region} region for ${timeFrame}. I need to know investment trends, funding patterns, venture capital activity, and ROI projections.`,
    };

    let basePrompt = researchTypePrompts[researchType as keyof typeof researchTypePrompts] || researchTypePrompts["market-trends"];

    const additionalRequirements: string[] = [];
    if (params.includeFinancialData) {
      additionalRequirements.push("Include financial metrics, revenue data, and market valuations");
    }
    if (params.includeSocialSentiment) {
      additionalRequirements.push("Include social media sentiment and public perception");
    }
    if (params.includeNewsAnalysis) {
      additionalRequirements.push("Include recent news analysis and industry developments");
    }

    if (additionalRequirements.length > 0) {
      basePrompt += `\n\nAdditional requirements: ${additionalRequirements.join(", ")}.`;
    }

    return basePrompt;
  }

  private getIndustrySymbols(industry: string): string[] {
    const industrySymbols: Record<string, string[]> = {
      technology: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
      healthcare: ["JNJ", "PFE", "UNH", "ABBV", "MRK"],
      finance: ["JPM", "BAC", "WFC", "GS", "MS"],
      retail: ["WMT", "TGT", "COST", "HD", "LOW"],
      automotive: ["TSLA", "TM", "F", "GM", "HMC"],
      energy: ["XOM", "CVX", "COP", "EOG", "SLB"],
      telecommunications: ["T", "VZ", "TMUS", "CMCSA", "CHTR"],
      tourism: ["MAR", "HLT", "AAL", "UAL", "DAL"],
      "real-estate": ["SPG", "PLD", "AMT", "CCI", "EQIX"],
      manufacturing: ["GE", "CAT", "DE", "BA", "MMM"],
    };

    return industrySymbols[industry] || ["AAPL", "MSFT", "GOOGL"];
  }

  private createChartConfig(chartData: any): any {
    return {
      type: chartData.type,
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: chartData.label,
            data: chartData.data,
            borderWidth: 1,
            ...(chartData.type === "bar" && { backgroundColor: chartData.colors }),
            ...(chartData.type === "line" && chartData.colors.length > 0 && { borderColor: chartData.colors[0] }),
          },
        ],
      },
      options: {
        animation: { duration: 0 }, 
      },
    };
  }

  private isDataProvider(instance: any): instance is IDataProvider {
    return instance && typeof instance.getCapabilities === 'function' && instance.manifest?.category === 'data-provider';
  }

  private isAnalyticsProvider(instance: any): instance is IAnalyticsProvider {
    return instance && typeof instance.getSupportedTypes === 'function' && instance.manifest?.category === 'analytics';
  }

  private isAIProvider(instance: any): instance is IAIProvider {
    return instance && typeof instance.generateText === 'function' && instance.manifest?.category === 'ai-provider';
  }

  private isOutputProvider(instance: any): instance is IOutputFormatProvider {
    return instance && typeof instance.getSupportedFormats === 'function' && instance.manifest?.category === 'output-format';
  }
}

export const researchService = new ResearchService();
