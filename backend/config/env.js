import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Carrega as variaveis do arquivo .env para dentro de process.env.
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const passwordResetExpiresMinutes = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 60);

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET deve ser configurado com pelo menos 32 caracteres em producao.');
}

if (!Number.isInteger(passwordResetExpiresMinutes) || passwordResetExpiresMinutes < 1) {
  throw new Error('PASSWORD_RESET_EXPIRES_MINUTES deve ser um inteiro positivo.');
}

// Centraliza as configuracoes do projeto para evitar valores espalhados pelo codigo.
export const env = {
  // Porta onde a API vai rodar; se nao existir no .env, usa 3000.
  port: process.env.PORT || 3000,

  // Segredo usado para assinar tokens JWT e tempo de validade desses tokens.
  jwtSecret: jwtSecret || 'local-development-only-secret-not-for-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  allowPublicRegistration:
    process.env.ALLOW_PUBLIC_REGISTRATION === 'true' ||
    (!isProduction && process.env.ALLOW_PUBLIC_REGISTRATION !== 'false'),
  frontendOrigins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5500')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  isProduction,
  frontendUrl: (process.env.FRONTEND_URL || (process.env.FRONTEND_ORIGINS || 'http://localhost:5500').split(',')[0])
    .trim()
    .replace(/\/+$/, ''),
  passwordResetExpiresMinutes,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Planeja+ <nao-responda@planejaplus.local>',
  },

  // Caminho persistente do arquivo SQLite, relativo ao backend quando configurado.
  database: {
    sqlitePath: resolve(
      process.env.SQLITE_PATH ||
        fileURLToPath(new URL('../database/planeja_plus.sqlite', import.meta.url)),
    ),
    // Credenciais opcionais usadas somente pelo importador do banco MySQL antigo.
    mysqlSource: {
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      name: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'planeja_plus',
    },
  },
};
