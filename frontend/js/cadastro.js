// Seleciona o formulario de cadastro da pagina.
const cadastroForm = document.querySelector('#cadastro-form');
const registrationDisabledMessage = document.querySelector('#registration-disabled');

if (!window.PUBLIC_REGISTRATION_ENABLED) {
  cadastroForm.hidden = true;
  registrationDisabledMessage.hidden = false;
  registrationDisabledMessage.textContent = 'O cadastro publico esta desativado.';
} else {
  cadastroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      // Coleta os campos, envia para a API e guarda o token recebido.
      const dados = window.AppUtils.getFormData(cadastroForm);
      const response = await window.ApiService.cadastro(dados);

      localStorage.setItem('planeja_token', response.token);
      window.location.href = './dashboard.html';
    } catch (error) {
      // Mostra o erro retornado pela API caso o cadastro falhe.
      window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
    }
  });
}
