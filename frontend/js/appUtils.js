// Transforma os campos de um formulario em um objeto simples.
function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

// Extrai uma mensagem amigavel de erro vinda da API ou do JavaScript.
function getApiError(error) {
  return error.response?.data?.message || error.message || 'Erro inesperado.';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

// Mostra mensagens de sucesso ou erro no elemento #message da pagina.
function showMessage(text, type = 'success') {
  const message = document.querySelector('#message');

  if (!message) {
    return;
  }

  message.textContent = text;
  message.className = `message ${type}`;
}

// Protege paginas internas redirecionando usuarios sem token para o login.
function requireAuth() {
  const token = localStorage.getItem('planeja_token');

  if (!token) {
    window.location.href = './login.html';
  }
}

// Remove o token salvo e leva o usuario de volta para a tela de login.
function logout() {
  localStorage.removeItem('planeja_token');
  window.location.href = './login.html';
}

// Adiciona o comportamento de logout em todos os links marcados com data-logout.
function setupLogout() {
  document.querySelectorAll('[data-logout]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  });
}

// Formata numeros como moeda brasileira.
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Formata datas para o padrao brasileiro.
function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Converte uma data para o formato aceito por input type="date".
function toInputDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

// Agrupa utilitarios globais para evitar repeticao nos scripts das paginas.
window.AppUtils = {
  formatCurrency,
  formatDate,
  escapeHtml,
  getApiError,
  getFormData,
  requireAuth,
  setupLogout,
  showMessage,
  toInputDate,
};
