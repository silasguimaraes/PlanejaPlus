import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { cadastro, login } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Cria um roteador separado para organizar as rotas de autenticacao.
const router = Router();
const createAuthLimiter = (limit, message) => rateLimit({
	windowMs: 15 * 60 * 1000,
	limit,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	handler: (req, res) => res.status(429).json({ message }),
});

// POST /auth/cadastro cria conta e devolve token.
router.post(
	'/cadastro',
	createAuthLimiter(5, 'Muitas tentativas de cadastro. Tente novamente mais tarde.'),
	asyncHandler(cadastro),
);

// POST /auth/login confere credenciais e devolve token.
router.post(
	'/login',
	createAuthLimiter(10, 'Muitas tentativas de login. Tente novamente mais tarde.'),
	asyncHandler(login),
);

export default router;
