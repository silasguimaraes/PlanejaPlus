// Seleciona o formulario de login da pagina.
const loginForm = document.querySelector('#login-form');

// Escuta o envio do formulario para autenticar sem recarregar a pagina.
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    // Coleta email/senha, chama a API e salva o token para manter a sessao.
    const dados = window.AppUtils.getFormData(loginForm);
    const response = await window.ApiService.login(dados);

    localStorage.setItem('planeja_token', response.token);
    window.location.href = './dashboard.html';
  } catch (error) {
    // Mostra uma mensagem amigavel caso as credenciais estejam incorretas.
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
});
