// Recebe um controller assincrono e devolve uma funcao que o Express entende.
export function asyncHandler(controller) {
  return (req, res, next) => {
    // Se uma Promise falhar, o erro e enviado para o middleware de erro.
    Promise.resolve(controller(req, res, next)).catch(next);
  };
}
