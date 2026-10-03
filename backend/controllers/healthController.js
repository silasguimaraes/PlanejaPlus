import { pool } from '../database/connection.js';

// Controller simples usado para verificar se a API esta respondendo.
export async function healthCheck(req, res) {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'ok' });
  } catch {
    return res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
}
