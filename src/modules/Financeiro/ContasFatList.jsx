import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import DataTable from '@/shared/DataTable';
import { toast } from 'sonner';
import {
  TrendingDown, CheckCircle, FileText, Filter, X,
  Search, Download, Printer, DollarSign, Calendar,
  CalendarClock, XCircle, Trash2
} from 'lucide-react';
import { contasPagarService } from '@/services/contasPagarService';
import ContaForm from './ContaForm';
import PagamentoModal from './PagamentoModal';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function DashCard({ label, value, icon: Icon, colorClass, active = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 flex items-center gap-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
      } ${active ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm'} ${colorClass}`}
    >
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
    case 'hoje':
      return { start: formatDateLocal(hoje), end: formatDateLocal(hoje) };
    case 'semana_util': {
      const diaSemana = hoje.getDay();
      const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      inicio.setDate(hoje.getDate() + diffSegunda);
      fim.setTime(inicio.getTime());
      fim.setDate(inicio.getDate() + 4);
      return { start: formatDateLocal(inicio), end: formatDateLocal(fim) };
    }
    case 'semana_7_dias':
      fim.setDate(hoje.getDate() + 7);
      return { start: formatDateLocal(hoje), end: formatDateLocal(fim) };
    case 'mes_atual': {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return { start: formatDateLocal(primeiroDia), end: formatDateLocal(ultimoDia) };
    }
    case 'proximos_30_dias':
      fim.setDate(hoje.getDate() + 30);
      return { start: formatDateLocal(hoje), end: formatDateLocal(fim) };
    case 'trimestre': {
      const mesAtual = hoje.getMonth();
      const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
      const primeiroDia = new Date(hoje.getFullYear(), inicioTrimestre, 1);
      const ultimoDia = new Date(hoje.getFullYear(), inicioTrimestre + 3, 0);
      return { start: formatDateLocal(primeiroDia), end: formatDateLocal(ultimoDia) };
    }
    case 'semestre': {
      const inicioSemestre = hoje.getMonth() < 6 ? 0 : 6;
      const primeiroDia = new Date(hoje.getFullYear(), inicioSemestre, 1);
      const ultimoDia = new Date(hoje.getFullYear(), inicioSemestre + 6, 0);
      return { start: formatDateLocal(primeiroDia), end: formatDateLocal(ultimoDia) };
    }
    case 'ano': {
      const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
      const ultimoDia = new Date(hoje.getFullYear(), 11, 31);
      return { start: formatDateLocal(primeiroDia), end: formatDateLocal(ultimoDia) };
    }
    case 'todos':
    default:
      return { start: '', end: '' };
  }
};

