import { useState, useEffect } from 'react';
import { Activity, Users, Building2, Wallet, AlertTriangle, FileText } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('pt-BR');
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
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const stats = [
    { 
      title: 'Obras Ativas', 
      value: formatNumber(resumo.obrasAtivas), 
      icon: Building2, 
      color: 'text-blue-500', 
      sub: '' 
    },
    { 
      title: 'Funcionários Ativos', 
      value: formatNumber(resumo.funcionariosAtivos), 
      icon: Users, 
      color: 'text-green-500', 
      sub: '' 
    },
    { 
      title: 'Custo do Mês', 
      value: formatCurrency(resumo.custoMes), 
      icon: Wallet, 
      color: 'text-indigo-500', 
      sub: '' 
    },
    { 
      title: 'Em Aberto', 
      value: formatCurrency(resumo.saldoEmAberto), 
      icon: FileText, 
      color: 'text-orange-500', 
      sub: `${resumo.qtdContasEmAberto} conta(s)` 
    },
    { 
      title: 'Vencidas', 
      value: formatCurrency(resumo.saldoVencido), 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      sub: `${resumo.qtdVencidas} conta(s)` 
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          Não foi possível carregar os indicadores do Dashboard.
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
              <div className={`p-3 rounded-lg bg-muted ${stat.color} shrink-0`}>
                <Icon size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground font-medium truncate">{stat.title}</p>
                <h3 className="text-2xl font-bold truncate">
                  {loading ? <span className="text-muted-foreground text-base font-normal">Carregando...</span> : stat.value}
                </h3>
                {stat.sub && !loading && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{stat.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center">
          {loading ? (
             <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : resumo.custosMensais.length > 0 ? (
             <div className="w-full h-full flex flex-col justify-end gap-2 p-4">
                <h4 className="text-sm font-medium mb-auto self-start text-foreground">Custos Mensais (Últimos 6 meses)</h4>
                <div className="space-y-2 mt-4">
                  {resumo.custosMensais.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b border-border pb-1">
                        <span className="text-muted-foreground">{item.mes}</span>
                        <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
                    </div>
                  ))}
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
    </div>
  );
}
