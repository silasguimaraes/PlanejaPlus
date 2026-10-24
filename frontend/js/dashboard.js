// Guardam as instancias dos graficos para permitir destruir e recriar quando necessario.
let graficoCategorias = null;
let graficoMensal = null;

// Calcula totais de receitas, despesas e saldo a partir das movimentacoes.
function calcularResumo(movimentacoes) {
  const receitas = movimentacoes
    .filter((item) => item.tipo === 'receita')
    .reduce((total, item) => total + Number(item.valor), 0);

  const despesas = movimentacoes
    .filter((item) => item.tipo === 'despesa')
    .reduce((total, item) => total + Number(item.valor), 0);

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
  };
}

// Soma somente despesas, separando os valores pelo nome da categoria.
function agruparDespesasPorCategoria(movimentacoes) {
  const totais = {};

  movimentacoes
    .filter((item) => item.tipo === 'despesa')
    .forEach((item) => {
      const categoria = item.categoria_nome || 'Sem categoria';
      totais[categoria] = (totais[categoria] || 0) + Number(item.valor);
    });

  return {
    labels: Object.keys(totais),
    valores: Object.values(totais),
  };
}

// Agrupa receitas e despesas por mes para montar o grafico de barras.
function agruparPorMes(movimentacoes) {
  const meses = {};

  movimentacoes.forEach((item) => {
    const data = new Date(item.data_movimentacao);
    const chave = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;

    // Cria a posicao do mes na primeira vez que ele aparecer.
    if (!meses[chave]) {
      meses[chave] = { receitas: 0, despesas: 0 };
    }

    // Soma o valor no grupo correto de acordo com o tipo.
    if (item.tipo === 'receita') {
      meses[chave].receitas += Number(item.valor);
    } else {
      meses[chave].despesas += Number(item.valor);
    }
  });

  // Ordena os meses para o grafico ficar em ordem cronologica.
  const chavesOrdenadas = Object.keys(meses).sort();

  return {
    labels: chavesOrdenadas.map((chave) => {
      const [ano, mes] = chave.split('-');
      return `${mes}/${ano}`;
    }),
    receitas: chavesOrdenadas.map((chave) => meses[chave].receitas),
    despesas: chavesOrdenadas.map((chave) => meses[chave].despesas),
  };
}

function preencherSaudacao() {
  const elemento = document.querySelector('#usuario-nome');
  const nome = window.AppUtils.getCurrentUser()?.nome;

  if (elemento && nome) {
    elemento.textContent = nome.trim().split(/\s+/)[0];
  }
}

// Preenche os cards superiores do dashboard com os valores calculados.
function preencherCards(resumo) {
  document.querySelector('#receitas-totais').textContent = window.AppUtils.formatCurrency(
    resumo.receitas,
  );
  document.querySelector('#despesas-totais').textContent = window.AppUtils.formatCurrency(
    resumo.despesas,
  );
  document.querySelector('#saldo-atual').textContent = window.AppUtils.formatCurrency(resumo.saldo);
  preencherBarraSaldo(resumo);
}

function preencherBarraSaldo(resumo) {
  const barra = document.querySelector('.saldo-bar');
  const preenchimento = document.querySelector('#saldo-bar-fill');
  const texto = document.querySelector('#saldo-bar-texto');

  if (!barra || !preenchimento || !texto) {
    return;
  }

  const percentual = resumo.receitas > 0
    ? Math.round(Math.max(0, Math.min(100, (resumo.saldo / resumo.receitas) * 100)))
    : 0;

  preenchimento.classList.toggle('negative', resumo.saldo < 0);
  preenchimento.style.width = `${resumo.saldo < 0 ? 100 : percentual}%`;
  barra.setAttribute('aria-valuenow', String(percentual));

  if (resumo.receitas <= 0) {
    texto.textContent = 'Cadastre receitas para acompanhar o saldo.';
    barra.setAttribute('aria-valuetext', 'Sem receitas cadastradas');
  } else if (resumo.saldo < 0) {
    const deficit = Math.abs(resumo.saldo);
    texto.textContent = `Despesas acima das receitas em ${window.AppUtils.formatCurrency(deficit)}`;
    barra.setAttribute('aria-valuetext', `Saldo negativo de ${window.AppUtils.formatCurrency(deficit)}`);
  } else {
    texto.textContent = `${percentual}% das receitas registradas permaneceram como saldo`;
    barra.setAttribute('aria-valuetext', `${percentual}% das receitas registradas`);
  }
}

