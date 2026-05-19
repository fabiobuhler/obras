import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import DataTable from '@/shared/DataTable';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle,
  Building2, CalendarClock, Filter, DollarSign, PieChart, Info, HardHat
} from 'lucide-react';
import { contasPagarService } from '@/services/contasPagarService';
import { obrasService } from '@/services/obrasService';
import { apontamentosObraService } from '@/services/apontamentosObraService';

const STATUS_CONFIG = {
  a_vencer:  { label: 'A Vencer',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  vencida:   { label: 'Vencida',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  paga:      { label: 'Paga',      color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  parcial:   { label: 'Parcial',   color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

const ORIGEM_COLORS = {
  material: 'bg-indigo-600',
  servico: 'bg-amber-500',
  funcionario: 'bg-emerald-600',
  equipamento: 'bg-cyan-500',
  outros: 'bg-rose-500',
};

const formatDateLocal = (date) => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const formatDateBR = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
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

const origemLabel = (origem) => {
  const labels = {
    material: 'Material',
    servico: 'Serviço',
    funcionario: 'Funcionário / RH',
    equipamento: 'Equipamento',
    outros: 'Outros',
  };

  return labels[origem] || origem || 'Outros';
};

const getStatusFinanceiro = (conta) => {
  const hojeStr = formatDateLocal(new Date());
  const total = Number(conta.valor_total ?? conta.valor ?? 0);
  const pago = Number(conta.valor_pago || 0);
  const saldo = Math.max(0, total - pago);

  if (conta.status === 'cancelada') return 'cancelada';
  if (saldo <= 0 || conta.status === 'paga') return 'paga';
  if (conta.status === 'parcial' || pago > 0) return 'parcial';
  if (conta.vencimento && conta.vencimento < hojeStr) return 'vencida';

  return 'a_vencer';
};

const statusLabel = (status) => {
  const labels = {
    a_vencer: 'A vencer',
    vencida: 'Vencida',
    paga: 'Paga',
    parcial: 'Parcial',
    cancelada: 'Cancelada',
  };

  return labels[status] || status || '-';
};

function DashCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className={`p-4 rounded-xl border ${colorClass} flex items-center justify-between shadow-sm hover:shadow transition-all duration-200`}>
      <div>
        <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold mt-1">{value}</p>
      </div>
      <div className="p-2 bg-white/20 rounded-lg">
        <Icon size={22} className="opacity-90" />
      </div>
    </div>
  );
}

export default function CustosPorObra() {
  const [obras, setObras] = useState([]);
  const [obraSelecionadaId, setObraSelecionadaId] = useState('');
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingObras, setLoadingObras] = useState(true);

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

  useEffect(() => {
    const loadObras = async () => {
      try {
        setLoadingObras(true);
        const data = await obrasService.getAll();
        setObras(data || []);
      } catch (error) {
        console.error('ERRO AO CARREGAR OBRAS:', error);
        toast.error('Erro ao carregar lista de obras.');
      } finally {
        setLoadingObras(false);
      }
    };
    loadObras();
  }, []);

  useEffect(() => {
    const loadContasObra = async () => {
      if (!obraSelecionadaId) {
        setContas([]);
        return;
      }

      try {
        setLoading(true);
        const data = await contasPagarService.getByObra(obraSelecionadaId);
        setContas(data || []);
      } catch (error) {
        console.error('ERRO AO CARREGAR CONTAS DA OBRA:', error);
        toast.error('Erro ao carregar custos da obra.');
      } finally {
        setLoading(false);
      }
    };

    loadContasObra();
  }, [obraSelecionadaId]);

  const [resumoApontamentos, setResumoApontamentos] = useState(null);

  useEffect(() => {
    const loadApontamentosResumo = async () => {
      if (!obraSelecionadaId) {
        setResumoApontamentos(null);
        return;
      }
      try {
        const resumo = await apontamentosObraService.getResumoPorObra(obraSelecionadaId, {
          dataInicio: pStart || undefined,
          dataFim: pEnd || undefined,
        });
        setResumoApontamentos(resumo);
      } catch (err) {
        console.error('ERRO AO CARREGAR RESUMO DE APONTAMENTOS:', err);
      }
    };
    loadApontamentosResumo();
  }, [obraSelecionadaId, pStart, pEnd]);

  const contaDentroDoPeriodo = (conta) => {
    if (!pStart || !pEnd) return true;
    const dataReferencia = conta.vencimento;
    if (!dataReferencia) return false;
    return dataReferencia >= pStart && dataReferencia <= pEnd;
  };

  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => contaDentroDoPeriodo(conta));
  }, [contas, pStart, pEnd]);

  const totais = useMemo(() => {
    const hojeStr = formatDateLocal(new Date());

    let totalPrevisto = 0;
    let totalPago = 0;
    let saldoPendente = 0;
    let totalVencido = 0;
    let totalAVencer = 0;
    let totalParcial = 0;

    contasFiltradas.forEach((conta) => {
      if (conta.status === 'cancelada') return;

      const total = Number(conta.valor_total ?? conta.valor ?? 0);
      const pago = Number(conta.valor_pago || 0);
      const saldo = Math.max(0, total - pago);

      totalPrevisto += total;
      totalPago += pago;
      saldoPendente += saldo;

      if (saldo <= 0 || conta.status === 'paga') return;

      if (conta.status === 'parcial' || pago > 0) {
        totalParcial += saldo;
      }

      if (conta.vencimento && conta.vencimento < hojeStr) {
        totalVencido += saldo;
      } else {
        totalAVencer += saldo;
      }
    });

    return {
      totalPrevisto,
      totalPago,
      saldoPendente,
      totalVencido,
      totalAVencer,
      totalParcial,
    };
  }, [contasFiltradas]);

  const custosPorOrigem = useMemo(() => {
    const grupos = {};

    contasFiltradas.forEach((conta) => {
      if (conta.status === 'cancelada') return;

      const origem = conta.origem || 'outros';
      const total = Number(conta.valor_total ?? conta.valor ?? 0);
      const pago = Number(conta.valor_pago || 0);
      const saldo = Math.max(0, total - pago);

      if (!grupos[origem]) {
        grupos[origem] = {
          origem,
          label: origemLabel(origem),
          totalPrevisto: 0,
          totalPago: 0,
          saldo: 0,
          quantidade: 0,
        };
      }

      grupos[origem].totalPrevisto += total;
      grupos[origem].totalPago += pago;
      grupos[origem].saldo += saldo;
      grupos[origem].quantidade += 1;
    });

    return Object.values(grupos).sort((a, b) => b.totalPrevisto - a.totalPrevisto);
  }, [contasFiltradas]);

  const columns = [
    {
      header: 'Descrição',
      accessor: 'descricao',
      render: (row) => <span className="font-medium text-foreground">{row.descricao}</span>
    },
    {
      header: 'Origem',
      accessor: 'origem',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
          row.origem === 'material' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
          row.origem === 'servico' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
          row.origem === 'funcionario' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
          row.origem === 'equipamento' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400' :
          'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
        }`}>
          {origemLabel(row.origem)}
        </span>
      )
    },
    {
      header: 'Vencimento',
      accessor: 'vencimento',
      render: (row) => <span className="font-mono text-xs">{formatDateBR(row.vencimento)}</span>,
    },
    {
      header: 'Valor',
      accessor: 'valor_total',
      render: (row) => <span className="font-semibold">{formatCurrency(row.valor_total)}</span>,
    },
    {
      header: 'Pago',
      accessor: 'valor_pago',
      render: (row) => <span className="font-medium text-green-600">{formatCurrency(row.valor_pago)}</span>,
    },
    {
      header: 'Saldo',
      accessor: 'saldo',
      render: (row) => {
        const saldo = Math.max(0, row.valor_total - (row.valor_pago || 0));
        return <span className={`font-semibold ${saldo > 0 ? 'text-orange-600' : 'text-zinc-400'}`}>{formatCurrency(saldo)}</span>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const calculated = getStatusFinanceiro(row);
        const cfg = STATUS_CONFIG[calculated] || STATUS_CONFIG.a_vencer;
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block text-center min-w-[90px] ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 min-w-0">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="text-primary" /> Custos por Obra
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhamento dos custos previstos, pagos e pendentes vinculados às contas a pagar da obra selecionada.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full items-end">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground">Selecione a Obra *</label>
            <select
              value={obraSelecionadaId}
              onChange={(e) => setObraSelecionadaId(e.target.value)}
              className="text-sm border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
              disabled={loadingObras}
            >
              <option value="">{loadingObras ? 'Carregando obras...' : 'Selecione uma obra'}</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.objeto || obra.nome || obra.titulo || obra.descricao || `Obra ${obra.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground">Período</label>
            <select
              value={periodoDashboard}
              onChange={(e) => handlePeriodoChange(e.target.value)}
              className="text-sm border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
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
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold text-muted-foreground">De</label>
                <input
                  type="date"
                  value={pStart}
                  onChange={(e) => setPStart(e.target.value)}
                  className="text-sm border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
                />
              </div>
              <span className="text-xs text-muted-foreground font-semibold self-end pb-2 hidden sm:inline">até</span>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold text-muted-foreground">Até</label>
                <input
                  type="date"
                  value={pEnd}
                  onChange={(e) => setPEnd(e.target.value)}
                  className="text-sm border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
                />
              </div>
            </div>
          )}
        </div>

        {obraSelecionadaId && pStart && pEnd && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-lg flex items-center gap-2 w-full max-w-md">
            <CalendarClock size={16} className="text-blue-600 shrink-0" />
            <span>Filtro de período ativo: <strong>{formatDateBR(pStart)}</strong> até <strong>{formatDateBR(pEnd)}</strong></span>
          </div>
        )}
      </div>

      {!obraSelecionadaId ? (
        <div className="bg-muted/30 border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Building2 size={40} className="text-muted-foreground animate-pulse" />
          <h3 className="font-semibold text-lg">Acompanhamento Financeiro de Obras</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Selecione uma obra no menu superior para carregar o resumo financeiro, custos agrupados por origem e o histórico detalhado de contas.
          </p>
        </div>
      ) : (
        <div className="space-y-6 min-w-0">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <DashCard label="Previsto" value={formatCurrency(totais.totalPrevisto)} icon={CalendarClock} colorClass="bg-card text-card-foreground border-border" />
            <DashCard label="Pago" value={formatCurrency(totais.totalPago)} icon={CheckCircle} colorClass="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900/50" />
            <DashCard label="Pendente" value={formatCurrency(totais.saldoPendente)} icon={DollarSign} colorClass="bg-card text-card-foreground border-border" />
            <DashCard label="Vencido" value={formatCurrency(totais.totalVencido)} icon={AlertTriangle} colorClass="bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50" />
            <DashCard label="A Vencer" value={formatCurrency(totais.totalAVencer)} icon={Clock} colorClass="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50" />
            <DashCard label="Parcial" value={formatCurrency(totais.totalParcial)} icon={TrendingUp} colorClass="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-900/50" />
          </div>

          {/* Bloco separado de custos operacionais apontados */}
          {resumoApontamentos && (
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <HardHat size={16} className="text-primary" /> Custos Operacionais Apontados
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Os custos apontados são exibidos separadamente para evitar dupla contagem com contas a pagar e previsões de RH.
                </p>
              </CardHeader>
              <CardContent className="pt-2 px-4 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className="p-3 border border-border rounded-lg bg-background flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Apontado</span>
                    <span className="text-base font-bold text-foreground mt-1">{formatCurrency(resumoApontamentos.custoTotal)}</span>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-background flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mão de Obra</span>
                    <span className="text-base font-bold text-foreground mt-1">{formatCurrency(resumoApontamentos.custoMaoObra)}</span>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-background flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Equipamentos</span>
                    <span className="text-base font-bold text-foreground mt-1">{formatCurrency(resumoApontamentos.custoEquipamentos)}</span>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-background flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Horas Mão Obra</span>
                    <span className="text-base font-bold text-foreground mt-1">{formatNumber(resumoApontamentos.horasMaoObra)} h</span>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-background flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Horas Equip.</span>
                    <span className="text-base font-bold text-foreground mt-1">{formatNumber(resumoApontamentos.horasEquipamentos)} h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Custos por Origem */}
            <Card className="lg:col-span-1 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <PieChart size={16} className="text-primary" /> Custos por Origem
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {custosPorOrigem.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum custo lançado no período.</p>
                ) : (
                  <div className="space-y-4">
                    {custosPorOrigem.map((item) => {
                      const percent = totais.totalPrevisto > 0 ? (item.totalPrevisto / totais.totalPrevisto) * 100 : 0;
                      const color = ORIGEM_COLORS[item.origem] || ORIGEM_COLORS.outros;
                      return (
                        <div key={item.origem} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="text-foreground">{item.label}</span>
                            <span className="text-muted-foreground">{percent.toFixed(1)}% ({item.quantidade})</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Previsto: {formatCurrency(item.totalPrevisto)}</span>
                            <span>Pago: {formatCurrency(item.totalPago)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listagem detalhada */}
            <Card className="lg:col-span-2 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingDown size={16} className="text-primary" /> Lançamentos de Custos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-0 sm:px-6">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground border-b border-zinc-100 dark:border-zinc-800 pb-2 gap-1.5 px-4 sm:px-0">
                    {pStart && pEnd ? (
                      <p>
                        Exibindo contas com vencimento entre <strong className="text-foreground">{formatDateBR(pStart)}</strong> e <strong className="text-foreground">{formatDateBR(pEnd)}</strong>.
                      </p>
                    ) : (
                      <p>Exibindo todas as contas vinculadas à obra.</p>
                    )}
                    <p>
                      Total exibido: <strong className="text-foreground">{contasFiltradas.length}</strong> de <strong className="text-foreground">{contas.length}</strong>
                    </p>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <DataTable
                      columns={columns}
                      data={contasFiltradas}
                      isLoading={loading}
                      searchable={true}
                      searchFields={['descricao', 'origem']}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
