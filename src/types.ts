export type Industry = 
  | "technology" 
  | "healthcare" 
  | "finance" 
  | "retail" 
  | "automotive" 
  | "energy" 
  | "telecommunications" 
  | "tourism" 
  | "real-estate" 
  | "manufacturing"
  | "custom";

export type Region = 
  | "MENA" 
  | "MEA" 
  | "North America" 
  | "Europe" 
  | "Asia Pacific" 
  | "Latin America" 
  | "Africa" 
  | "custom";

export type ResearchType = 
  | "market-trends" 
  | "competitive-analysis" 
  | "trend-forecasting" 
  | "consumer-behavior" 
  | "market-size" 
  | "investment-analysis"
  | "custom";

export interface ResearchParams {
  industry: Industry;
  region: Region;
  researchType: ResearchType;
  customIndustry?: string;
  customRegion?: string;
  customResearchType?: string;
  timeFrame: "2024-2025" | "2024-2026" | "2025-2030" | "custom";
  customTimeFrame?: string;
  includeFinancialData: boolean;
  includeSocialSentiment: boolean;
  includeNewsAnalysis: boolean;
}

export interface ResearchRequest {
  params: ResearchParams;
  timestamp: Date;
  id: string;
}

export interface ResearchResult {
  marketTrends: string;
  sources: Source[];
  chartConfigs: TChartConfig[];
  htmlReport: string;
  pdfPath?: string;
}

export type Source = {
  type: "source";
  id: string;
  sourceType: "url" | "document";
  url?: string;
  title?: string;
  providerMetadata?: Record<string, unknown>;
};

import type { ChartConfiguration } from "chart.js";
export type TChartConfig = ChartConfiguration;
