import { BasePlugin } from '../base/base-plugin.js';
import type { IOutputFormatProvider, IReportData, IOutputOptions, IOutputResult, IOutputFormatConfig, ITemplate } from '../interfaces/output-format.interface.js';
import { PluginUtils } from '../sdk/plugin-sdk.js';
import puppeteer from 'puppeteer';

export class PDFOutputProvider extends BasePlugin implements IOutputFormatProvider {
  private templates: Map<string, ITemplate> = new Map();

  constructor() {
    const manifest = PluginUtils.createManifest({
      id: 'pdf-output-provider',
      name: 'PDF Output Provider',
      version: '1.0.0',
      description: 'Generates PDF reports from research data',
      author: 'Market Research Team',
      category: 'output-format',
      dependencies: [],
      entryPoint: 'pdf.output.ts',
      permissions: ['generate_pdf', 'export_reports'],
      tags: ['pdf', 'output', 'reports'],
      configSchema: {
        enabled: { type: 'boolean', required: false, default: true },
        defaultTemplate: { type: 'string', required: false, default: 'professional' },
        outputDirectory: { type: 'string', required: false, default: './reports' },
        compressionEnabled: { type: 'boolean', required: false, default: false },
        watermarkEnabled: { type: 'boolean', required: false, default: false },
        watermarkText: { type: 'string', required: false, default: 'Market Research Report' }
      }
    });

    super(manifest);
    this.initializeDefaultTemplates();
  }

  getSupportedFormats(): string[] {
    return ['pdf'];
  }

  supportsFormat(format: string): boolean {
    return format === 'pdf';
  }

  async generateOutput(data: IReportData, options: IOutputOptions): Promise<IOutputResult> {
    const startTime = Date.now();

    try {
      if (options.format !== 'pdf') {
        throw new Error(`Unsupported format: ${options.format}`);
      }

      const htmlContent = await this.generateHTML(data, options);

      const pdfBuffer = await this.convertHTMLToPDF(htmlContent, options);

      const fileName = this.generateFileName(data.title);
      const filePath = await this.savePDF(pdfBuffer, fileName);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        filePath,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        processingTime,
        metadata: {
          pages: await this.getPageCount(pdfBuffer),
          wordCount: this.countWords(data),
          chartCount: data.charts.length,
          tableCount: data.tables.length
        }
      };
    } catch (error) {
      this.log(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return {
        success: false,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async generateFromTemplate(templateId: string, data: any, options?: Partial<IOutputOptions>): Promise<IOutputResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const mergedOptions: IOutputOptions = {
      format: 'pdf',
      template: templateId,
      style: 'professional',
      includeCharts: true,
      includeTables: true,
      includeMetadata: true,
      pageSize: 'a4',
      orientation: 'portrait',
      ...options
    };

    return this.generateOutput(data, mergedOptions);
  }

  getTemplates(): ITemplate[] {
    return Array.from(this.templates.values());
  }

  async registerTemplate(template: ITemplate): Promise<void> {
    this.templates.set(template.id, template);
    this.log(`Template registered: ${template.id}`);
  }

  async updateTemplate(templateId: string, template: Partial<ITemplate>): Promise<void> {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template ${templateId} not found`);
    }

    this.templates.set(templateId, { ...existing, ...template });
    this.log(`Template updated: ${templateId}`);
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.log(`Template deleted: ${templateId}`);
    }
    return deleted;
  }

  async previewTemplate(templateId: string, data: any): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const htmlContent = await this.generateHTML(data, {
      format: 'pdf',
      template: templateId,
      style: 'professional'
    });

    return htmlContent;
  }

  async convertFormat(inputPath: string, outputFormat: string, options?: Partial<IOutputOptions>): Promise<IOutputResult> {
    if (outputFormat !== 'pdf') {
      throw new Error(`Conversion to ${outputFormat} not supported`);
    }

    const fs = await import('fs/promises');
    const inputContent = await fs.readFile(inputPath, 'utf-8');

    const data: IReportData = {
      title: 'Converted Report',
      date: new Date(),
      summary: 'Converted from other format',
      sections: [{ title: 'Content', content: inputContent, level: 1 }],
      charts: [],
      tables: [],
      metadata: {}
    };

    return this.generateOutput(data, {
      format: 'pdf',
      ...options
    });
  }

  async mergeOutputs(inputPaths: string[], outputPath: string, options?: Partial<IOutputOptions>): Promise<IOutputResult> {

    throw new Error('PDF merging not implemented yet');
  }

  async extractText(filePath: string): Promise<string> {

    throw new Error('PDF text extraction not implemented yet');
  }

  async validateOutput(filePath: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const fs = await import('fs/promises');
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const stats = await fs.stat(filePath);

      if (stats.size === 0) {
        errors.push('File is empty');
      } else if (stats.size < 1024) {
        warnings.push('File size is very small, may be incomplete');
      }

      const buffer = await fs.readFile(filePath);
      const isPDF = buffer.slice(0, 4).toString() === '%PDF';

      if (!isPDF) {
        errors.push('File is not a valid PDF');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`File validation failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        errors,
        warnings
      };
    }
  }

