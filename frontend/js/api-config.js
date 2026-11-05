window.API_BASE_URL = 'http://localhost:3000/api';
window.PUBLIC_REGISTRATION_ENABLED = ['localhost', '127.0.0.1'].includes(window.location.hostname);

if (!window.PUBLIC_REGISTRATION_ENABLED) {
  document.querySelectorAll('[data-public-registration]').forEach((link) => {
    link.hidden = true;
  });
}