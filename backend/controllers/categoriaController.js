import Categoria from '../models/Categoria.js';

// Controller que cria uma categoria para o usuario autenticado.
export async function criarCategoria(req, res) {
  // Nome e tipo chegam do formulario de categorias.
  const { nome, tipo } = req.body || {};

  // Garante que a categoria tenha as informacoes minimas para existir.
  if (!nome || !tipo) {
    return res.status(400).json({ message: 'Nome e tipo sao obrigatorios.' });
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
