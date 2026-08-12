import { Router } from 'express';
import { cadastro, login } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Cria um roteador separado para organizar as rotas de autenticacao.
const router = Router();

// POST /auth/cadastro cria conta e devolve token.
router.post('/cadastro', asyncHandler(cadastro));

// POST /auth/login confere credenciais e devolve token.
router.post('/login', asyncHandler(login));

export default router;
