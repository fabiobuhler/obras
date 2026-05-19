import { ApiService } from './apiService';
import { supabase } from './supabase';

class EquipamentoManutencoesService extends ApiService {
  constructor() {
    super('equipamento_manutencoes');
  }

  async getByEquipamento(equipamentoId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        empresas:fornecedor_id ( id, nome_fantasia )
      `)
      .eq('equipamento_id', equipamentoId)
      .order('data_inicio', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

export const equipamentoManutencoesService = new EquipamentoManutencoesService();
