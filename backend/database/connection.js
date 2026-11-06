import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '../config/env.js';

// Garante que a pasta do arquivo exista antes de abrir o banco SQLite.
mkdirSync(dirname(env.database.sqlitePath), { recursive: true });

// Abre uma conexao dedicada para permitir que cada transacao seja isolada.
function openDatabase() {
  const database = new Database(env.database.sqlitePath);
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');
  return database;
}

// Mantem o formato de resultados usado pelos modelos enquanto executa SQL no SQLite.
function createConnection(database, closeOnRelease = false) {
  const run = (sql, params = []) => {
    const statement = database.prepare(sql);
    // O MySQL aceita booleanos diretamente; SQLite recebe esses valores como 0 ou 1.
    const values = params.map((value) => (typeof value === 'boolean' ? Number(value) : value));

    if (statement.reader) {
      return [statement.all(...values), undefined];
    }

    const result = statement.run(...values);
    return [
      {
        insertId: Number(result.lastInsertRowid),
        affectedRows: result.changes,
      },
      undefined,
    ];
  };

  return {
    // Oferece os metodos query e execute que os modelos ja utilizam.
    query: async (sql, params) => run(sql, params),
    execute: async (sql, params) => run(sql, params),

    // Inicia a transacao como escrita para evitar disputas entre operacoes concorrentes.
    beginTransaction: async () => database.exec('BEGIN IMMEDIATE'),
    commit: async () => database.exec('COMMIT'),
    rollback: async () => database.exec('ROLLBACK'),

    // Fecha somente conexoes dedicadas; a conexao principal vive ate pool.end().
    release: () => {
      if (closeOnRelease && database.open) {
        database.close();
      }
    },
  };
}

// Mantem uma conexao principal para consultas curtas e transacoes independentes.
const database = openDatabase();
database.pragma('journal_mode = WAL');
const mainConnection = createConnection(database);

// Preserva a interface anterior do pool para minimizar alteracoes nos modelos.
export const pool = {
  query: mainConnection.query,
  execute: mainConnection.execute,

  // Entrega conexao propria para transacoes de cadastro e recuperacao de senha.
  getConnection: async () => createConnection(openDatabase(), true),

  // Fecha o arquivo ao encerrar scripts de migracao e seed.
  end: async () => {
    if (database.open) {
      database.close();
    }
  },
};
