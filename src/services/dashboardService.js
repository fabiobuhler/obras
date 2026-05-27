import { supabase } from './supabase';

const getValorTotal = (conta) => Number(conta.valor_total ?? conta.valor ?? 0);
const getValorPago = (conta) => Number(conta.valor_pago || 0);
const getSaldo = (conta) => Math.max(0, getValorTotal(conta) - getValorPago(conta));

const getHojeLocalString = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const isPaga = (conta) => {
  const status = String(conta.status || '').toLowerCase();
  const total = getValorTotal(conta);
  const pago = getValorPago(conta);

  return status === 'paga' || (total > 0 && pago >= total);
};

const isCancelada = (conta) => String(conta.status || '').toLowerCase() === 'cancelada';

const isFat = (conta) => Boolean(conta.pagamento_direto_cliente);

const isVencida = (conta) => {
  if (!conta.vencimento) return false;
  if (isPaga(conta)) return false;
  if (isCancelada(conta)) return false;
  if (isFat(conta)) return false;
  if (getSaldo(conta) <= 0) return false;

  return conta.vencimento < getHojeLocalString();
};

export const dashboardService = {
  async getResumo() {
    const hoje = getHojeLocalString();
    const mesAtual = hoje.slice(0, 7);

    const [
      obrasResult,
      funcionariosResult,
      contasResult,
    ] = await Promise.all([
      supabase.from('obras').select('*'),
      supabase.from('funcionarios').select('*'),
      supabase.from('contas_pagar').select('*'),
    ]);

    if (obrasResult.error) throw obrasResult.error;
    if (funcionariosResult.error) throw funcionariosResult.error;
    if (contasResult.error) throw contasResult.error;

    const obras = obrasResult.data || [];
    const funcionarios = funcionariosResult.data || [];
    const contas = contasResult.data || [];

    const obrasAtivas = obras.filter((obra) => {
      const status = String(obra.status || obra.situacao || '').toLowerCase();

      if (!status) return true;

      return !['concluida', 'concluída', 'cancelada', 'inativa', 'finalizada'].includes(status);
    }).length;

    const funcionariosAtivos = funcionarios.filter((funcionario) => {
      const status = String(funcionario.status || funcionario.situacao || funcionario.situacao_acesso || '').toLowerCase();

      if (!status) return true;

      return !['inativo', 'desligado', 'demitido', 'cancelado'].includes(status);
    }).length;

    const contasEmAberto = contas.filter((conta) => {
      if (isPaga(conta)) return false;
      if (isCancelada(conta)) return false;
      if (isFat(conta)) return false;
      return getSaldo(conta) > 0;
    });

    const saldoEmAberto = contasEmAberto.reduce((acc, conta) => acc + getSaldo(conta), 0);

    const contasVencidas = contasEmAberto.filter(isVencida);

    const saldoVencido = contasVencidas.reduce((acc, conta) => acc + getSaldo(conta), 0);

    const contasMes = contas.filter((conta) => {
      if (!conta.vencimento) return false;
      if (isCancelada(conta)) return false;

      return conta.vencimento.slice(0, 7) === mesAtual;
    });

    const custoMes = contasMes.reduce((acc, conta) => acc + getValorTotal(conta), 0);

    const pagosMes = contasMes.reduce((acc, conta) => acc + getValorPago(conta), 0);

    const custosMensaisMap = new Map();

    contas
      .filter((conta) => conta.vencimento && !isCancelada(conta))
      .forEach((conta) => {
        const mes = conta.vencimento.slice(0, 7);
        const atual = custosMensaisMap.get(mes) || 0;
        custosMensaisMap.set(mes, atual + getValorTotal(conta));
      });

    const custosMensais = Array.from(custosMensaisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, valor]) => ({ mes, valor }));

    return {
      obrasAtivas,
      funcionariosAtivos,
      saldoEmAberto,
      qtdContasEmAberto: contasEmAberto.length,
      saldoVencido,
      qtdVencidas: contasVencidas.length,
      custoMes,
      pagosMes,
      custosMensais,
      evolucaoFisicoFinanceira: [],
    };
  },
};
