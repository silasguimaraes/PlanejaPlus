import { pool } from '../database/connection.js';

// Model com as consultas de administracao, que enxergam dados de todos os usuarios.
class Admin {
  // Totais gerais da plataforma para os cards do painel.
  static async resumo() {
    const [rows] = await pool.execute(
      `SELECT
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE ativo = 1) AS usuarios_ativos,
        (SELECT COUNT(*) FROM movimentacoes) AS total_movimentacoes,
        (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes WHERE tipo = 'receita') AS total_receitas,
        (SELECT COALESCE(SUM(valor), 0) FROM movimentacoes WHERE tipo = 'despesa') AS total_despesas`,
    );

    return rows[0];
  }

  // Lista todos os usuarios com a quantidade de movimentacoes de cada um (sem expor a senha).
  static async listarUsuarios() {
    const [rows] = await pool.execute(
      `SELECT
        usuarios.id, usuarios.nome, usuarios.email, usuarios.perfil, usuarios.ativo,
        usuarios.criado_em,
        COUNT(movimentacoes.id) AS total_movimentacoes
       FROM usuarios
       LEFT JOIN movimentacoes ON movimentacoes.usuario_id = usuarios.id
       GROUP BY usuarios.id, usuarios.nome, usuarios.email, usuarios.perfil, usuarios.ativo, usuarios.criado_em
       ORDER BY usuarios.criado_em DESC, usuarios.id DESC`,
    );

    return rows;
  }

  // Atualiza perfil e/ou status de um usuario; campos nao enviados continuam como estao.
  static async atualizarUsuario({ id, perfil, ativo }) {
    const [result] = await pool.execute(
      `UPDATE usuarios
       SET perfil = COALESCE(?, perfil), ativo = COALESCE(?, ativo)
       WHERE id = ?`,
      [perfil ?? null, ativo ?? null, id],
    );

    return result.affectedRows > 0;
  }

  // Remove o usuario; categorias e movimentacoes dele saem junto (ON DELETE CASCADE).
  static async excluirUsuario(id) {
    const [result] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);

    return result.affectedRows > 0;
  }
}

export default Admin;
