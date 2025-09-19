import type { IPlugin } from '../../core/interfaces/plugin.interface.js';

export interface IAnalyticsConfig {
  enabled: boolean;
  batchSize?: number;
  processingTimeout?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
}

export interface ISentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  score: number; 
  confidence: number; 
  sources: {
    news: ISentimentSource;
    social: ISentimentSource;
    financial: ISentimentSource;
  };
  trends: ISentimentTrend[];
  keywords: ISentimentKeyword[];
}

export interface ISentimentSource {
  score: number;
  count: number;
  recent: boolean;
}

export interface ISentimentTrend {
  period: string;
  score: number;
  change: number;
}

export interface ISentimentKeyword {
  word: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;
  impact: number;
}

export interface IPredictiveModel {
  type: 'trend' | 'price' | 'demand' | 'growth';
  confidence: number;
  timeframe: string;
  predictions: IPrediction[];
  factors: IPredictionFactor[];
  accuracy: IModelAccuracy;
}

export interface IPrediction {
  date: string;
  value: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
}

export interface IPredictionFactor {
  factor: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface IModelAccuracy {
  historical: number;
  crossValidation: number;
  backtesting: number;
}

export interface ICompetitiveIntelligence {
  competitors: ICompetitor[];
  marketShare: IMarketShareData[];
  competitiveAdvantages: ICompetitiveAdvantage[];
  threats: IThreat[];
  opportunities: IOpportunity[];
}

export interface ICompetitor {
  name: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  strategies: string[];
  recentActivities: string[];
  financialHealth: 'excellent' | 'good' | 'fair' | 'poor';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface IMarketShareData {
  company: string;
  share: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
}

export interface ICompetitiveAdvantage {
  type: 'cost' | 'differentiation' | 'innovation' | 'scale';
  description: string;
  sustainability: 'high' | 'medium' | 'low';
  impact: number;
}

export interface IThreat {
  source: string;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
}

export interface IOpportunity {
  description: string;
  probability: number;
  potential: 'high' | 'medium' | 'low';
  timeframe: string;
  requirements: string[];
}

export interface IRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; 
  riskFactors: IRiskFactor[];
  riskCategories: IRiskCategory[];
  recommendations: IRiskRecommendation[];
  monitoring: IRiskMonitoring[];
}

export interface IRiskFactor {
  category: string;
  risk: number; 
  impact: 'high' | 'medium' | 'low';
  probability: number; 
  description: string;
  mitigation: string;
}

export interface IRiskCategory {
  name: string;
  risk: number;
  factors: IRiskFactor[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface IRiskRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  timeframe: string;
  cost: 'low' | 'medium' | 'high';
}

export interface IRiskMonitoring {
  metric: string;
  threshold: number;
  current: number;
  status: 'safe' | 'warning' | 'critical';
  frequency: string;
}

export interface IAnalyticsRequest {
  type: 'sentiment' | 'prediction' | 'competitive' | 'risk' | 'custom';
  data: any;
  parameters?: Record<string, any>;
  options?: {
    includeTrends?: boolean;
    includeConfidence?: boolean;
    timeframe?: string;
    granularity?: string;
  };
}

export interface IAnalyticsResult {
  type: string;
  data: any;
  metadata: {
    processingTime: number;
    confidence: number;
    source: string;
    timestamp: Date;
  };
  errors?: string[];
}

export interface IAnalyticsProvider extends IPlugin {

  getSupportedTypes(): string[];

  supportsType(type: string): boolean;

  analyzeSentiment(data: any, options?: any): Promise<ISentimentAnalysis>;

  generatePredictions(data: any, options?: any): Promise<IPredictiveModel[]>;

  analyzeCompetitiveIntelligence(data: any, options?: any): Promise<ICompetitiveIntelligence>;

  assessRisks(data: any, options?: any): Promise<IRiskAssessment>;

  executeCustomAnalytics(request: IAnalyticsRequest): Promise<IAnalyticsResult>;

  processBatch(requests: IAnalyticsRequest[]): Promise<IAnalyticsResult[]>;

  getModelInfo(): Promise<{
    name: string;
    version: string;
    accuracy: number;
    lastUpdated: Date;
    capabilities: string[];
  }>;

  trainModel?(data: any, options?: any): Promise<{
    success: boolean;
    accuracy: number;
    trainingTime: number;
  }>;

  getConfig(): IAnalyticsConfig;

  updateConfig(config: Partial<IAnalyticsConfig>): Promise<void>;

  getPerformanceMetrics(): Promise<{
    totalRequests: number;
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
    last24Hours: {
      requests: number;
      errors: number;
      averageTime: number;
    };
  }>;
}
