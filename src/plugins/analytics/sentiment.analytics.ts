import { BasePlugin } from '../base/base-plugin.js';
import type { IAnalyticsProvider, ISentimentAnalysis, IAnalyticsConfig, IAnalyticsRequest, IAnalyticsResult } from '../interfaces/analytics.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';

export class SentimentAnalyticsProvider extends BasePlugin implements IAnalyticsProvider {
  private positiveWords = new Set([
    'growth', 'profit', 'increase', 'positive', 'strong', 'success', 'opportunity',
    'innovation', 'expansion', 'gain', 'rise', 'surge', 'boost', 'improve',
    'excellent', 'outstanding', 'leading', 'dominant', 'breakthrough', 'revolutionary'
  ]);

  private negativeWords = new Set([
    'decline', 'loss', 'decrease', 'negative', 'weak', 'failure', 'risk',
    'recession', 'crisis', 'drop', 'fall', 'crash', 'bankruptcy', 'struggle',
    'poor', 'worst', 'declining', 'troubled', 'failing', 'collapsing'
  ]);

  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'sentiment-analytics-provider',
      name: 'Sentiment Analytics Provider',
      version: '1.0.0',
      description: 'Provides sentiment analysis for text and news articles',
      author: 'Market Research Team',
      category: 'analytics',
      dependencies: [],
      entryPoint: 'sentiment.analytics.ts',
      permissions: ['analyze_sentiment'],
      tags: ['sentiment', 'analysis', 'nlp'],
      configSchema: {
        enabled: { type: 'boolean', required: false, default: true },
        batchSize: { type: 'number', required: false, default: 100 },
        processingTimeout: { type: 'number', required: false, default: 30000 },
        cacheEnabled: { type: 'boolean', required: false, default: true },
        cacheTTL: { type: 'number', required: false, default: 300000 }
      }
    });

    super(manifest);
  }

  getSupportedTypes(): string[] {
    return ['sentiment'];
  }

  supportsType(type: string): boolean {
    return type === 'sentiment';
  }

  async analyzeSentiment(data: any, options?: any): Promise<ISentimentAnalysis> {
    const startTime = Date.now();

    try {

      const newsSentiment = await this.analyzeNewsSentiment(data.newsArticles || []);

      const socialSentiment = await this.analyzeSocialSentiment(data.industry, data.region);

      const financialSentiment = await this.analyzeFinancialSentiment(data.industry);

      const overallScore = this.calculateOverallScore(newsSentiment, socialSentiment, financialSentiment);
      const overall = this.getSentimentLabel(overallScore);

      const trends = await this.generateSentimentTrends(data.industry, data.region);

      const keywords = this.extractKeywords(data.newsArticles || []);

      const processingTime = Date.now() - startTime;

      return {
        overall,
        score: overallScore,
        confidence: this.calculateConfidence(newsSentiment, socialSentiment, financialSentiment),
        sources: {
          news: newsSentiment,
          social: socialSentiment,
          financial: financialSentiment,
        },
        trends,
        keywords,
      };
    } catch (error) {
      this.log(`Sentiment analysis failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  }




  override getConfig(): IAnalyticsConfig {
    return {
      enabled: this.getConfigValue('enabled', true),
      batchSize: this.getConfigValue('batchSize', 100),
      processingTimeout: this.getConfigValue('processingTimeout', 30000),
      cacheEnabled: this.getConfigValue('cacheEnabled', true),
      cacheTTL: this.getConfigValue('cacheTTL', 300000),
      maxRetries: this.getConfigValue('maxRetries', 3)
    };
  }

  override async updateConfig(config: Partial<IAnalyticsConfig>): Promise<void> {
    await this.updateConfig(config);
  }


  private async analyzeNewsSentiment(articles: any[]): Promise<any> {
    if (articles.length === 0) {
      return { score: 0, count: 0, recent: false };
    }

    let totalScore = 0;
    let recentCount = 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const article of articles) {
      const articleScore = this.analyzeTextSentiment(article.title + ' ' + article.description);
      totalScore += articleScore;

      if (article.publishedAt > oneWeekAgo) {
        recentCount++;
      }
    }

    return {
      score: totalScore / articles.length,
      count: articles.length,
      recent: recentCount > articles.length * 0.3,
    };
  }

  private async analyzeSocialSentiment(industry: string, region: string): Promise<any> {
    // Mock social sentiment analysis
    const score = 0.1; // Slightly positive baseline
    return {
      score,
      count: 500,
      recent: true,
    };
  }

  private async analyzeFinancialSentiment(industry: string): Promise<any> {
    // Mock financial sentiment analysis
    const score = 0.05; // Slightly positive baseline
    return {
      score,
      count: 25,
      recent: true,
    };
  }

  private analyzeTextSentiment(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (this.positiveWords.has(word)) {
        positiveCount++;
      } else if (this.negativeWords.has(word)) {
        negativeCount++;
      }
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  private calculateOverallScore(news: any, social: any, financial: any): number {
    const weights = { news: 0.3, social: 0.2, financial: 0.5 };

    return (
      news.score * weights.news +
      social.score * weights.social +
      financial.score * weights.financial
    );
  }

  private getSentimentLabel(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(news: any, social: any, financial: any): number {
    const dataPoints = news.count + social.count + financial.count;
    const recentFactor = (news.recent && social.recent && financial.recent) ? 1.2 : 1.0;

    return Math.min(0.9, (dataPoints / 1000) * recentFactor);
  }

  private async generateSentimentTrends(industry: string, region: string): Promise<any[]> {
    const periods = ['1 month ago', '2 months ago', '3 months ago', '6 months ago'];
    const trends: any[] = [];

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const baseScore = 0.1 - (i * 0.05); // Gradual improvement over time
      const change = i > 0 ? 0.05 : 0; // Consistent improvement

      trends.push({
        period,
        score: baseScore,
        change,
      });
    }

    return trends;
  }

  private extractKeywords(articles: any[]): any[] {
    const keywordMap = new Map<string, { positive: number; negative: number; neutral: number }>();

    for (const article of articles) {
      const words = (article.title + ' ' + article.description).toLowerCase().split(/\s+/);

      for (const word of words) {
        if (word.length < 4) continue;

        if (!keywordMap.has(word)) {
          keywordMap.set(word, { positive: 0, negative: 0, neutral: 0 });
        }

        const sentiment = this.analyzeTextSentiment(word);
        const entry = keywordMap.get(word)!;

        if (sentiment > 0.1) entry.positive++;
        else if (sentiment < -0.1) entry.negative++;
        else entry.neutral++;
      }
    }

    return Array.from(keywordMap.entries())
      .filter(([_, counts]) => counts.positive + counts.negative + counts.neutral >= 2)
      .map(([word, counts]) => {
        const total = counts.positive + counts.negative + counts.neutral;
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        let impact = 0;

        if (counts.positive > counts.negative && counts.positive > counts.neutral) {
          sentiment = 'positive';
          impact = counts.positive / total;
        } else if (counts.negative > counts.positive && counts.negative > counts.neutral) {
          sentiment = 'negative';
          impact = counts.negative / total;
        }

        return {
          word,
          sentiment,
          frequency: total,
          impact,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }
}
