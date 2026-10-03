import Movimentacao from '../models/Movimentacao.js';

function validarDadosMovimentacao({ categoria_id, descricao, valor, tipo, data_movimentacao }) {
  const data = typeof data_movimentacao === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data_movimentacao)
    ? new Date(`${data_movimentacao}T00:00:00.000Z`)
    : null;
  const dataValida = data && !Number.isNaN(data.valueOf()) &&
    data.toISOString().slice(0, 10) === data_movimentacao;

  return Number.isInteger(Number(categoria_id)) && Number(categoria_id) > 0 &&
    typeof descricao === 'string' && descricao.trim().length > 0 && descricao.length <= 180 &&
    Number.isFinite(Number(valor)) && Number(valor) > 0 &&
    ['receita', 'despesa'].includes(tipo) && dataValida;
}

// Controller que cria uma nova movimentacao financeira.
export async function criarMovimentacao(req, res) {
  // Campos enviados pelo formulario de movimentacoes.
  const { categoria_id, descricao, valor, tipo, data_movimentacao } = req.body || {};

  // Valida se todos os campos obrigatorios foram preenchidos.
  if (!validarDadosMovimentacao({ categoria_id, descricao, valor, tipo, data_movimentacao })) {
    return res.status(400).json({
      message: 'Informe categoria, descricao, valor positivo, tipo valido e data correta.',
    });
  }

  // Cria a movimentacao ligada ao usuario autenticado.
  const movimentacao = await Movimentacao.create({
    usuarioId: req.usuario.id,
    categoriaId: Number(categoria_id),
    descricao: descricao.trim(),
    valor: Number(valor),
    tipo,
    dataMovimentacao: data_movimentacao,
  });

  // Se vier null, a categoria nao pertence ao usuario ou nao existe.
  if (!movimentacao) {
    return res.status(400).json({ message: 'Categoria invalida para este usuario.' });
  }

  // Retorna a movimentacao criada.
  return res.status(201).json(movimentacao);
}

// Controller que lista todas as movimentacoes do usuario logado.
export async function listarMovimentacoes(req, res) {
  const movimentacoes = await Movimentacao.findByUsuario(req.usuario.id);

  return res.json(movimentacoes);
}

// Controller que edita uma movimentacao existente.
export async function editarMovimentacao(req, res) {
  // O id vem pela URL, e os demais dados vem pelo corpo da requisicao.
  const { id } = req.params;
  const { categoria_id, descricao, valor, tipo, data_movimentacao } = req.body || {};

  // Mantem a mesma regra de campos obrigatorios usada na criacao.
  if (!validarDadosMovimentacao({ categoria_id, descricao, valor, tipo, data_movimentacao })) {
    return res.status(400).json({
      message: 'Informe categoria, descricao, valor positivo, tipo valido e data correta.',
    });
  }

  // Atualiza somente se a movimentacao e a categoria pertencerem ao usuario.
  const movimentacao = await Movimentacao.update({
    id,
    usuarioId: req.usuario.id,
    categoriaId: Number(categoria_id),
    descricao: descricao.trim(),
    valor: Number(valor),
    tipo,
    dataMovimentacao: data_movimentacao,
  });

  // Quando nada e atualizado, o registro nao existe ou pertence a outro usuario.
  if (!movimentacao) {
    return res.status(404).json({ message: 'Movimentacao nao encontrada ou categoria invalida.' });
  }

  return res.json(movimentacao);
}

// Controller que remove uma movimentacao do usuario logado.
export async function excluirMovimentacao(req, res) {
  const { id } = req.params;

  // O model retorna true quando a exclusao realmente aconteceu.
  const removida = await Movimentacao.delete({ id, usuarioId: req.usuario.id });

  if (!removida) {
    return res.status(404).json({ message: 'Movimentacao nao encontrada.' });
  }

  // Status 204 significa sucesso sem corpo de resposta.
  return res.status(204).send();
}
