import { useState, useEffect } from 'react';
import { Activity, Users, Building2, Wallet, AlertTriangle, FileText, X } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatCurrencyCompact = (value) => {
  const numero = Number(value || 0);

  if (Math.abs(numero) >= 1000000) {
    return `R$ ${(numero / 1000000).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} mi`;
  }

  if (Math.abs(numero) >= 100000) {
    return `R$ ${(numero / 1000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mil`;
  }

  return formatCurrency(numero);
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('pt-BR');
};

const getValorTotalConta = (conta) => Number(conta.valor_total ?? conta.valor ?? 0);
const getValorPagoConta = (conta) => Number(conta.valor_pago || 0);
const getSaldoConta = (conta) => Math.max(0, getValorTotalConta(conta) - getValorPagoConta(conta));

const getCredorNome = (conta) => {
  return (
    conta.pessoas?.nome ||
    conta.pessoa?.nome ||
    conta.credor_pessoa?.nome ||
    conta.empresas?.nome_fantasia ||
    conta.empresa?.nome_fantasia ||
    conta.credor_empresa?.nome_fantasia ||
    conta.empresas?.razao_social ||
    conta.empresa?.razao_social ||
    conta.credor_empresa?.razao_social ||
    conta.credor_avulso ||
    conta.credor_nome ||
    conta.fornecedor ||
    '-'
  );
};

const getObraNome = (conta) => {
  return (
    conta.obras?.objeto ||
    conta.obra?.objeto ||
    conta.obra_nome ||
    '-'
  );
};

const formatDateBR = (dateStr) => {
  if (!dateStr) return '-';
  const value = String(dateStr).slice(0, 10);
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const [ano, mes, dia] = parts;
  return `${dia}/${mes}/${ano}`;
};

const getFuncionarioNome = (funcionario) => {
  return (
    funcionario.nome_exibicao ||
    funcionario.nome ||
    funcionario.pessoa?.nome ||
    funcionario.nome_completo ||
    funcionario.apelido ||
    funcionario.email ||
    '-'
  );
};

const getFuncionarioCargo = (funcionario) => {
  return (
    funcionario.funcao ||
    funcionario.cargo ||
    funcionario.tipo ||
    funcionario.categoria ||
    '-'
  );
};

const getFuncionarioStatus = (funcionario) => {
  return (
    funcionario.status ||
    funcionario.situacao ||
    funcionario.situacao_acesso ||
    'Ativo'
  );
};

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'text-blue-500',
  nowrapValue = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted ${color}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p className={`mt-1 text-xl font-bold leading-tight tracking-tight text-foreground lg:text-2xl ${nowrapValue ? 'whitespace-nowrap' : 'break-words'}`}>
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}

          <p className="mt-2 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
            Clique para detalhar
          </p>
        </div>
      </div>
    </button>
  );
};

