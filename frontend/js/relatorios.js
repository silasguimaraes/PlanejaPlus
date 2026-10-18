// Seleciona elementos usados pelos filtros e pela tabela do relatorio.
const relatorioForm = document.querySelector('.filters');
const exportarPdfButton = document.querySelector('#exportar-pdf');
const exportarCsvButton = document.querySelector('#exportar-csv');
const detalhesTabela = document.querySelector('#relatorio-detalhes');
const periodoInicioInput = document.querySelector('#periodo-inicio');
const periodoFimInput = document.querySelector('#periodo-fim');

// Guarda as movimentacoes carregadas para filtrar sem consultar a API toda hora.
let movimentacoesRelatorio = [];

// Formata datas dos inputs para aparecerem de forma amigavel no PDF.
function formatarDataInput(data) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
}

function definirPeriodoInicial() {
  const hoje = new Date();
  const formatarInput = (data) => [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0'),
  ].join('-');

  periodoInicioInput.value = formatarInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  periodoFimInput.value = formatarInput(hoje);
}

// Aplica os filtros de periodo e tipo sobre as movimentacoes carregadas (para que eu não precise consultar a API toda hora).
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

// Agrupa movimentações por categoria e tipo para montar o detalhamento.
function agruparDetalhes(movimentacoes) {
  const grupos = new Map();

  movimentacoes.forEach((item) => {
    const chave = JSON.stringify([item.categoria_nome, item.tipo]);

    // Cria o grupo quando a categoria ainda nao apareceu.
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        categoria: item.categoria_nome || 'Sem categoria',
        tipo: item.tipo,
        quantidade: 0,
        total: 0,
      });
    }

    // Atualiza quantidade e valor total do grupo.
    const grupo = grupos.get(chave);
    grupo.quantidade += 1;
    grupo.total += Number(item.valor);
  });

  return [...grupos.values()];
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
        <td colspan="4">Nenhuma movimentação encontrada no período.</td>
      </tr>
    `;
    return;
  }
  //  Usei da IA para me ajudar a criar a taberla de detalhes ja que estava com dificuldade de fazer a tabela de detalhes, e ela me ajudou a criar a tabela de detalhes.
  detalhesTabela.innerHTML = detalhes
    .map(
      (item) => `
        <tr>
          <td>${window.AppUtils.escapeHtml(item.categoria)}</td>
          <td>${window.AppUtils.escapeHtml(item.tipo)}</td>
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

// Recalcula os dados filtrados para manter o PDF igual ao relatorio exibido.
function obterDadosRelatorio() {
  const inicio = document.querySelector('#periodo-inicio').value;
  const fim = document.querySelector('#periodo-fim').value;
  const movimentacoes = filtrarMovimentacoes();
  const resumo = calcularResumo(movimentacoes);

  return {
    periodo: `${formatarDataInput(inicio)} a ${formatarDataInput(fim)}`,
    receitas: window.AppUtils.formatCurrency(resumo.receitas),
    despesas: window.AppUtils.formatCurrency(resumo.despesas),
    saldo: window.AppUtils.formatCurrency(resumo.saldo),
    detalhes: agruparDetalhes(movimentacoes),
  };
}

// ----------------------------------------------------------------------------------------------------------------------------

// AQUI COMEÇA A PARTE DE EDITAR O PDF, QUE É A PARTE MAIS COMPLICADA, POIS TEM QUE LIDAR COM PAGINAÇÃO E FORMATAÇÃO DE TEXTO.
// TODAS AS CORES E FORMATAÇÕES DE TEXTO DEVEM TER O MESMO PADRÃO DO SITE, POIS O PDF É UMA EXTENSÃO DO SITE, ENTÃO DEVE TER A MESMA IDENTIDADE VISUAL.
// 

// ----------------------------------------------------------------------------------------------------------------------------

