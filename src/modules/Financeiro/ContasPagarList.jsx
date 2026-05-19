import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import DataTable from '@/shared/DataTable';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle,
  Plus, DollarSign, CalendarClock, XCircle, FileText, Filter, X, Trash2,
  Search, Download, Printer
} from 'lucide-react';
import { contasPagarService } from '@/services/contasPagarService';
import ContaForm from './ContaForm';
import PagamentoModal from './PagamentoModal';
import PrevisaoRhModal from './PrevisaoRhModal';
import { funcionariosService } from '@/services/funcionariosService';

const STATUS_CONFIG = {
  a_vencer:  { label: 'A Vencer',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  vencida:   { label: 'Vencida',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  paga:      { label: 'Paga',      color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  parcial:   { label: 'Parcial',   color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

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

function ReagendarModal({ isOpen, onClose, conta, onReagendado }) {
  const [data, setData] = useState('');
  const handleConfirm = async () => {
    if (!data) { toast.error('Informe a nova data.'); return; }
    try {
      await onReagendado(conta.id, data);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Erro ao reagendar.');
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reagendar Vencimento" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{conta?.descricao}</p>
        <div>
          <label className="block text-sm font-medium mb-1">Novo Vencimento</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancelar</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700">Reagendar</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ContasPagarList() {
  const { hasPermission } = useAuth();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagando, setPagando] = useState(null);
  const [reagendando, setReagendando] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [filtros, setFiltros] = useState({ status: '', origem: '' });
  const [showFiltros, setShowFiltros] = useState(false);
  const [isPrevisaoRhOpen, setIsPrevisaoRhOpen] = useState(false);
  const [searchTermMobile, setSearchTermMobile] = useState('');

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

  const statusLabel = (status) => {
    const labels = {
      a_vencer: 'A Vencer',
      vencida: 'Vencida',
      paga: 'Paga',
      parcial: 'Parcial',
      cancelada: 'Cancelada',
    };
    return labels[status] || status || '—';
  };

  const getSaldoConta = (conta) => {
    const total = Number(conta.valor_total ?? conta.valor ?? 0);
    const pago = Number(conta.valor_pago || 0);
    return Math.max(0, total - pago);
  };

  const getDadosExportacao = () => {
    return (contasFiltradas || []).map((conta) => {
      const valorTotal = Number(conta.valor_total ?? conta.valor ?? 0);
      const valorPago = Number(conta.valor_pago || 0);
      const saldo = getSaldoConta(conta);

      return {
        vencimento: formatDateBR(conta.vencimento),
        descricao: conta.descricao || '—',
        credor: getCredorNome(conta),
        obra: getObraNome(conta),
        origem: conta.origem || '—',
        valorTotal,
        valorPago,
        saldo,
        status: statusLabel(conta.status),
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
      toast.error('Não há contas para exportar no filtro atual.');
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

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const periodoNome = periodoDashboard || 'filtro';
    const dataHoje = new Date().toISOString().slice(0, 10);
    const fileName = `contas-a-pagar-${periodoNome}-${dataHoje}.csv`;

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
      toast.error('Não há contas para imprimir no filtro atual.');
      return;
    }

    const totalPrevisto = dados.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0);
    const totalPago = dados.reduce((acc, item) => acc + Number(item.valorPago || 0), 0);
    const saldoTotal = dados.reduce((acc, item) => acc + Number(item.saldo || 0), 0);

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
          <title>Contas a Pagar</title>
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
              grid-template-columns: repeat(3, 1fr);
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
          <h1>Contas a Pagar</h1>
          <div class="subtitle">
            Período: ${getPeriodoDescricao()} | Total de registros: ${dados.length}
          </div>

          <div class="summary">
            <div class="card">
              <div class="label">Total previsto</div>
              <div class="value">${formatCurrency(totalPrevisto)}</div>
            </div>
            <div class="card">
              <div class="label">Total pago</div>
              <div class="value">${formatCurrency(totalPago)}</div>
            </div>
            <div class="card">
              <div class="label">Saldo</div>
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

  // States de Período do Dashboard
  const [periodoDashboard, setPeriodoDashboard] = useState('mes_atual');
  const [pStart, setPStart] = useState(() => getPeriodoRange('mes_atual').start);
  const [pEnd, setPEnd] = useState(() => getPeriodoRange('mes_atual').end);

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
    const dataReferencia = conta.vencimento;
    if (!dataReferencia) return false;
    return dataReferencia >= pStart && dataReferencia <= pEnd;
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
      const data = await contasPagarService.getAll(filtros);
      setContas(data);
    } catch (error) {
      console.error('ERRO AO CARREGAR CONTAS:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        full: error,
      });
      toast.error(error.message || 'Erro ao carregar contas a pagar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filtros]);

  // Dashboard totalizadores filtrados por período
  const totais = useMemo(() => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;

    let total_a_vencer = 0;
    let total_vencido = 0;
    let total_pago = 0;
    let total_parcial = 0;

    const dentroPeriodo = (data) => {
      if (!pStart || !pEnd) return true;
      return data && data >= pStart && data <= pEnd;
    };

    contas.forEach((c) => {
      if (c.status === 'cancelada') return;

      const total = Number(c.valor_total ?? c.valor ?? 0);
      const pagoAcumulado = Number(c.valor_pago || 0);
      const saldo = Math.max(0, total - pagoAcumulado);

      // Pagamentos realizados no período
      if (Array.isArray(c.pagamentos) && c.pagamentos.length > 0) {
        c.pagamentos.forEach((p) => {
          if (dentroPeriodo(p.data_pagamento)) {
            total_pago += Number(p.valor_pago || 0);
          }
        });
      } else if (pagoAcumulado > 0 && dentroPeriodo(c.vencimento)) {
        total_pago += pagoAcumulado;
      }

      // Se não existe saldo em aberto, não entra em A Vencer, Vencido ou Parcial
      if (saldo <= 0 || c.status === 'paga') return;

      // Valores em aberto são filtrados pelo vencimento da conta
      if (!dentroPeriodo(c.vencimento)) return;

      // Parcial mostra o saldo restante de contas parcialmente pagas
      if (c.status === 'parcial' || pagoAcumulado > 0) {
        total_parcial += saldo;
      }

      // A vencer e vencido sempre devem considerar saldo, não valor total
      if (c.vencimento && c.vencimento < hojeStr) {
        total_vencido += saldo;
      } else {
        total_a_vencer += saldo;
      }
    });

    return { total_a_vencer, total_vencido, total_pago, total_parcial };
  }, [contas, pStart, pEnd]);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        const cleanPayload = { ...payload }; delete cleanPayload.id;
        await contasPagarService.update(editing.id, cleanPayload);
        toast.success('Conta atualizada!');
      } else {
        await contasPagarService.create(payload);
        toast.success('Conta criada!');
      }
      setIsFormOpen(false);
      setEditing(null);
      loadData();
    } catch (error) {
      console.error('ERRO AO SALVAR CONTA:', error);
      toast.error(error.message || 'Erro ao salvar conta.');
    }
  };

  const handlePagamento = async (contaId, pagPayload) => {
    try {
      const { novoStatus } = await contasPagarService.registrarPagamento(contaId, pagPayload);
      if (novoStatus === 'paga') {
        toast.success("Conta quitada com sucesso.");
      } else {
        toast.success("Pagamento parcial registrado. Vencimento atualizado.");
      }
      loadData();
    } catch (error) {
      console.error('ERRO AO REGISTRAR PAGAMENTO:', error);
      toast.error(error.message || 'Erro ao registrar pagamento.');
      throw error;
    }
  };

  const handleReagendar = async (contaId, novoVencimento) => {
    await contasPagarService.reagendar(contaId, novoVencimento);
    toast.success('Vencimento reagendado!');
    loadData();
  };

  const handleCancelar = async () => {
    try {
      await contasPagarService.cancelar(cancelando.id);
      toast.success('Conta cancelada.');
      setCancelando(null);
      loadData();
    } catch (error) {
      console.error('ERRO AO CANCELAR:', error);
      toast.error(error.message || 'Erro ao cancelar conta.');
    }
  };

  const handleDeletePermanente = async (conta) => {
    const mensagem = [
      'Esta ação excluirá definitivamente a conta e seus pagamentos vinculados.',
      '',
      `Conta: ${conta.descricao || conta.id}`,
      '',
      'Esta ação não poderá ser desfeita.',
      '',
      'Digite EXCLUIR para confirmar:'
    ].join('\n');

    const confirmacao = window.prompt(mensagem);

    if (confirmacao !== 'EXCLUIR') {
      toast.info('Exclusão cancelada.');
      return;
    }

    try {
      await contasPagarService.deletePermanente(conta.id);
      toast.success('Conta excluída definitivamente.');
      await loadData();
    } catch (error) {
      console.error('ERRO AO EXCLUIR CONTA DEFINITIVAMENTE:', error);
      toast.error(error.message || 'Erro ao excluir conta definitivamente.');
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

  const renderCredor = (row) => {
    const nome =
      row.pessoas?.nome ||
      row.empresas?.nome_fantasia ||
      row.empresas?.razao_social ||
      row.credor_avulso ||
      '—';
    return <span className="text-sm">{nome}</span>;
  };

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
      {hasPermission('financeiro_contas_pagar', 'editar') && row.status !== 'cancelada' && row.status !== 'paga' && (
        <button onClick={() => setReagendando(row)} title="Reagendar"
          className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 font-medium transition-colors">
          <CalendarClock size={12} /> Reagendar
        </button>
      )}
      {hasPermission('financeiro_contas_pagar', 'editar') && row.status !== 'cancelada' && row.status !== 'paga' && (
        <button onClick={() => setCancelando(row)} title="Cancelar"
          className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-medium transition-colors">
          <XCircle size={12} /> Cancelar
        </button>
      )}
      {hasPermission('financeiro_contas_pagar', 'excluir') && row.status === 'cancelada' && (
        <button onClick={() => handleDeletePermanente(row)} title="Excluir Definitivamente"
          className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 font-medium transition-colors">
          <Trash2 size={12} /> Excluir
        </button>
      )}
      {row.arquivo_url && (
        <a href={row.arquivo_url} target="_blank" rel="noreferrer" title="Abrir Arquivo"
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

  const columns = [
    { header: 'Vencimento', accessor: 'vencimento', render: (row) => <span className={`text-sm ${row.status === 'vencida' ? 'text-red-600 font-semibold' : ''}`}>{row.vencimento ? new Date(row.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span> },
    { header: 'Descrição', accessor: 'descricao' },
    { header: 'Credor', accessor: 'credor', render: renderCredor },
    { header: 'Obra', accessor: 'obra', render: (row) => row.obras?.objeto || '—' },
    { header: 'Valores', accessor: 'valor_total', render: renderValores },
    { header: 'Status', accessor: 'status', render: renderStatus },
    { header: 'Ações', accessor: '_acoes', render: renderAcoes },
  ];

  const fmtBR = (dateStr) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [a, m, d] = parts;
    return `${d}/${m}/${a}`;
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* Filtro de Período do Dashboard */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Dashboard Financeiro</h2>
          {pStart && pEnd ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Período: <strong className="text-foreground">{fmtBR(pStart)}</strong> até <strong className="text-foreground">{fmtBR(pEnd)}</strong>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400"></span>
              Exibindo todas as contas (sem filtro de período).
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
        <DashCard label="A Vencer" value={fmt(totais.total_a_vencer)} icon={Clock}         colorClass="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50" />
        <DashCard label="Vencido"  value={fmt(totais.total_vencido)}  icon={AlertTriangle}  colorClass="bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50" />
        <DashCard label="Pago"     value={fmt(totais.total_pago)}     icon={CheckCircle}    colorClass="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900/50" />
        <DashCard label="Parcial"  value={fmt(totais.total_parcial)}  icon={TrendingUp}     colorClass="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-900/50" />
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><TrendingDown size={20} /> Contas a Pagar</CardTitle>
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

            {hasPermission('financeiro_contas_pagar', 'criar') && (
              <button
                onClick={() => setIsPrevisaoRhOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
              >
                Previsões RH
              </button>
            )}
            {hasPermission('financeiro_contas_pagar', 'criar') && (
              <button onClick={() => { setEditing(null); setIsFormOpen(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Plus size={15} /> Nova
              </button>
            )}
          </div>
        </CardHeader>

        {showFiltros && (
          <div className="px-6 pb-4 flex flex-wrap gap-3 border-b border-border">
            <select value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}
              className="text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filtros.origem} onChange={e => setFiltros(f => ({ ...f, origem: e.target.value }))}
              className="text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground">
              <option value="">Todas as origens</option>
              {['avulso','locacao','manutencao','abastecimento','funcionario','terceiro','fornecedor'].map(o =>
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              )}
            </select>
            {(filtros.status || filtros.origem) && (
              <button onClick={() => setFiltros({ status: '', origem: '' })}
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
                  Exibindo contas com vencimento entre <strong className="text-foreground">{fmtBR(pStart)}</strong> e <strong className="text-foreground">{fmtBR(pEnd)}</strong>.
                </p>
              ) : (
                <p>Exibindo todas as contas (sem filtro de período).</p>
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
                  searchFields={['descricao', 'origem']}
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
                        {renderStatus(conta)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border py-2">
                        <div>
                          <span className="text-muted-foreground">Vencimento</span>
                          <p className="font-medium text-foreground">
                            {conta.vencimento ? new Date(conta.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor total</span>
                          <p className="font-medium text-foreground">
                            {fmt(conta.valor_total ?? conta.valor)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pago</span>
                          <p className="font-medium text-green-600">
                            {fmt(conta.valor_pago)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saldo</span>
                          <p className="font-medium text-orange-600">
                            {fmt(getSaldoConta(conta))}
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
          title={editing ? 'Editar Conta' : 'Nova Conta a Pagar'} size="lg">
          <ContaForm initialData={editing} onSubmit={handleSave} onCancel={() => { setIsFormOpen(false); setEditing(null); }} />
        </Modal>
      )}

      {/* Modal Pagamento */}
      {pagando && (
        <PagamentoModal isOpen={!!pagando} onClose={() => setPagando(null)}
          conta={pagando} onPagamentoRegistrado={handlePagamento} />
      )}

      {/* Modal Reagendar */}
      {reagendando && (
        <ReagendarModal isOpen={!!reagendando} onClose={() => setReagendando(null)}
          conta={reagendando} onReagendado={handleReagendar} />
      )}

      {/* Confirm Cancelar */}
      {cancelando && (
        <ConfirmModal isOpen={!!cancelando} onClose={() => setCancelando(null)}
          onConfirm={handleCancelar}
          title="Cancelar Conta"
          message={`Confirmar cancelamento da conta "${cancelando?.descricao}"? Esta ação não exclui os pagamentos já registrados.`} />
      )}

      {/* Modal Previsão RH */}
      {isPrevisaoRhOpen && (
        <PrevisaoRhModal isOpen={isPrevisaoRhOpen} onClose={() => setIsPrevisaoRhOpen(false)} onConfirmado={loadData} />
      )}
    </div>
  );
}
