import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import routes from './routes/index.js';

// Cria a aplicacao Express; e aqui que configuramos tudo que o servidor vai usar.
const app = express();

// Libera chamadas do frontend, que normalmente roda em outra origem durante o desenvolvimento.
app.use(cors());

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
