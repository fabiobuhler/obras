import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Clock, HardHat, Users, Wrench, CalendarClock, DollarSign, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import DataTable from '@/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { supabase } from '@/services/supabase';
import { apontamentosObraService } from '@/services/apontamentosObraService';

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

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

const tipoLabel = (tipo) => {
  const labels = {
    mao_obra: 'Mão de obra',
    equipamento: 'Equipamento',
  };

  return labels[tipo] || tipo || '-';
};

const tipoHoraLabel = (tipo) => {
  const labels = {
    normal: 'Normal',
    extra_50: 'Extra 50%',
    extra_100: 'Extra 100%',
    noturna: 'Noturna',
    sabado: 'Sábado',
    domingo: 'Domingo',
    feriado: 'Feriado',
  };

  return labels[tipo] || tipo || '-';
};

const multiplicadorPorTipoHora = {
  normal: 1,
  extra_50: 1.5,
  extra_100: 2,
  noturna: 1.2,
  sabado: 1.5,
  domingo: 2,
  feriado: 2,
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

export default function ApontamentosPorObra() {
  const { hasPermission } = useAuth();
  const [obras, setObras] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);

  const [obraSelecionadaId, setObraSelecionadaId] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  const [apontamentos, setApontamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAux, setLoadingAux] = useState(true);
  const [tableError, setTableError] = useState(false);

  const [periodoDashboard, setPeriodoDashboard] = useState('mes_atual');
  const [pStart, setPStart] = useState(() => getPeriodoRange('mes_atual').start);
  const [pEnd, setPEnd] = useState(() => getPeriodoRange('mes_atual').end);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form States
  const [formTipo, setFormTipo] = useState('mao_obra');
  const [formFuncionarioId, setFormFuncionarioId] = useState('');
  const [formEquipamentoId, setFormEquipamentoId] = useState('');
  const [formData, setFormData] = useState(() => formatDateLocal(new Date()));
  const [formQuantidadeHoras, setFormQuantidadeHoras] = useState(0);
  const [formTipoHora, setFormTipoHora] = useState('normal');
  const [formMultiplicador, setFormMultiplicador] = useState(1);
  const [formValorUnitario, setFormValorUnitario] = useState(0);
  const [formDescricao, setFormDescricao] = useState('');
  const [formObservacao, setFormObservacao] = useState('');

  const loadAuxData = async () => {
    try {
      setLoadingAux(true);
      // Load Obras
      const { data: dataObras, error: errorObras } = await supabase
        .from('obras')
        .select('id, objeto')
        .order('objeto', { ascending: true });
      if (errorObras) throw errorObras;
      setObras(dataObras || []);

      // Load Funcionarios
      const queryFunc = supabase
        .from('funcionarios')
        .select(`
          *,
          pessoas:pessoa_id (
            id,
            nome,
            cpf
          )
        `)
        .order('created_at', { ascending: false });

      const { data: dataFunc, error: errorFunc } = await queryFunc;
      if (errorFunc) throw errorFunc;
      setFuncionarios(dataFunc || []);

      // Load Equipamentos
      const { data: dataEquip, error: errorEquip } = await supabase
        .from('equipamentos')
        .select('*');
      if (errorEquip) throw errorEquip;
      setEquipamentos(dataEquip || []);

    } catch (err) {
      console.error('ERRO AO CARREGAR DADOS AUXILIARES:', err);
      toast.error('Erro ao carregar dados auxiliares do formulário.');
    } finally {
      setLoadingAux(false);
    }
  };

  const loadApontamentos = async () => {
    if (!obraSelecionadaId) {
      setApontamentos([]);
      return;
    }

    try {
      setLoading(true);
      setTableError(false);

      const data = await apontamentosObraService.getAll({
        obraId: obraSelecionadaId,
        tipo: tipoFiltro || undefined,
        dataInicio: pStart || undefined,
        dataFim: pEnd || undefined,
      });

      setApontamentos(data || []);
    } catch (error) {
      console.error('ERRO AO CARREGAR APONTAMENTOS:', error);
      // Check if it's a table not found error (PG code 42P01)
      if (error.code === '42P01') {
        setTableError(true);
      } else {
        toast.error('Erro ao carregar apontamentos da obra.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadApontamentos();
  }, [obraSelecionadaId, tipoFiltro, pStart, pEnd]);

  const handlePeriodoChange = (tipo) => {
    setPeriodoDashboard(tipo);

    if (tipo === 'personalizado') {
      return;
    }

    const range = getPeriodoRange(tipo);
    setPStart(range.start);
    setPEnd(range.end);
  };

  const sugerirValorHoraFuncionario = (funcionario) => {
    if (!funcionario) return 0;
    if (funcionario.valor_hora) {
      return Number(funcionario.valor_hora || 0);
    }
    if (funcionario.salario) {
      return Number((Number(funcionario.salario || 0) / 220).toFixed(2));
    }
    return 0;
  };

  const sugerirValorHoraEquipamento = (equipamento) => {
    if (!equipamento) return 0;
    return Number(
      equipamento.valor_hora ||
      equipamento.custo_hora ||
      equipamento.custo_operacional_hora ||
      equipamento.valor_unitario ||
      0
    );
  };

  const getFuncionarioLabel = (funcionario) => {
    return funcionario?.pessoas?.nome || funcionario?.nome || `Funcionário ${funcionario?.id}`;
  };

  const getEquipamentoLabel = (equipamento) => {
    return (
      equipamento?.nome ||
      equipamento?.descricao ||
      equipamento?.patrimonio ||
      equipamento?.tag ||
      equipamento?.placa ||
      `Equipamento ${equipamento?.id}`
    );
  };

  // Form Suggestions Handlers
  const handleFuncionarioChange = (id) => {
    setFormFuncionarioId(id);
    const func = funcionarios.find(f => f.id === id);
    if (func) {
      const valor = sugerirValorHoraFuncionario(func);
      setFormValorUnitario(valor);
    }
  };

  const handleEquipamentoChange = (id) => {
    setFormEquipamentoId(id);
    const equip = equipamentos.find(e => e.id === id);
    if (equip) {
      const valor = sugerirValorHoraEquipamento(equip);
      setFormValorUnitario(valor);
    }
  };

  const handleTipoHoraChange = (th) => {
    setFormTipoHora(th);
    setFormMultiplicador(multiplicadorPorTipoHora[th] || 1);
  };

  // Calculate live total cost
  const formCustoTotal = useMemo(() => {
    const total = Number(formQuantidadeHoras || 0) * Number(formValorUnitario || 0) * Number(formMultiplicador || 1);
    return Number(total.toFixed(2));
  }, [formQuantidadeHoras, formValorUnitario, formMultiplicador]);

  // Open Modal logic
  const handleOpenNew = () => {
    if (!obraSelecionadaId) {
      toast.warning('Selecione uma obra antes de criar um apontamento.');
      return;
    }
    setEditingItem(null);
    setFormTipo('mao_obra');
    setFormFuncionarioId('');
    setFormEquipamentoId('');
    setFormData(formatDateLocal(new Date()));
    setFormQuantidadeHoras(0);
    setFormTipoHora('normal');
    setFormMultiplicador(1);
    setFormValorUnitario(0);
    setFormDescricao('');
    setFormObservacao('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTipo(item.tipo);
    setFormFuncionarioId(item.funcionario_id || '');
    setFormEquipamentoId(item.equipamento_id || '');
    setFormData(item.data);
    setFormQuantidadeHoras(item.quantidade_horas);
    setFormTipoHora(item.tipo_hora || 'normal');
    setFormMultiplicador(item.multiplicador);
    setFormValorUnitario(item.valor_unitario);
    setFormDescricao(item.descricao || '');
    setFormObservacao(item.observacao || '');
    setModalOpen(true);
  };

  // Save submit
  const handleSave = async (e) => {
    e.preventDefault();

    if (!obraSelecionadaId) {
      toast.error('Erro: nenhuma obra selecionada.');
      return;
    }

    if (!formData) {
      toast.error('Informe a data do apontamento.');
      return;
    }

    if (Number(formQuantidadeHoras || 0) <= 0) {
      toast.error('A quantidade de horas deve ser maior que 0.');
      return;
    }

    if (formTipo === 'mao_obra' && !formFuncionarioId) {
      toast.error('Selecione o funcionário.');
      return;
    }

    if (formTipo === 'equipamento' && !formEquipamentoId) {
      toast.error('Selecione o equipamento.');
      return;
    }

    const payload = {
      obra_id: obraSelecionadaId,
      tipo: formTipo,
      funcionario_id: formTipo === 'mao_obra' ? formFuncionarioId : null,
      equipamento_id: formTipo === 'equipamento' ? formEquipamentoId : null,
      data: formData,
      quantidade_horas: Number(formQuantidadeHoras || 0),
      tipo_hora: formTipo === 'mao_obra' ? formTipoHora : null,
      multiplicador: formTipo === 'mao_obra' ? Number(formMultiplicador || 1) : 1,
      valor_unitario: Number(formValorUnitario || 0),
      descricao: formDescricao || null,
      observacao: formObservacao || null,
    };

    try {
      if (editingItem) {
        await apontamentosObraService.update(editingItem.id, payload);
        toast.success('Apontamento atualizado com sucesso.');
      } else {
        await apontamentosObraService.create(payload);
        toast.success('Apontamento registrado com sucesso.');
      }
      setModalOpen(false);
      loadApontamentos();
    } catch (err) {
      console.error('ERRO AO SALVAR APONTAMENTO:', err);
      toast.error('Erro ao salvar apontamento.');
    }
  };

  // Delete handler
  const handleDelete = async (item) => {
    const confirmar = window.confirm('Deseja realmente excluir este apontamento?');
    if (!confirmar) return;

    try {
      await apontamentosObraService.remove(item.id);
      toast.success('Apontamento excluído com sucesso.');
      loadApontamentos();
    } catch (err) {
      console.error('ERRO AO EXCLUIR APONTAMENTO:', err);
      toast.error('Erro ao excluir apontamento.');
    }
  };

  // Compute stats card
  const resumo = useMemo(() => {
    return apontamentos.reduce(
      (acc, item) => {
        const custo = Number(item.custo_total || 0);
        const horas = Number(item.quantidade_horas || 0);

        acc.custoTotal += custo;
        acc.quantidade += 1;

        if (item.tipo === 'mao_obra') {
          acc.custoMaoObra += custo;
          acc.horasMaoObra += horas;
        }

        if (item.tipo === 'equipamento') {
          acc.custoEquipamentos += custo;
          acc.horasEquipamentos += horas;
        }

        return acc;
      },
      {
        custoTotal: 0,
        custoMaoObra: 0,
        custoEquipamentos: 0,
        horasMaoObra: 0,
        horasEquipamentos: 0,
        quantidade: 0,
      }
    );
  }, [apontamentos]);

  // columns definition
  const columns = [
    {
      header: 'Data',
      accessor: 'data',
      render: (row) => formatDateBR(row.data),
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
          row.tipo === 'mao_obra' 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
            : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
        }`}>
          {tipoLabel(row.tipo)}
        </span>
      ),
    },
    {
      header: 'Recurso',
      accessor: 'recurso',
      render: (row) => {
        if (row.tipo === 'mao_obra') {
          return getFuncionarioLabel(row.funcionarios);
        }
        if (row.tipo === 'equipamento') {
          return getEquipamentoLabel(row.equipamentos);
        }
        return '-';
      },
    },
    {
      header: 'Tipo de hora',
      accessor: 'tipo_hora',
      render: (row) => row.tipo === 'mao_obra' ? tipoHoraLabel(row.tipo_hora) : '-',
    },
    {
      header: 'Horas',
      accessor: 'quantidade_horas',
      render: (row) => `${formatNumber(row.quantidade_horas)} h`,
    },
    {
      header: 'Valor unit.',
      accessor: 'valor_unitario',
      render: (row) => formatCurrency(row.valor_unitario),
    },
    {
      header: 'Mult.',
      accessor: 'multiplicador',
      render: (row) => row.tipo === 'mao_obra' ? formatNumber(row.multiplicador) : '1,00',
    },
    {
      header: 'Custo total',
      accessor: 'custo_total',
      render: (row) => formatCurrency(row.custo_total),
    },
    {
      header: 'Ações',
      accessor: 'acoes',
      render: (row) => (
        <div className="flex gap-2">
          {hasPermission('apontamentos_obra', 'editar') && (
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1 text-xs rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
          )}
          {hasPermission('apontamentos_obra', 'excluir') && (
            <button
              onClick={() => handleDelete(row)}
              className="p-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Apontamentos por Obra</h1>
          <p className="text-sm text-muted-foreground">
            Gestão operacional de horas trabalhadas e utilização de equipamentos vinculados à obra.
          </p>
        </div>
        {hasPermission('apontamentos_obra', 'criar') && (
          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus size={16} /> Novo Apontamento
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full items-end">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground">Selecione a Obra *</label>
            <select
              value={obraSelecionadaId}
              onChange={(e) => setObraSelecionadaId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
              disabled={loadingAux}
            >
              <option value="">{loadingAux ? 'Carregando obras...' : 'Selecione uma obra'}</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.objeto || `Obra ${obra.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground">Período</label>
            <select
              value={periodoDashboard}
              onChange={(e) => handlePeriodoChange(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
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
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                />
              </div>
              <span className="text-xs text-muted-foreground font-semibold self-end pb-2 hidden sm:inline">até</span>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold text-muted-foreground">Até</label>
                <input
                  type="date"
                  value={pEnd}
                  onChange={(e) => setPEnd(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground">Tipo de Apontamento</label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
            >
              <option value="">Todos</option>
              <option value="mao_obra">Mão de obra</option>
              <option value="equipamento">Equipamento</option>
            </select>
          </div>
        </div>

        {obraSelecionadaId && pStart && pEnd && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-lg flex items-center gap-2 w-full max-w-md">
            <CalendarClock size={16} className="text-blue-600 shrink-0" />
            <span>Filtro ativo: <strong>{formatDateBR(pStart)}</strong> até <strong>{formatDateBR(pEnd)}</strong></span>
          </div>
        )}
      </div>

      {tableError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 p-6 rounded-xl flex flex-col gap-2 items-center text-center">
          <AlertTriangle size={36} className="text-red-500" />
          <h3 className="font-semibold text-base">Tabela não encontrada</h3>
          <p className="text-sm max-w-md">
            Não foi possível carregar os apontamentos. Verifique se a tabela <strong>apontamentos_obra</strong> foi criada no Supabase através do editor SQL.
          </p>
        </div>
      )}

      {!tableError && !obraSelecionadaId ? (
        <div className="bg-muted/30 border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Users size={40} className="text-muted-foreground animate-pulse" />
          <h3 className="font-semibold text-lg text-foreground">Operação Operacional de Obras</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Selecione uma obra no menu superior para carregar os cartões de resumo, custos logados e histórico operacional detalhado.
          </p>
        </div>
      ) : (
        !tableError && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <DashCard label="Custo Total" value={formatCurrency(resumo.custoTotal)} icon={DollarSign} colorClass="bg-card text-card-foreground border-border" />
              <DashCard label="Mão de Obra" value={formatCurrency(resumo.custoMaoObra)} icon={HardHat} colorClass="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50" />
              <DashCard label="Equipamentos" value={formatCurrency(resumo.custoEquipamentos)} icon={Wrench} colorClass="bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:border-cyan-900/50" />
              <DashCard label="Horas M.O." value={`${formatNumber(resumo.horasMaoObra)} h`} icon={Clock} colorClass="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50" />
              <DashCard label="Horas Equip." value={`${formatNumber(resumo.horasEquipamentos)} h`} icon={Clock} colorClass="bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:border-cyan-900/50" />
              <DashCard label="Apontamentos" value={resumo.quantidade} icon={FileSpreadsheet} colorClass="bg-card text-card-foreground border-border" />
            </div>

            {/* Listagem */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileSpreadsheet size={16} className="text-primary" /> Histórico de Apontamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-0 sm:px-6">
                <div className="w-full overflow-x-auto">
                  <DataTable
                    columns={columns}
                    data={apontamentos}
                    isLoading={loading}
                    searchable={true}
                    searchFields={['descricao', 'observacao']}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* FORM / MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editingItem ? 'Editar Apontamento' : 'Novo Apontamento'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer bg-background text-foreground hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="tipo"
                    value="mao_obra"
                    checked={formTipo === 'mao_obra'}
                    onChange={() => {
                      setFormTipo('mao_obra');
                      setFormEquipamentoId('');
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Mão de Obra</span>
                    <span className="text-[10px] text-muted-foreground">Trabalho de colaboradores</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer bg-background text-foreground hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="tipo"
                    value="equipamento"
                    checked={formTipo === 'equipamento'}
                    onChange={() => {
                      setFormTipo('equipamento');
                      setFormFuncionarioId('');
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Equipamento</span>
                    <span className="text-[10px] text-muted-foreground">Uso de maquinários</span>
                  </div>
                </label>
              </div>

              {/* Data & Obra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Data *</label>
                  <input
                    type="date"
                    required
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tipo de Hora</label>
                  <select
                    disabled={formTipo !== 'mao_obra'}
                    value={formTipo === 'mao_obra' ? formTipoHora : 'normal'}
                    onChange={(e) => handleTipoHoraChange(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full disabled:opacity-50"
                  >
                    <option value="normal">Normal</option>
                    <option value="extra_50">Extra 50%</option>
                    <option value="extra_100">Extra 100%</option>
                    <option value="noturna">Noturna</option>
                    <option value="sabado">Sábado</option>
                    <option value="domingo">Domingo</option>
                    <option value="feriado">Feriado</option>
                  </select>
                </div>
              </div>

              {/* Recurso (Funcionario ou Equipamento) */}
              {formTipo === 'mao_obra' ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Selecione o Funcionário *</label>
                  <select
                    required
                    value={formFuncionarioId}
                    onChange={(e) => handleFuncionarioChange(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                  >
                    <option value="">Selecione um funcionário</option>
                    {funcionarios.map(func => (
                      <option key={func.id} value={func.id}>
                        {getFuncionarioLabel(func)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Selecione o Equipamento *</label>
                  <select
                    required
                    value={formEquipamentoId}
                    onChange={(e) => handleEquipamentoChange(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                  >
                    <option value="">Selecione um equipamento</option>
                    {equipamentos.map(equip => (
                      <option key={equip.id} value={equip.id}>
                        {getEquipamentoLabel(equip)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantidade Horas, Valor Unitario, Multiplicador, Custo Total */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Horas *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formQuantidadeHoras || ''}
                    onChange={(e) => setFormQuantidadeHoras(parseFloat(e.target.value) || 0)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Valor Hora (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValorUnitario || ''}
                    onChange={(e) => setFormValorUnitario(parseFloat(e.target.value) || 0)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Multiplicador</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={formTipo !== 'mao_obra'}
                    value={formMultiplicador}
                    onChange={(e) => setFormMultiplicador(parseFloat(e.target.value) || 1)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Custo Total (R$)</label>
                  <input
                    type="text"
                    readOnly
                    value={formatCurrency(formCustoTotal)}
                    className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full font-bold"
                  />
                </div>
              </div>

              {/* Descricao & Observacao */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Escavação da vala principal ou Operação do compactador"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">Observações</label>
                <textarea
                  placeholder="Observações operacionais..."
                  rows="2"
                  value={formObservacao}
                  onChange={(e) => setFormObservacao(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-input rounded-md text-sm hover:bg-muted text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-md text-sm transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
