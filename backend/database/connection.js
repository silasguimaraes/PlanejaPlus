import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

// Cria um pool de conexoes para reutilizar conexoes com o MySQL.
export const pool = mysql.createPool({
  // Dados do banco vindos do arquivo de configuracao.
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,

  // Configuracoes para controlar fila e limite de conexoes simultaneas.
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
