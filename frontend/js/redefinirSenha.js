const redefinirForm = document.querySelector('#redefinir-form');
const invalidLink = document.querySelector('#invalid-link');
const invalidLinkMessage = document.querySelector('#invalid-link-message');
const token = new URLSearchParams(window.location.search).get('token');

window.history.replaceState({}, document.title, window.location.pathname);

function mostrarLinkInvalido(texto) {
  redefinirForm.hidden = true;
  invalidLink.hidden = false;
  invalidLinkMessage.textContent = texto;
}

async function validarLink() {
  if (!token) {
    mostrarLinkInvalido('Link inválido ou expirado. Solicite uma nova recuperação de senha.');
    return;
  }

  try {
    await window.ApiService.validarTokenRedefinicao(token);
  } catch (error) {
    mostrarLinkInvalido(window.AppUtils.getApiError(error));
  }
}

redefinirForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { senha, confirmarSenha } = window.AppUtils.getFormData(redefinirForm);

  if (senha !== confirmarSenha) {
    window.AppUtils.showMessage('As senhas não coincidem.', 'error');
    return;
  }

  if ([...senha].length < 8 || !/[\p{P}\p{S}]/u.test(senha)) {
    window.AppUtils.showMessage('A senha deve ter pelo menos 8 caracteres e incluir um símbolo.', 'error');
    return;
  }

  const button = redefinirForm.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const response = await window.ApiService.redefinirSenha({ token, senha });
    localStorage.removeItem('planeja_token');
    localStorage.removeItem('planeja_user');
    window.AppUtils.showMessage(`${response.message} Redirecionando para o login...`, 'success');
    setTimeout(() => {
      window.location.href = './login.html';
    }, 2000);
  } catch (error) {
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
    button.disabled = false;
  }
});

validarLink();
