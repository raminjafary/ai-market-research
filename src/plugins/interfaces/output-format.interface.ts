import type { IPlugin } from '../../core/interfaces/plugin.interface.js';

export interface IOutputFormatConfig {
  enabled: boolean;
  defaultTemplate?: string;
  customTemplates?: Record<string, string>;
  outputDirectory?: string;
  compressionEnabled?: boolean;
  watermarkEnabled?: boolean;
  watermarkText?: string;
}

export interface IReportData {
  title: string;
  subtitle?: string;
  author?: string;
  date: Date;
  summary: string;
  sections: IReportSection[];
  charts: IReportChart[];
  tables: IReportTable[];
  metadata: Record<string, any>;
}

export interface IReportSection {
  title: string;
  content: string;
  level: number;
  subsections?: IReportSection[];
}

export interface IReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  title: string;
  data: any;
  options?: Record<string, any>;
}

export interface IReportTable {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  options?: {
    sortable?: boolean;
    filterable?: boolean;
    pagination?: boolean;
  };
}

export interface IOutputOptions {
  format: 'pdf' | 'html' | 'docx' | 'xlsx' | 'json' | 'xml' | 'csv';
  template?: string;
  style?: 'professional' | 'modern' | 'minimal' | 'corporate';
  includeCharts?: boolean;
  includeTables?: boolean;
  includeMetadata?: boolean;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header?: {
    enabled: boolean;
    content?: string;
    logo?: string;
  };
  footer?: {
    enabled: boolean;
    content?: string;
    pageNumbers?: boolean;
  };
  compression?: {
    enabled: boolean;
    level: number;
  };
}

export interface IOutputResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  downloadUrl?: string;
  processingTime: number;
  error?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    chartCount?: number;
    tableCount?: number;
  };
}

export interface ITemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  content: string;
  variables: string[];
  preview?: string;
}

export interface IOutputFormatProvider extends IPlugin {

  getSupportedFormats(): string[];

  supportsFormat(format: string): boolean;

  generateOutput(data: IReportData, options: IOutputOptions): Promise<IOutputResult>;

  getTemplates(): ITemplate[];

  validateOutput(filePath: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  getConfig(): IOutputFormatConfig;

  updateConfig(config: Partial<IOutputFormatConfig>): Promise<void>;

}
