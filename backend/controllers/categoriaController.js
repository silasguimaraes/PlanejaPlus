import Categoria from '../models/Categoria.js';

// Controller que cria uma categoria para o usuario autenticado.
export async function criarCategoria(req, res) {
  // Nome e tipo chegam do formulario de categorias.
  const { nome, tipo } = req.body || {};

  // Garante que a categoria tenha as informacoes minimas para existir.
  if (!nome || !tipo) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios.' });
  }

  // Usa req.usuario.id para ligar a categoria ao usuario dono do token.
  const categoria = await Categoria.create({
    usuarioId: req.usuario.id,
    nome,
    tipo,
  });

  // Responde com a categoria criada e o status HTTP correto para criacao.
  return res.status(201).json(categoria);
}

// Controller que lista apenas as categorias pertencentes ao usuario logado.
export async function listarCategorias(req, res) {
  const categorias = await Categoria.findByUsuario(req.usuario.id);

  return res.json(categorias);
}

// Exclui uma categoria livre sem permitir que ela remova movimentacoes financeiras.
export async function excluirCategoria(req, res) {
  const { id } = req.params;
  const resultado = await Categoria.delete({ id, usuarioId: req.usuario.id });

  if (!resultado.deleted && resultado.inUse) {
    return res.status(409).json({
      message: 'Não é possível excluir uma categoria que possui movimentações vinculadas.',
    });
  }

  if (!resultado.deleted) {
    return res.status(404).json({ message: 'Categoria não encontrada.' });
  }

  return res.status(204).send();
}
