import { ApiService } from './apiService';
import { supabase } from './supabase';

class EpisService extends ApiService {
  constructor() {
    super('epis');
  }

  async getAll(options = {}) {
    let query = supabase.from(this.tableName).select(`
      *,
      funcionarios:funcionario_id (
        id,
        cargo,
        funcao,
        pessoas:pessoa_id (
          id,
          nome,
          cpf
        )
      )
    `);
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}

export const episService = new EpisService();