const STATUS_CONFIG = {
  a_vencer: { label: 'A Vencer', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  vencida: { label: 'Vencida', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
  paga: { label: 'Paga', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  parcial: { label: 'Parcial', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
  cancelada: { label: 'Cancelada', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200' },
};

export default function ContasFatList() {
  const { hasPermission } = useAuth();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [pagando, setPagando] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filtros, setFiltros] = useState({ origem: '' });
  const [showFiltros, setShowFiltros] = useState(false);
  const [searchTermMobile, setSearchTermMobile] = useState('');
  const [cardSelecionado, setCardSelecionado] = useState(null);

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

  const handlePeriodoChange = (tipo) => {
    setPeriodoDashboard(tipo);
    setCardSelecionado(null);
    if (tipo === 'personalizado') return;
    const range = getPeriodoRange(tipo);
    setPStart(range.start);
    setPEnd(range.end);
  };

  const contaDentroDoPeriodo = (conta) => {
    if (!pStart || !pEnd) return true;
    const dataRef = conta.vencimento;
    if (!dataRef) return false;
    return dataRef >= pStart && dataRef <= pEnd;
  };

  const getHojeLocalString = () => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const contasFiltradas = useMemo(() => {
    let base = contas.filter((conta) => contaDentroDoPeriodo(conta));

    if (cardSelecionado) {
      base = base.filter((conta) => {
        const total = Number(conta.valor_total ?? conta.valor ?? 0);
        const pago = Number(conta.valor_pago || 0);
        const saldo = Math.max(0, total - pago);
        const hojeStr = getHojeLocalString();

        if (cardSelecionado === 'total_fat') {
          return true;
        }
        if (cardSelecionado === 'total_pago') {
          return pago > 0;
        }
        if (cardSelecionado === 'saldo_pendente') {
          return saldo > 0 && conta.status !== 'cancelada';
        }
        return true;
      });
    }

    return base;
  }, [contas, pStart, pEnd, cardSelecionado]);

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
      const data = await contasPagarService.getFat(filtros);
      setContas(data);
    } catch (error) {
      console.error('ERRO AO CARREGAR CONTAS FAT:', error);
      toast.error(error.message || 'Erro ao carregar contas FAT.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  const totais = useMemo(() => {
    let totalFat = 0;
    let totalPago = 0;
    let saldoPendente = 0;
    let quantidade = 0;

    const baseContas = contas.filter((conta) => contaDentroDoPeriodo(conta));

    baseContas.forEach((c) => {
      if (c.status === 'cancelada') return;
      const total = Number(c.valor_total ?? c.valor ?? 0);
      const pago = Number(c.valor_pago || 0);
      const saldo = Math.max(0, total - pago);

      totalFat += total;
      totalPago += pago;
      saldoPendente += saldo;
      quantidade += 1;
    });

    return { totalFat, totalPago, saldoPendente, quantidade };
  }, [contas, pStart, pEnd]);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        const cleanPayload = { ...payload };
        delete cleanPayload.id;
        await contasPagarService.update(editing.id, cleanPayload);
        toast.success('Conta FAT atualizada!');
      } else {
        await contasPagarService.create(payload);
        toast.success('Conta FAT criada!');
      }
      setIsFormOpen(false);
      setEditing(null);
      loadData();
    } catch (error) {
      console.error('ERRO AO SALVAR CONTA FAT:', error);
      toast.error(error.message || 'Erro ao salvar conta FAT.');
    }
  };

  const handlePagamento = async (contaId, pagPayload) => {
    try {
      const { novoStatus } = await contasPagarService.registrarPagamento(contaId, pagPayload);
      if (novoStatus === 'paga') {
        toast.success("Conta FAT quitada com sucesso.");
      } else {
        toast.success("Pagamento parcial registrado.");
      }
      loadData();
    } catch (error) {
      console.error('ERRO AO REGISTRAR PAGAMENTO FAT:', error);
      toast.error(error.message || 'Erro ao registrar pagamento FAT.');
      throw error;
    }
  };

  const handleDelete = async (conta) => {
    const confirmacao = window.prompt(`Digite EXCLUIR para confirmar a exclusão permanente de "${conta.descricao}":`);
    if (confirmacao !== 'EXCLUIR') {
      toast.info('Exclusão cancelada.');
      return;
    }

    try {
      await contasPagarService.deletePermanente(conta.id);
      toast.success('Conta FAT excluída definitivamente.');
      loadData();
    } catch (error) {
      console.error('ERRO AO EXCLUIR CONTA:', error);
      toast.error(error.message || 'Erro ao excluir conta.');
    }
  };

  const renderStatus = (row) => {
    const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.a_vencer;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block text-center min-w-[90px] ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  const renderCredor = (row) => <span className="text-sm">{getCredorNome(row)}</span>;

  const renderValores = (row) => {
    const total = Number(row.valor_total ?? row.valor ?? 0);
    const pago = Number(row.valor_pago || 0);
    const saldo = Math.max(0, total - pago);

    return (
      <div className="text-xs space-y-0.5 whitespace-nowrap">
        <div><span className="text-muted-foreground">Valor total:</span> <span className="font-semibold text-foreground">{fmt(total)}</span></div>
        {pago > 0 && (
          <div><span className="text-muted-foreground">Pago:</span> <span className="font-semibold text-green-600">{fmt(pago)}</span></div>
        )}
        {saldo > 0 && pago > 0 && (
          <div><span className="text-muted-foreground">Saldo:</span> <span className="font-semibold text-orange-600">{fmt(saldo)}</span></div>
        )}
      </div>
    );
  };

  const renderAcoes = (row) => (
    <div className="flex flex-col sm:flex-row flex-wrap gap-1.5 items-stretch sm:items-center">
      {hasPermission('financeiro_contas_pagar', 'editar') && ['a_vencer', 'parcial', 'vencida'].includes(row.status) && (
        <button onClick={() => setPagando(row)} title="Registrar Pagamento"
          className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors">
          <DollarSign size={12} /> Pagar
        </button>
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
      {hasPermission('financeiro_contas_pagar', 'excluir') && (
        <button onClick={() => handleDelete(row)} title="Excluir"
          className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-800 font-medium transition-colors">
          <Trash2 size={12} /> Excluir
        </button>
      )}
    </div>
  );

  const columns = [
    { header: 'Vencimento', accessor: 'vencimento', render: (row) => <span className={`text-sm ${row.status === 'vencida' ? 'text-red-600 font-semibold' : ''}`}>{row.vencimento ? new Date(row.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span> },
    { header: 'Descrição', accessor: 'descricao' },
    { header: 'Credor', accessor: 'credor', render: renderCredor },
    { header: 'Obra', accessor: 'obra', render: (row) => getObraNome(row) },
    { header: 'Valores', accessor: 'valor_total', render: renderValores },
    { header: 'Status', accessor: 'status', render: renderStatus },
    { header: 'Ações', accessor: '_acoes', render: renderAcoes }
  ];

  const getDadosExportacao = () => {
    return (contasFiltradas || []).map((conta) => {
      const valorTotal = Number(conta.valor_total ?? conta.valor ?? 0);
      const valorPago = Number(conta.valor_pago || 0);
      const saldo = Math.max(0, valorTotal - valorPago);

      return {
        vencimento: formatDateBR(conta.vencimento),
        descricao: conta.descricao || '—',
        credor: getCredorNome(conta),
        obra: getObraNome(conta),
        origem: conta.origem || '—',
        valorTotal,
        valorPago,
        saldo,
        status: STATUS_CONFIG[conta.status]?.label || conta.status || '—',
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
      toast.error('Não há contas FAT para exportar.');
      return;
    }

    const headers = [
      'Vencimento',
      'Descrição',
      'Credor',
      'Obra',
      'Origem',
      'Valor Total',
      'Valor Pago',
      'Saldo',
      'Status',
      'Observação',
    ];

    const linhas = dados.map((item) => [
      item.vencimento,
      item.descricao,
      item.credor,
      item.obra,
      item.origem,
      formatNumber(item.valorTotal),
      formatNumber(item.valorPago),
      formatNumber(item.saldo),
      item.status,
      item.observacao,
    ]);

    const csv = [
      headers.map(escapeCsv).join(';'),
      ...linhas.map((linha) => linha.map(escapeCsv).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const periodNome = periodoDashboard || 'filtro';
    const dataHoje = new Date().toISOString().slice(0, 10);
    const fileName = `contas-fat-${periodNome}-${dataHoje}.csv`;

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
    if (pStart && pEnd) return `${formatDateBR(pStart)} a ${formatDateBR(pEnd)}`;
    return 'Todos';
  };

  const handlePrintPdf = () => {
    const dados = getDadosExportacao();

    if (!dados.length) {
      toast.error('Não há contas FAT para imprimir.');
      return;
    }

    const totalPrevisto = dados.reduce((acc, item) => acc + item.valorTotal, 0);
    const totalPago = dados.reduce((acc, item) => acc + item.valorPago, 0);
    const saldoTotal = dados.reduce((acc, item) => acc + item.saldo, 0);

    const rowsHtml = dados.map((item) => `
      <tr>
        <td>${item.vencimento}</td>
        <td>${item.descricao}</td>
        <td>${item.credor}</td>
        <td>${item.obra}</td>
        <td>${item.origem}</td>
        <td class="right">${formatCurrency(item.valorTotal)}</td>
        <td class="right">${formatCurrency(item.valorPago)}</td>
        <td class="right">${formatCurrency(item.saldo)}</td>
        <td>${item.status}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Contas FAT</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #111827; margin: 24px; font-size: 12px; }
            h1 { font-size: 20px; margin: 0 0 4px 0; }
            .subtitle { color: #4b5563; margin-bottom: 16px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
            .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; }
            .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; font-size: 11px; }
            .right { text-align: right; white-space: nowrap; }
            .footer { margin-top: 16px; font-size: 10px; color: #6b7280; }
            @media print {
              body { margin: 12mm; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <h1>Contas FAT (Pagamento Direto pelo Cliente)</h1>
          <div class="subtitle">
            Período: ${getPeriodoDescricao()} | Total de registros: ${dados.length}
          </div>

          <div class="summary">
            <div class="card">
              <div class="label">Total FAT</div>
              <div class="value">${formatCurrency(totalPrevisto)}</div>
            </div>
            <div class="card">
              <div class="label">Total Pago p/ Cliente</div>
              <div class="value">${formatCurrency(totalPago)}</div>
            </div>
            <div class="card">
              <div class="label">Saldo Pendente FAT</div>
              <div class="value">${formatCurrency(saldoTotal)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Descrição</th>
                <th>Credor</th>
                <th>Obra</th>
                <th>Origem</th>
                <th>Valor</th>
                <th>Pago</th>
                <th>Saldo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">Relatório gerado em ${new Date().toLocaleString('pt-BR')}.</div>
          <script>window.onload = () => { window.print(); };</script>
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

  const cardLabel = (card) => {
    const labels = {
      total_fat: 'Total FAT',
      total_pago: 'Total pago pelo cliente',
      saldo_pendente: 'Saldo pendente FAT',
    };
    return labels[card] || card;
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* Filtro de Período do Dashboard */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Dashboard Financeiro - Contas FAT</h2>
          {pStart && pEnd ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Período: <strong className="text-foreground">{formatDateBR(pStart)}</strong> até <strong className="text-foreground">{formatDateBR(pEnd)}</strong>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400"></span>
              Exibindo todas as contas FAT (sem filtro de período).
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
        <DashCard
          label="Total FAT"
          value={fmt(totais.totalFat)}
          icon={DollarSign}
          colorClass="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50"
          active={cardSelecionado === 'total_fat'}
          onClick={() => setCardSelecionado(cardSelecionado === 'total_fat' ? null : 'total_fat')}
        />
        <DashCard
          label="Total pago p/ cliente"
          value={fmt(totais.totalPago)}
          icon={CheckCircle}
          colorClass="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900/50"
          active={cardSelecionado === 'total_pago'}
          onClick={() => setCardSelecionado(cardSelecionado === 'total_pago' ? null : 'total_pago')}
        />
        <DashCard
          label="Saldo pendente FAT"
          value={fmt(totais.saldoPendente)}
          icon={TrendingDown}
          colorClass="bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-900/50"
          active={cardSelecionado === 'saldo_pendente'}
          onClick={() => setCardSelecionado(cardSelecionado === 'saldo_pendente' ? null : 'saldo_pendente')}
        />
        <DashCard
          label="Quantidade FAT"
          value={totais.quantidade}
          icon={Calendar}
          colorClass="bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/50"
        />
      </div>

      {cardSelecionado && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <span>Exibindo itens que compõem: {cardLabel(cardSelecionado)}</span>
          <button type="button" onClick={() => setCardSelecionado(null)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40">
            <X size={14} /> Limpar seleção
          </button>
        </div>
      )}

      {/* Tabela */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><DollarSign size={20} className="text-blue-600" /> Contas FAT</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {hasPermission('financeiro_contas_pagar', 'criar') && (
              <button onClick={() => { setEditing(null); setIsFormOpen(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                Nova Conta FAT
              </button>
            )}
            <button onClick={() => setShowFiltros(!showFiltros)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted bg-card">
              <Filter size={15} /> Filtros
            </button>
            <button type="button" onClick={handleExportCsv}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted bg-card">
              <Download size={15} /> Exportar planilha
            </button>
            <button type="button" onClick={handlePrintPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted bg-card">
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
                <p>Exibindo contas FAT com vencimento entre <strong className="text-foreground">{formatDateBR(pStart)}</strong> e <strong className="text-foreground">{formatDateBR(pEnd)}</strong>.</p>
              ) : (
                <p>Exibindo todas as contas FAT (sem filtro de período).</p>
              )}
              <p>Total exibido: <strong className="text-foreground">{contasFiltradas.length}</strong> de <strong className="text-foreground">{contas.length}</strong></p>
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
                  placeholder="Buscar por descrição ou credor..."
                  value={searchTermMobile}
                  onChange={(e) => setSearchTermMobile(e.target.value)}
                  className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
                />
                {searchTermMobile && (
                  <button onClick={() => setSearchTermMobile('')}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
                )}
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
              ) : mobileFilteredContas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta FAT encontrada.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {mobileFilteredContas.map((conta) => {
                    const total = Number(conta.valor_total ?? conta.valor ?? 0);
                    const pago = Number(conta.valor_pago || 0);
                    const saldo = Math.max(0, total - pago);

                    return (
                      <div key={conta.id} className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm hover:shadow transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-semibold">{formatDateBR(conta.vencimento)}</span>
                          {renderStatus(conta)}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{conta.descricao}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{getCredorNome(conta)}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-1">Obra: <span className="text-foreground">{getObraNome(conta)}</span></p>
                        </div>

                        <div className="pt-2 border-t border-dashed border-border grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Total</span>
                            <span className="text-xs font-semibold text-foreground">{fmt(total)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Pago</span>
                            <span className="text-xs font-semibold text-green-600">{fmt(pago)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Saldo</span>
                            <span className="text-xs font-semibold text-orange-600">{fmt(saldo)}</span>
                          </div>
                        </div>

                        {conta.observacao && (
                          <div className="text-xs bg-muted/40 p-2 rounded">
                            <span className="text-muted-foreground font-medium">Obs:</span> {conta.observacao}
                          </div>
                        )}

                        <div className="pt-1">{renderAcoes(conta)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Form */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); }}
          title={editing ? 'Editar Conta FAT' : 'Nova Conta FAT'} size="lg">
          <ContaForm
            initialData={editing ? { ...editing, pagamento_direto_cliente: true } : { status: 'a_vencer', pagamento_direto_cliente: true }}
            onSubmit={handleSave}
            onCancel={() => { setIsFormOpen(false); setEditing(null); }}
          />
        </Modal>
      )}

      {/* Modal Pagamento */}
      {pagando && (
        <PagamentoModal isOpen={!!pagando} onClose={() => setPagando(null)}
          conta={pagando} onPagamentoRegistrado={handlePagamento} />
      )}
    </div>
  );
}
