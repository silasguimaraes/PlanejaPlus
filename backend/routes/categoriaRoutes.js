import { Router } from 'express';
import { criarCategoria, listarCategorias } from '../controllers/categoriaController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Roteador exclusivo para endpoints de categorias.
const router = Router();

// Todas as rotas abaixo exigem token valido.
router.use(authMiddleware);

// POST /categorias cria uma categoria para o usuario logado.
router.post('/', asyncHandler(criarCategoria));

// GET /categorias lista as categorias do usuario logado.
router.get('/', asyncHandler(listarCategorias));

export default router;
