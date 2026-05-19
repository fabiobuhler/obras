import { ApiService } from './apiService';
import { supabase } from './supabase';
import { storageService } from './storageService';

const normalizeFromDb = (record) => {
  if (!record) return record;
  return {
    ...record,
    valor_total: Number(record.valor_total ?? record.valor ?? 0),
  };
};

const normalizePayloadToDb = (payload) => {
  const clean = { ...payload };

  if (Object.prototype.hasOwnProperty.call(clean, 'valor_total')) {
    clean.valor = clean.valor_total;
    delete clean.valor_total;
  }

  return clean;
};

class ContasPagarService extends ApiService {
  constructor() {
    super('contas_pagar');
  }

  async getAll(filtros = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        pessoas:credor_pessoa_id(id, nome),
        empresas:credor_empresa_id(id, nome_fantasia),
        obras:obra_id(id, objeto),
        equipamentos:equipamento_id(id, equipamento),
        pagamentos:pagamentos(
          id,
          conta_id,
          valor_pago,
          data_pagamento,
          forma_pagamento,
          observacoes,
          comprovante_url,
          created_at
        )
      `)
      .order('vencimento', { ascending: true });

    if (filtros.status)      query = query.eq('status', filtros.status);
    if (filtros.obra_id)     query = query.eq('obra_id', filtros.obra_id);
    if (filtros.origem)      query = query.eq('origem', filtros.origem);
    if (filtros.data_ini)    query = query.gte('vencimento', filtros.data_ini);
    if (filtros.data_fim)    query = query.lte('vencimento', filtros.data_fim);
    if (filtros.credor_empresa_id) query = query.eq('credor_empresa_id', filtros.credor_empresa_id);
    if (filtros.credor_pessoa_id)  query = query.eq('credor_pessoa_id', filtros.credor_pessoa_id);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(normalizeFromDb);
  }

  async getPagas(filtros = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        pessoas:credor_pessoa_id(id, nome),
        empresas:credor_empresa_id(id, nome_fantasia),
        obras:obra_id(id, objeto),
        equipamentos:equipamento_id(id, equipamento),
        pagamentos:pagamentos(
          id,
          conta_id,
          valor_pago,
          data_pagamento,
          forma_pagamento,
          observacoes,
          comprovante_url,
          created_at
        )
      `)
      .eq('status', 'paga')
      .order('updated_at', { ascending: false });

    if (filtros.origem) {
      query = query.eq('origem', filtros.origem);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(normalizeFromDb);
  }