  override getConfig(): IOutputFormatConfig {
    return {
      enabled: this.getConfigValue('enabled', true),
      defaultTemplate: this.getConfigValue('defaultTemplate', 'professional'),
      customTemplates: {},
      outputDirectory: this.getConfigValue('outputDirectory', './reports'),
      compressionEnabled: this.getConfigValue('compressionEnabled', false),
      watermarkEnabled: this.getConfigValue('watermarkEnabled', false),
      watermarkText: this.getConfigValue('watermarkText', 'Market Research Report')
    };
  }

  override async updateConfig(config: Partial<IOutputFormatConfig>): Promise<void> {
    await this.updateConfig(config);
  }

  async getStatistics(): Promise<{
    totalGenerated: number;
    formatsGenerated: Record<string, number>;
    averageProcessingTime: number;
    totalFileSize: number;
    last24Hours: {
      generated: number;
      errors: number;
      averageTime: number;
    };
  }> {

    return {
      totalGenerated: 100,
      formatsGenerated: { pdf: 100 },
      averageProcessingTime: 2000,
      totalFileSize: 50 * 1024 * 1024, 
      last24Hours: {
        generated: 5,
        errors: 0,
        averageTime: 1800
      }
    };
  }

  private initializeDefaultTemplates(): void {
    const professionalTemplate: ITemplate = {
      id: 'professional',
      name: 'Professional Report',
      description: 'Clean and professional report template',
      format: 'pdf',
      content: this.getProfessionalTemplate(),
      variables: ['title', 'author', 'date', 'summary', 'sections', 'charts', 'tables'],
      preview: 'Professional template preview'
    };

    const modernTemplate: ITemplate = {
      id: 'modern',
      name: 'Modern Report',
      description: 'Modern and stylish report template',
      format: 'pdf',
      content: this.getModernTemplate(),
      variables: ['title', 'author', 'date', 'summary', 'sections', 'charts', 'tables'],
      preview: 'Modern template preview'
    };

    this.templates.set('professional', professionalTemplate);
    this.templates.set('modern', modernTemplate);
  }

  private async generateHTML(data: IReportData, options: IOutputOptions): Promise<string> {
    const template = this.templates.get(options.template || 'professional');
    if (!template) {
      throw new Error(`Template ${options.template} not found`);
    }

    let html = template.content;

    html = html.replace(/\{\{title\}\}/g, data.title);
    html = html.replace(/\{\{author\}\}/g, data.author || 'Market Research Team');
    html = html.replace(/\{\{date\}\}/g, data.date.toLocaleDateString());
    html = html.replace(/\{\{summary\}\}/g, data.summary);

    const sectionsHtml = this.generateSectionsHTML(data.sections);
    html = html.replace(/\{\{sections\}\}/g, sectionsHtml);

    if (options.includeCharts && data.charts && data.charts.length > 0) {
      const chartsHtml = this.generateChartsHTML(data.charts);
      html = html.replace(/\{\{charts\}\}/g, chartsHtml);
    } else {

      html = html.replace(/\{\{charts\}\}/g, '');
    }

    if (options.includeTables && data.tables && data.tables.length > 0) {
      const tablesHtml = this.generateTablesHTML(data.tables);
      html = html.replace(/\{\{tables\}\}/g, tablesHtml);
    } else {

      html = html.replace(/\{\{tables\}\}/g, '');
    }

    if (this.getConfigValue('watermarkEnabled', false)) {
      const watermarkText = this.getConfigValue('watermarkText', 'Market Research Report');
      html = html.replace('</body>', `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.1; font-size: 48px; color: #ccc; pointer-events: none; z-index: 1000;">
          ${watermarkText}
        </div>
      </body>`);
    }

    return html;
  }

