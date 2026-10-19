import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
	cadastro,
	esqueciSenha,
	login,
	redefinirSenha,
	validarTokenRedefinicao,
} from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Cria um roteador separado para organizar as rotas de autenticação.
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
	createAuthLimiter(10, 'Muitas tentativas de cadastro. Tente novamente mais tarde.'),
	asyncHandler(cadastro),
);

// POST /auth/login confere credenciais e devolve token.
router.post(
	'/login',
	createAuthLimiter(10, 'Muitas tentativas de login. Tente novamente mais tarde.'),
	asyncHandler(login),
);

router.post(
	'/esqueci-senha',
	createAuthLimiter(5, 'Muitas solicitações de recuperação de senha. Tente novamente mais tarde.'),
	asyncHandler(esqueciSenha),
);

router.get(
	'/redefinir-senha/:token',
	createAuthLimiter(30, 'Muitas tentativas. Tente novamente mais tarde.'),
	asyncHandler(validarTokenRedefinicao),
);

router.post(
	'/redefinir-senha',
	createAuthLimiter(10, 'Muitas tentativas de redefinição de senha. Tente novamente mais tarde.'),
	asyncHandler(redefinirSenha),
);

export default router;
