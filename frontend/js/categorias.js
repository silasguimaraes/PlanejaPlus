// Seleciona o formulario e a area onde as categorias serao exibidas.
const categoriaForm = document.querySelector('#categoria-form');
const categoriasLista = document.querySelector('#categorias-lista');
const filtrosCategorias = document.querySelector('.categories-filters');
let categoriasCache = [];
let filtroCategoriasAtual = 'todas';

// Renderiza a lista de categorias recebida da API.
function renderCategorias(categorias) {
  categoriasCache = categorias;
  const resultados = categorias.filter(
    (categoria) => filtroCategoriasAtual === 'todas' || categoria.tipo === filtroCategoriasAtual,
  );

  // Caso o usuario ainda nao tenha categorias, mostra uma mensagem vazia.
  if (!resultados.length) {
    const mensagem = categorias.length
      ? 'Nenhuma categoria encontrada para este filtro.'
      : 'Nenhuma categoria cadastrada.';
    categoriasLista.innerHTML = `<p class="empty">${mensagem}</p>`;
    return;
  }

  // Transforma cada categoria em um bloco HTML de visualizacao.
  categoriasLista.innerHTML = resultados
    .map(
      (categoria) => `
        <article class="item">
          <div class="item-header">
            <p class="item-title">${window.AppUtils.escapeHtml(categoria.nome)}</p>
            <span class="tag ${categoria.tipo === 'receita' ? 'success-soft' : 'danger-soft'}">
              ${window.AppUtils.escapeHtml(
                categoria.tipo.charAt(0).toUpperCase() + categoria.tipo.slice(1),
              )}
            </span>
            <button
              class="button danger category-delete"
              type="button"
              data-excluir-categoria="${categoria.id}"
              aria-label="Excluir categoria ${window.AppUtils.escapeHtml(categoria.nome)}"
            >
              Excluir
            </button>
          </div>
        </article>
      `,
    )
    .join('');
}

// Exclui a categoria escolhida e atualiza os filtros sem perder o estado da tela.
categoriasLista.addEventListener('click', async (event) => {
  const botao = event.target.closest('button[data-excluir-categoria]');

  if (!botao) {
    return;
  }

  const categoria = categoriasCache.find(
    (item) => String(item.id) === botao.dataset.excluirCategoria,
  );

  if (!categoria || !window.confirm(`Deseja excluir a categoria "${categoria.nome}"?`)) {
    return;
  }

  try {
    await window.ApiService.excluirCategoria(categoria.id);
    window.AppUtils.showMessage('Categoria excluída com sucesso.');
    await carregarCategorias();
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
});

filtrosCategorias.addEventListener('click', (event) => {
  const botao = event.target.closest('button[data-filtro]');

  if (!botao) {
    return;
  }

  filtroCategoriasAtual = botao.dataset.filtro;
  filtrosCategorias.querySelectorAll('button[data-filtro]').forEach((filtro) => {
    const ativo = filtro === botao;
    filtro.classList.toggle('is-active', ativo);
    filtro.setAttribute('aria-pressed', String(ativo));
  });
  renderCategorias(categoriasCache);
});

// Busca categorias no backend e atualiza a tela.
async function carregarCategorias() {
  try {
    const categorias = await window.ApiService.listarCategorias();
    renderCategorias(categorias);
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
}

// Envia o formulario para criar uma nova categoria.
categoriaForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    // Coleta dados do formulario, cria a categoria e recarrega a lista.
    const dados = window.AppUtils.getFormData(categoriaForm);
    await window.ApiService.criarCategoria(dados);

    categoriaForm.reset();
    window.AppUtils.showMessage('Categoria criada com sucesso.');
    carregarCategorias();
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
});

// Protege a pagina, prepara o botao de sair e carrega os dados iniciais.
window.AppUtils.requireAuth();
window.AppUtils.setupAdminLink();
window.AppUtils.setupLogout();
carregarCategorias();
