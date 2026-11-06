// Seleciona elementos usados pelos filtros e pela tabela do relatorio.
const relatorioForm = document.querySelector('.filters');
const exportarPdfButton = document.querySelector('#exportar-pdf');
const exportarExcelButton = document.querySelector('#exportar-excel');
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

// Gera um relatório PDF com resumo, detalhamento e suporte a várias páginas.
function exportarRelatorioPdf() {
  const { jsPDF } = window.jspdf;
  const relatorio = obterDadosRelatorio();
  const documento = new jsPDF();
  const larguraPagina = documento.internal.pageSize.getWidth();
  const alturaPagina = documento.internal.pageSize.getHeight();
  const margem = 18;
  const larguraConteudo = larguraPagina - margem * 2;

  documento.setFillColor(31, 41, 55);
  documento.rect(0, 0, larguraPagina, 48, 'F');
  documento.setFillColor(37, 99, 235);
  documento.rect(0, 0, larguraPagina, 3, 'F');
  documento.setTextColor(255, 255, 255);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(10);
  documento.text('PLANEJA+', margem, 15);
  documento.setFontSize(20);
  documento.text('Relatório financeiro', margem, 29);
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(10);
  documento.setTextColor(220, 228, 240);
  documento.text('Resumo das movimentações por período e categoria', margem, 39);

  documento.setTextColor(107, 114, 128);
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);
  documento.text('PERÍODO', margem, 61);
  documento.setTextColor(31, 41, 55);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(11);
  documento.text(relatorio.periodo, margem, 68);
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);
  documento.setTextColor(107, 114, 128);
  documento.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, larguraPagina - margem, 68, {
    align: 'right',
  });

  documento.setTextColor(31, 41, 55);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(13);
  documento.text('Resumo financeiro', margem, 84);

  const espacoCards = 5;
  const larguraCard = (larguraConteudo - espacoCards * 2) / 3;
  const cards = [
    { titulo: 'Receitas', valor: relatorio.receitas, cor: [21, 128, 61] },
    { titulo: 'Despesas', valor: relatorio.despesas, cor: [220, 38, 38] },
    { titulo: 'Saldo do período', valor: relatorio.saldo, cor: [37, 99, 235] },
  ];

  cards.forEach((card, indice) => {
    const x = margem + indice * (larguraCard + espacoCards);
    documento.setFillColor(246, 247, 249);
    documento.setDrawColor(216, 222, 232);
    documento.roundedRect(x, 90, larguraCard, 29, 2, 2, 'FD');
    documento.setTextColor(107, 114, 128);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(9);
    documento.text(card.titulo, x + 5, 99);
    documento.setTextColor(...card.cor);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(12);
    documento.text(card.valor, x + 5, 111);
  });

  documento.setTextColor(31, 41, 55);
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(13);
  documento.text('Detalhamento por categoria', margem, 137);

  const largurasColunas = [70, 36, 24, 44];
  const titulosColunas = ['Categoria', 'Tipo', 'Quantidade', 'Total'];
  let y = 143;

  function desenharCabecalhoTabela() {
    documento.setFillColor(37, 99, 235);
    documento.roundedRect(margem, y, larguraConteudo, 10, 1.5, 1.5, 'F');
    documento.setTextColor(255, 255, 255);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(8);

    let x = margem + 4;
    titulosColunas.forEach((titulo, indice) => {
      documento.text(titulo, x, y + 6.5);
      x += largurasColunas[indice];
    });

    y += 10;
  }

  desenharCabecalhoTabela();

  if (!relatorio.detalhes.length) {
    documento.setTextColor(107, 114, 128);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(10);
    documento.text('Nenhuma movimentação encontrada neste período.', margem + 4, y + 9);
    y += 16;
  } else {
    relatorio.detalhes.forEach((item, indice) => {
      const categoria = documento.splitTextToSize(
        item.categoria || 'Sem categoria',
        largurasColunas[0] - 8,
      );
      const tipo = item.tipo === 'receita' ? 'Receita' : 'Despesa';
      const alturaLinha = Math.max(10, categoria.length * 4.5 + 5);

      if (y + alturaLinha > alturaPagina - 20) {
        documento.addPage();
        y = 20;
        desenharCabecalhoTabela();
      }

      if (indice % 2 === 0) {
        documento.setFillColor(246, 247, 249);
        documento.rect(margem, y, larguraConteudo, alturaLinha, 'F');
      }

      documento.setTextColor(31, 41, 55);
      documento.setFont('helvetica', 'normal');
      documento.setFontSize(9);
      documento.text(categoria, margem + 4, y + 6.5);
      documento.text(tipo, margem + largurasColunas[0] + 4, y + 6.5);
      documento.text(
        String(item.quantidade),
        margem + largurasColunas[0] + largurasColunas[1] + largurasColunas[2] - 4,
        y + 6.5,
        { align: 'right' },
      );
      documento.setFont('helvetica', 'bold');
      documento.text(window.AppUtils.formatCurrency(item.total), margem + larguraConteudo - 4, y + 6.5, {
        align: 'right',
      });
      y += alturaLinha;
    });
  }

  const totalPaginas = documento.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    documento.setPage(pagina);
    documento.setDrawColor(216, 222, 232);
    documento.line(margem, alturaPagina - 15, larguraPagina - margem, alturaPagina - 15);
    documento.setTextColor(107, 114, 128);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(8);
    documento.text('Planeja+ · Relatório financeiro', margem, alturaPagina - 9);
    documento.text(`${pagina} / ${totalPaginas}`, larguraPagina - margem, alturaPagina - 9, {
      align: 'right',
    });
  }

  documento.save('relatorio-planeja-plus.pdf');
}

