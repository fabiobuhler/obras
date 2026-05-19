import { ApiService } from './apiService';
import { supabase } from './supabase';

class FuncionariosService extends ApiService {
  constructor() {
    super('funcionarios');
  }

  // Sobrescrevendo o getAll para trazer o nome da pessoa vinculada
  async getAll(options = {}) {
    let query = supabase.from(this.tableName).select(`
      *,
      pessoas:pessoa_id (
        id,
        nome,
        cpf
      )
    `);
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async gerarPrevisoesFinanceiras({ ano, mes, vencimentoSalario, vencimentoVr, vencimentoVt }) {
    const competencia = `${String(mes).padStart(2, '0')}/${ano}`;

    const { data: funcionarios, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        pessoas:pessoa_id (
          id,
          nome,
          cpf
        )
      `)
      .eq('ativo', true);

    if (error) throw error;

    let criadas = 0;
    let ignoradas = 0;
    let totalCriado = 0;

    const addPrevisao = async ({ funcionario, tipo, valor, vencimento, periodicidade }) => {
      const valorNum = Number(valor || 0);
      if (!valorNum || valorNum <= 0 || !vencimento) {
        ignoradas += 1;
        return;
      }

      const nome = funcionario.pessoas?.nome || funcionario.nome || 'Funcionário';
      const descricao = `${tipo} - ${nome} - ${competencia}`;

      const { data: existentes, error: checkError } = await supabase
        .from('contas_pagar')
        .select('id')
        .eq('origem', 'funcionario')
        .eq('credor_pessoa_id', funcionario.pessoa_id)
        .eq('descricao', descricao)
        .eq('vencimento', vencimento)
        .limit(1);

      if (checkError) throw checkError;

      if (existentes && existentes.length > 0) {
        ignoradas += 1;
        return;
      }

      const payload = {
        descricao,
        credor_pessoa_id: funcionario.pessoa_id,
        credor_empresa_id: null,
        obra_id: null,
        equipamento_id: null,
        origem: 'funcionario',
        valor: valorNum,
        vencimento,
        status: 'a_vencer',
        forma_pagamento: null,
        pagamento_direto_cliente: false,
        observacao: `Previsão gerada automaticamente pelo módulo de funcionários. Competência ${competencia}. Periodicidade cadastrada: ${periodicidade || 'não informada'}.`,
        valor_pago: 0,
      };

      const { error: insertError } = await supabase
        .from('contas_pagar')
        .insert(payload);

      if (insertError) throw insertError;

      criadas += 1;
      totalCriado += valorNum;
    };

    for (const funcionario of funcionarios || []) {
      await addPrevisao({
        funcionario,
        tipo: 'Salário',
        valor: funcionario.salario,
        vencimento: vencimentoSalario,
        periodicidade: funcionario.periodicidade_pagamento,
      });

      await addPrevisao({
        funcionario,
        tipo: 'Vale-Refeição',
        valor: funcionario.vale_refeicao_valor,
        vencimento: vencimentoVr,
        periodicidade: funcionario.periodicidade_vr,
      });

      await addPrevisao({
        funcionario,
        tipo: 'Vale-Transporte',
        valor: funcionario.vale_transporte_valor,
        vencimento: vencimentoVt,
        periodicidade: funcionario.periodicidade_vt,
      });
    }

    return { criadas, ignoradas, totalCriado };
  }
}

export const funcionariosService = new FuncionariosService();
