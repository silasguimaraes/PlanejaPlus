import dotenv from 'dotenv';

// Carrega as variaveis do arquivo .env para dentro de process.env.
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET deve ser configurado com pelo menos 32 caracteres em producao.');
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

  // Dados de conexao com o banco MySQL.
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'planeja_plus',
  },
};
