const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isServedByApi = window.location.port === '' || window.location.port === '3000';

// Em producao (Vercel) o site e a API ficam no mesmo dominio, entao usamos caminho relativo.
// Localmente, o frontend roda na porta 5500 e a API na 3000.
window.API_BASE_URL = isLocalHost && !isServedByApi ? 'http://localhost:3000/api' : '/api';
window.PUBLIC_REGISTRATION_ENABLED = isLocalHost;

if (!window.PUBLIC_REGISTRATION_ENABLED) {
  document.querySelectorAll('[data-public-registration]').forEach((link) => {
    link.hidden = true;
  });
}
