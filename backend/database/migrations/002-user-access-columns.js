export const version = '002-user-access-columns';

export async function up(connection) {
  // Consulta os metadados nativos do SQLite para manter a migration idempotente.
  const [columns] = await connection.query('PRAGMA table_info(usuarios)');
  const existingColumns = new Set(columns.map((column) => column.name));

  if (!existingColumns.has('perfil')) {
    await connection.execute(
      "ALTER TABLE usuarios ADD COLUMN perfil TEXT NOT NULL DEFAULT 'usuario' CHECK (perfil IN ('usuario', 'admin'))",
    );
  }

  if (!existingColumns.has('ativo')) {
    await connection.execute(
      'ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))',
    );
  }

  // Normaliza registros antigos que possam ter valores nulos nessas colunas.
  await connection.execute(
    "UPDATE usuarios SET perfil = COALESCE(perfil, 'usuario'), ativo = COALESCE(ativo, 1) WHERE perfil IS NULL OR ativo IS NULL",
  );
}
