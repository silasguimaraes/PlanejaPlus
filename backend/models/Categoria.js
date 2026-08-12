import { pool } from '../database/connection.js';

// Model que concentra as consultas SQL relacionadas a categorias.
class Categoria {
  // Insere uma nova categoria no banco para um usuario especifico.
  static async create({ usuarioId, nome, tipo }) {
    const [result] = await pool.execute(
      'INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)',
      [usuarioId, nome, tipo],
    );

    // Monta o objeto de retorno usando o id gerado pelo MySQL.
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
}

// Exporta a classe para que os controllers possam usar suas consultas.
export default Categoria;