  async getFat(filtros = {}) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        pessoas:credor_pessoa_id(id, nome),
        empresas:credor_empresa_id(id, nome_fantasia),
        obras:obra_id(id, objeto),
        equipamentos:equipamento_id(id, equipamento),
        pagamentos:pagamentos(
          id,
          conta_id,
          valor_pago,
          data_pagamento,
          forma_pagamento,
          observacoes,
          comprovante_url,
          created_at
        )
      `)
      .eq('pagamento_direto_cliente', true)
      .order('vencimento', { ascending: true });

    if (filtros.origem) {
      query = query.eq('origem', filtros.origem);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(normalizeFromDb);
  }

  async getById(id) {
    const data = await super.getById(id);
    return normalizeFromDb(data);
  }

  async create(record) {
    const payload = normalizePayloadToDb(record);
    const data = await super.create(payload);
    return normalizeFromDb(data);
  }

  async update(id, updates) {
    const payload = normalizePayloadToDb(updates);
    const data = await super.update(id, payload);
    return normalizeFromDb(data);
  }

  // Registra pagamento (total ou parcial) e recalcula status
  async registrarPagamento(contaId, pagamentoPayload) {
    const { novo_vencimento, ...payloadParaInserir } = pagamentoPayload;

    // 1. Buscar conta atual
    const { data: conta, error: contaError } = await supabase
      .from(this.tableName)
      .select('valor_total, valor, valor_pago')
      .eq('id', contaId)
      .single();

    if (contaError) throw contaError;

    const total = Number(conta.valor_total ?? conta.valor ?? 0);
    const pagoAtual = Number(conta.valor_pago || 0);
    const valorPagamento = Number(payloadParaInserir.valor_pago || 0);
    const saldoAntes = Math.max(0, total - pagoAtual);

    if (valorPagamento <= 0) {
      throw new Error('Informe um valor de pagamento válido.');
    }

    if (valorPagamento > saldoAntes) {
      throw new Error('O valor do pagamento não pode ser maior que o saldo restante.');
    }

    // 2. Inserir pagamento (sem novo_vencimento no payload da tabela pagamentos)
    const { error: pagError } = await supabase
      .from('pagamentos')
      .insert([{ ...payloadParaInserir, conta_id: contaId }]);

    if (pagError) throw pagError;

    // 3. Recalcular valor_pago e status
    const novoValorPago = pagoAtual + valorPagamento;
    const saldoDepois = Math.max(0, total - novoValorPago);
    const novoStatus = saldoDepois <= 0 ? 'paga' : 'parcial';

    // 4. Montar campos para atualizar a conta
    const camposUpdate = {
      valor_pago: novoValorPago,
      status: novoStatus,
      updated_at: new Date().toISOString()
    };

    if (novoStatus === 'parcial' && novo_vencimento) {
      camposUpdate.vencimento = novo_vencimento;
    }

    const { error: updateError } = await supabase
      .from(this.tableName)
      .update(camposUpdate)
      .eq('id', contaId);

    if (updateError) throw updateError;

    return { novoValorPago, novoStatus };
  }

  // Reagendar vencimento
  async reagendar(contaId, novoVencimento) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ vencimento: novoVencimento, status: 'a_vencer', updated_at: new Date().toISOString() })
      .eq('id', contaId)
      .select()
      .single();

    if (error) throw error;
    return normalizeFromDb(data);
  }

  // Cancelar conta
  async cancelar(contaId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ status: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', contaId)
      .select()
      .single();

    if (error) throw error;
    return normalizeFromDb(data);
  }

  // Exclusão Permanente de Conta
  async deletePermanente(contaId) {
    if (!contaId) {
      throw new Error('ID da conta não informado.');
    }

    const { data: conta, error: contaError } = await supabase
      .from(this.tableName)
      .select(`
        *,
        pagamentos (
          id,
          comprovante_url
        )
      `)
      .eq('id', contaId)
      .single();

    if (contaError) throw contaError;

    try {
      if (conta?.arquivo_url) {
        await storageService.removeFinanceiroByUrl(conta.arquivo_url);
      }

      if (Array.isArray(conta?.pagamentos)) {
        for (const p of conta.pagamentos) {
          if (p.comprovante_url) {
            await storageService.removeFinanceiroByUrl(p.comprovante_url);
          }
        }
      }
    } catch (storageError) {
      console.error('ERRO AO REMOVER ARQUIVOS DA CONTA:', storageError);
    }

    const { error: pagamentosError } = await supabase
      .from('pagamentos')
      .delete()
      .eq('conta_id', contaId);

    if (pagamentosError) throw pagamentosError;

    const { error: deleteError } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', contaId);

    if (deleteError) throw deleteError;

    return true;
  }


  async getByObra(obraId) {
    if (!obraId) return [];

    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        pagamentos (
          id,
          conta_id,
          valor_pago,
          data_pagamento,
          forma_pagamento,
          observacoes,
          comprovante_url,
          created_at
        ),
        pessoas:credor_pessoa_id (
          id,
          nome,
          cpf
        ),
        empresas:credor_empresa_id (
          id,
          nome_fantasia
        ),
        obras:obra_id (
          id,
          objeto
        )
      `)
      .eq('obra_id', obraId)
      .order('vencimento', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(normalizeFromDb);
  }

  // Buscar pagamentos de uma conta
  async getPagamentos(contaId) {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('conta_id', contaId)
      .order('data_pagamento', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const contasPagarService = new ContasPagarService();