function renderUltimasMovimentacoes(movimentacoes) {
  const container = document.querySelector('#ultimas-movimentacoes');

  if (!container) {
    return;
  }

  const recentes = [...movimentacoes]
    .sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao))
    .slice(0, 5);

  if (!recentes.length) {
    container.innerHTML =
      '<tr><td colspan="4" class="empty">Nenhuma movimentação registrada ainda.</td></tr>';
    return;
  }

  container.innerHTML = recentes
    .map((movimentacao) => {
      const receita = movimentacao.tipo === 'receita';
      const tipo = receita ? 'receita' : 'despesa';

      return `
        <tr>
          <td>
            <span class="ultima-descricao">${window.AppUtils.escapeHtml(movimentacao.descricao)}</span>
            <span class="tag ${receita ? 'success-soft' : 'danger-soft'}">${tipo}</span>
          </td>
          <td>${window.AppUtils.escapeHtml(movimentacao.categoria_nome || 'Sem categoria')}</td>
          <td>${window.AppUtils.formatDate(movimentacao.data_movimentacao)}</td>
          <td class="col-value ${receita ? 'positive' : 'negative'}">
            ${receita ? '+ ' : '− '}${window.AppUtils.formatCurrency(movimentacao.valor)}
          </td>
        </tr>
      `;
    })
    .join('');
}

// Cria o grafico de pizza que mostra a distribuicao das despesas por categoria.
function criarGraficoCategorias(dados) {
  const contexto = document.querySelector('#grafico-categorias');

  // Destroi o grafico antigo para evitar sobreposicao no canvas.
  if (graficoCategorias) {
    graficoCategorias.destroy();
  }

  graficoCategorias = new Chart(contexto, {
    type: 'pie',
    data: {
      labels: dados.labels.length ? dados.labels : ['Sem despesas'],
      datasets: [
        {
          data: dados.valores.length ? dados.valores : [1],
          backgroundColor: ['#2563eb', '#16a34a', '#f97316', '#dc2626', '#7c3aed', '#0891b2'],
          borderColor: '#ffffff',
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
}

// Cria o grafico de barras comparando receitas e despesas por mes.
function criarGraficoMensal(dados) {
  const contexto = document.querySelector('#grafico-mensal');

  // Destroi o grafico anterior antes de desenhar um novo.
  if (graficoMensal) {
    graficoMensal.destroy();
  }

  graficoMensal = new Chart(contexto, {
    type: 'bar',
    data: {
      labels: dados.labels.length ? dados.labels : ['Sem dados'],
      datasets: [
        {
          label: 'Receitas',
          data: dados.receitas.length ? dados.receitas : [0],
          backgroundColor: '#16a34a',
          borderRadius: 6,
        },
        {
          label: 'Despesas',
          data: dados.despesas.length ? dados.despesas : [0],
          backgroundColor: '#dc2626',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => window.AppUtils.formatCurrency(value),
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
}

// Carrega dados da API, calcula resumos e desenha os componentes do dashboard.
async function carregarDashboard() {
  try {
    const movimentacoes = await window.ApiService.listarMovimentacoes();
    const resumo = calcularResumo(movimentacoes);
    const categorias = agruparDespesasPorCategoria(movimentacoes);
    const mensal = agruparPorMes(movimentacoes);

    preencherCards(resumo);
    criarGraficoCategorias(categorias);
    criarGraficoMensal(mensal);
    renderUltimasMovimentacoes(movimentacoes);
  } catch (error) {
    console.error(window.AppUtils.getApiError(error));
  }
}

// Protege a pagina, ativa logout e inicia o carregamento do dashboard.
window.AppUtils.requireAuth();
window.AppUtils.setupAdminLink();
window.AppUtils.setupLogout();
preencherSaudacao();
carregarDashboard();