// Exporta os dados do relatório em uma planilha XLSX formatada.
async function exportarRelatorioExcel() {
  exportarExcelButton.disabled = true;

  try {
    const relatorio = obterDadosRelatorio();
    const workbook = new window.ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    worksheet.columns = [
      { header: 'Categoria', key: 'categoria', width: 32 },
      { header: 'Tipo', key: 'tipo', width: 16 },
      { header: 'Quantidade', key: 'quantidade', width: 16 },
      { header: 'Total', key: 'total', width: 20 },
    ];

    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'Planeja+ | Relatório financeiro';
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = `Período: ${relatorio.periodo}`;
    worksheet.getCell('A2').font = { italic: true, color: { argb: 'FF6B7280' } };
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['Categoria', 'Tipo', 'Quantidade', 'Total']);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      cell.alignment = { vertical: 'middle' };
    });

    relatorio.detalhes.forEach((item, indice) => {
      const row = worksheet.addRow({
        categoria: item.categoria || 'Sem categoria',
        tipo: item.tipo === 'receita' ? 'Receita' : 'Despesa',
        quantidade: item.quantidade,
        total: Number(item.total),
      });

      if (indice % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF6F7F9' },
          };
        });
      }

      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(4).numFmt = '"R$" #,##0.00';
    });

    if (!relatorio.detalhes.length) {
      const emptyRow = worksheet.addRow(['Nenhuma movimentação encontrada neste período.']);
      worksheet.mergeCells(`A${emptyRow.number}:D${emptyRow.number}`);
      emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
    }

    worksheet.autoFilter = {
      from: 'A4',
      to: `D${4 + relatorio.detalhes.length}`,
    };
    worksheet.views = [{ state: 'frozen', ySplit: 4 }];

    const conteudo = await workbook.xlsx.writeBuffer();
    const arquivo = new Blob([conteudo], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-planeja-plus.xlsx';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Não foi possível exportar o relatório Excel.', error);
    window.AppUtils.showMessage('Não foi possível exportar o relatório Excel.', 'error');
  } finally {
    exportarExcelButton.disabled = false;
  }
}
// Carrega movimentações da API e renderiza o primeiro relatório.
async function carregarRelatorio() {
  try {
    movimentacoesRelatorio = await window.ApiService.listarMovimentacoes();
    exportarPdfButton.disabled = false;
    exportarExcelButton.disabled = false;
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
exportarExcelButton.addEventListener('click', exportarRelatorioExcel);

// Protege a pagina, prepara logout e carrega dados iniciais.
definirPeriodoInicial();
exportarPdfButton.disabled = true;
exportarExcelButton.disabled = true;
window.AppUtils.requireAuth();
window.AppUtils.setupAdminLink();
window.AppUtils.setupLogout();
carregarRelatorio();