// Gera um relatorio PDF com resumo, detalhamento e suporte a varias paginas.
function exportarRelatorioPdf() {
  const { jsPDF } = window.jspdf;
  const relatorio = obterDadosRelatorio();
  const documento = new jsPDF();

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(20);
  documento.text('Planeja+ - Relatório Financeiro', 20, 24);

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(12);
  documento.text(`Período selecionado: ${relatorio.periodo}`, 20, 40);

  documento.setDrawColor(216, 222, 232);
  documento.line(20, 48, 190, 48);

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(14);
  documento.text('Resumo', 20, 62);

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(12);
  documento.text(`Receitas: ${relatorio.receitas}`, 20, 78);
  documento.text(`Despesas: ${relatorio.despesas}`, 20, 92);
  documento.text(`Saldo: ${relatorio.saldo}`, 20, 106);

  documento.setFontSize(10);
  documento.setTextColor(107, 114, 128);
  documento.text('Gerado a partir dos dados da API Planeja+.', 20, 282);

  documento.save('relatorio-planeja-plus.pdf');
}



// ESPAÇO RESERVADO PARA FUTURA FORMATAÇÃO VISUAL DA EXPORTAÇÃO CSV.
// A função abaixo exporta os dados atuais; a formatação do CSV será feita aqui depois.

  function exportarRelatorioCSV() {
    const detalhes = agruparDetalhes(filtrarMovimentacoes());
    const linhas = [
      ['Categoria', 'Tipo', 'Quantidade', 'Total'],
      ...detalhes.map((item) => [
        item.categoria || 'Sem categoria',
        item.tipo === 'receita' ? 'Receita' : 'Despesa',
        item.quantidade,
        Number(item.total).toFixed(2).replace('.', ','),
      ]),
    ];
  // ===============================================================================================================================================================================
  // Esse const é o que transforma os dados em CSV, e o \uFEFF é para evitar problemas de acentuação no Excel. 
  // Foi o CODEX que me indicou usar essa função ja que perdemos muito tempo para arrumar todos os erros de pontuação criados por não imoportar a biblioteca Javascript correta
  // ===============================================================================================================================================================================
  
    const csv = '\uFEFF' + linhas 
    .map((linha) =>
    linha
      .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
      .join(';'),
  )
  .join('\r\n');
    const arquivo = new Blob([csv], { type: 'text/csv;charset=utf-8;' });  //CRIA O AQUIVO CSV COM OS DADOS DO RELATORIO
    const url = URL.createObjectURL(arquivo); //CRIA O ENDEREÇO DO AQUIVO PARA O USUARIO BAIXAR ATRAVES DO NAVEGADOR
      const link = document.createElement('a'); 
      //CRIA UM LINK PARA O USUARIO BAIXAR O AQUIVO, ESSE LINK É CRIADO PARA O USUARIO BAIXAR O AQUIVO, POIS O JAVASCRIPT NÃO PERMITE BAIXAR ARQUIVOS DIRETAMENTE SEM UM LINK.
      // E ELE É INVISIVEL PARA O USUARIO, POIS ELE NÃO PRECISA CLICAR NELE, ELE É CLICADO AUTOMATICAMENTE PELO JAVASCRIPT.

      link.href = url;
      link.download = 'relatorio-planeja-plus.csv';
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

      //===================================================================================================//
      

      //ESPAÇO RESERVADO PARA FUTURA FORMATAÇÃO VISUAL DA EXPORTAÇÃO CSV.


      //===================================================================================================//




















    


// Carrega movimentacoes da API e renderiza o primeiro relatorio.
async function carregarRelatorio() {
  try {
    movimentacoesRelatorio = await window.ApiService.listarMovimentacoes();
    exportarPdfButton.disabled = false;
    exportarCsvButton.disabled = false;
    atualizarRelatorio();
  } catch (error) {
    console.error(window.AppUtils.getApiError(error));
    window.AppUtils.showMessage(window.AppUtils.getApiError(error), 'error');
  }
}

// O envio do formulario apenas recalcula a tela, sem recarregar a pagina.
relatorioForm.addEventListener('submit', (event) => {
  event.preventDefault();
  atualizarRelatorio();
});

// O botao de PDF chama a funcao de exportacao.
exportarPdfButton.addEventListener('click', exportarRelatorioPdf);
exportarCsvButton.addEventListener('click', exportarRelatorioCSV);

// Protege a pagina, prepara logout e carrega dados iniciais.
definirPeriodoInicial();
exportarPdfButton.disabled = true;
exportarCsvButton.disabled = true;
window.AppUtils.requireAuth();
window.AppUtils.setupAdminLink();
window.AppUtils.setupLogout();
carregarRelatorio();
