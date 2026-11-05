import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import routes from './routes/index.js';

// Cria a aplicacao Express; e aqui que configuramos tudo que o servidor vai usar.
const app = express();
app.set('trust proxy', 1);

// Libera chamadas do frontend durante o desenvolvimento. Em ambiente local o frontend pode
// ser servido em localhost, 127.0.0.1 ou em IPs da rede, entao usamos a origem da requisicao
// em vez de bloquear apenas uma lista estreita.
app.use(cors({ origin: true, credentials: true }));

// Ensina o Express a ler dados enviados em JSON no corpo das requisicoes.
app.use(express.json());

// Permite ler formularios enviados no formato tradicional de URL.
app.use(express.urlencoded({ extended: true }));

// Concentra todas as rotas da API abaixo do prefixo /api.
app.use('/api', routes);

// Deixa o tratamento de erro por ultimo para capturar problemas das rotas anteriores.
app.use(errorMiddleware);

// Exporta a aplicacao para que o arquivo server.js possa iniciar o servidor.
export default app;
