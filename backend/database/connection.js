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

export async function ensureUsuarioAdminColumns() {
  const [columns] = await pool.query('SHOW COLUMNS FROM usuarios');
  const existingColumns = new Set(columns.map((column) => column.Field));

  try {
    if (!existingColumns.has('perfil')) {
      await pool.execute(
        "ALTER TABLE usuarios ADD COLUMN perfil ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario'",
      );
    }

    if (!existingColumns.has('ativo')) {
      await pool.execute('ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE');
    }

    await pool.execute(
      "UPDATE usuarios SET perfil = COALESCE(perfil, 'usuario'), ativo = COALESCE(ativo, TRUE) WHERE perfil IS NULL OR ativo IS NULL",
    );
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      throw error;
    }
  }
}
