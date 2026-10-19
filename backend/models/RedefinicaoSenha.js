import { pool } from '../database/connection.js';

class RedefinicaoSenha {
  static async create({ usuarioId, tokenHash, expiraEmMinutos }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.execute(
        'UPDATE redefinicoes_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL',
        [usuarioId],
      );
      await connection.execute(
        `INSERT INTO redefinicoes_senha (usuario_id, token_hash, expira_em)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
        [usuarioId, tokenHash, expiraEmMinutos],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async isValid(tokenHash) {
    const [rows] = await pool.execute(
      `SELECT id FROM redefinicoes_senha
       WHERE token_hash = ? AND usado_em IS NULL AND expira_em > NOW()
       LIMIT 1`,
      [tokenHash],
    );

    return rows.length > 0;
  }

  static async redefinirSenha({ tokenHash, senhaHash }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(
        `SELECT usuario_id FROM redefinicoes_senha
         WHERE token_hash = ? AND usado_em IS NULL AND expira_em > NOW()
         LIMIT 1
         FOR UPDATE`,
        [tokenHash],
      );

      if (rows.length === 0) {
        await connection.rollback();
        return false;
      }

      const { usuario_id: usuarioId } = rows[0];
      await connection.execute('UPDATE usuarios SET senha = ? WHERE id = ?', [senhaHash, usuarioId]);
      await connection.execute(
        'UPDATE redefinicoes_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL',
        [usuarioId],
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default RedefinicaoSenha;
