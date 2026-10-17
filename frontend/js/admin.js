const { escapeHtml, formatCurrency, formatDate, getApiError, showMessage } = window.AppUtils;

const usuariosTabela = document.querySelector('#usuarios-tabela');
let usuarioLogadoId = null;

function renderResumo(resumo) {
  document.querySelector('#total-usuarios').textContent = resumo.total_usuarios;
  document.querySelector('#usuarios-ativos').textContent = resumo.usuarios_ativos;
  document.querySelector('#total-movimentacoes').textContent = resumo.total_movimentacoes;
  document.querySelector('#total-receitas').textContent = formatCurrency(resumo.total_receitas);
  document.querySelector('#total-despesas').textContent = formatCurrency(resumo.total_despesas);
}

function renderUsuarios(usuarios) {
  if (!usuarios.length) {
    usuariosTabela.innerHTML = '<tr><td colspan="6" class="empty">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  usuariosTabela.innerHTML = usuarios
    .map((u) => {
      const ehAdmin = u.perfil === 'admin';
      const ehVoce = u.id === usuarioLogadoId;

      const acoes = ehVoce
        ? '<span class="item-meta">Você</span>'
        : `
          <button class="button secondary small" data-acao="perfil" data-id="${u.id}">
            ${ehAdmin ? 'Tornar usuário' : 'Tornar admin'}
          </button>
          <button class="button secondary small" data-acao="ativo" data-id="${u.id}">
            ${u.ativo ? 'Desativar' : 'Ativar'}
          </button>
          <button class="button danger small" data-acao="excluir" data-id="${u.id}">Excluir</button>`;

      return `
        <tr class="${u.ativo ? '' : 'inativo'}">
          <td>${escapeHtml(u.nome)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="tag ${ehAdmin ? 'admin-soft' : ''}">${ehAdmin ? 'admin' : 'usuário'}</span></td>
          <td>${u.total_movimentacoes}</td>
          <td>${formatDate(u.criado_em)}</td>
          <td class="col-acoes">${acoes}</td>
        </tr>`;
    })
    .join('');

  usuariosTabela.usuarios = usuarios;
}

async function carregar() {
  try {
    const [resumo, usuarios] = await Promise.all([
      window.ApiService.adminResumo(),
      window.ApiService.adminListarUsuarios(),
    ]);

    renderResumo(resumo);
    renderUsuarios(usuarios);
  } catch (error) {
    if ([401, 403].includes(error.response?.status)) {
      window.location.href = './dashboard.html';
      return;
    }

    showMessage(getApiError(error), 'error');
  }
}

usuariosTabela.addEventListener('click', async (event) => {
  const botao = event.target.closest('button[data-acao]');

  if (!botao) {
    return;
  }

  const id = Number(botao.dataset.id);
  const usuario = usuariosTabela.usuarios.find((u) => u.id === id);

  try {
    if (botao.dataset.acao === 'perfil') {
      const perfil = usuario.perfil === 'admin' ? 'usuario' : 'admin';
      await window.ApiService.adminAtualizarUsuario(id, { perfil });
    } else if (botao.dataset.acao === 'ativo') {
      await window.ApiService.adminAtualizarUsuario(id, { ativo: !usuario.ativo });
    } else if (botao.dataset.acao === 'excluir') {
      if (!confirm(`Excluir ${usuario.nome} e todas as movimentações dele? Isso não pode ser desfeito.`)) {
        return;
      }
      await window.ApiService.adminExcluirUsuario(id);
    }

    showMessage('Alteração salva.');
    carregar();
  } catch (error) {
    showMessage(getApiError(error), 'error');
  }
});

function lerIdDoToken() {
  try {
    const payload = localStorage.getItem('planeja_token').split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).id;
  } catch {
    return null;
  }
}

window.AppUtils.requireAuth();
window.AppUtils.setupAdminLink();
window.AppUtils.setupLogout();
usuarioLogadoId = lerIdDoToken();
carregar();
