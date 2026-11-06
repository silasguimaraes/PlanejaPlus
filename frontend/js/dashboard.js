// Guardam as instancias dos graficos para permitir destruir e recriar quando necessario.
let graficoCategorias = null;
let graficoMensal = null;

Chart.defaults.font.size =
  Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75;

function atualizarTemaGraficos() {
  const styles = getComputedStyle(document.documentElement);
  const color = styles.getPropertyValue('--text').trim();
  const gridColor = styles.getPropertyValue('--line').trim();
  const isDark = document.documentElement.dataset.theme === 'dark';

  if (graficoCategorias) {
    graficoCategorias.updateOptions({
      chart: { foreColor: color },
      legend: { labels: { colors: color } },
      theme: { mode: isDark ? 'dark' : 'light' },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              name: { color },
              value: { color },
              total: { color },
            },
          },
        },
      },
    });
  }

  if (graficoMensal) {
    const grafico = graficoMensal;
    grafico.options.color = color;
    Object.values(grafico.options.scales || {}).forEach((scale) => {
      scale.ticks.color = color;
      scale.grid.color = gridColor;
      scale.border.color = gridColor;
    });
    grafico.update('none');
  }
}

atualizarTemaGraficos();
document.addEventListener('planeja:themechange', atualizarTemaGraficos);

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
  const totalTransacoes = movimentacoes.filter((item) => item.tipo === 'despesa').length;

  movimentacoes
    .filter((item) => item.tipo === 'despesa')
    .forEach((item) => {
      const categoria = item.categoria_nome || 'Sem categoria';
      totais[categoria] = (totais[categoria] || 0) + Number(item.valor);
    });

  return {
    labels: Object.keys(totais),
    valores: Object.values(totais),
    totalTransacoes,
  };
}

