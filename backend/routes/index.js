import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import categoriaRoutes from './categoriaRoutes.js';
import healthRoutes from './healthRoutes.js';
import movimentacaoRoutes from './movimentacaoRoutes.js';

// Roteador principal que junta todos os modulos de rota da API.
const router = Router();

// Cada use cria um prefixo para um grupo de funcionalidades.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/movimentacoes', movimentacaoRoutes);

export default router;
