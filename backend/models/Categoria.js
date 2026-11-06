import { pool } from '../database/connection.js';

// Model que concentra as consultas SQL relacionadas a categorias.
class Categoria {
  // Insere uma nova categoria no banco para um usuario especifico.
  static async create({ usuarioId, nome, tipo }) {
    const [result] = await pool.execute(
      'INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)',
      [usuarioId, nome, tipo],
    );

    // Monta o objeto de retorno usando o id gerado pelo SQLite.
    return {
      id: result.insertId,
      usuario_id: usuarioId,
      nome,
      tipo,
    };
  }

  // Busca todas as categorias de um usuario, em ordem alfabetica.
  static async findByUsuario(usuarioId) {
    const [rows] = await pool.execute(
      `SELECT id, usuario_id, nome, tipo, criado_em, atualizado_em
       FROM categorias
       WHERE usuario_id = ?
       ORDER BY nome ASC`,
      [usuarioId],
    );

    return rows;
  }

  // Apaga apenas categorias do usuario e preserva as movimentacoes vinculadas.
  static async delete({ id, usuarioId }) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const [categorias] = await connection.execute(
        'SELECT id FROM categorias WHERE id = ? AND usuario_id = ? LIMIT 1',
        [id, usuarioId],
      );

      if (!categorias.length) {
        await connection.rollback();
        transactionStarted = false;
        return { deleted: false, inUse: false };
      }

      const [movimentacoes] = await connection.execute(
        'SELECT id FROM movimentacoes WHERE categoria_id = ? LIMIT 1',
        [id],
      );

      if (movimentacoes.length) {
        await connection.rollback();
        transactionStarted = false;
        return { deleted: false, inUse: true };
      }

      await connection.execute('DELETE FROM categorias WHERE id = ? AND usuario_id = ?', [
        id,
        usuarioId,
      ]);
      await connection.commit();
      transactionStarted = false;
      return { deleted: true, inUse: false };
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
      }
      throw error;
    } finally {
      connection.release();
    }
  }
}

// Exporta a classe para que os controllers possam usar suas consultas.
export default Categoria;
