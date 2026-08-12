import { Router } from 'express';
import {
  criarMovimentacao,
  editarMovimentacao,
  excluirMovimentacao,
  listarMovimentacoes,
} from '../controllers/movimentacaoController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Roteador exclusivo para o CRUD de movimentacoes financeiras.
const router = Router();

// Todas as movimentacoes pertencem a um usuario, entao o token e obrigatorio.
router.use(authMiddleware);

// Cria uma nova movimentacao.
router.post('/', asyncHandler(criarMovimentacao));

// Lista todas as movimentacoes do usuario logado.
router.get('/', asyncHandler(listarMovimentacoes));

// Edita uma movimentacao pelo id informado na URL.
router.put('/:id', asyncHandler(editarMovimentacao));

// Remove uma movimentacao pelo id informado na URL.
router.delete('/:id', asyncHandler(excluirMovimentacao));

export default router;
