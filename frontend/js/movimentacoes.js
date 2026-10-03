// Seleciona elementos principais da tela de movimentacoes.
const movimentacaoForm = document.querySelector('#movimentacao-form');
const movimentacoesLista = document.querySelector('#movimentacoes-lista');
const categoriaSelect = movimentacaoForm.elements.categoria_id;
const cancelarEdicaoButton = document.querySelector('#cancelar-edicao');

// Cache local usado para encontrar uma movimentacao quando o usuario clicar em editar.
let movimentacoesCache = [];

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

// Renderiza os cards de movimentacoes na tela.
function renderMovimentacoes(movimentacoes) {
  movimentacoesCache = movimentacoes;

  // Se nao houver dados, mostra uma mensagem simples.
  if (!movimentacoes.length) {
    movimentacoesLista.innerHTML = '<p class="empty">Nenhuma movimentacao cadastrada.</p>';
    return;
  }

  // Monta um artigo HTML para cada movimentacao.
  movimentacoesLista.innerHTML = movimentacoes
    .map(
      (movimentacao) => `
        <article class="item">
          <div class="item-header">
            <div>
              <p class="item-title">${window.AppUtils.escapeHtml(movimentacao.descricao)}</p>
              <p class="item-meta">
                ${window.AppUtils.escapeHtml(movimentacao.categoria_nome)} - ${window.AppUtils.formatDate(
                  movimentacao.data_movimentacao,
                )}
              </p>
            </div>
            <span class="tag ${movimentacao.tipo === 'receita' ? 'success-soft' : 'danger-soft'}">
              ${window.AppUtils.escapeHtml(movimentacao.tipo)}
            </span>
          </div>
          <p class="item-value ${movimentacao.tipo === 'receita' ? 'positive' : 'negative'}">
            ${window.AppUtils.formatCurrency(movimentacao.valor)}
          </p>
          <div class="actions compact">
            <button class="button secondary" type="button" data-editar="${movimentacao.id}">
              Editar
            </button>
            <button class="button danger" type="button" data-excluir="${movimentacao.id}">
              Excluir
            </button>
          </div>
        </article>
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
    window.AppUtils.showMessage('Movimentacao salva com sucesso.');
    carregarDados();
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
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
      window.AppUtils.showMessage('Movimentacao excluida com sucesso.');
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
window.AppUtils.setupLogout();
resetForm();
carregarDados();
