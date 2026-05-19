import { ApiService } from './apiService';
import { supabase } from './supabase';

class NrsService extends ApiService {
  constructor() {
    super('nrs_funcionarios');
  }

  async getByFuncionario(funcionarioId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('funcionario_id', funcionarioId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

export const nrsService = new NrsService();
