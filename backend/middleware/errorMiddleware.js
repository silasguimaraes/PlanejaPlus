// Middleware centralizado para tratar erros que acontecerem nas rotas.
export function errorMiddleware(err, req, res, next) {
  // Ambos os drivers usam codigos diferentes para informar uma chave UNIQUE duplicada.
  if (
    err.code === 'ER_DUP_ENTRY' ||
    err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
  ) {
    return res.status(409).json({ message: 'Registro já existente.' });
  }

  // Registra o erro completo no terminal para ajudar na investigacao durante o desenvolvimento.
  console.error(err);

  // Resposta generica para nao expor detalhes internos da aplicacao ao usuario.
  return res.status(500).json({ message: 'Erro interno no servidor.' });
}
