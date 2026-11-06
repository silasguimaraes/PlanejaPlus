import { pool } from '../database/connection.js';

class RedefinicaoSenha {
  static async create({ usuarioId, tokenHash, expiraEmMinutos }) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
      await connection.beginTransaction();
      transactionStarted = true;
      await connection.execute(
        `UPDATE redefinicoes_senha
         SET usado_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP
         WHERE usuario_id = ? AND usado_em IS NULL`,
        [usuarioId],
      );
      await connection.execute(
        `INSERT INTO redefinicoes_senha (usuario_id, token_hash, expira_em)
         VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))`,
        [usuarioId, tokenHash, expiraEmMinutos],
      );
      await connection.commit();
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  static async isValid(tokenHash) {
    const [rows] = await pool.execute(
      `SELECT id FROM redefinicoes_senha
       WHERE token_hash = ? AND usado_em IS NULL AND expira_em > CURRENT_TIMESTAMP
       LIMIT 1`,
      [tokenHash],
    );

    return rows.length > 0;
  }

  static async redefinirSenha({ tokenHash, senhaHash }) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
      await connection.beginTransaction();
      transactionStarted = true;
      const [rows] = await connection.execute(
        `SELECT usuario_id FROM redefinicoes_senha
         WHERE token_hash = ? AND usado_em IS NULL AND expira_em > CURRENT_TIMESTAMP
         LIMIT 1`,
        [tokenHash],
      );

      if (rows.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return false;
      }

      const { usuario_id: usuarioId } = rows[0];
      await connection.execute(
        'UPDATE usuarios SET senha = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
        [senhaHash, usuarioId],
      );
      await connection.execute(
        `UPDATE redefinicoes_senha
         SET usado_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP
         WHERE usuario_id = ? AND usado_em IS NULL`,
        [usuarioId],
      );
      await connection.commit();
      transactionStarted = false;
      return true;
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

export default RedefinicaoSenha;
