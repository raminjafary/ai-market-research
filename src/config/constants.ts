export const AI_MODELS = {
  PRIMARY: "gemini-2.5-flash",
  FALLBACK: "gemini-2.0-flash",
  FAST: "gemini-1.5-flash",
} as const;

export const API_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: 100,
  BATCH_SIZE: 10,
} as const;

export const SERVER_CONFIG = {
  PORT: process.env['PORT'] || 3000,
  HOST: process.env['HOST'] || 'localhost',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || '*',
  SESSION_SECRET: process.env['SESSION_SECRET'] || 'your-secret-key',
} as const;

export const DB_CONFIG = {
  TYPE: 'sqlite',
  HOST: process.env['DB_HOST'] || 'localhost',
  PORT: process.env['DB_PORT'] || 5432,
  DATABASE: process.env['DB_NAME'] || 'market_research',
  USERNAME: process.env['DB_USER'] || 'postgres',
  PASSWORD: process.env['DB_PASSWORD'] || '',
  SYNCHRONIZE: process.env['NODE_ENV'] === 'development',
  LOGGING: process.env['NODE_ENV'] === 'development',
} as const;

export const REDIS_CONFIG = {
  HOST: process.env['REDIS_HOST'] || 'localhost',
  PORT: process.env['REDIS_PORT'] || 6379,
  PASSWORD: process.env['REDIS_PASSWORD'] || '',
  DB: process.env['REDIS_DB'] || 0,
  KEY_PREFIX: 'market_research:',
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, 
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_DIR: 'uploads',
  TEMP_DIR: 'temp',
} as const;

export const EMAIL_CONFIG = {
  HOST: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
  PORT: process.env['EMAIL_PORT'] || 587,
  SECURE: process.env['EMAIL_SECURE'] === 'true',
  USER: process.env['EMAIL_USER'] || '',
  PASSWORD: process.env['EMAIL_PASSWORD'] || '',
  FROM: process.env['EMAIL_FROM'] || 'noreply@marketresearch.com',
} as const;

export const CHART_CONFIG = {
  DEFAULT_WIDTH: 600,
  DEFAULT_HEIGHT: 400,
  COLORS: [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#f5576c',
    '#4facfe',
    '#00f2fe',
    '#43e97b',
    '#38f9d7',
    '#fa709a',
    '#fee140',
  ],
  ANIMATION_DURATION: 1000,
  RESPONSIVE: true,
} as const;

export const REPORT_CONFIG = {
  DEFAULT_FORMAT: 'pdf',
  SUPPORTED_FORMATS: ['pdf', 'html', 'excel', 'powerpoint'],
  MAX_PAGES: 50,
  TEMPLATE_DIR: 'templates',
  OUTPUT_DIR: 'reports',
} as const;

export const SECURITY_CONFIG = {
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-jwt-secret',
  JWT_EXPIRES_IN: '24h',
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, 
  RATE_LIMIT_MAX: 100,
} as const;

export const LOGGING_CONFIG = {
  LEVEL: process.env['LOG_LEVEL'] || 'info',
  FORMAT: process.env['NODE_ENV'] === 'production' ? 'json' : 'simple',
  FILE: 'logs/app.log',
  MAX_SIZE: '20m',
  MAX_FILES: '14d',
} as const;

export const FEATURES = {
  ENABLE_REAL_TIME: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_COLLABORATION: true,
  ENABLE_EXPORT: true,
  ENABLE_IMPORT: true,
} as const;
