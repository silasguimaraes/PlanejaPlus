// Cria uma instancia do Axios com a URL base da API.
const api = axios.create({
  baseURL: window.API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor executado antes de cada requisicao enviada ao backend.
api.interceptors.request.use((config) => {
  // Busca o token salvo no navegador depois do login.
  const token = localStorage.getItem('planeja_token');

  // Se existir token, envia no cabecalho Authorization para acessar rotas protegidas.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Objeto que organiza todas as chamadas HTTP usadas pelo frontend.
const ApiService = {
  // Envia dados de cadastro para a API.
  async cadastro(dados) {
    const response = await api.post('/auth/cadastro', dados);
    return response.data;
  },

  // Envia email e senha para autenticar o usuario.
  async login(dados) {
    const response = await api.post('/auth/login', dados);
    return response.data;
  },

  // Busca as movimentacoes do usuario logado.
  async listarMovimentacoes() {
    const response = await api.get('/movimentacoes');
    return response.data;
  },

  // Busca as categorias do usuario logado.
  async listarCategorias() {
    const response = await api.get('/categorias');
    return response.data;
  },

  // Cria uma nova categoria.
  async criarCategoria(dados) {
    const response = await api.post('/categorias', dados);
    return response.data;
  },

  // Cria uma nova movimentacao.
  async criarMovimentacao(dados) {
    const response = await api.post('/movimentacoes', dados);
    return response.data;
  },

  // Edita uma movimentacao existente pelo id.
  async editarMovimentacao(id, dados) {
    const response = await api.put(`/movimentacoes/${id}`, dados);
    return response.data;
  },

  // Exclui uma movimentacao pelo id.
  async excluirMovimentacao(id) {
    await api.delete(`/movimentacoes/${id}`);
  },
};

// Disponibiliza o servico no objeto global para os outros scripts da pagina.
window.ApiService = ApiService;
