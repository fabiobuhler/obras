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
      supabase.from('contas_pagar').select(`
        *,
        pessoas:credor_pessoa_id (id, nome),
        empresas:credor_empresa_id (id, nome_fantasia, razao_social),
        obras:obra_id (id, objeto)
      `),
    ]);

    if (obrasResult.error) throw obrasResult.error;
    if (funcionariosResult.error) throw funcionariosResult.error;
    if (contasResult.error) throw contasResult.error;

    const obras = obrasResult.data || [];
    const funcionariosRaw = funcionariosResult.data || [];
    const contas = contasResult.data || [];

    const pessoaIds = [...new Set(funcionariosRaw.map((f) => f.pessoa_id ? String(f.pessoa_id) : null).filter(Boolean))];
    let pessoas = [];

    if (pessoaIds.length > 0) {
      const pessoasResult = await supabase
        .from('pessoas')
        .select('id, nome')
        .in('id', pessoaIds);

      if (pessoasResult.error) {
        console.error('ERRO AO BUSCAR PESSOAS DO DASHBOARD:', pessoasResult.error);
      } else {
        pessoas = pessoasResult.data || [];
      }
    }

    const pessoasMap = new Map(pessoas.map((p) => [String(p.id), p]));

    const funcionarios = funcionariosRaw.map((funcionario) => {
      const pId = funcionario.pessoa_id ? String(funcionario.pessoa_id) : null;
      const pessoa = pId ? pessoasMap.get(pId) : null;

      // Se a pessoa não foi encontrada na etapa 2, tenta aproveitar se por acaso veio em um join prévio
      const pessoaFallback = pessoa || funcionario.pessoas || funcionario.pessoa;

      return {
        ...funcionario,
        pessoa: pessoaFallback,
        nome_exibicao:
          pessoaFallback?.nome ||
          funcionario.nome ||
          funcionario.nome_completo ||
          funcionario.apelido ||
          funcionario.email ||
          '-',
      };
    });

    const obrasAtivasLista = obras.filter((obra) => {
      const status = String(obra.status || obra.situacao || '').toLowerCase();

      if (!status) return true;

      return !['concluida', 'concluída', 'cancelada', 'inativa', 'finalizada'].includes(status);
    });

    const funcionariosAtivosLista = funcionarios.filter((funcionario) => {
      if (funcionario.ativo !== undefined && funcionario.ativo !== null) {
        return Boolean(funcionario.ativo);
      }
      const status = String(funcionario.status || funcionario.situacao || funcionario.situacao_acesso || '').toLowerCase();

      if (!status) return true;

      return !['inativo', 'desligado', 'demitido', 'cancelado'].includes(status);
    });

    const contasEmAbertoLista = contas.filter((conta) => {
      if (isPaga(conta)) return false;
      if (isCancelada(conta)) return false;
      if (isFat(conta)) return false;
      return getSaldo(conta) > 0;
    });

    const contasVencidasLista = contasEmAbertoLista.filter(isVencida);

    const contasMesLista = contas.filter((conta) => {
      if (!conta.vencimento) return false;
      if (isCancelada(conta)) return false;

      return conta.vencimento.slice(0, 7) === mesAtual;
    });

    const saldoEmAberto = contasEmAbertoLista.reduce((acc, conta) => acc + getSaldo(conta), 0);
    const saldoVencido = contasVencidasLista.reduce((acc, conta) => acc + getSaldo(conta), 0);
    const custoMes = contasMesLista.reduce((acc, conta) => acc + getValorTotal(conta), 0);
    const pagosMes = contasMesLista.reduce((acc, conta) => acc + getValorPago(conta), 0);

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
      obrasAtivas: obrasAtivasLista.length,
      funcionariosAtivos: funcionariosAtivosLista.length,
      saldoEmAberto,
      qtdContasEmAberto: contasEmAbertoLista.length,
      saldoVencido,
      qtdVencidas: contasVencidasLista.length,
      custoMes,
      pagosMes,
      custosMensais,
      evolucaoFisicoFinanceira: [],
      detalhes: {
        obrasAtivasLista,
        funcionariosAtivosLista,
        contasMesLista,
        contasEmAbertoLista,
        contasVencidasLista,
      },
    };
  },
};
