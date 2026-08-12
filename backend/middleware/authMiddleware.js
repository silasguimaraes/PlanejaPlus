import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Middleware que protege rotas exigindo um token JWT valido.
export function authMiddleware(req, res, next) {
  // O token deve chegar no cabecalho Authorization, no formato "Bearer token".
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token nao informado.' });
  }

  // Separa a palavra Bearer do token real.
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Token invalido.' });
  }

  try {
    // Verifica o token e guarda os dados do usuario na requisicao.
    req.usuario = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    // Se o token estiver errado ou vencido, bloqueia o acesso.
    return res.status(401).json({ message: 'Token invalido ou expirado.' });
  }
}