// Agrupa as movimentacoes desde o primeiro registro financeiro ate o mes atual.
function chaveMes(dataMovimentacao) {
  const data = new Date(dataMovimentacao);

  if (Number.isNaN(data.valueOf())) {
    return null;
  }

  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

function agruparPorMes(movimentacoes) {
  const chaves = movimentacoes
    .map((item) => chaveMes(item.data_movimentacao))
    .filter(Boolean)
    .sort();
  const inicio = chaves[0];
  const hoje = new Date();
  const fim = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const meses = [];
  let chave = inicio;

  while (chave && chave <= fim) {
    meses.push({ chave, receitas: 0, despesas: 0 });
    const [ano, mes] = chave.split('-').map(Number);
    const proximoMes = new Date(Date.UTC(ano, mes, 1));
    chave = `${proximoMes.getUTCFullYear()}-${String(proximoMes.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  const mesesPorChave = new Map(meses.map((mes) => [mes.chave, mes]));
  movimentacoes.forEach((item) => {
    const mes = mesesPorChave.get(chaveMes(item.data_movimentacao));

    if (!mes) {
      return;
    }

    if (item.tipo === 'receita') {
      mes.receitas += Number(item.valor);
    } else if (item.tipo === 'despesa') {
      mes.despesas += Number(item.valor);
    }
  });

  return {
    labels: meses.map(({ chave: mes }) => {
      const [ano, numeroMes] = mes.split('-').map(Number);
      const nomeMes = new Date(Date.UTC(ano, numeroMes - 1, 1))
        .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
        .replace('.', '')
        .replace(' de ', '/');

      return `${nomeMes.charAt(0).toLocaleUpperCase('pt-BR')}${nomeMes.slice(1)}`;
    }),
    receitas: meses.map((mes) => mes.receitas),
    despesas: meses.map((mes) => mes.despesas),
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
      // Apresenta o tipo com inicial maiuscula apenas no rotulo da tabela.
      const tipo = receita ? 'Receita' : 'Despesa';

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

// Cria o grafico donut que mostra a distribuicao das despesas por categoria.
function criarGraficoCategorias(dados) {
  const contexto = document.querySelector('#grafico-categorias');

  // Destroi o grafico antigo antes de criar a nova instancia.
  if (graficoCategorias) {
    graficoCategorias.destroy();
  }

  const isDark = document.documentElement.dataset.theme === 'dark';
  const temDespesas = dados.valores.length > 0;
  const corTexto = getComputedStyle(document.documentElement)
    .getPropertyValue('--text')
    .trim();

  graficoCategorias = new ApexCharts(contexto, {
    chart: {
      type: 'donut',
      height: '100%',
      background: 'transparent',
      fontFamily: 'inherit',
      foreColor: corTexto,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 500,
      },
    },
    series: temDespesas ? dados.valores : [1],
    labels: temDespesas ? dados.labels : ['Sem despesas'],
    colors: ['#0EA5E9', '#14B8A6', '#F59E0B', '#F43F5E', '#8B5CF6', '#6366F1'],
    plotOptions: {
      pie: {
        borderRadius: 8,
        spacing: 4,
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: {
              color: corTexto,
              offsetY: -3,
            },
            value: {
              color: corTexto,
              offsetY: -3,
              formatter: (valor) => window.AppUtils.formatCurrency(temDespesas ? valor : 0),
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total de transações',
              color: corTexto,
              formatter: () => String(dados.totalTransacoes),
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: temDespesas,
      y: {
        formatter: (valor) => window.AppUtils.formatCurrency(valor),
      },
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: corTexto,
      },
      markers: {
        width: 8,
        height: 8,
        radius: 8,
      },
      itemMargin: {
        horizontal: 9,
        vertical: 4,
      },
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: '100%' },
          legend: {
            itemMargin: { horizontal: 5, vertical: 3 },
          },
        },
      },
    ],
  });
  graficoCategorias.render();
}

// Cria o grafico de barras comparando receitas e despesas por mes.
function calcularLimiteEixoMensal(receitas, despesas) {
  const maiorValor = Math.max(0, ...receitas, ...despesas);
  return Math.ceil((maiorValor + 1000) / 1000) * 1000;
}

function criarGraficoMensal(dados) {
  const contexto = document.querySelector('#grafico-mensal');
  const container = contexto.parentElement;

  // Destroi o grafico anterior antes de criar um novo.
  if (graficoMensal) {
    graficoMensal.destroy();
  }

  let tooltipElement = container.querySelector('.monthly-chart-tooltip');

  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'monthly-chart-tooltip';
    tooltipElement.setAttribute('aria-hidden', 'true');
    container.append(tooltipElement);
  }

  function renderizarTooltip({ chart, tooltip }) {
    if (!tooltip.opacity || !tooltip.dataPoints?.length) {
      tooltipElement.classList.remove('is-visible', 'is-below');
      tooltipElement.setAttribute('aria-hidden', 'true');
      return;
    }

    const titulo = document.createElement('div');
    titulo.className = 'monthly-chart-tooltip-title';
    titulo.textContent = tooltip.title?.[0] || '';

    const linhas = document.createElement('div');
    linhas.className = 'monthly-chart-tooltip-rows';

    tooltip.dataPoints.forEach((ponto) => {
      const linha = document.createElement('div');
      linha.className = 'monthly-chart-tooltip-row';

      const indicador = document.createElement('span');
      indicador.className = `monthly-chart-tooltip-dot ${
        ponto.datasetIndex === 0 ? 'is-income' : 'is-expense'
      }`;
      indicador.setAttribute('aria-hidden', 'true');

      const nome = document.createElement('span');
      nome.className = 'monthly-chart-tooltip-label';
      nome.textContent = ponto.dataset.label;

      const valor = document.createElement('strong');
      valor.className = 'monthly-chart-tooltip-value';
      valor.textContent = window.AppUtils.formatCurrency(ponto.raw);

      linha.append(indicador, nome, valor);
      linhas.append(linha);
    });

    tooltipElement.replaceChildren(titulo, linhas);
    tooltipElement.setAttribute('aria-hidden', 'false');

    const largura = container.clientWidth;
    const margem = Math.min(tooltipElement.offsetWidth / 2 + 8, largura / 2);
    const x = Math.max(margem, Math.min(largura - margem, tooltip.caretX));
    const abaixo = tooltip.caretY < 72;
    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${tooltip.caretY + (abaixo ? 12 : -12)}px`;
    tooltipElement.classList.toggle('is-below', abaixo);
    requestAnimationFrame(() => tooltipElement.classList.add('is-visible'));
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
          hoverBackgroundColor: '#22c55e',
          hoverBorderColor: '#15803d',
          borderRadius: 6,
        },
        {
          label: 'Despesas',
          data: dados.despesas.length ? dados.despesas : [0],
          backgroundColor: '#dc2626',
          hoverBackgroundColor: '#f87171',
          hoverBorderColor: '#b91c1c',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
      },
      transitions: {
        active: {
          animation: {
            duration: 260,
          },
        },
      },
      hover: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          max: calcularLimiteEixoMensal(dados.receitas, dados.despesas),
          ticks: {
            stepSize: 1000,
            precision: 0,
            callback: (value) => window.AppUtils.formatCurrency(value),
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          enabled: false,
          external: renderizarTooltip,
        },
      },
    },
  });
}

function atualizarDadosGraficoMensal(movimentacoes) {
  const dados = agruparPorMes(movimentacoes);

  if (!graficoMensal) {
    criarGraficoMensal(dados);
    return;
  }

  graficoMensal.data.labels = dados.labels;
  graficoMensal.data.datasets[0].data = dados.receitas;
  graficoMensal.data.datasets[1].data = dados.despesas;
  graficoMensal.options.scales.y.max = calcularLimiteEixoMensal(
    dados.receitas,
    dados.despesas,
  );
  graficoMensal.update();
}

let atualizacaoGraficoEmAndamento = false;

async function atualizarGraficoMensal() {
  if (atualizacaoGraficoEmAndamento) {
    return;
  }

  atualizacaoGraficoEmAndamento = true;
  try {
    const movimentacoes = await window.ApiService.listarMovimentacoes();
    atualizarDadosGraficoMensal(movimentacoes);
  } catch (error) {
    console.error(window.AppUtils.getApiError(error));
  } finally {
    atualizacaoGraficoEmAndamento = false;
  }
}

// Carrega dados da API, calcula resumos e desenha os componentes do dashboard.
async function carregarDashboard() {
  try {
    const movimentacoes = await window.ApiService.listarMovimentacoes();
    const resumo = calcularResumo(movimentacoes);
    const categorias = agruparDespesasPorCategoria(movimentacoes);

    preencherCards(resumo);
    criarGraficoCategorias(categorias);
    atualizarDadosGraficoMensal(movimentacoes);
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
window.setInterval(atualizarGraficoMensal, 60000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    atualizarGraficoMensal();
  }
});
window.addEventListener('focus', atualizarGraficoMensal);
