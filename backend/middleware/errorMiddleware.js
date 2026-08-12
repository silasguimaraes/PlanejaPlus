// Middleware centralizado para tratar erros que acontecerem nas rotas.
export function errorMiddleware(err, req, res, next) {
  // ER_DUP_ENTRY acontece quando o MySQL bloqueia um valor repetido, como email duplicado.
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Registro ja existente.' });
  }

  // Registra o erro completo no terminal para ajudar na investigacao durante o desenvolvimento.
  console.error(err);

  // Resposta generica para nao expor detalhes internos da aplicacao ao usuario.
  return res.status(500).json({ message: 'Erro interno no servidor.' });
}
