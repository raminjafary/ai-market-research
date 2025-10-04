import express from "express";
import cors from "cors";
import { microkernel } from "./core/microkernel.js";
import { researchService } from "./services/research.service.js";
import type { ResearchParams } from "./types.js";
import { loadEnvFile } from "process";

import { YahooFinanceProvider } from "./plugins/providers/yahoo-finance.provider.js";
import { NewsAPIProvider } from "./plugins/providers/newsapi.provider.js";
import { WorldBankProvider } from "./plugins/providers/world-bank.provider.js";
import { SentimentAnalyticsProvider } from "./plugins/analytics/sentiment.analytics.js";
import { GoogleGeminiProvider } from "./plugins/ai/google-gemini.provider.js";
import { PDFOutputProvider } from "./plugins/output/pdf.output.js";

loadEnvFile();

const app = express();
const PORT = process.env['PORT'] || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use('/reports', express.static('reports'));

app.get('/api/reports', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const reportsDir = './reports';
    const files = await fs.readdir(reportsDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    const reports = pdfFiles.map(file => ({
      filename: file,
      url: `http://localhost:3000/reports/${file}`,
      downloadUrl: `http://localhost:3000/reports/${file}`,
      createdAt: new Date().toISOString() 
    }));

    res.json({
      success: true,
      reports: reports,
      total: reports.length
    });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list reports'
    });
  }
});

