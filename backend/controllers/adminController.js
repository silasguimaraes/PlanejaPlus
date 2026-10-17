import Admin from '../models/Admin.js';

// Devolve os totais exibidos nos cards do painel admin.
export async function resumo(req, res) {
  return res.json(await Admin.resumo());
}

// Devolve todos os usuarios cadastrados.
export async function listarUsuarios(req, res) {
  return res.json(await Admin.listarUsuarios());
}

// Altera perfil e/ou status (ativo) de um usuario.
export async function atualizarUsuario(req, res) {
  const id = Number(req.params.id);
  const { perfil, ativo } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Id invalido.' });
  }

  if (perfil !== undefined && !['usuario', 'admin'].includes(perfil)) {
    return res.status(400).json({ message: 'Perfil invalido.' });
  }

  if (id === req.usuario.id && (perfil === 'usuario' || ativo === false)) {
    return res.status(400).json({ message: 'Voce nao pode remover seu proprio acesso de admin.' });
  }

  const atualizado = await Admin.atualizarUsuario({
    id,
    perfil,
    ativo: ativo === undefined ? undefined : Number(Boolean(ativo)),
  });

  if (!atualizado) {
    return res.status(404).json({ message: 'Usuario nao encontrado.' });
  }

  return res.json({ message: 'Usuario atualizado.' });
}

// Exclui um usuario e todos os dados ligados a ele.
export async function excluirUsuario(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Id invalido.' });
  }

  if (id === req.usuario.id) {
    return res.status(400).json({ message: 'Voce nao pode excluir a propria conta.' });
  }

  if (!(await Admin.excluirUsuario(id))) {
    return res.status(404).json({ message: 'Usuario nao encontrado.' });
  }

  return res.status(204).send();
}
