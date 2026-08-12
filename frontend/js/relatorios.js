// Seleciona elementos usados pelos filtros e pela tabela do relatorio.
const relatorioForm = document.querySelector('.filters');
const exportarPdfButton = document.querySelector('#exportar-pdf');
const detalhesTabela = document.querySelector('#relatorio-detalhes');

// Guarda as movimentacoes carregadas para filtrar sem consultar a API toda hora.
let movimentacoesRelatorio = [];

// Formata datas dos inputs para aparecerem de forma amigavel no PDF.
function formatarDataInput(data) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
}

// Aplica os filtros de periodo e tipo sobre as movimentacoes carregadas.
function filtrarMovimentacoes() {
  const inicio = document.querySelector('#periodo-inicio').value;
  const fim = document.querySelector('#periodo-fim').value;
  const tipo = document.querySelector('#relatorio-tipo').value;

  return movimentacoesRelatorio.filter((movimentacao) => {
    const data = window.AppUtils.toInputDate(movimentacao.data_movimentacao);
    const dentroPeriodo = data >= inicio && data <= fim;
    const tipoValido = tipo === 'todos' || movimentacao.tipo === tipo;

    return dentroPeriodo && tipoValido;
  });
}

// Soma receitas, despesas e saldo do conjunto filtrado.
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

// Agrupa movimentacoes por categoria e tipo para montar o detalhamento.
function agruparDetalhes(movimentacoes) {
  const grupos = {};

  movimentacoes.forEach((item) => {
    const chave = `${item.categoria_nome}-${item.tipo}`;

    // Cria o grupo quando a categoria ainda nao apareceu.
    if (!grupos[chave]) {
      grupos[chave] = {
        categoria: item.categoria_nome || 'Sem categoria',
        tipo: item.tipo,
        quantidade: 0,
        total: 0,
      };
    }

    // Atualiza quantidade e valor total do grupo.
    grupos[chave].quantidade += 1;
    grupos[chave].total += Number(item.valor);
  });

  return Object.values(grupos);
}

// Atualiza os cards de resumo do relatorio.
function renderResumo(resumo) {
  document.querySelector('#relatorio-receitas').textContent = window.AppUtils.formatCurrency(
    resumo.receitas,
  );
  document.querySelector('#relatorio-despesas').textContent = window.AppUtils.formatCurrency(
    resumo.despesas,
  );
  document.querySelector('#relatorio-saldo').textContent = window.AppUtils.formatCurrency(
    resumo.saldo,
  );
}

// Preenche a tabela de detalhes com os grupos calculados.
function renderDetalhes(detalhes) {
  if (!detalhes.length) {
    detalhesTabela.innerHTML = `
      <tr>
        <td colspan="4">Nenhuma movimentacao encontrada no periodo.</td>
      </tr>
    `;
    return;
  }

  detalhesTabela.innerHTML = detalhes
    .map(
      (item) => `
        <tr>
          <td>${item.categoria}</td>
          <td>${item.tipo}</td>
          <td>${item.quantidade}</td>
          <td>${window.AppUtils.formatCurrency(item.total)}</td>
        </tr>
      `,
    )
    .join('');
}

// Recalcula o relatorio sempre que os filtros mudarem ou forem enviados.
function atualizarRelatorio() {
  const movimentacoesFiltradas = filtrarMovimentacoes();
  const resumo = calcularResumo(movimentacoesFiltradas);
  const detalhes = agruparDetalhes(movimentacoesFiltradas);

  renderResumo(resumo);
  renderDetalhes(detalhes);
}

// Coleta os dados ja exibidos na tela para montar o PDF.
function obterDadosRelatorio() {
  const inicio = document.querySelector('#periodo-inicio').value;
  const fim = document.querySelector('#periodo-fim').value;
  const receitas = document.querySelector('#relatorio-receitas').textContent;
  const despesas = document.querySelector('#relatorio-despesas').textContent;
  const saldo = document.querySelector('#relatorio-saldo').textContent;

  return {
    periodo: `${formatarDataInput(inicio)} a ${formatarDataInput(fim)}`,
    receitas,
    despesas,
    saldo,
  };
}

// Gera um arquivo PDF simples usando a biblioteca jsPDF.
function exportarRelatorioPdf() {
  const { jsPDF } = window.jspdf;
  const relatorio = obterDadosRelatorio();
  const documento = new jsPDF();

  // Cabecalho do documento.
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(20);
  documento.text('Planeja+ - Relatorio Financeiro', 20, 24);

  // Periodo selecionado pelo usuario.
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(12);
  documento.text(`Periodo selecionado: ${relatorio.periodo}`, 20, 40);

  // Linha divisoria para separar cabecalho e conteudo.
  documento.setDrawColor(216, 222, 232);
  documento.line(20, 48, 190, 48);

  // Resumo financeiro dentro do PDF.
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(14);
  documento.text('Resumo', 20, 62);

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(12);
  documento.text(`Receitas: ${relatorio.receitas}`, 20, 78);
  documento.text(`Despesas: ${relatorio.despesas}`, 20, 92);
  documento.text(`Saldo: ${relatorio.saldo}`, 20, 106);

  // Rodape informando a origem dos dados.
  documento.setFontSize(10);
  documento.setTextColor(107, 114, 128);
  documento.text('Gerado a partir dos dados da API Planeja+.', 20, 282);

  documento.save('relatorio-planeja-plus.pdf');
}

// Carrega movimentacoes da API e renderiza o primeiro relatorio.
async function carregarRelatorio() {
  try {
    movimentacoesRelatorio = await window.ApiService.listarMovimentacoes();
    atualizarRelatorio();
  } catch (error) {
    console.error(window.AppUtils.getApiError(error));
  }
}

// O envio do formulario apenas recalcula a tela, sem recarregar a pagina.
relatorioForm.addEventListener('submit', (event) => {
  event.preventDefault();
  atualizarRelatorio();
});

// O botao de PDF chama a funcao de exportacao.
exportarPdfButton.addEventListener('click', exportarRelatorioPdf);

// Protege a pagina, prepara logout e carrega dados iniciais.
window.AppUtils.requireAuth();
window.AppUtils.setupLogout();
carregarRelatorio();
