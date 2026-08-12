import Movimentacao from '../models/Movimentacao.js';

// Controller que cria uma nova movimentacao financeira.
export async function criarMovimentacao(req, res) {
  // Campos enviados pelo formulario de movimentacoes.
  const { categoria_id, descricao, valor, tipo, data_movimentacao } = req.body || {};

  // Valida se todos os campos obrigatorios foram preenchidos.
  if (!categoria_id || !descricao || !valor || !tipo || !data_movimentacao) {
    return res.status(400).json({
      message: 'Categoria, descricao, valor, tipo e data_movimentacao sao obrigatorios.',
    });
  }

  // Cria a movimentacao ligada ao usuario autenticado.
  const movimentacao = await Movimentacao.create({
    usuarioId: req.usuario.id,
    categoriaId: categoria_id,
    descricao,
    valor,
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
  if (!categoria_id || !descricao || !valor || !tipo || !data_movimentacao) {
    return res.status(400).json({
      message: 'Categoria, descricao, valor, tipo e data_movimentacao sao obrigatorios.',
    });
  }

  // Atualiza somente se a movimentacao e a categoria pertencerem ao usuario.
  const movimentacao = await Movimentacao.update({
    id,
    usuarioId: req.usuario.id,
    categoriaId: categoria_id,
    descricao,
    valor,
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
