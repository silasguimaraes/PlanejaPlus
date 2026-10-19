const esqueciForm = document.querySelector('#esqueci-form');

esqueciForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const button = esqueciForm.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const dados = window.AppUtils.getFormData(esqueciForm);
    const response = await window.ApiService.esqueciSenha(dados);

    window.AppUtils.showMessage(response.message, 'success');
    esqueciForm.reset();
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  } finally {
    button.disabled = false;
  }
});
