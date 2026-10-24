// Seleciona elementos principais da tela de movimentacoes.
const movimentacaoForm = document.querySelector('#movimentacao-form');
const movimentacoesLista = document.querySelector('#movimentacoes-lista');
const categoriaSelect = movimentacaoForm.elements.categoria_id;
const cancelarEdicaoButton = document.querySelector('#cancelar-edicao');
const buscaMovimentacoesInput = document.querySelector('#buscar-movimentacoes');
const filtrosMovimentacoes = document.querySelector('.movement-filters');

// Cache local usado para encontrar uma movimentacao quando o usuario clicar em editar.
let movimentacoesCache = [];
let filtroMovimentacoesAtual = 'todas';

// Limpa o formulario e coloca a data atual como valor padrao.
function resetForm() {
  movimentacaoForm.reset();
  movimentacaoForm.elements.id.value = '';
  movimentacaoForm.elements.data_movimentacao.value = new Date().toISOString().slice(0, 10);
}

// Preenche o select de categorias usando os dados vindos da API.
function renderCategorias(categorias) {
  if (!categorias.length) {
    categoriaSelect.innerHTML = '<option value="">Crie uma categoria primeiro</option>';
    return;
  }

  categoriaSelect.innerHTML = categorias
    .map((categoria) => `<option value="${categoria.id}">${window.AppUtils.escapeHtml(categoria.nome)}</option>`)
    .join('');
}

function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

// Renderiza as movimentacoes filtradas na tabela.
function renderMovimentacoes(movimentacoes) {
  movimentacoesCache = movimentacoes;
  const termoBusca = normalizarTexto(buscaMovimentacoesInput.value.trim());
  const resultados = movimentacoes.filter((movimentacao) => {
    const correspondeAoTipo =
      filtroMovimentacoesAtual === 'todas' || movimentacao.tipo === filtroMovimentacoesAtual;
    const correspondeABusca = normalizarTexto(movimentacao.descricao).includes(termoBusca);

    return correspondeAoTipo && correspondeABusca;
  });

  if (!resultados.length) {
    const mensagem = movimentacoes.length
      ? 'Nenhuma movimentação encontrada para este filtro.'
      : 'Nenhuma movimentação cadastrada.';
    movimentacoesLista.innerHTML = `<tr><td class="empty movement-empty" colspan="4">${mensagem}</td></tr>`;
    return;
  }

  movimentacoesLista.innerHTML = resultados
    .map(
      (movimentacao) => `
        <tr class="movement-row">
          <td>
            <span class="movement-description">${window.AppUtils.escapeHtml(movimentacao.descricao)}</span>
            <div class="movement-row-actions">
              <button class="button secondary small" type="button" data-editar="${movimentacao.id}" aria-label="Editar movimentação">Editar</button>
              <button class="button danger small" type="button" data-excluir="${movimentacao.id}" aria-label="Excluir movimentação">Excluir</button>
            </div>
          </td>
          <td>${window.AppUtils.escapeHtml(movimentacao.categoria_nome)}</td>
          <td>${window.AppUtils.formatDate(movimentacao.data_movimentacao)}</td>
          <td class="movement-value ${movimentacao.tipo === 'receita' ? 'positive' : 'negative'}">
            ${window.AppUtils.formatCurrency(movimentacao.valor)}
          </td>
        </tr>
      `,
    )
    .join('');
}

// Carrega categorias e movimentacoes ao mesmo tempo para deixar a tela pronta.
async function carregarDados() {
  try {
    const [categorias, movimentacoes] = await Promise.all([
      window.ApiService.listarCategorias(),
      window.ApiService.listarMovimentacoes(),
    ]);

    renderCategorias(categorias);
    renderMovimentacoes(movimentacoes);
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
}

// Salva uma movimentacao nova ou atualiza uma existente.
movimentacaoForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    // O campo id indica se o formulario esta em modo edicao.
    const dados = window.AppUtils.getFormData(movimentacaoForm);
    const id = dados.id;
    delete dados.id;

    if (id) {
      await window.ApiService.editarMovimentacao(id, dados);
    } else {
      await window.ApiService.criarMovimentacao(dados);
    }

    resetForm();
    window.AppUtils.showMessage('Movimentação salva com sucesso.');
    carregarDados();
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
});

buscaMovimentacoesInput.addEventListener('input', () => {
  renderMovimentacoes(movimentacoesCache);
});

filtrosMovimentacoes.addEventListener('click', (event) => {
  const botao = event.target.closest('button[data-filtro]');

  if (!botao) {
    return;
  }

  filtroMovimentacoesAtual = botao.dataset.filtro;
  filtrosMovimentacoes.querySelectorAll('button[data-filtro]').forEach((filtro) => {
    const ativo = filtro === botao;
    filtro.classList.toggle('is-active', ativo);
    filtro.setAttribute('aria-pressed', String(ativo));
  });
  renderMovimentacoes(movimentacoesCache);
});

// Trata cliques nos botoes de editar e excluir dentro da lista.
movimentacoesLista.addEventListener('click', async (event) => {
  const editarButton = event.target.closest('[data-editar]');
  const excluirButton = event.target.closest('[data-excluir]');

  // Ao editar, copia os dados da movimentacao escolhida para o formulario.
  if (editarButton) {
    const movimentacao = movimentacoesCache.find(
      (item) => String(item.id) === editarButton.dataset.editar,
    );

    if (!movimentacao) {
      return;
    }

    movimentacaoForm.elements.id.value = movimentacao.id;
    movimentacaoForm.elements.categoria_id.value = movimentacao.categoria_id;
    movimentacaoForm.elements.descricao.value = movimentacao.descricao;
    movimentacaoForm.elements.valor.value = movimentacao.valor;
    movimentacaoForm.elements.tipo.value = movimentacao.tipo;
    movimentacaoForm.elements.data_movimentacao.value = window.AppUtils.toInputDate(
      movimentacao.data_movimentacao,
    );
  }

  // Ao excluir, chama a API e atualiza a lista na tela.
  if (excluirButton) {
    try {
      await window.ApiService.excluirMovimentacao(excluirButton.dataset.excluir);
      window.AppUtils.showMessage('Movimentação excluída com sucesso.');
      carregarDados();
    } catch (error) {
      window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
    }
  }
});

// Botao usado para cancelar a edicao e limpar o formulario.
cancelarEdicaoButton.addEventListener('click', resetForm);

// Protege a pagina, ativa logout, prepara o formulario e carrega dados.
window.AppUtils.requireAuth();
window.AppUtils.setupAdminLink();
window.AppUtils.setupLogout();
resetForm();
carregarDados();
