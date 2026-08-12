import { pool } from '../database/connection.js';

// Model que concentra as consultas SQL relacionadas a movimentacoes financeiras.
class Movimentacao {
  // Cria uma movimentacao somente se a categoria informada pertencer ao usuario.
  static async create({ usuarioId, categoriaId, descricao, valor, tipo, dataMovimentacao }) {
    const [result] = await pool.execute(
      `INSERT INTO movimentacoes
        (usuario_id, categoria_id, descricao, valor, tipo, data_movimentacao)
       SELECT ?, categorias.id, ?, ?, ?, ?
       FROM categorias
       WHERE categorias.id = ? AND categorias.usuario_id = ?`,
      [usuarioId, descricao, valor, tipo, dataMovimentacao, categoriaId, usuarioId],
    );

    // affectedRows igual a zero indica que a categoria nao foi encontrada para esse usuario.
    if (result.affectedRows === 0) {
      return null;
    }

    // Busca o registro completo, ja com o nome da categoria.
    return this.findByIdAndUsuario({ id: result.insertId, usuarioId });
  }

  // Lista movimentacoes do usuario com os dados da categoria relacionada.
  static async findByUsuario(usuarioId) {
    const [rows] = await pool.execute(
      `SELECT
        movimentacoes.id,
        movimentacoes.usuario_id,
        movimentacoes.categoria_id,
        categorias.nome AS categoria_nome,
        movimentacoes.descricao,
        movimentacoes.valor,
        movimentacoes.tipo,
        movimentacoes.data_movimentacao,
        movimentacoes.criado_em,
        movimentacoes.atualizado_em
       FROM movimentacoes
       INNER JOIN categorias ON categorias.id = movimentacoes.categoria_id
       WHERE movimentacoes.usuario_id = ?
       ORDER BY movimentacoes.data_movimentacao DESC, movimentacoes.id DESC`,
      [usuarioId],
    );

    return rows;
  }

  // Busca uma movimentacao especifica garantindo que ela pertence ao usuario.
  static async findByIdAndUsuario({ id, usuarioId }) {
    const [rows] = await pool.execute(
      `SELECT
        movimentacoes.id,
        movimentacoes.usuario_id,
        movimentacoes.categoria_id,
        categorias.nome AS categoria_nome,
        movimentacoes.descricao,
        movimentacoes.valor,
        movimentacoes.tipo,
        movimentacoes.data_movimentacao,
        movimentacoes.criado_em,
        movimentacoes.atualizado_em
       FROM movimentacoes
       INNER JOIN categorias ON categorias.id = movimentacoes.categoria_id
       WHERE movimentacoes.id = ? AND movimentacoes.usuario_id = ?
       LIMIT 1`,
      [id, usuarioId],
    );

    return rows[0] || null;
  }

  // Atualiza uma movimentacao e tambem valida se a nova categoria pertence ao usuario.
  static async update({
    id,
    usuarioId,
    categoriaId,
    descricao,
    valor,
    tipo,
    dataMovimentacao,
  }) {
    const [result] = await pool.execute(
      `UPDATE movimentacoes
       INNER JOIN categorias
        ON categorias.id = ?
        AND categorias.usuario_id = movimentacoes.usuario_id
       SET
        movimentacoes.categoria_id = categorias.id,
        movimentacoes.descricao = ?,
        movimentacoes.valor = ?,
        movimentacoes.tipo = ?,
        movimentacoes.data_movimentacao = ?
       WHERE movimentacoes.id = ? AND movimentacoes.usuario_id = ?`,
      [categoriaId, descricao, valor, tipo, dataMovimentacao, id, usuarioId],
    );

    // Se nada foi alterado, a movimentacao nao existe ou a categoria nao e valida.
    if (result.affectedRows === 0) {
      return null;
    }

    return this.findByIdAndUsuario({ id, usuarioId });
  }

  // Remove uma movimentacao somente quando ela pertence ao usuario logado.
  static async delete({ id, usuarioId }) {
    const [result] = await pool.execute(
      'DELETE FROM movimentacoes WHERE id = ? AND usuario_id = ?',
      [id, usuarioId],
    );

    // Converte a quantidade de linhas removidas em verdadeiro ou falso.
    return result.affectedRows > 0;
  }
}

export default Movimentacao;
