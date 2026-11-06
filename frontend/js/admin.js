// Usa o utilitario global por namespace para evitar redeclarar nomes de appUtils.js.
const adminUtils = window.AppUtils;

const usuariosTabela = document.querySelector('#usuarios-tabela');
const adminStatus = document.querySelector('#admin-status');
let usuarioLogadoId = null;

function renderResumo(resumo) {
  // Converte os valores agregados antes de apresenta-los para evitar campos vazios.
  document.querySelector('#total-usuarios').textContent = Number(resumo.total_usuarios);
  document.querySelector('#usuarios-ativos').textContent = Number(resumo.usuarios_ativos);
  document.querySelector('#total-movimentacoes').textContent = Number(resumo.total_movimentacoes);
  document.querySelector('#total-receitas').textContent = adminUtils.formatCurrency(resumo.total_receitas);
  document.querySelector('#total-despesas').textContent = adminUtils.formatCurrency(resumo.total_despesas);
}

function renderUsuarios(usuarios) {
  if (!usuarios.length) {
    usuariosTabela.innerHTML = '<tr><td colspan="6" class="empty">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  usuariosTabela.innerHTML = usuarios
    .map((u) => {
      const ehAdmin = u.perfil === 'admin';
      const ehVoce = Number(u.id) === usuarioLogadoId;

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
          <td>${adminUtils.escapeHtml(u.nome)}</td>
          <td>${adminUtils.escapeHtml(u.email)}</td>
          <td><span class="tag ${ehAdmin ? 'admin-soft' : ''}">${ehAdmin ? 'admin' : 'usuário'}</span></td>
          <td>${u.total_movimentacoes}</td>
          <td>${adminUtils.formatDate(u.criado_em)}</td>
          <td class="col-acoes">${acoes}</td>
        </tr>`;
    })
    .join('');

  usuariosTabela.usuarios = usuarios;
}

async function carregar() {
  adminStatus.textContent = 'Carregando dados do painel...';

  try {
    const [resumo, usuarios] = await Promise.all([
      window.ApiService.adminResumo(),
      window.ApiService.adminListarUsuarios(),
    ]);

    renderResumo(resumo);
    renderUsuarios(usuarios);
    adminStatus.textContent = `Dados atualizados. ${usuarios.length} usuário(s) encontrado(s).`;
  } catch (error) {
    // Informa falta de permissao sem redirecionar silenciosamente nem exibir zeros falsos.
    if ([401, 403].includes(error.response?.status)) {
      adminStatus.textContent =
        'Não foi possível carregar o painel: entre com uma conta de administrador ativa.';
      document.querySelectorAll('.admin-stats strong').forEach((value) => {
        value.textContent = '—';
      });
      usuariosTabela.innerHTML =
        '<tr><td colspan="6" class="empty">Os dados administrativos não estão disponíveis para esta conta.</td></tr>';
      return;
    }

    adminStatus.textContent = 'Não foi possível carregar os dados. Confira se a API está em execução e tente novamente.';
    document.querySelectorAll('.admin-stats strong').forEach((value) => {
      value.textContent = '—';
    });
    adminUtils.showMessage(adminUtils.getApiError(error), 'error');
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

    adminUtils.showMessage('Alteração salva.');
    carregar();
  } catch (error) {
    adminUtils.showMessage(adminUtils.getApiError(error), 'error');
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
