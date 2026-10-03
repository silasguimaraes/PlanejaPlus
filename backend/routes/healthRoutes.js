import { Router } from 'express';
import { healthCheck } from '../controllers/healthController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Roteador usado para verificar se a API esta viva.
const router = Router();

// GET /health retorna uma resposta simples de funcionamento.
router.get('/', asyncHandler(healthCheck));

export default router;
