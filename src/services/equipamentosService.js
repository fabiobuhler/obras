import { ApiService } from './apiService';
import { supabase } from './supabase';

class EquipamentosService extends ApiService {
  constructor() {
    super('equipamentos');
  }

  async getAll() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Cria equipamento e, se locado, a locação vinculada automaticamente
  async createComLocacao(equipamentoPayload, locacaoPayload = null) {
    const { data: equip, error: equipError } = await supabase
      .from(this.tableName)
      .insert([equipamentoPayload])
      .select()
      .single();

    if (equipError) throw equipError;

    if (locacaoPayload && equip?.id) {
      const locPayload = {
        ...locacaoPayload,
        equipamento_id: equip.id,
        status: (locacaoPayload.status || 'ativa').toLowerCase(),
      };

      const { error: locError } = await supabase
        .from('equipamento_locacoes')
        .insert([locPayload]);

      if (locError) {
        console.error('ERRO AO CRIAR LOCACAO NO CREATE:', locError);
        // Não bloqueia — locação pode ser criada depois na aba Locações
      }
    }

    return equip;
  }

  // Atualiza equipamento e, se passou a ser locado, cria ou atualiza locação
  async updateComLocacao(id, equipamentoPayload, locacaoPayload = null) {
    console.log('LOCACAO PAYLOAD EDICAO (campos):', {
      equipamento_id: id,
      fornecedor_id: locacaoPayload?.fornecedor_id,
      obra_id: locacaoPayload?.obra_id,
      data_inicio: locacaoPayload?.data_inicio,
      previsao_devolucao: locacaoPayload?.previsao_devolucao,
      data_devolucao: locacaoPayload?.data_devolucao,
      tipo_locacao: locacaoPayload?.tipo_locacao,
      valor: locacaoPayload?.valor,
      forma_pagamento: locacaoPayload?.forma_pagamento,
      status: locacaoPayload?.status,
    });

    const { data: equip, error: equipError } = await supabase
      .from(this.tableName)
      .update(equipamentoPayload)
      .eq('id', id)
      .select()
      .single();

    if (equipError) {
      console.error('ERRO AO ATUALIZAR EQUIPAMENTO:', equipError);
      throw equipError;
    }

    let locacaoCriada = false;
    let locacaoJaExistia = false;

    if (locacaoPayload && equipamentoPayload.origem === 'locado') {
      // Busca locação ativa ignorando caixa do status
      const { data: locacoesAtivas, error: checkError } = await supabase
        .from('equipamento_locacoes')
        .select('id, status')
        .eq('equipamento_id', id)
        .in('status', ['ativa', 'Ativa', 'ATIVA']);

      if (checkError) {
        console.error('ERRO AO CONSULTAR LOCACOES ATIVAS:', checkError);
        throw new Error(`Falha ao consultar locações ativas: ${checkError.message}`);
      }

      const locacaoAtiva = locacoesAtivas?.[0] || null;
      console.log('Locação ativa encontrada:', locacaoAtiva);

      // Regra: se data_devolucao preenchida, status vira encerrada
      const statusFinal = locacaoPayload.data_devolucao
        ? 'encerrada'
        : (locacaoPayload.status || 'ativa').toLowerCase();

      const payloadLocacao = {
        ...locacaoPayload,
        equipamento_id: id,
        status: statusFinal,
      };

      if (locacaoAtiva) {
        // Locação ativa existe — verificar se tem data_devolucao para encerrar
        if (locacaoPayload.data_devolucao) {
          // Atualiza a locação existente com encerramento
          const { error: updateLocError } = await supabase
            .from('equipamento_locacoes')
            .update({ data_devolucao: locacaoPayload.data_devolucao, status: 'encerrada' })
            .eq('id', locacaoAtiva.id);

          if (updateLocError) {
            console.error('ERRO AO ENCERRAR LOCACAO:', updateLocError);
            throw new Error(`Falha ao encerrar locação: ${updateLocError.message}`);
          } else {
            console.log('Locação encerrada com data de devolução:', locacaoAtiva.id);
            locacaoCriada = false;
            locacaoJaExistia = true;
          }
        } else {
          // Locação ativa, sem devolução — não duplicar
          console.log('Locação ativa já existente — não duplicar:', locacaoAtiva);
          locacaoJaExistia = true;
        }
      } else {
        // Nenhuma locação ativa — criar nova
        const { data: locacao, error: locacaoError } = await supabase
          .from('equipamento_locacoes')
          .insert([payloadLocacao])
          .select()
          .single();

        if (locacaoError) {
          console.error('ERRO AO CRIAR LOCACAO NA EDICAO:', locacaoError);
          throw new Error(`Falha ao criar locação: ${locacaoError.message}`);
        } else {
          console.log('Locação criada com sucesso:', locacao);
          locacaoCriada = true;
        }
      }
    }

    return { equip, locacaoCriada, locacaoJaExistia };
  }

  // Exclui equipamento e todos os registros filhos para evitar erro de FK
  async deleteComDependencias(id) {
    const tabelas = [
      'equipamento_abastecimentos',
      'equipamento_manutencoes',
      'equipamento_locacoes',
      'equipamento_movimentacoes',
    ];

    for (const tabela of tabelas) {
      const { error } = await supabase.from(tabela).delete().eq('equipamento_id', id);
      if (error) {
        console.error(`ERRO AO EXCLUIR DEPENDENCIAS [${tabela}]:`, error);
        // Não bloqueia — tenta excluir o próprio equipamento mesmo assim
      }
    }

    const { error: deleteError } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('ERRO AO EXCLUIR EQUIPAMENTO:', deleteError);
      throw deleteError;
    }

    return true;
  }

}
export const equipamentosService = new EquipamentosService();
