import app from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './database/migrationRunner.js';

async function startServer() {
  await runMigrations();

  // Escuta nas interfaces de rede para permitir acesso local por outros dispositivos.
  app.listen(env.port, '0.0.0.0', () => {
    // Mostra no terminal que a API esta pronta para receber requisicoes.
    console.log(`Servidor rodando na porta ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exitCode = 1;
});
