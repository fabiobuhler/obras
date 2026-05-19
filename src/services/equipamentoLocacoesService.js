import { ApiService } from './apiService';
import { supabase } from './supabase';

class EquipamentoLocacoesService extends ApiService {
  constructor() {
    super('equipamento_locacoes');
  }

  async getByEquipamento(equipamentoId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        empresas:fornecedor_id ( id, nome_fantasia ),
        obras:obra_id ( id, nome_obra )
      `)
      .eq('equipamento_id', equipamentoId)
      .order('data_inicio', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

export const equipamentoLocacoesService = new EquipamentoLocacoesService();
