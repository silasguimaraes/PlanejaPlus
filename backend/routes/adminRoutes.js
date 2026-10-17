import { Router } from 'express';
import {
  atualizarUsuario,
  excluirUsuario,
  listarUsuarios,
  resumo,
} from '../controllers/adminController.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Roteador do painel admin: exige token valido E perfil de administrador.
const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/resumo', asyncHandler(resumo));
router.get('/usuarios', asyncHandler(listarUsuarios));
router.patch('/usuarios/:id', asyncHandler(atualizarUsuario));
router.delete('/usuarios/:id', asyncHandler(excluirUsuario));

export default router;
