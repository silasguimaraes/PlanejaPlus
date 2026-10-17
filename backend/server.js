import app from './app.js';
import { env } from './config/env.js';
import { ensureUsuarioAdminColumns } from './database/connection.js';

async function startServer() {
  await ensureUsuarioAdminColumns();

  // Inicia o servidor na porta configurada no arquivo .env ou no valor padrao.
  app.listen(env.port, () => {
    // Mostra no terminal que a API esta pronta para receber requisicoes.
    console.log(`Servidor rodando na porta ${env.port}`);
  });
}

startServer();
