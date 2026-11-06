import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { pool } from './connection.js';
import { runMigrations } from './migrationRunner.js';

// Copia as tabelas atuais sem alterar o banco MySQL de origem.
const tableColumns = {
  usuarios: [
    'id',
    'nome',
    'email',
    'senha',
    'perfil',
    'ativo',
    'criado_em',
    'atualizado_em',
  ],
  categorias: ['id', 'usuario_id', 'nome', 'tipo', 'criado_em', 'atualizado_em'],
  movimentacoes: [
    'id',
    'usuario_id',
    'categoria_id',
    'descricao',
    'valor',
    'tipo',
    'data_movimentacao',
    'criado_em',
    'atualizado_em',
  ],
  pagamentos: [
    'id',
    'movimentacao_id',
    'forma_pagamento',
    'status',
    'data_pagamento',
    'criado_em',
    'atualizado_em',
  ],
  relatorios: [
    'id',
    'usuario_id',
    'titulo',
    'periodo_inicio',
    'periodo_fim',
    'criado_em',
    'atualizado_em',
  ],
  redefinicoes_senha: [
    'id',
    'usuario_id',
    'token_hash',
    'expira_em',
    'usado_em',
    'criado_em',
    'atualizado_em',
  ],
};

// Cria a conexao de leitura com MySQL, mantendo datas como texto para evitar conversoes de fuso.
const source = mysql.createPool({
  host: env.database.mysqlSource.host,
  port: env.database.mysqlSource.port,
  user: env.database.mysqlSource.user,
  password: env.database.mysqlSource.password,
  database: env.database.mysqlSource.name,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 2,
});

let targetConnection;
let targetTransactionStarted = false;

try {
  // Prepara o arquivo SQLite antes de receber as linhas importadas.
  await runMigrations();

  const [sourceTables] = await source.query('SHOW TABLES');
  const availableTables = new Set(Object.values(sourceTables[0] || {}));
  const missingTables = Object.keys(tableColumns).filter((table) => !availableTables.has(table));

  if (missingTables.length) {
    throw new Error(`Tabelas ausentes no MySQL de origem: ${missingTables.join(', ')}`);
  }

  targetConnection = await pool.getConnection();
  await targetConnection.beginTransaction();
  targetTransactionStarted = true;

  // Bloqueia repeticoes e importacoes sobre um SQLite que ja contenha dados.
  await targetConnection.query(
    `CREATE TABLE IF NOT EXISTS sqlite_imports (
      source TEXT PRIMARY KEY,
      imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  );
  const [previousImports] = await targetConnection.execute(
    "SELECT source FROM sqlite_imports WHERE source = 'mysql'",
  );

  if (previousImports.length) {
    throw new Error('Este banco MySQL ja foi importado para o SQLite.');
  }

  for (const table of Object.keys(tableColumns)) {
    const [existingRows] = await targetConnection.execute(`SELECT COUNT(*) AS total FROM ${table}`);

    if (Number(existingRows[0].total) > 0) {
      throw new Error(`A tabela ${table} no SQLite ja possui dados; a importacao foi cancelada.`);
    }
  }

  // A ordem respeita as chaves estrangeiras do schema SQLite.
  let totalRows = 0;
  for (const [table, columns] of Object.entries(tableColumns)) {
    const [rows] = await source.query(`SELECT ${columns.join(', ')} FROM ${table} ORDER BY id`);
    const placeholders = columns.map(() => '?').join(', ');
    const statement = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    for (const row of rows) {
      const values = columns.map((column) => row[column]);
      await targetConnection.execute(statement, values);
      totalRows += 1;
    }
  }

  // Registra a origem somente depois de copiar todas as linhas com sucesso.
  await targetConnection.execute("INSERT INTO sqlite_imports (source) VALUES ('mysql')");
  await targetConnection.commit();
  targetTransactionStarted = false;
  console.log(`Importacao concluida: ${totalRows} registro(s) copiado(s) para o SQLite.`);
} catch (error) {
  if (targetConnection && targetTransactionStarted) {
    await targetConnection.rollback();
  }
  console.error('Falha ao importar MySQL para SQLite:', error);
  process.exitCode = 1;
} finally {
  targetConnection?.release();
  await source.end();
  await pool.end();
}
