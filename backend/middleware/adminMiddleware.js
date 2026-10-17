import { pool } from '../database/connection.js';

// Libera a rota apenas para administradores ativos (usar depois do authMiddleware).
export async function adminMiddleware(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT perfil, ativo FROM usuarios WHERE id = ? LIMIT 1',
      [req.usuario.id],
    );

    if (!rows[0] || rows[0].perfil !== 'admin' || !rows[0].ativo) {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
