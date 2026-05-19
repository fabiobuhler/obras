import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import DataTable from '@/shared/DataTable';
import { toast } from 'sonner';
import {
  TrendingDown, CheckCircle, FileText, Filter, X,
  Search, Download, Printer, DollarSign, Calendar
} from 'lucide-react';
import { contasPagarService } from '@/services/contasPagarService';
import ContaForm from './ContaForm';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function DashCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${colorClass}`}>
      <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-medium opacity-75">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

const formatDateLocal = (date) => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const getPeriodoRange = (tipo) => {
  const hoje = new Date();
  const inicio = new Date(hoje);
  const fim = new Date(hoje);

  switch (tipo) {
    case 'hoje': {
      return {
        start: formatDateLocal(hoje),
        end: formatDateLocal(hoje),
      };
    }

    case 'semana_util': {
      const diaSemana = hoje.getDay();
      const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

      inicio.setDate(hoje.getDate() + diffSegunda);
      fim.setTime(inicio.getTime());
      fim.setDate(inicio.getDate() + 4);

      return {
        start: formatDateLocal(inicio),
        end: formatDateLocal(fim),
      };
    }

    case 'semana_7_dias': {
      fim.setDate(hoje.getDate() + 7);

      return {
        start: formatDateLocal(hoje),
        end: formatDateLocal(fim),
      };
    }

    case 'mes_atual': {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      return {
        start: formatDateLocal(primeiroDia),
        end: formatDateLocal(ultimoDia),
      };
    }

    case 'proximos_30_dias': {
      fim.setDate(hoje.getDate() + 30);

      return {
        start: formatDateLocal(hoje),
        end: formatDateLocal(fim),
      };
    }

    case 'trimestre': {
      const mesAtual = hoje.getMonth();
      const inicioTrimestre = Math.floor(mesAtual / 3) * 3;

      const primeiroDia = new Date(hoje.getFullYear(), inicioTrimestre, 1);
      const ultimoDia = new Date(hoje.getFullYear(), inicioTrimestre + 3, 0);

      return {
        start: formatDateLocal(primeiroDia),
        end: formatDateLocal(ultimoDia),
      };
    }

    case 'semestre': {
      const inicioSemestre = hoje.getMonth() < 6 ? 0 : 6;

      const primeiroDia = new Date(hoje.getFullYear(), inicioSemestre, 1);
      const ultimoDia = new Date(hoje.getFullYear(), inicioSemestre + 6, 0);

      return {
        start: formatDateLocal(primeiroDia),
        end: formatDateLocal(ultimoDia),
      };
    }

    case 'ano': {
      const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
      const ultimoDia = new Date(hoje.getFullYear(), 11, 31);

      return {
        start: formatDateLocal(primeiroDia),
        end: formatDateLocal(ultimoDia),
      };
    }

    case 'todos':
    default:
      return {
        start: '',
        end: '',
      };
  }
};

export default function ContasPagasList() {
  const { hasPermission } = useAuth();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filtros, setFiltros] = useState({ origem: '' });
  const [showFiltros, setShowFiltros] = useState(false);
  const [searchTermMobile, setSearchTermMobile] = useState('');

  // States de Período do Dashboard
  const [periodoDashboard, setPeriodoDashboard] = useState('mes_atual');
  const [pStart, setPStart] = useState(() => getPeriodoRange('mes_atual').start);
  const [pEnd, setPEnd] = useState(() => getPeriodoRange('mes_atual').end);

  const formatDateBR = (dateStr) => {
    if (!dateStr) return '—';
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return dateStr;
    const [ano, mes, dia] = parts;
    return `${dia}/${mes}/${ano}`;
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getCredorNome = (conta) => {
    return (
      conta.pessoas?.nome ||
      conta.empresas?.nome_fantasia ||
      conta.empresas?.razao_social ||
      conta.credor_avulso ||
      conta.credor_nome ||
      '—'
    );
  };

  const getObraNome = (conta) => {
    return (
      conta.obras?.objeto ||
      conta.obras?.nome ||
      conta.obra?.objeto ||
      conta.obra?.nome ||
      '—'
    );
  };

  const getDataPagamentoEfetiva = (conta) => {
    const pagamentos = conta.pagamentos || [];

    if (Array.isArray(pagamentos) && pagamentos.length > 0) {
      const datas = pagamentos
        .map((p) => p.data_pagamento)
        .filter(Boolean)
        .sort();

      if (datas.length > 0) {
        return datas[datas.length - 1];
      }
    }

    if (conta.data_pagamento) return conta.data_pagamento;
    if (conta.updated_at) return String(conta.updated_at).slice(0, 10);
    return conta.vencimento || null;
  };

  const handlePeriodoChange = (tipo) => {
    setPeriodoDashboard(tipo);

    if (tipo === 'personalizado') {
      return;
    }

    const range = getPeriodoRange(tipo);
    setPStart(range.start);
    setPEnd(range.end);
  };

  const contaDentroDoPeriodo = (conta) => {
    if (!pStart || !pEnd) return true;
    const dataRef = getDataPagamentoEfetiva(conta);
    if (!dataRef) return false;
    return dataRef >= pStart && dataRef <= pEnd;
  };

  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      const dentroPeriodo = contaDentroDoPeriodo(conta);
      if (!dentroPeriodo) return false;
      return true;
    });
  }, [contas, pStart, pEnd]);

  const mobileFilteredContas = useMemo(() => {
    if (!searchTermMobile) return contasFiltradas;
    return contasFiltradas.filter((c) => {
      const desc = String(c.descricao || '').toLowerCase();
      const credor = String(getCredorNome(c)).toLowerCase();
      const term = searchTermMobile.toLowerCase();
      return desc.includes(term) || credor.includes(term);
    });
  }, [contasFiltradas, searchTermMobile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await contasPagarService.getPagas(filtros);
      setContas(data);
    } catch (error) {
      console.error('ERRO AO CARREGAR CONTAS PAGAS:', error);
      toast.error(error.message || 'Erro ao carregar contas pagas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  const totais = useMemo(() => {
    let totalPago = 0;
    let maiorPagamento = 0;

    contasFiltradas.forEach((c) => {
      const valor = Number(c.valor_pago || c.valor_total || c.valor || 0);
      totalPago += valor;
      if (valor > maiorPagamento) {
        maiorPagamento = valor;
      }
    });

    const quantidade = contasFiltradas.length;
    const media = quantidade > 0 ? totalPago / quantidade : 0;

    return { totalPago, quantidade, maiorPagamento, media };
  }, [contasFiltradas]);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        const cleanPayload = { ...payload };
        delete cleanPayload.id;
        await contasPagarService.update(editing.id, cleanPayload);
        toast.success('Conta atualizada!');
        setIsFormOpen(false);
        setEditing(null);
        loadData();
      }
    } catch (error) {
      console.error('ERRO AO SALVAR CONTA:', error);
      toast.error(error.message || 'Erro ao salvar conta.');
    }
  };

  const getComprovanteUrl = (conta) => {
    const pagamentos = conta.pagamentos || [];
    if (Array.isArray(pagamentos) && pagamentos.length > 0) {
      const pComComprovante = pagamentos.find(p => p.comprovante_url);
      if (pComComprovante) return pComComprovante.comprovante_url;
    }
    return null;
  };

  const renderAcoes = (row) => {
    const comprovanteUrl = getComprovanteUrl(row);
    return (
      <div className="flex flex-col sm:flex-row flex-wrap gap-1.5 items-stretch sm:items-center">
        {comprovanteUrl && (
          <a href={comprovanteUrl} target="_blank" rel="noreferrer" title="Ver Comprovante"
            className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors">
            <FileText size={12} /> Comprovante
          </a>
        )}
        {row.arquivo_url && (
          <a href={row.arquivo_url} target="_blank" rel="noreferrer" title="Abrir Boleto/NF"
            className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-medium transition-colors">
            <FileText size={12} /> Boleto
          </a>
        )}
        {hasPermission('financeiro_contas_pagar', 'editar') && (
          <button onClick={() => { setEditing(row); setIsFormOpen(true); }} title="Editar Conta"
            className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-zinc-600 hover:bg-zinc-700 text-white rounded font-medium transition-colors">
            Editar
          </button>
        )}
      </div>
    );
  };

  const columns = [
    {
      header: 'Data Pagamento',
      accessor: 'data_pagamento',
      render: (row) => <span className="text-sm font-semibold text-green-600">{formatDateBR(getDataPagamentoEfetiva(row))}</span>
    },
    {
      header: 'Vencimento',
      accessor: 'vencimento',
      render: (row) => <span className="text-sm text-muted-foreground">{formatDateBR(row.vencimento)}</span>
    },
    { header: 'Descrição', accessor: 'descricao' },
    { header: 'Credor', accessor: 'credor', render: (row) => <span className="text-sm">{getCredorNome(row)}</span> },
    { header: 'Obra', accessor: 'obra', render: (row) => getObraNome(row) },
    {
      header: 'Valor Total',
      accessor: 'valor_total',
      render: (row) => <span className="text-sm font-medium">{formatCurrency(row.valor_total)}</span>
    },
    {
      header: 'Valor Pago',
      accessor: 'valor_pago',
      render: (row) => <span className="text-sm font-semibold text-green-600">{formatCurrency(row.valor_pago)}</span>
    },
    {
      header: 'Forma Pgto',
      accessor: 'forma_pagamento',
      render: (row) => {
        const pagamentos = row.pagamentos || [];
        if (pagamentos.length > 0) {
          const formas = pagamentos.map(p => p.forma_pagamento).filter(Boolean);
          return <span className="text-xs">{formas.join(', ') || '—'}</span>;
        }
        return '—';
      }
    },
    { header: 'Ações', accessor: '_acoes', render: renderAcoes }
  ];

  const getDadosExportacao = () => {
    return (contasFiltradas || []).map((conta) => {
      const pagamentos = conta.pagamentos || [];
      const formas = pagamentos.map(p => p.forma_pagamento).filter(Boolean).join(', ');
      return {
        dataPagamento: formatDateBR(getDataPagamentoEfetiva(conta)),
        vencimento: formatDateBR(conta.vencimento),
        descricao: conta.descricao || '—',
        credor: getCredorNome(conta),
        obra: getObraNome(conta),
        origem: conta.origem || '—',
        valorTotal: Number(conta.valor_total ?? 0),
        valorPago: Number(conta.valor_pago ?? 0),
        formaPagamento: formas || '—',
        observacao: conta.observacao || '',
      };
    });
  };

  const escapeCsv = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    const dados = getDadosExportacao();

    if (!dados.length) {
      toast.error('Não há contas pagas para exportar no filtro atual.');
      return;
    }

    const headers = [
      'Data Pagamento',
      'Vencimento',
      'Descrição',
      'Credor',
      'Obra',
      'Origem',
      'Valor Total',
      'Valor Pago',
      'Forma Pagamento',
      'Observação',
    ];

    const linhas = dados.map((item) => [
      item.dataPagamento,
      item.vencimento,
      item.descricao,
      item.credor,
      item.obra,
      item.origem,
      formatNumber(item.valorTotal),
      formatNumber(item.valorPago),
      item.formaPagamento,
      item.observacao,
    ]);

    const csv = [
      headers.map(escapeCsv).join(';'),
      ...linhas.map((linha) => linha.map(escapeCsv).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const periodoNome = periodoDashboard || 'filtro';
    const dataHoje = new Date().toISOString().slice(0, 10);
    const fileName = `contas-pagas-${periodoNome}-${dataHoje}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Planilha exportada com sucesso.');
  };

  const getPeriodoDescricao = () => {
    if (pStart && pEnd) {
      return `${formatDateBR(pStart)} a ${formatDateBR(pEnd)}`;
    }
    return 'Todos';
  };

  const handlePrintPdf = () => {
    const dados = getDadosExportacao();

    if (!dados.length) {
      toast.error('Não há contas pagas para imprimir no filtro atual.');
      return;
    }

    const totalPagoSum = dados.reduce((acc, item) => acc + item.valorPago, 0);

    const rowsHtml = dados.map((item) => `
      <tr>
        <td>${item.dataPagamento}</td>
        <td>${item.vencimento}</td>
        <td>${item.descricao}</td>
        <td>${item.credor}</td>
        <td>${item.obra}</td>
        <td>${item.origem}</td>
        <td class="right">${formatCurrency(item.valorTotal)}</td>
        <td class="right">${formatCurrency(item.valorPago)}</td>
        <td>${item.formaPagamento}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Contas Pagas</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #111827;
              margin: 24px;
              font-size: 12px;
            }

            h1 {
              font-size: 20px;
              margin: 0 0 4px 0;
            }

            .subtitle {
              color: #4b5563;
              margin-bottom: 16px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }

            .card {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 8px;
            }

            .label {
              font-size: 10px;
              color: #6b7280;
              text-transform: uppercase;
            }

            .value {
              font-size: 14px;
              font-weight: bold;
              margin-top: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 6px;
              vertical-align: top;
            }

            th {
              background: #f3f4f6;
              text-align: left;
              font-size: 11px;
            }

            .right {
              text-align: right;
              white-space: nowrap;
            }

            .footer {
              margin-top: 16px;
              font-size: 10px;
              color: #6b7280;
            }

            @media print {
              body {
                margin: 12mm;
              }

              .no-print {
                display: none;
              }

              table {
                page-break-inside: auto;
              }

              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }

              thead {
                display: table-header-group;
              }
            }
          </style>
        </head>
        <body>
          <h1>Contas Pagas</h1>
          <div class="subtitle">
            Período: ${getPeriodoDescricao()} | Total de registros: ${dados.length}
          </div>

          <div class="summary">
            <div class="card">
              <div class="label">Total Pago</div>
              <div class="value">${formatCurrency(totalPagoSum)}</div>
            </div>
            <div class="card">
              <div class="label">Quantidade de Contas</div>
              <div class="value">${dados.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data Pagamento</th>
                <th>Vencimento</th>
                <th>Descrição</th>
                <th>Credor</th>
                <th>Obra</th>
                <th>Origem</th>
                <th>Valor Total</th>
                <th>Valor Pago</th>
                <th>Forma Pgto</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Relatório gerado em ${new Date().toLocaleString('pt-BR')}.
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* Filtro de Período do Dashboard */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Dashboard Financeiro - Contas Pagas</h2>
          {pStart && pEnd ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              Período (por pagamento): <strong className="text-foreground">{formatDateBR(pStart)}</strong> até <strong className="text-foreground">{formatDateBR(pEnd)}</strong>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400"></span>
              Exibindo todas as contas pagas (sem filtro de período).
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Filtrar por:</label>
            <select
              value={periodoDashboard}
              onChange={(e) => handlePeriodoChange(e.target.value)}
              className="text-xs border border-input rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:min-w-[150px]"
            >
              <option value="hoje">Hoje</option>
              <option value="semana_util">Semana útil atual</option>
              <option value="semana_7_dias">Próximos 7 dias</option>
              <option value="mes_atual">Mês atual</option>
              <option value="proximos_30_dias">Próximos 30 dias</option>
              <option value="trimestre">Trimestre</option>
              <option value="semestre">Semestre</option>
              <option value="ano">Ano</option>
              <option value="personalizado">Personalizado</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {periodoDashboard === 'personalizado' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="date"
                value={pStart}
                onChange={(e) => setPStart(e.target.value)}
                className="text-xs border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none w-full sm:w-auto"
              />
              <span className="text-xs text-muted-foreground text-center">até</span>
              <input
                type="date"
                value={pEnd}
                onChange={(e) => setPEnd(e.target.value)}
                className="text-xs border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none w-full sm:w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashCard label="Total Pago" value={fmt(totais.totalPago)} icon={DollarSign} colorClass="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900/50" />
        <DashCard label="Quantidade" value={totais.quantidade} icon={CheckCircle} colorClass="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50" />
        <DashCard label="Maior Pago" value={fmt(totais.maiorPagamento)} icon={TrendingDown} colorClass="bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/50" />
        <DashCard label="Média p/ Conta" value={fmt(totais.media)} icon={Calendar} colorClass="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-900/50" />
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><CheckCircle size={20} className="text-green-600" /> Contas Pagas</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => setShowFiltros(!showFiltros)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted">
              <Filter size={15} /> Filtros
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted text-foreground bg-card"
            >
              <Download size={15} /> Exportar planilha
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted text-foreground bg-card"
            >
              <Printer size={15} /> Imprimir / PDF
            </button>
          </div>
        </CardHeader>

        {showFiltros && (
          <div className="px-6 pb-4 flex flex-wrap gap-3 border-b border-border">
            <select value={filtros.origem} onChange={e => setFiltros(f => ({ ...f, origem: e.target.value }))}
              className="text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground">
              <option value="">Todas as origens</option>
              {['avulso','locacao','manutencao','abastecimento','funcionario','terceiro','fornecedor'].map(o =>
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              )}
            </select>
            {filtros.origem && (
              <button onClick={() => setFiltros({ origem: '' })}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                <X size={14} /> Limpar
              </button>
            )}
          </div>
        )}

        <CardContent className="px-0 sm:px-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground border-b border-border pb-2 gap-1.5 px-4 sm:px-0">
              {pStart && pEnd ? (
                <p>
                  Exibindo contas pagas com data de pagamento entre <strong className="text-foreground">{formatDateBR(pStart)}</strong> e <strong className="text-foreground">{formatDateBR(pEnd)}</strong>.
                </p>
              ) : (
                <p>Exibindo todas as contas pagas (sem filtro de período).</p>
              )}
              <p>
                Total exibido: <strong className="text-foreground">{contasFiltradas.length}</strong> de <strong className="text-foreground">{contas.length}</strong>
              </p>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block w-full overflow-x-auto">
              <div className="min-w-[980px]">
                <DataTable
                  columns={columns}
                  data={contasFiltradas}
                  isLoading={loading}
                  searchable={true}
                  searchFields={['descricao']}
                />
              </div>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden space-y-4 px-4">
              <div className="flex items-center px-3 py-2 border border-input rounded-md bg-background">
                <Search size={18} className="text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Buscar descrição ou credor..."
                  value={searchTermMobile}
                  onChange={(e) => setSearchTermMobile(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  Carregando dados...
                </div>
              ) : mobileFilteredContas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</div>
              ) : (
                <div className="space-y-3">
                  {mobileFilteredContas.map((conta) => (
                    <div
                      key={conta.id}
                      className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground break-words">
                            {conta.descricao || '—'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Credor: {getCredorNome(conta)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Obra: {getObraNome(conta)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border py-2">
                        <div>
                          <span className="text-muted-foreground">Pagamento</span>
                          <p className="font-medium text-foreground">
                            {formatDateBR(getDataPagamentoEfetiva(conta))}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vencimento</span>
                          <p className="font-medium text-foreground">
                            {formatDateBR(conta.vencimento)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor total</span>
                          <p className="font-medium text-foreground">
                            {fmt(conta.valor_total)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor pago</span>
                          <p className="font-medium text-green-600">
                            {fmt(conta.valor_pago)}
                          </p>
                        </div>
                      </div>

                      {conta.observacao && (
                        <div className="text-xs bg-muted/40 p-2 rounded">
                          <span className="text-muted-foreground font-medium">Obs:</span> {conta.observacao}
                        </div>
                      )}

                      <div className="pt-1">
                        {renderAcoes(conta)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); }}
          title="Editar Conta" size="lg">
          <ContaForm initialData={editing} onSubmit={handleSave} onCancel={() => { setIsFormOpen(false); setEditing(null); }} />
        </Modal>
      )}
    </div>
  );
}