  private async convertHTMLToPDF(html: string, options: IOutputOptions): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: (options.pageSize || 'A4') as any,
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: options.margins || {
          top: '20mm',
          bottom: '20mm',
          left: '20mm',
          right: '20mm'
        }
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async savePDF(buffer: Buffer, fileName: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const outputDir = this.getConfigValue('outputDirectory', './reports');

    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {

    }

    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, buffer);

    return filePath;
  }

  private generateFileName(title: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `report-${sanitizedTitle}-${timestamp}.pdf`;
  }

  private async getPageCount(buffer: Buffer): Promise<number> {

    return Math.ceil(buffer.length / 50000); 
  }

  private countWords(data: IReportData): number {
    let wordCount = 0;

    wordCount += data.summary.split(/\s+/).length;

    for (const section of data.sections) {
      wordCount += section.content.split(/\s+/).length;
    }

    return wordCount;
  }

  private generateSectionsHTML(sections: any[]): string {
    return sections.map(section => `
      <section class="report-section">
        <h${section.level} class="section-title">${section.title}</h${section.level}>
        <div class="section-content">${section.content}</div>
      </section>
    `).join('');
  }

  private generateChartsHTML(charts: any[]): string {
    return charts.map(chart => `
      <div class="chart-container">
        <h3>${chart.title}</h3>
        <div class="chart-placeholder">
          [Chart: ${chart.type} - ${chart.title}]
        </div>
      </div>
    `).join('');
  }

  private generateTablesHTML(tables: any[]): string {
    return tables.map(table => `
      <div class="table-container">
        <h3>${table.title}</h3>
        <table class="data-table">
          <thead>
            <tr>${table.headers.map((header: string) => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${table.rows.map((row: any[]) => `<tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
  }

  private getProfessionalTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
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
        .summary {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #333;
        }
        .report-section {
            margin: 30px 0;
        }
        .section-title {
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }
        .chart-container, .table-container {
            margin: 20px 0;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .data-table th, .data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .chart-placeholder {
            background: #f5f5f5;
            border: 1px dashed #ccc;
            padding: 40px;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{{title}}</div>
        <div class="meta">
            <div>Author: {{author}}</div>
            <div>Date: {{date}}</div>
        </div>
    </div>

    <div class="summary">
        <h2>Executive Summary</h2>
        <p>{{summary}}</p>
    </div>

    {{sections}}
    {{charts}}
    {{tables}}
</body>
</html>`;
  }

  private getModernTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .meta {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .summary {
            background: #f8f9fa;
            padding: 25px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .report-section {
            margin: 30px 0;
        }
        .section-title {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .chart-container, .table-container {
            margin: 25px 0;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            border-radius: 8px;
            overflow: hidden;
        }
        .data-table th, .data-table td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
        }
        .data-table th {
            background-color: #667eea;
            color: white;
            font-weight: bold;
        }
        .chart-placeholder {
            background: #e9ecef;
            border: 2px dashed #667eea;
            padding: 50px;
            text-align: center;
            color: #6c757d;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">{{title}}</div>
            <div class="meta">
                <div>Author: {{author}}</div>
                <div>Date: {{date}}</div>
            </div>
        </div>

        <div class="content">
            <div class="summary">
                <h2>Executive Summary</h2>
                <p>{{summary}}</p>
            </div>

            {{sections}}
            {{charts}}
            {{tables}}
        </div>
    </div>
</body>
</html>`;
  }
}
