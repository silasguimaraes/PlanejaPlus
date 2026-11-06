import { pool } from './connection.js';
import { migrations } from './migrations/index.js';

export async function runMigrations() {
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    // O bloqueio de escrita do SQLite serializa migrations entre processos.
    await connection.beginTransaction();
    transactionStarted = true;
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    const [appliedRows] = await connection.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRows.map((row) => row.version));

    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      console.log(`Aplicando migration ${migration.version}...`);
      await migration.up(connection);
      await connection.execute('INSERT INTO schema_migrations (version) VALUES (?)', [
        migration.version,
      ]);
    }

    // Publica as alteracoes somente depois de todas as migrations serem aplicadas.
    await connection.commit();
    transactionStarted = false;
    console.log('Migrations atualizadas.');
  } catch (error) {
    // Desfaz o schema parcial para que uma inicializacao seguinte possa tentar de novo.
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }
}
