import dotenv from 'dotenv';

// Carrega as variaveis do arquivo .env para dentro de process.env.
dotenv.config();

// Centraliza as configuracoes do projeto para evitar valores espalhados pelo codigo.
export const env = {
  // Porta onde a API vai rodar; se nao existir no .env, usa 3000.
  port: process.env.PORT || 3000,

  // Segredo usado para assinar tokens JWT e tempo de validade desses tokens.
  jwtSecret: process.env.JWT_SECRET || 'troque_este_segredo_em_producao',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // Dados de conexao com o banco MySQL.
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'planeja_plus',
  },
};
