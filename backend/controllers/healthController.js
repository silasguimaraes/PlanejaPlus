// Controller simples usado para verificar se a API esta respondendo.
export function healthCheck(req, res) {
  // Retorna uma resposta pequena para confirmar que o servidor esta online.
  res.json({
    status: 'ok',
    message: 'Planeja+ API',
  });
}
