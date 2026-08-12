import { Router } from 'express';
import { healthCheck } from '../controllers/healthController.js';

// Roteador usado para verificar se a API esta viva.
const router = Router();

// GET /health retorna uma resposta simples de funcionamento.
router.get('/', healthCheck);

export default router;
