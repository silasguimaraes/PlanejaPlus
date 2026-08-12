import { pool } from '../database/connection.js';

// Model que concentra as consultas SQL relacionadas aos usuarios.
class Usuario {
  // Cria um usuario novo com nome, email e senha ja criptografada.
  static async create({ nome, email, senha }) {
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senha],
    );

    // Retorna apenas dados seguros, sem devolver a senha.
    return {
      id: result.insertId,
      nome,
      email,
    };
  }

  // Busca um usuario pelo email para permitir a validacao do login.
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1',
      [email],
    );

    return rows[0] || null;
  }
}

export default Usuario;
