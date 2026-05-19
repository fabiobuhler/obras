import { ApiService } from './apiService';
import { supabase } from './supabase';

class EquipamentoMovimentacoesService extends ApiService {
  constructor() {
    super('equipamento_movimentacoes');
  }

  async getByEquipamento(equipamentoId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        obra_origem:obra_origem_id ( id, nome_obra ),
        obra_destino:obra_destino_id ( id, nome_obra ),
        pessoas:responsavel_id ( id, nome )
      `)
      .eq('equipamento_id', equipamentoId)
      .order('data_movimentacao', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

export const equipamentoMovimentacoesService = new EquipamentoMovimentacoesService();