const TabelaDetalheContas = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro encontrado para este indicador.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Vencimento</th>
            <th className="px-4 py-2 font-medium">Descrição</th>
            <th className="px-4 py-2 font-medium">Credor</th>
            <th className="px-4 py-2 font-medium text-right">Valor</th>
            <th className="px-4 py-2 font-medium text-right">Pago</th>
            <th className="px-4 py-2 font-medium text-right">Saldo</th>
            <th className="px-4 py-2 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/50">
              <td className="px-4 py-2 whitespace-nowrap">{formatDateBR(row.vencimento)}</td>
              <td className="px-4 py-2 max-w-[200px] truncate" title={row.descricao || '-'}>{row.descricao || '-'}</td>
              <td className="px-4 py-2 max-w-[200px] truncate" title={getCredorNome(row)}>{getCredorNome(row)}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap">{formatCurrency(getValorTotalConta(row))}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap text-green-600 dark:text-green-400">{formatCurrency(getValorPagoConta(row))}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap font-medium text-red-600 dark:text-red-400">{formatCurrency(getSaldoConta(row))}</td>
              <td className="px-4 py-2 text-center whitespace-nowrap capitalize">{row.status || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabelaDetalheObras = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro encontrado para este indicador.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Objeto</th>
            <th className="px-4 py-2 font-medium">Situação/Status</th>
            <th className="px-4 py-2 font-medium">Criado em</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/50">
              <td className="px-4 py-2">{row.objeto || '-'}</td>
              <td className="px-4 py-2 capitalize">{row.situacao || row.status || '-'}</td>
              <td className="px-4 py-2 whitespace-nowrap">{formatDateBR(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TabelaDetalheFuncionarios = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro encontrado para este indicador.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Função/Cargo</th>
            <th className="px-4 py-2 font-medium">Situação/Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/50">
              <td className="px-4 py-2">{getFuncionarioNome(row)}</td>
              <td className="px-4 py-2">{getFuncionarioCargo(row)}</td>
              <td className="px-4 py-2 capitalize">{getFuncionarioStatus(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DashboardDetailModal = ({ tipo, resumo, onClose }) => {
  if (!tipo) return null;

  const detalhes = resumo.detalhes || {};

  const config = {
    obras: {
      title: 'Obras Ativas',
      description: 'Obras consideradas ativas no cadastro.',
      rows: detalhes.obrasAtivasLista || [],
      columns: ['Objeto', 'Status'],
    },
    funcionarios: {
      title: 'Funcionários Ativos',
      description: 'Funcionários considerados ativos no cadastro.',
      rows: detalhes.funcionariosAtivosLista || [],
    },
    custo_mes: {
      title: 'Custo do Mês',
      description: 'Contas com vencimento dentro do mês atual.',
      rows: detalhes.contasMesLista || [],
      type: 'contas',
    },
    em_aberto: {
      title: 'Contas em Aberto',
      description: 'Contas com saldo em aberto, excluindo pagas, canceladas e FAT.',
      rows: detalhes.contasEmAbertoLista || [],
      type: 'contas',
    },
    vencidas: {
      title: 'Contas Vencidas',
      description: 'Contas vencidas em aberto, prioridade de pagamento.',
      rows: detalhes.contasVencidasLista || [],
      type: 'contas',
    },
  };

  const current = config[tipo];

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {current.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {current.type === 'contas' ? (
            <TabelaDetalheContas rows={current.rows} />
          ) : tipo === 'obras' ? (
            <TabelaDetalheObras rows={current.rows} />
          ) : (
            <TabelaDetalheFuncionarios rows={current.rows} />
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [resumo, setResumo] = useState({
    obrasAtivas: 0,
    funcionariosAtivos: 0,
    saldoEmAberto: 0,
    qtdContasEmAberto: 0,
    saldoVencido: 0,
    qtdVencidas: 0,
    custoMes: 0,
    pagosMes: 0,
    custosMensais: [],
    evolucaoFisicoFinanceira: [],
    detalhes: {},
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detalheAberto, setDetalheAberto] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadResumo = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await dashboardService.getResumo();

        if (mounted) {
          setResumo(data);
        }
      } catch (err) {
        console.error('ERRO AO CARREGAR DASHBOARD:', err);
        if (mounted) {
          setError(err.message || 'Erro ao carregar dados do Dashboard.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResumo();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          Não foi possível carregar os indicadores do Dashboard.
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <DashboardCard
          title="Obras Ativas"
          value={loading ? "..." : formatNumber(resumo.obrasAtivas)}
          subtitle="Clique para ver obras ativas"
          icon={Building2}
          color="text-blue-500"
          onClick={() => setDetalheAberto('obras')}
        />

        <DashboardCard
          title="Funcionários Ativos"
          value={loading ? "..." : formatNumber(resumo.funcionariosAtivos)}
          subtitle="Clique para ver funcionários ativos"
          icon={Users}
          color="text-green-500"
          onClick={() => setDetalheAberto('funcionarios')}
        />

        <DashboardCard
          title="Custo do Mês"
          value={loading ? "..." : formatCurrencyCompact(resumo.custoMes)}
          subtitle={loading ? '' : `${formatCurrency(resumo.custoMes)} • Contas do mês`}
          icon={Wallet}
          color="text-indigo-500"
          nowrapValue
          onClick={() => setDetalheAberto('custo_mes')}
        />

        <DashboardCard
          title="Em Aberto"
          value={loading ? "..." : formatCurrencyCompact(resumo.saldoEmAberto)}
          subtitle={loading ? '' : `${formatCurrency(resumo.saldoEmAberto)} • ${resumo.qtdContasEmAberto} conta(s)`}
          icon={FileText}
          color="text-orange-500"
          nowrapValue
          onClick={() => setDetalheAberto('em_aberto')}
        />

        <DashboardCard
          title="Vencidas"
          value={loading ? "..." : formatCurrencyCompact(resumo.saldoVencido)}
          subtitle={loading ? '' : `${formatCurrency(resumo.saldoVencido)} • ${resumo.qtdVencidas} conta(s)`}
          icon={AlertTriangle}
          color="text-red-500"
          nowrapValue
          onClick={() => setDetalheAberto('vencidas')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[300px] flex flex-col justify-center">
          {loading ? (
             <p className="text-muted-foreground text-sm text-center">Carregando...</p>
          ) : resumo.custosMensais.length > 0 ? (
             <div className="w-full h-full flex flex-col justify-end gap-2">
                <h4 className="text-sm font-medium mb-auto text-foreground">Custos Mensais (Últimos 6 meses)</h4>
                <div className="space-y-4 mt-4">
                  {resumo.custosMensais.map((item) => {
                    const max = Math.max(...resumo.custosMensais.map((i) => Number(i.valor || 0)), 1);
                    const percent = Math.max(4, (Number(item.valor || 0) / max) * 100);

                    return (
                      <div key={item.mes} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-muted-foreground">
                            {item.mes}
                          </span>
                          <span className="whitespace-nowrap font-semibold text-foreground">
                            {formatCurrency(item.valor)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          ) : (
             <p className="text-muted-foreground text-sm text-center px-4">
               Sem dados suficientes para montar o gráfico de custos mensais.
             </p>
          )}
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center">
          {loading ? (
             <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
             <p className="text-muted-foreground text-sm text-center px-4">Indicador ainda não configurado com dados reais.</p>
          )}
        </div>
      </div>

      {detalheAberto && (
        <DashboardDetailModal 
          tipo={detalheAberto} 
          resumo={resumo} 
          onClose={() => setDetalheAberto(null)} 
        />
      )}
    </div>
  );
}
