// Seleciona o formulario e a area onde as categorias serao exibidas.
const categoriaForm = document.querySelector('#categoria-form');
const categoriasLista = document.querySelector('#categorias-lista');

// Renderiza a lista de categorias recebida da API.
function renderCategorias(categorias) {
  // Caso o usuario ainda nao tenha categorias, mostra uma mensagem vazia.
  if (!categorias.length) {
    categoriasLista.innerHTML = '<p class="empty">Nenhuma categoria cadastrada.</p>';
    return;
  }

  // Transforma cada categoria em um bloco HTML de visualizacao.
  categoriasLista.innerHTML = categorias
    .map(
      (categoria) => `
        <article class="item">
          <div class="item-header">
            <p class="item-title">${categoria.nome}</p>
            <span class="tag ${categoria.tipo === 'receita' ? 'success-soft' : 'danger-soft'}">
              ${categoria.tipo}
            </span>
          </div>
          <p class="item-meta">ID: ${categoria.id}</p>
        </article>
      `,
    )
    .join('');
}

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
window.AppUtils.setupLogout();
carregarCategorias();