app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = `./reports/${filename}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath, { root: process.cwd() }, (err) => {
    if (err) {
      console.error('Error serving PDF:', err);
      res.status(404).json({ error: 'PDF not found' });
    }
  });
});

async function initializeSystem() {
  try {
    console.log('🚀 Initializing Market Research Web Server...\n');

    await microkernel.start();
    console.log('✅ Microkernel started\n');

    await registerPlugins();
    console.log('✅ All plugins registered\n');

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

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Market Research Tool</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .content {
            padding: 40px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }

        .form-group select,
        .form-group input {
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }

        .form-group select:focus,
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }

        .checkbox-group input[type="checkbox"] {
            width: 20px;
            height: 20px;
        }

        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            width: 100%;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .result {
            display: none;
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .error {
            display: none;
            margin-top: 20px;
            padding: 15px;
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 8px;
            color: #c33;
        }

        .custom-input {
            display: none;
            margin-top: 10px;
        }

        .custom-input.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Market Research Tool</h1>
            <p>Generate comprehensive market research reports with AI-powered analysis</p>
        </div>

        <div class="content">
            <form id="researchForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="industry">Industry</label>
                        <select id="industry" name="industry" required>
                            <option value="">Select Industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="retail">Retail</option>
                            <option value="automotive">Automotive</option>
                            <option value="energy">Energy</option>
                            <option value="telecommunications">Telecommunications</option>
                            <option value="tourism">Tourism</option>
                            <option value="real-estate">Real Estate</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="custom">Custom</option>
                        </select>
                        <input type="text" id="customIndustry" class="custom-input" placeholder="Enter custom industry">
                    </div>

                    <div class="form-group">
                        <label for="region">Region</label>
                        <select id="region" name="region" required>
                            <option value="">Select Region</option>
                            <option value="MENA">MENA (Middle East & North Africa)</option>
                            <option value="MEA">MEA (Middle East & Africa)</option>
                            <option value="North America">North America</option>
                            <option value="Europe">Europe</option>
                            <option value="Asia Pacific">Asia Pacific</option>
                            <option value="Latin America">Latin America</option>
                            <option value="Africa">Africa</option>
                            <option value="custom">Custom</option>
                        </select>
                        <input type="text" id="customRegion" class="custom-input" placeholder="Enter custom region">
                    </div>

                    <div class="form-group">
                        <label for="researchType">Research Type</label>
                        <select id="researchType" name="researchType" required>
                            <option value="">Select Research Type</option>
                            <option value="market-trends">Market Trends</option>
                            <option value="competitive-analysis">Competitive Analysis</option>
                            <option value="trend-forecasting">Trend Forecasting</option>
                            <option value="consumer-behavior">Consumer Behavior</option>
                            <option value="market-size">Market Size</option>
                            <option value="investment-analysis">Investment Analysis</option>
                            <option value="custom">Custom</option>
                        </select>
                        <input type="text" id="customResearchType" class="custom-input" placeholder="Enter custom research type">
                    </div>

                    <div class="form-group">
                        <label for="timeFrame">Time Frame</label>
                        <select id="timeFrame" name="timeFrame" required>
                            <option value="">Select Time Frame</option>
                            <option value="2024-2025">2024-2025</option>
                            <option value="2024-2026">2024-2026</option>
                            <option value="2025-2030">2025-2030</option>
                            <option value="custom">Custom</option>
                        </select>
                        <input type="text" id="customTimeFrame" class="custom-input" placeholder="Enter custom time frame">
                    </div>
                </div>

                <div class="form-group">
                    <label>Additional Analysis Options</label>
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeFinancialData" name="includeFinancialData">
                        <label for="includeFinancialData">Include Financial Data & Metrics</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeSocialSentiment" name="includeSocialSentiment">
                        <label for="includeSocialSentiment">Include Social Media Sentiment Analysis</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="includeNewsAnalysis" name="includeNewsAnalysis">
                        <label for="includeNewsAnalysis">Include Recent News Analysis</label>
                    </div>
                </div>

                <button type="submit" class="btn" id="submitBtn">
                    🚀 Generate Research Report
                </button>
            </form>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>🔍 Analyzing market data...</p>
                <p>This may take a few minutes. Please wait.</p>
            </div>

            <div class="result" id="result">
                <h3>✅ Research Completed!</h3>
                <p id="resultText"></p>
            </div>

            <div class="error" id="error">
                <h3>❌ Error</h3>
                <p id="errorText"></p>
            </div>

            <div class="reports-section" id="reportsSection" style="display: none;">
                <h3>📊 Recent Reports</h3>
                <div id="reportsList"></div>
            </div>
        </div>
    </div>

    <script>

        function setupCustomInputs() {
            const customFields = ['industry', 'region', 'researchType', 'timeFrame'];

            customFields.forEach(field => {
                const select = document.getElementById(field);
                const customInput = document.getElementById('custom' + field.charAt(0).toUpperCase() + field.slice(1));

                select.addEventListener('change', () => {
                    if (select.value === 'custom') {
                        customInput.classList.add('show');
                        customInput.required = true;
                    } else {
                        customInput.classList.remove('show');
                        customInput.required = false;
                    }
                });
            });
        }

        document.getElementById('researchForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const params = {
                industry: formData.get('industry'),
                region: formData.get('region'),
                researchType: formData.get('researchType'),
                timeFrame: formData.get('timeFrame'),
                includeFinancialData: formData.get('includeFinancialData') === 'on',
                includeSocialSentiment: formData.get('includeSocialSentiment') === 'on',
                includeNewsAnalysis: formData.get('includeNewsAnalysis') === 'on',
            };

            if (params.industry === 'custom') {
                params.customIndustry = document.getElementById('customIndustry').value;
            }
            if (params.region === 'custom') {
                params.customRegion = document.getElementById('customRegion').value;
            }
            if (params.researchType === 'custom') {
                params.customResearchType = document.getElementById('customResearchType').value;
            }
            if (params.timeFrame === 'custom') {
                params.customTimeFrame = document.getElementById('customTimeFrame').value;
            }

            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').style.display = 'none';
            document.getElementById('error').style.display = 'none';
            document.getElementById('submitBtn').disabled = true;

            try {
                const response = await fetch('/api/research', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params),
                });

                const result = await response.json();

                if (response.ok) {
                    document.getElementById('resultText').innerHTML = \`
                        <strong>PDF Report:</strong> \${result.pdfPath}<br>
                        <strong>View Report:</strong> <a href="\${result.pdfUrl}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold;">📄 Open PDF in Browser</a><br>
                        <strong>Download:</strong> <a href="\${result.pdfUrl}" download="\${result.fileName}" style="color: #28a745; text-decoration: none; font-weight: bold;">💾 Download PDF</a><br>
                        <strong>Sources Found:</strong> \${result.sources.length}<br>
                        <strong>Charts Generated:</strong> \${result.chartConfigs.length}
                    \`;
                    document.getElementById('result').style.display = 'block';

                    loadRecentReports();
                } else {
                    throw new Error(result.error || 'Research failed');
                }
            } catch (error) {
                document.getElementById('errorText').textContent = error.message;
                document.getElementById('error').style.display = 'block';
            } finally {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('submitBtn').disabled = false;
            }
        });

        async function loadRecentReports() {
            try {
                const response = await fetch('/api/reports');
                const data = await response.json();

                if (data.success && data.reports.length > 0) {
                    const reportsList = document.getElementById('reportsList');
                    const reportsHtml = data.reports.map(report => \`
                        <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <strong>\${report.filename}</strong><br>
                            <a href="\${report.url}" target="_blank" style="color: #667eea; margin-right: 10px;">📄 View</a>
                            <a href="\${report.downloadUrl}" download="\${report.filename}" style="color: #28a745;">💾 Download</a>
                        </div>
                    \`).join('');

                    reportsList.innerHTML = reportsHtml;
                    document.getElementById('reportsSection').style.display = 'block';
                }
            } catch (error) {
                console.log('No reports available or error loading reports');
            }
        }

        setupCustomInputs();
        loadRecentReports();
    </script>
</body>
</html>
  `);
});

app.post("/api/research", async (req, res) => {
  try {
    const params: ResearchParams = req.body;

    console.log("🔍 Starting research with params:", params);

    const result = await researchService.generateMarketResearch(params);

    const path = await import('path');
    const fileName = result.pdfPath ? path.basename(result.pdfPath) : 'report.pdf';
    const pdfUrl = `http://localhost:3000/reports/${fileName}`;

    res.json({
      success: true,
      pdfPath: result.pdfPath,
      pdfUrl: pdfUrl,
      fileName: fileName,
      sources: result.sources,
      chartConfigs: result.chartConfigs,
    });
  } catch (error) {
    console.error("❌ Research error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});



initializeSystem().then((success) => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`🚀 Market Research Web Server running on http://localhost:${PORT}`);
      console.log(`📊 Open your browser and navigate to the URL above to start researching!`);
    });
  } else {
    console.error('❌ Failed to initialize system, exiting...');
    process.exit(1);
  }
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
