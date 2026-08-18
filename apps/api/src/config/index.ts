import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Authentication
  authSecret: process.env.AUTH_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  
  // AI Provider
  aiProviderApiKey: process.env.AI_PROVIDER_API_KEY || '',
  aiProviderBaseUrl: process.env.AI_PROVIDER_BASE_URL || 'https://api.openai.com/v1',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  aiEmbeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  
  // Storage
  storagePath: process.env.STORAGE_PATH || './uploads',
  storageType: process.env.STORAGE_TYPE || 'local',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || '').split(','),
  
  // Application
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  
  // Email (optional)
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'ExamForge <noreply@examforge.app>',
  
  // Google OAuth (optional)
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  
  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@examforge.app',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMeInProduction123!',
  
  // Feature Flags
  enableOcr: process.env.ENABLE_OCR !== 'false',
  enableVectorSearch: process.env.ENABLE_VECTOR_SEARCH !== 'false',
  enableStudyGroups: process.env.ENABLE_STUDY_GROUPS !== 'false',
  enableReferrals: process.env.ENABLE_REFERRALS !== 'false',
  
  // Usage Limits - Free tier
  freeMaxCourses: parseInt(process.env.FREE_MAX_COURSES || '3', 10),
  freeMaxAiRequestsPerDay: parseInt(process.env.FREE_MAX_AI_REQUESTS_PER_DAY || '50', 10),
  freeMaxStorageMb: parseInt(process.env.FREE_MAX_STORAGE_MB || '500', 10),
  freeMaxExamSimulationsPerMonth: parseInt(process.env.FREE_MAX_EXAM_SIMULATIONS_PER_MONTH || '5', 10),
  
  // Usage Limits - Pro tier
  proMaxCourses: parseInt(process.env.PRO_MAX_COURSES || '999', 10),
  proMaxAiRequestsPerDay: parseInt(process.env.PRO_MAX_AI_REQUESTS_PER_DAY || '500', 10),
  proMaxStorageMb: parseInt(process.env.PRO_MAX_STORAGE_MB || '10000', 10),
  proMaxExamSimulationsPerMonth: parseInt(process.env.PRO_MAX_EXAM_SIMULATIONS_PER_MONTH || '999', 10),
};

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';
